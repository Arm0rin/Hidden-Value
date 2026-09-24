import {EventBus} from '../core/EventBus';
import {GameFlow} from '../core/GameFlow';
import {createDefaultState} from '../content/defaultState';
import {itemDefinitions, itemSequence} from '../content/items';
import {pocketWatch} from '../content/items/pocketWatch';
import type {FlowPhase,GameState,ItemDefinition,RestorationTool} from '../core/types';
import {SaveService} from '../services/SaveService';
import {AnalyticsService} from '../services/AnalyticsService';
import {AudioService} from '../services/AudioService';
import {EconomySystem} from '../systems/EconomySystem';
import {ValuationSystem} from '../systems/ValuationSystem';
import {RestorationSystem} from '../systems/RestorationSystem';
import {WebAdapter} from '../platform/web/WebAdapter';

export class Game {
  readonly bus=new EventBus();
  readonly platform=new WebAdapter();
  readonly saveService=new SaveService(this.platform);
  readonly analytics=new AnalyticsService(this.platform.getPlatformName(),this.platform.getLanguage());
  readonly audio=new AudioService();
  readonly valuation=new ValuationSystem();
  readonly restoration=new RestorationSystem();
  state=createDefaultState();
  flow=new GameFlow('BOOT');
  economy!:EconomySystem;
  private rejectedItemIds=new Set<string>();

  get phase(){return this.flow.getPhase();}
  get activeDefinition():ItemDefinition|null{return this.state.activeItemId?itemDefinitions[this.state.activeItemId]??null:null;}

  private nextDefinition(){return itemSequence.find(def=>!this.state.progression.completedItemIds.includes(def.id)&&!this.rejectedItemIds.has(def.id));}

  private createItem(definition:ItemDefinition){
    this.state.activeItemId=definition.id;
    this.state.activeItem={
      definitionId:definition.id,
      discoveredClueIds:[],
      condition:definition.startingCondition,
      completed:false,
      owned:false,
      bought:false,
      sold:false,
      toolProgress:0
    };
  }

  private createNextItem(){
    const definition=this.nextDefinition();
    if(definition)this.createItem(definition);
    return definition??null;
  }

  async init(){
    await this.platform.init();
    this.state=await this.saveService.load();
    // Saves from the first slice predate the per-item completion list.
    if(this.state.tutorial.completed&&this.state.progression.completedItems>0&&this.state.progression.completedItemIds.length===0){
      this.state.progression.completedItemIds=[pocketWatch.id];
    }
    if(this.state.phase==='BOOT'&&!this.state.activeItemId)this.state.phase='TITLE';
    this.flow.restore(this.state.phase);
    this.economy=new EconomySystem(this.state);
    if(this.state.activeItemId&&!this.state.activeItem&&!this.state.progression.completedItemIds.includes(this.state.activeItemId)){
      const definition=itemDefinitions[this.state.activeItemId];
      if(definition)this.createItem(definition);
    }
    this.analytics.track('game_start',{phase:this.state.phase,cash:this.state.player.cash});
    return this;
  }

  async go(to:FlowPhase){
    this.flow.transition(to);
    this.state.phase=to;
    if(to==='CLIENT'&&!this.state.activeItem)this.createNextItem();
    const definition=this.activeDefinition;
    if(definition&&to==='CLIENT')this.analytics.track('item_presented',{itemId:definition.id});
    if(definition&&to==='INSPECT')this.analytics.track('inspect_started',{itemId:definition.id});
    if(definition&&to==='RESTORE')this.analytics.track('restoration_started',{itemId:definition.id});
    await this.saveService.save(this.state);
    this.bus.emit('change',this.state);
  }

  async start(){if(this.phase==='BOOT')await this.go('TITLE');else if(this.phase==='TITLE')await this.go('WORKSHOP');}

  async showClient(){
    if(this.phase!=='WORKSHOP')return false;
    if(!this.state.activeItem&&!this.createNextItem())return false;
    await this.go('CLIENT');
    return true;
  }

  async inspect(){if(this.phase==='CLIENT')await this.go('INSPECT');}

  async decideBack(){if(this.phase==='INSPECT')await this.go('DECISION');}

