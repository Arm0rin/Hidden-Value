import {EventBus} from '../core/EventBus';
import {GameFlow} from '../core/GameFlow';
import {createDefaultState} from '../content/defaultState';
import {pocketWatch} from '../content/items/pocketWatch';
import type {FlowPhase,GameState,RestorationTool} from '../core/types';
import {SaveService} from '../services/SaveService';
import {AnalyticsService} from '../services/AnalyticsService';
import {AudioService} from '../services/AudioService';
import {EconomySystem} from '../systems/EconomySystem';
import {ValuationSystem} from '../systems/ValuationSystem';
import {RestorationSystem} from '../systems/RestorationSystem';
import {WebAdapter} from '../platform/web/WebAdapter';

export class Game { readonly bus=new EventBus(); readonly platform=new WebAdapter(); readonly saveService=new SaveService(this.platform); readonly analytics=new AnalyticsService(this.platform.getPlatformName(),this.platform.getLanguage()); readonly audio=new AudioService(); readonly valuation=new ValuationSystem(); readonly restoration=new RestorationSystem(); state=createDefaultState(); flow=new GameFlow('BOOT'); economy!:EconomySystem;
 async init(){await this.platform.init();this.state=await this.saveService.load();if(this.state.phase==='BOOT' && !this.state.activeItemId){this.state.phase='TITLE';}this.flow.restore(this.state.phase);this.economy=new EconomySystem(this.state);if(this.state.activeItemId===pocketWatch.id && !this.state.activeItem && !this.state.tutorial.completed)this.createItem();this.analytics.track('game_start',{phase:this.state.phase,cash:this.state.player.cash});return this;}
 private createItem(){this.state.activeItemId=pocketWatch.id;this.state.activeItem={definitionId:pocketWatch.id,discoveredClueIds:[...this.state.progression.discoveredClues],condition:42,completed:false,owned:false,bought:false,sold:false,toolProgress:0};}
 get phase(){return this.flow.getPhase();}
 async go(to:FlowPhase){this.flow.transition(to);this.state.phase=to;if(to==='WORKSHOP'&&!this.state.activeItem&&!this.state.tutorial.completed){this.createItem();}if(to==='CLIENT')this.analytics.track('item_presented',{itemId:pocketWatch.id});if(to==='INSPECT')this.analytics.track('inspect_started',{itemId:pocketWatch.id});if(to==='RESTORE')this.analytics.track('restoration_started',{itemId:pocketWatch.id});await this.saveService.save(this.state);this.bus.emit('change',this.state);}
 async start(){if(this.phase==='BOOT')await this.go('TITLE');else if(this.phase==='TITLE')await this.go('WORKSHOP');}
 async showClient(){if(this.phase==='WORKSHOP'&&!this.state.tutorial.completed&&this.state.activeItem)await this.go('CLIENT');}
 async inspect(){if(this.phase==='CLIENT')await this.go('INSPECT');}
 async decideBack(){if(this.phase==='INSPECT')await this.go('DECISION');}
 async revealClue(){if(!this.state.activeItem||this.state.activeItem.discoveredClueIds.includes('silver_925'))return false;this.state.activeItem.discoveredClueIds.push('silver_925');if(!this.state.progression.discoveredClues.includes('silver_925'))this.state.progression.discoveredClues.push('silver_925');this.analytics.track('clue_discovered',{itemId:pocketWatch.id});this.audio.tone('clue');await this.saveService.save(this.state);this.bus.emit('change',this.state);return true;}
 async buy(){if(this.phase!=='DECISION'||!this.state.activeItem||this.state.activeItem.bought)return false;if(!this.economy.spend(pocketWatch.purchasePrice,'purchase_item'))return false;this.state.activeItem.bought=true;this.state.activeItem.owned=true;this.state.stats.itemsBought+=1;this.analytics.track('item_bought',{itemId:pocketWatch.id,cash:this.state.player.cash});this.audio.tone('transaction');await this.saveService.save(this.state);await this.go('BUY');await this.go('RESTORE');return true;}
 async refuse(){if(this.phase==='DECISION'){await this.go('CLIENT');return true;}return false;}
 selectTool(tool:RestorationTool){if(this.phase!=='RESTORE'||!this.state.activeItem)return;this.restoration.selectTool(this.state.activeItem,tool);this.bus.emit('change',this.state);}
 async stroke(){if(this.phase!=='RESTORE'||!this.state.activeItem)return false;const done=this.restoration.stroke(pocketWatch,this.state.activeItem);if(done){this.analytics.track('restoration_step_completed',{itemId:pocketWatch.id,tool:this.state.activeItem.activeTool,condition:this.state.activeItem.condition});this.state.activeItem.activeTool=undefined;this.state.activeItem.toolProgress=0;}if(this.restoration.isComplete(pocketWatch,this.state.activeItem)){this.state.activeItem.completed=true;this.state.phase='APPRAISE';this.flow.restore('APPRAISE');this.analytics.track('restoration_completed',{itemId:pocketWatch.id});await this.saveService.save(this.state);}this.bus.emit('change',this.state);return done;}
 async toSell(){if(this.phase==='APPRAISE')await this.go('SELL');}
 async sell(){if(this.phase!=='SELL'||!this.state.activeItem||!this.state.activeItem.owned||this.state.activeItem.sold)return false;const amount=pocketWatch.trueValue;this.state.activeItem.sold=true;this.state.activeItem.owned=false;this.economy.earn(amount,'sell_item');this.state.player.xp+=25;this.state.stats.itemsSold+=1;this.state.stats.totalProfit+=amount-pocketWatch.purchasePrice;this.state.progression.completedItems+=1;this.analytics.track('item_sold',{itemId:pocketWatch.id,cash:this.state.player.cash});this.analytics.track('item_completed',{itemId:pocketWatch.id,profit:amount-pocketWatch.purchasePrice});this.audio.tone('transaction');await this.saveService.save(this.state);await this.go('RESULT');return true;}
 async next(){if(this.phase==='RESULT'){this.state.activeItem=null;this.state.activeItemId=null;this.state.tutorial.completed=true;await this.go('WORKSHOP');}}
 async reset(){this.state=createDefaultState();this.state.phase='TITLE';this.flow=new GameFlow('TITLE');this.economy=new EconomySystem(this.state);await this.saveService.save(this.state);this.bus.emit('change',this.state);}
 async debugSetCash(cash:number){this.state.player.cash=cash;await this.saveService.save(this.state);this.bus.emit('change',this.state);}
 async debugReveal(){await this.revealClue();}
}
