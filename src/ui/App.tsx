import {useEffect, useMemo, useState} from 'preact/hooks';
import {Game} from '../app/Game';
import {LocalizationService} from '../services/LocalizationService';
import {WatchCanvas} from '../rendering/WatchCanvas';
import {pocketWatch} from '../content/items/pocketWatch';
import type {GameState} from '../core/types';
import '../styles.css';

export function App({game}:{game:Game}) {
  const [state, setState] = useState<GameState>(game.state);
  const [lang, setLang] = useState(game.platform.getLanguage().startsWith('ru') ? 'ru' : 'en');
  const [debug, setDebug] = useState(new URLSearchParams(location.search).get('debug') === '1');
  const loc = useMemo(() => new LocalizationService(lang), [lang]);
  useEffect(() => game.bus.on('change', next => setState({...next as GameState})), [game]);

  const t = (key:string) => loc.t(key);
  const phase = state.phase;
  const item = state.activeItem;
  const completed = state.tutorial.completed;
  const valuationItem = item ?? {definitionId:pocketWatch.id, discoveredClueIds:[], condition:completed ? 91 : 42, completed, owned:false, bought:false, sold:completed, toolProgress:0};
  const valuation = game.valuation.evaluate(pocketWatch, valuationItem);
  const clue = item?.discoveredClueIds.includes('silver_925') ?? false;
  const condition = item?.condition ?? (completed ? 91 : 42);
  const act = async (fn:() => Promise<unknown>) => { try { await fn(); } catch (error) { console.error(error); } };

  const header = <header>
    <div className="brand">HIDDEN VALUE</div>
    <div className="header-actions">
      <button className="lang" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} aria-label="Change language">{lang.toUpperCase()}</button>
      <div className="cash"><span>✦</span> ${state.player.cash}</div>
    </div>
  </header>;

  if (phase === 'BOOT' || phase === 'TITLE') return <main className="shell title-screen">
    {header}
    <section className="title-card">
      <div className="eyebrow">{t('workshopEyebrow')}</div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <button className="primary" onClick={() => act(() => game.start())}>{t('start')}</button>
    </section>
    <div className="title-mark">HV / 01</div>
  </main>;

  return <main className={`shell phase-${phase.toLowerCase()}`}>
    {header}
    <div className="progress"><span className={phase === 'WORKSHOP' ? 'active' : ''}>{t('workshop')}</span><i/><span className={['CLIENT','INSPECT','DECISION'].includes(phase) ? 'active' : ''}>{t('client')}</span><i/><span className={['RESTORE','APPRAISE','SELL','RESULT'].includes(phase) ? 'active' : ''}>{t('valueStage')}</span></div>
    <section className="scene">
      <div className="scene-copy">
        {phase === 'WORKSHOP' && (completed ? <>
          <div className="eyebrow">{t('completeEyebrow')}</div>
          <h2>{t('completeHeadlineA')}<br/><em>{t('completeHeadlineB')}</em></h2>
          <p className="muted">{t('completeHint')}</p>
        </> : <>
          <div className="eyebrow">{t('workshop')} · 01</div>
          <h2>{t('workshopHeadlineA')}<br/><em>{t('workshopHeadlineB')}</em></h2>
          <p className="muted">{t('clean')}</p>
          <button className="primary" onClick={() => act(() => game.showClient())}>{t('continue')}</button>
        </>)}
        {phase === 'CLIENT' && <><div className="eyebrow">{t('client')} · 01</div><h2>{t('item.pocketWatch.name')}</h2><p className="muted">{t('decisionHint')}</p></>}
        {phase === 'INSPECT' && <><div className="eyebrow">{t('inspect')}</div><h2>{t('turn')}</h2><p className="muted">{clue ? t('valueFound') : t('decisionHint')}</p></>}
        {phase === 'DECISION' && <><div className="eyebrow">{t('client')} · DECISION</div><h2>{t('item.pocketWatch.name')}</h2><p className="muted">{clue ? t('valueFound') : t('decisionHint')}</p></>}
        {phase === 'RESTORE' && <><div className="eyebrow">{t('restoreStage')} · 01</div><h2>{t('restoreHint')}</h2><p className="muted">{t('condition')}: <strong>{Math.round(condition)}%</strong></p></>}
        {['APPRAISE','SELL','RESULT'].includes(phase) && <><div className="eyebrow">{phase === 'RESULT' ? t('soldStage') : t('appraisalStage')} · 01</div><h2>{phase === 'RESULT' ? t('complete') : t('value')}</h2><p className="muted">{t('item.pocketWatch.name')}</p></>}
      </div>
      <WatchCanvas phase={phase} discovered={clue} condition={condition} clueHint={t('clueTap')} devAssetLabel={t('devAsset')} restoreActiveTool={item?.activeTool} onRotate={angle => { if (Math.abs(angle) > 1) game.analytics.track('item_rotated', {itemId:pocketWatch.id}); }} onRestoreStroke={() => act(() => game.stroke())} onReveal={() => act(() => game.revealClue())}/>
      <section className="panel">
        {phase === 'CLIENT' && <><div className="money-row"><span>{t('sellerPrice')}</span><b>$40</b></div><button className="primary" onClick={() => act(() => game.inspect())}>{t('inspect')}</button><button className="secondary disabled" disabled>{t('buy')} $40</button><button className="text-button disabled" disabled>{t('refuse')}</button></>}
        {phase === 'INSPECT' && <><div className="valuation"><span>{t('valuation')}</span><strong>${valuation.knownMin}–${valuation.knownMax}</strong></div>{clue && <div className="clue-card"><small>{t('clue.stamp')}</small><b>925</b><span>{t('clue.silver')}</span></div>}<button className="primary" disabled={!clue} onClick={() => act(() => game.decideBack())}>{t('back')}</button></>}
        {phase === 'DECISION' && <><div className="valuation"><span>{t('valuation')}</span><strong>${valuation.knownMin}–${valuation.knownMax}</strong></div><button className="primary" onClick={() => act(() => game.buy())}>{t('buy')} $40</button><button className="secondary" onClick={() => act(() => game.refuse())}>{t('refuse')}</button></>}
        {phase === 'RESTORE' && <><div className="condition-row"><span>{t('condition')}</span><strong>{Math.round(condition)}%</strong></div><div className="tool-row"><button className={item?.activeTool === 'brush' ? 'tool selected' : 'tool'} onClick={() => game.selectTool('brush')}>✣<span>{t('brush')}</span></button><button className={item?.activeTool === 'polish' ? 'tool selected' : 'tool'} disabled={condition < 68} onClick={() => game.selectTool('polish')}>✦<span>{t('polish')}</span></button></div><button className="primary" disabled={!item?.activeTool} onClick={() => act(() => game.stroke())}>{item?.activeTool ? `${item.activeTool === 'brush' ? t('brush') : t('polish')} · ${item.toolProgress}` : t('restoreHint')}</button></>}
        {(phase === 'APPRAISE' || phase === 'SELL') && <><div className="receipt"><div><span>{t('bought')}</span><b>$40</b></div><div><span>{t('costs')}</span><b>$0</b></div><div><span>{t('value')}</span><b>$118</b></div><div className="profit"><span>{t('profit')}</span><b>+$78</b></div></div><button className="primary" onClick={() => phase === 'APPRAISE' ? act(() => game.toSell()) : act(() => game.sell())}>{phase === 'APPRAISE' ? t('appraise') : t('sell')} {phase === 'SELL' ? '$118' : ''}</button></>}
        {phase === 'RESULT' && <><div className="result"><span>+$78</span><small>{t('resultSummary')}</small></div><button className="primary" onClick={() => act(() => game.next())}>{t('next')}</button></>}
        {phase === 'WORKSHOP' && <><div className="stats"><div><span>{t('cash')}</span><b>${state.player.cash}</b></div><div><span>{t('level')}</span><b>01</b></div><div><span>{t('profitShort')}</span><b>${state.stats.totalProfit}</b></div></div>{completed && <div className="completion-note">{t('completeHint')}</div>}</>}
      </section>
    </section>
    {debug && <Debug game={game} state={state} close={() => setDebug(false)}/>}<button className="debug-toggle" onClick={() => setDebug(value => !value)} aria-label="Developer tools">⌘</button>
  </main>;
}

function Debug({game, state, close}:{game:Game;state:GameState;close:()=>void}) {
  return <aside className="debug"><button onClick={close}>×</button><b>DEBUG</b><pre>{JSON.stringify(state, null, 2)}</pre><button onClick={() => game.reset()}>Reset save</button><button onClick={() => game.debugSetCash(999)}>Set cash $999</button><button onClick={() => game.debugReveal()}>Reveal clue</button></aside>;
}