  async revealClue(){
    if(this.phase!=='INSPECT'||!this.state.activeItem)return false;
    const definition=this.activeDefinition;
    const clue=definition?.clues.find(candidate=>!this.state.activeItem!.discoveredClueIds.includes(candidate.id));
    if(!clue)return false;
    this.state.activeItem.discoveredClueIds.push(clue.id);
    if(!this.state.progression.discoveredClues.includes(clue.id))this.state.progression.discoveredClues.push(clue.id);
    this.analytics.track('clue_discovered',{itemId:definition?.id,clueId:clue.id});
    this.audio.tone('clue');
    await this.saveService.save(this.state);
    this.bus.emit('change',this.state);
    return true;
  }

  async buy(discount=0){
    const definition=this.activeDefinition;
    if(this.phase!=='DECISION'||!this.state.activeItem||!definition||this.state.activeItem.bought)return false;
    const paidPrice=Math.max(1,Math.round(definition.purchasePrice*(1-Math.min(.2,Math.max(0,discount)))));
    if(!this.economy.spend(paidPrice,'purchase_item'))return false;
    this.state.activeItem.bought=true;
    this.state.activeItem.purchaseValue=paidPrice;
    this.state.activeItem.owned=true;
    this.state.stats.itemsBought+=1;
    this.analytics.track('item_bought',{itemId:definition.id,cash:this.state.player.cash});
    this.audio.tone('transaction');
    await this.saveService.save(this.state);
    await this.go('BUY');
    await this.go('RESTORE');
    return true;
  }

  async refuse(){
    if(this.phase!=='DECISION'||!this.state.activeItemId)return false;
    this.rejectedItemIds.add(this.state.activeItemId);
    this.state.activeItem=null;
    this.state.activeItemId=null;
    await this.go('CLIENT');
    return true;
  }

  selectTool(tool:RestorationTool){
    if(this.phase!=='RESTORE'||!this.state.activeItem)return;
    const definition=this.activeDefinition;
    if(definition?.repairOptions?.length&&!this.state.activeItem.repairOptionId)return;
    const stepIndex=definition?.restorationSteps.findIndex(step=>step.tool===tool)??-1;
    if(stepIndex>0&&this.state.activeItem.condition<definition!.restorationSteps[stepIndex-1].targetCondition)return;
    if(this.state.activeItem.activeTool!==tool)this.state.activeItem.toolProgress=0;
    this.restoration.selectTool(this.state.activeItem,tool);
    this.bus.emit('change',this.state);
  }

  async chooseRepair(optionId:string){
    const definition=this.activeDefinition;
    const item=this.state.activeItem;
    const option=definition?.repairOptions?.find(candidate=>candidate.id===optionId);
    if(this.phase!=='RESTORE'||!definition||!item||!option||item.repairOptionId||item.activeTool)return false;
    if(!this.economy.spend(option.cost,'repair_item'))return false;
    item.repairOptionId=option.id;
    await this.saveService.save(this.state);
    this.analytics.track('repair_option_selected',{itemId:definition.id,optionId:option.id,cost:option.cost});
    this.audio.tone('transaction');
    this.bus.emit('change',this.state);
    return true;
  }

  async stroke(deltaMs?:number){
    const definition=this.activeDefinition;
    if(this.phase!=='RESTORE'||!this.state.activeItem||!definition)return false;
    const step=definition.restorationSteps.find(candidate=>candidate.tool===this.state.activeItem!.activeTool);
    const done=this.restoration.work(definition,this.state.activeItem,deltaMs??step?.durationMs??250);
    if(done){
      this.analytics.track('restoration_step_completed',{itemId:definition.id,tool:this.state.activeItem.activeTool,condition:this.state.activeItem.condition});
      this.state.activeItem.activeTool=undefined;
      this.state.activeItem.toolProgress=0;
    }
    if(this.restoration.isComplete(definition,this.state.activeItem)){
      this.state.activeItem.completed=true;
      this.state.phase='APPRAISE';
      this.flow.restore('APPRAISE');
      this.analytics.track('restoration_completed',{itemId:definition.id});
      await this.saveService.save(this.state);
    }
    this.bus.emit('change',this.state);
    return done;
  }

  async toSell(){if(this.phase==='APPRAISE')await this.go('SELL');}

