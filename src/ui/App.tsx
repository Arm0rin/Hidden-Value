import {useEffect,useMemo,useState} from 'preact/hooks';
import {Game} from '../app/Game';
import {LocalizationService} from '../services/LocalizationService';
import {WatchCanvas} from '../rendering/WatchCanvas';
import {ItemCanvas} from '../rendering/ItemCanvas';
import {pocketWatch} from '../content/items/pocketWatch';
import {itemDefinitions,itemSequence} from '../content/items';
import type {GameState} from '../core/types';
import '../styles.css';

type MetaView='workshop'|'collection'|'auction'|'profile';

export function App({game}:{game:Game}) {
  const [state,setState]=useState<GameState>(game.state);
  const [lang,setLang]=useState(game.platform.getLanguage().startsWith('ru')?'ru':'en');
  const [debug,setDebug]=useState(new URLSearchParams(location.search).get('debug')==='1');
  const [metaView,setMetaView]=useState<MetaView>('workshop');
  const [inventoryOpen,setInventoryOpen]=useState(false);
  const loc=useMemo(()=>new LocalizationService(lang),[lang]);
  useEffect(()=>game.bus.on('change',next=>setState({...next as GameState})),[game]);
  const t=(key:string)=>loc.t(key);
  const phase=state.phase;
  const item=state.activeItem;
  const definition=game.activeDefinition??pocketWatch;
  const valuationItem=item??{definitionId:definition.id,discoveredClueIds:[],condition:definition.startingCondition,completed:false,owned:false,bought:false,sold:false,toolProgress:0};
  const valuation=game.valuation.evaluate(definition,valuationItem);
  const discoveredIds=item?.discoveredClueIds??[];
  const nextClue=definition.clues.find(clueDefinition=>!discoveredIds.includes(clueDefinition.id));
  const foundClue=[...definition.clues].reverse().find(clueDefinition=>discoveredIds.includes(clueDefinition.id));
  const clue=Boolean(foundClue);
  const condition=item?.condition??definition.startingCondition;
  const brushProgress=item?game.restoration.getProgress(definition,item,'brush'):0;
  const polishProgress=item?game.restoration.getProgress(definition,item,'polish'):0;
  const itemName=t(definition.displayNameKey);
  const price=definition.purchasePrice;
  const selectedRepair=definition.repairOptions?.find(option=>option.id===item?.repairOptionId);
  const repairCost=selectedRepair?.cost??0;
  const selectedSale=definition.saleOptions?.find(option=>option.id===item?.saleModeId);
  const saleValue=item?.saleValue??(selectedSale?selectedSale.successValue:definition.trueValue+(selectedRepair?.valueBonus??0));
  const saleRange=selectedSale?`${selectedSale.fallbackValue}–${selectedSale.successValue}`:String(saleValue);
  const saleCost=selectedSale?.fee??Math.max(0,(item?.saleCost??0)-repairCost);
  const profit=saleValue-price-repairCost-saleCost;
  const saleNeedsChoice=phase==='SELL'&&Boolean(definition.saleOptions?.length&&!selectedSale);
  const devLabel=t(definition.renderType==='camera'?'devAssetCamera':definition.renderType==='pixelBox'?'devAssetPixelBox':definition.renderType==='painting'?'devAssetPainting':'devAsset');
  const act=async(fn:()=>Promise<unknown>)=>{try{await fn();}catch(error){console.error(error);}};
  const header=<header><div className="brand">HIDDEN VALUE</div><div className="header-actions"><button className="lang" onClick={()=>setLang(lang==='ru'?'en':'ru')} aria-label="Change language">{lang.toUpperCase()}</button><div className="cash"><span>✦</span> {'$'+state.player.cash}</div></div></header>;
  if(phase==='BOOT'||phase==='TITLE')return <main className="shell title-screen">
    {header}
    <WatchCanvas phase="TITLE" discovered={true} condition={42} clueHint={t('clueTap')} clueCode="925" clueRotation={Math.PI} devAssetLabel={t('devAsset')} onRotate={()=>{}} onReveal={()=>{}}/>
    <section className="title-card"><div className="eyebrow">{t('workshopEyebrow')}</div><h1>{t('title')}</h1><p>{t('subtitle')}</p><button className="primary" onClick={()=>act(()=>game.start())}>{t('start')}</button></section>
    <div className="title-mark">HV / 01</div>
  </main>;
  const sceneTitle=phase==='CLIENT'?itemName:phase==='INSPECT'?t('turn'):phase==='DECISION'?itemName:phase==='RESTORE'?t('restoreHint'):phase==='RESULT'?t('complete'):t('completeHeadlineA');
  const completedCount=state.progression.completedItemIds.length;
  const hasMoreItems=completedCount<itemSequence.length;
  const nextCollectionItem=itemSequence.find(candidate=>!state.progression.completedItemIds.includes(candidate.id));
  const collectionGoal=nextCollectionItem?t('collectionGoal').replace('{item}',t(nextCollectionItem.displayNameKey)):t('collectionComplete');
  const xpProgress=Math.min(1,(state.player.xp%50)/50);
  const restart=()=>{if(window.confirm(t('restartConfirm'))){setMetaView('workshop');setInventoryOpen(false);void act(async()=>{await game.reset();await game.start();});}};
  return <main className={'shell phase-'+phase.toLowerCase()}>
    {header}
    <div className="workspace-controls"><button className="secondary" aria-expanded={inventoryOpen} onClick={()=>setInventoryOpen(!inventoryOpen)}>{t('inventory')} · {item?.owned?1:0}</button><button className="text-button" onClick={restart}>{t('restart')}</button></div>
    {inventoryOpen&&<section className="inventory-panel" aria-label={t('inventory')}><div><small>{t('inventory')}</small><h3>{item?.owned?itemName:t('inventoryEmpty')}</h3><p>{item?.owned?t('condition')+': '+Math.round(condition)+'%':t('inventoryHint')}</p></div>{item?.owned&&<button className="secondary" onClick={()=>setInventoryOpen(false)}>{t('continue')}</button>}</section>}
    <MetaNav view={metaView} setView={setMetaView} t={t}/>
    {metaView!=='workshop'&&<section className="hub-surface"><button className="text-button" onClick={()=>setMetaView('workshop')}>{t('backToGame')}</button>{metaView==='collection'&&<CollectionPanel state={state} t={t}/>} {metaView==='auction'&&<AuctionPanel state={state} t={t}/>} {metaView==='profile'&&<ProfilePanel state={state} xpProgress={xpProgress} t={t}/>}</section>}
    <div hidden={metaView!=='workshop'}>
    <div className="progress"><span className={phase==='WORKSHOP'?'active':''}>{t('workshop')}</span><i/><span className={['CLIENT','INSPECT','DECISION'].includes(phase)?'active':''}>{t('client')}</span><i/><span className={['RESTORE','APPRAISE','SELL','RESULT'].includes(phase)?'active':''}>{t('valueStage')}</span></div>
    <section className="scene">
      <div className="scene-copy">
        {phase==='WORKSHOP'&&completedCount>0&&!item?<><div className="eyebrow">{t('completeEyebrow')}</div><h2>{t('completeHeadlineA')}<br/><em>{t('completeHeadlineB')}</em></h2><p className="muted">{t('completeHint')}</p><button className="primary next-item-button" disabled={!hasMoreItems} onClick={()=>act(()=>game.showClient())}>{hasMoreItems?t('nextItem'):t('allItemsComplete')}</button></>:phase==='WORKSHOP'?<><div className="eyebrow">{t('workshop')} · 01</div><h2>{t('workshopHeadlineA')}<br/><em>{t('workshopHeadlineB')}</em></h2><p className="muted">{t('clean')}</p><button className="primary" onClick={()=>act(()=>game.showClient())}>{t('continue')}</button></>:null}
        {phase==='CLIENT'&&<><div className="eyebrow">{t('client')} · 01</div><h2>{itemName}</h2><p className="muted">{t('decisionHint')}</p></>}
        {phase==='INSPECT'&&<><div className="eyebrow">{t('inspect')}</div><h2>{t('turn')}</h2><p className="muted">{nextClue?t('decisionHint'):t('valueFound')}</p></>}
        {phase==='DECISION'&&<><div className="eyebrow">{t('client')} · DECISION</div><h2>{itemName}</h2><p className="muted">{clue?t('valueFound'):t('decisionHint')}</p></>}
        {phase==='RESTORE'&&<><div className="eyebrow">{t('restoreStage')} · 01</div><h2>{t('restoreHint')}</h2><p className="muted">{t('condition')}: <strong>{Math.round(condition)}%</strong></p></>}
        {['APPRAISE','SELL','RESULT'].includes(phase)&&<><div className="eyebrow">{phase==='RESULT'?t('soldStage'):t('appraisalStage')} · 01</div><h2>{sceneTitle}</h2><p className="muted">{itemName}</p></>}
      </div>
      <ItemCanvas definition={definition} phase={phase} discovered={!nextClue} condition={condition} clueHint={t('clueTap')} clueCode={nextClue?.code??foundClue?.code??''} clueRotation={nextClue?.requiredRotation??foundClue?.requiredRotation??Math.PI} devAssetLabel={devLabel} showDevAsset={debug} restoreActiveTool={item?.activeTool} onRotate={angle=>{if(Math.abs(angle)>1)game.analytics.track('item_rotated',{itemId:definition.id});}} onRestoreStroke={(deltaMs)=>act(()=>game.stroke(deltaMs))} onReveal={()=>act(()=>game.revealClue())}/>
      <section className="panel">
        {phase==='CLIENT'&&<><div className="money-row"><span>{t('sellerPrice')}</span><b>{'$'+price}</b></div><button className="primary" onClick={()=>act(()=>game.inspect())}>{t('inspect')}</button><button className="secondary disabled" disabled>{t('buy')} {'$'+price}</button><button className="text-button disabled" disabled>{t('refuse')}</button></>}
        {phase==='INSPECT'&&<><div className="valuation"><span>{t('valuation')}</span><strong>{'$'+valuation.knownMin+'–$'+valuation.knownMax}</strong></div>{foundClue&&<div className="clue-card"><small>{t(foundClue.labelKey)}</small><b>{foundClue.code}</b><span>{t(foundClue.valueKey)}</span></div>}<button className="primary" disabled={Boolean(nextClue)} onClick={()=>act(()=>game.decideBack())}>{nextClue?t('turn'):t('back')}</button></>}
        {phase==='DECISION'&&<><div className="valuation"><span>{t('valuation')}</span><strong>{'$'+valuation.knownMin+'–$'+valuation.knownMax}</strong></div><button className="primary" onClick={()=>act(()=>game.buy())}>{t('buy')} {'$'+price}</button><button className="secondary" onClick={()=>act(()=>game.refuse())}>{t('refuse')}</button></>}
        {phase==='RESTORE'&&<><div className="condition-row"><span>{t('condition')}</span><strong>{Math.round(condition)}%</strong></div>{definition.repairOptions&&<div className="repair-options"><div className="repair-title"><span>{t('repairDecision')}</span><b>{item?.repairOptionId?t('repairSelected'):t('repairRequired')}</b></div>{definition.repairOptions.map(option=><button className={item?.repairOptionId===option.id?'repair-option selected':'repair-option'} disabled={Boolean(item?.repairOptionId)} onClick={()=>act(()=>game.chooseRepair(option.id))}><span><b>{t(option.labelKey)}</b><small>{t(option.descriptionKey)}</small></span><strong>{'$'+option.cost}</strong></button>)}</div>}<div className="restoration-progress"><div className="restoration-meter"><div className="meter-head"><span>{t('cleaning')}</span><b>{Math.round(brushProgress*100)}%</b></div><div className="meter-track"><i style={{width:`${brushProgress*100}%`}}/></div><small>{t('cleaningHint')}</small></div><div className="restoration-meter"><div className="meter-head"><span>{t('polishing')}</span><b>{Math.round(polishProgress*100)}%</b></div><div className="meter-track"><i style={{width:`${polishProgress*100}%`}}/></div><small>{polishProgress>=1?t('readyToSell'):brushProgress>=1?t('polishingHint'):t('lockedUntilClean')}</small></div></div><div className="tool-row"><button className={item?.activeTool==='brush'?'tool selected':'tool'} disabled={Boolean(definition.repairOptions?.length&&!item?.repairOptionId)} onClick={()=>game.selectTool('brush')}>✣<span>{t('brush')}</span></button><button className={item?.activeTool==='polish'?'tool selected':'tool'} disabled={brushProgress<1||Boolean(definition.repairOptions?.length&&!item?.repairOptionId)} onClick={()=>game.selectTool('polish')}>✦<span>{t('polish')}</span></button></div><div className="restore-action-hint">{item?.activeTool?t('moveTool'):definition.repairOptions&&!item?.repairOptionId?t('repairFirst'):t('restoreHint')}</div></>}
        {(phase==='APPRAISE'||phase==='SELL')&&<>{phase==='SELL'&&definition.saleOptions&&<div className="sale-options"><div className="repair-title"><span>{t('saleDecision')}</span><b>{item?.saleModeId?t('saleSelected'):t('saleRequired')}</b></div>{definition.saleOptions.map(option=><button className={item?.saleModeId===option.id?'sale-option selected':'sale-option'} disabled={Boolean(item?.saleModeId)} onClick={()=>act(()=>game.chooseSaleMode(option.id))}><span><b>{t(option.labelKey)}</b><small>{t(option.descriptionKey)}</small></span><strong>{option.successValue===option.fallbackValue?'$'+option.successValue:'$'+option.fallbackValue+'–$'+option.successValue}</strong></button>)}</div>}<div className="receipt"><div><span>{t('bought')}</span><b>{'$'+price}</b></div><div><span>{t('costs')}</span><b>{'$'+(selectedSale?.fee??saleCost)}</b></div><div><span>{t('value')}</span><b>{saleNeedsChoice?'—':phase==='SELL'&&selectedSale&&!item?.saleValue?'$'+saleRange:'$'+saleValue}</b></div><div className="profit"><span>{t('profit')}</span><b>{saleNeedsChoice?t('saleChooseToSee'):phase==='SELL'&&selectedSale&&!item?.saleValue?t('saleChooseToSee'):('+$'+profit)}</b></div></div><button className="primary" disabled={saleNeedsChoice} onClick={()=>phase==='APPRAISE'?act(()=>game.toSell()):act(()=>game.sell())}>{phase==='APPRAISE'?t('appraise'):t('sell')} {phase==='SELL'&&item?.saleModeId?'$'+saleValue:''}</button></>}
        {phase==='RESULT'&&<><div className="result"><span>{'+$'+profit}</span><small>{t('resultSummary').replace('$118','$'+saleValue)}</small></div><button className="primary" onClick={()=>act(()=>game.next())}>{t('next')}</button></>}
        {phase==='WORKSHOP'&&!item&&metaView==='workshop'&&<WorkshopOverview state={state} completedCount={completedCount} itemCount={itemSequence.length} collectionGoal={collectionGoal} t={t}/>}
      </section>
    </section>
    </div>
    {debug&&<Debug game={game} state={state} close={()=>setDebug(false)}/>}
  </main>;
}