  async chooseSaleMode(modeId:string){
    const definition=this.activeDefinition;
    const item=this.state.activeItem;
    const mode=definition?.saleOptions?.find(option=>option.id===modeId);
    if(this.phase!=='SELL'||!definition||!item||!mode||item.saleModeId)return false;
    item.saleModeId=mode.id;
    await this.saveService.save(this.state);
    this.analytics.track('sale_mode_selected',{itemId:definition.id,modeId:mode.id});
    this.bus.emit('change',this.state);
    return true;
  }

  async sell(){
    const definition=this.activeDefinition;
    if(this.phase!=='SELL'||!this.state.activeItem||!definition||!this.state.activeItem.owned||this.state.activeItem.sold)return false;
    const repairOption=definition.repairOptions?.find(option=>option.id===this.state.activeItem!.repairOptionId);
    if(definition.repairOptions?.length&&!repairOption)return false;
    const saleMode=definition.saleOptions?.find(option=>option.id===this.state.activeItem!.saleModeId);
    if(definition.saleOptions?.length&&!saleMode)return false;
    const auctionSuccess=Boolean(saleMode&&saleMode.successValue!==saleMode.fallbackValue&&Math.random()<saleMode.successChance);
    const amount=saleMode?(auctionSuccess?saleMode.successValue:saleMode.fallbackValue):definition.trueValue+(repairOption?.valueBonus??0);
    const repairCost=repairOption?.cost??0;
    const saleCost=saleMode?.fee??0;
    this.state.activeItem.saleValue=amount;
    this.state.activeItem.saleCost=repairCost+saleCost;
    this.state.activeItem.sold=true;
    this.state.activeItem.owned=false;
    // Sale fees are paid at the point of sale, so the wallet receives the net amount.
    this.economy.earn(amount-saleCost,'sell_item');
    this.state.player.xp+=25;
    const previousPlayerLevel=this.state.player.level;
    this.state.player.level=Math.max(1,1+Math.floor(this.state.player.xp/50));
    if(this.state.player.level>previousPlayerLevel)this.analytics.track('player_level_up',{level:this.state.player.level});
    this.state.stats.itemsSold+=1;
    this.state.stats.totalProfit+=amount-(this.state.activeItem.purchaseValue??definition.purchasePrice)-repairCost-saleCost;
    if(saleMode?.id==='auction'){
      this.state.stats.auctionAttempts+=1;
      if(auctionSuccess)this.state.stats.auctionWins+=1;
      this.state.stats.auctionRevenue+=amount;
      this.state.stats.auctionHistory.push({itemId:definition.id,value:amount,success:auctionSuccess});
    }
    this.state.progression.completedItems+=1;
    const previousWorkshopLevel=this.state.workshop.level;
    this.state.workshop.level=Math.max(1,1+Math.floor(this.state.progression.completedItems/2));
    if(this.state.workshop.level>previousWorkshopLevel)this.analytics.track('workshop_level_up',{level:this.state.workshop.level});
    if(!this.state.progression.completedItemIds.includes(definition.id))this.state.progression.completedItemIds.push(definition.id);
    this.state.tutorial.completed=true;
    this.analytics.track('item_sold',{itemId:definition.id,cash:this.state.player.cash,saleMode:saleMode?.id,saleValue:amount});
    this.analytics.track('item_completed',{itemId:definition.id,profit:amount-(this.state.activeItem.purchaseValue??definition.purchasePrice)-repairCost-saleCost});
    this.audio.tone('transaction');
    await this.saveService.save(this.state);
    await this.go('RESULT');
    return true;
  }

  async next(){
    if(this.phase!=='RESULT')return;
    this.state.activeItem=null;
    this.state.activeItemId=null;
    await this.go('WORKSHOP');
  }

  async reset(){
    this.state=createDefaultState();
    this.rejectedItemIds.clear();
    this.state.phase='TITLE';
    this.flow=new GameFlow('TITLE');
    this.economy=new EconomySystem(this.state);
    await this.saveService.save(this.state);
    this.bus.emit('change',this.state);
  }

  async debugSetCash(cash:number){this.state.player.cash=cash;await this.saveService.save(this.state);this.bus.emit('change',this.state);}
  async debugReveal(){await this.revealClue();}
}