function Debug({game,state,close}:{game:Game;state:GameState;close:()=>void}){return <aside className="debug"><button onClick={close}>×</button><b>DEBUG</b><pre>{JSON.stringify(state,null,2)}</pre><button onClick={()=>game.reset()}>Reset save</button><button onClick={()=>game.debugSetCash(999)}>Set cash $999</button><button onClick={()=>game.debugReveal()}>Reveal clue</button></aside>;}

type Translator=(key:string)=>string;
function MetaNav({view,setView,t}:{view:MetaView;setView:(view:MetaView)=>void;t:Translator}){return <nav className="meta-nav" aria-label="Workshop sections">{(['workshop','collection','auction','profile'] as MetaView[]).map(section=><button key={section} className={view===section?'active':''} aria-current={view===section?'page':undefined} onClick={()=>setView(section)}>{t('nav'+section[0].toUpperCase()+section.slice(1))}</button>)}</nav>;}

function WorkshopOverview({state,completedCount,itemCount,collectionGoal,t}:{state:GameState;completedCount:number;itemCount:number;collectionGoal:string;t:Translator}){return <><div className="stats"><div><span>{t('cash')}</span><b>{'$'+state.player.cash}</b></div><div><span>{t('level')}</span><b>{String(state.workshop.level).padStart(2,'0')}</b></div><div><span>{t('profitShort')}</span><b>{'$'+state.stats.totalProfit}</b></div></div><div className="workshop-meta"><div className="meta-heading"><span>{t('collection')}</span><b>{completedCount}/{itemCount}</b></div><div className="collection-goal"><small>{t('nextGoal')}</small><span>{collectionGoal}</span></div></div>{completedCount>0&&<div className="completion-note">{t('completeHint')}</div>}</>;}

function CollectionPanel({state,t}:{state:GameState;t:Translator}){return <div className="meta-panel"><div className="meta-panel-heading"><div><small>{t('collection')}</small><h3>{state.progression.completedItemIds.length} / {itemSequence.length}</h3></div><span>{t('collectionHint')}</span></div><div className="collection-cards">{itemSequence.map(definition=>{const found=state.progression.completedItemIds.includes(definition.id);return <article key={definition.id} className={found?'collection-card found':'collection-card'}><div className="collection-card-mark">{found?'✓':'?'}</div><div><b>{found?t(definition.displayNameKey):t('unknownItem')}</b><small>{found?t('category.'+definition.category):t('lockedItem')}</small></div><strong>{found?'$'+definition.trueValue:'—'}</strong></article>;})}</div></div>;}

function AuctionPanel({state,t}:{state:GameState;t:Translator}){const history=[...(state.stats.auctionHistory??[])].reverse();const attempts=state.stats.auctionAttempts??0;const wins=state.stats.auctionWins??0;const winRate=attempts?Math.round(wins/attempts*100):0;return <div className="meta-panel"><div className="meta-panel-heading"><div><small>{t('auctionHouse')}</small><h3>{t('auctionHeadline')}</h3></div><span>{attempts?t('auctionActive'):t('auctionEmpty')}</span></div><div className="auction-stats"><div><span>{t('auctionAttempts')}</span><b>{attempts}</b></div><div><span>{t('auctionWinRate')}</span><b>{winRate+'%'}</b></div><div><span>{t('auctionRevenue')}</span><b>{'$'+(state.stats.auctionRevenue??0)}</b></div></div>{history.length?<div className="auction-history">{history.map((record,index)=>{const definition=itemDefinitions[record.itemId];return <div key={`${record.itemId}-${index}`} className="auction-record"><span className={record.success?'success':'fallback'}>{record.success?'↑':'↓'}</span><div><b>{definition?t(definition.displayNameKey):record.itemId}</b><small>{record.success?t('auctionWon'):t('auctionFallback')}</small></div><strong>{'$'+record.value}</strong></div>;})}</div>:<div className="empty-state">{t('auctionNoHistory')}</div>}</div>;}

function ProfilePanel({state,xpProgress,t}:{state:GameState;xpProgress:number;t:Translator}){const currentXp=state.player.xp%50;return <div className="meta-panel"><div className="profile-hero"><div className="profile-avatar">HV</div><div><small>{t('profile')}</small><h3>{t('collector')}</h3></div><span>{t('guestProfile')}</span></div><div className="profile-level"><div className="meter-head"><span>{t('xpProgress')}</span><b>{currentXp}/50 XP</b></div><div className="meter-track"><i style={{width:`${xpProgress*100}%`}}/></div></div><div className="profile-stats"><div><span>{t('profileLevel')}</span><b>{String(state.player.level).padStart(2,'0')}</b></div><div><span>{t('itemsSold')}</span><b>{state.stats.itemsSold}</b></div><div><span>{t('workshopLevel')}</span><b>{String(state.workshop.level).padStart(2,'0')}</b></div><div><span>{t('totalProfit')}</span><b>{'$'+state.stats.totalProfit}</b></div></div></div>;}
