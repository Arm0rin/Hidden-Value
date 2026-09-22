# Hidden Value Handoff

## Product idea

Hidden Value is a premium casual game about discovering the hidden value of old, dirty or suspicious objects. The player's pleasure comes from reducing uncertainty: inspect an object, find a clue, narrow the valuation range, make a purchase decision, restore the object and sell it for a profit.

The first slice proves one complete loop with an old silver pocket watch. It is deliberately small so the feel of inspection, discovery, restoration and reward can be reviewed before adding content.

## Current core loop

```text
TITLE -> WORKSHOP -> CLIENT -> INSPECT -> DECISION -> BUY
     -> RESTORE -> APPRAISE -> SELL -> RESULT -> WORKSHOP
```

`GameFlow` is the only owner of legal scene transitions. UI actions call `Game` methods; they do not mutate flow or money directly.

## Stack and architecture

The project uses TypeScript, Vite, Three.js, Preact, HTML/CSS and Pointer Events. This keeps the first slice light enough for HTML5 portals while leaving a path to a real GLB/glTF asset pipeline.

```text
UI -> Game/GameFlow -> gameplay systems -> GameState -> services -> PlatformAdapter
```

The first adapter is `WebAdapter`. It uses browser language detection, localStorage save and a guest player. `YandexAdapter` and `CrazyGamesAdapter` inherit the boundary only; their SDKs are intentionally not integrated yet.

## Implemented systems

- `ValuationSystem`: returns `trueValue`, `knownMin`, `knownMax` and confidence from discovered clues.
- `EconomySystem`: checks balance and applies spend/earn operations.
- `RestorationSystem`: reusable brush and polish tools update condition and visual material state.
- `SaveService`: handles empty, corrupt and partial saves and writes `saveVersion`.
- `AnalyticsService`: provides the event contract with a development console implementation.
- `AudioService`: provides master/music/sfx/ambient controls and lightweight feedback tones.
- `LocalizationService`: loads Russian and English dictionaries.
- `DeviceProfiler`: selects LOW/MEDIUM/HIGH renderer settings and caps DPR for portal devices.

## GameState schema

`GameState` contains only gameplay state:

```ts
interface GameState {
  version: number;
  saveVersion: number;
  phase: FlowPhase;
  player: { level: number; xp: number; cash: number };
  workshop: { level: number };
  progression: { completedItems: number; discoveredClues: string[] };
  tutorial: { currentStep: string; completed: boolean };
  stats: { totalProfit: number; itemsBought: number; itemsSold: number };
  activeItemId: string | null;
  activeItem: ItemInstance | null;
  sessionStartedAt: number;
}
```

Camera position, DOM state, hover, pointer position and animation progress are not saved. The active item and its clue, restoration and ownership state are saved so a reload can resume the slice safely.

## PlatformAdapter contract

```ts
interface PlatformAdapter {
  init(): Promise<void>;
  getPlatformName(): string;
  getLanguage(): string;
  loadSave(): Promise<string | null>;
  save(data: string): Promise<void>;
  showRewarded?(placement: string): Promise<RewardedResult>;
  showInterstitial?(placement: string): Promise<void>;
  gameplayStart?(): void;
  gameplayStop?(): void;
}
```

No production ad or purchase flow is surfaced in the current slice.

## ItemDefinition and pocket watch data

Items are data-driven. `pocket_watch_01` defines the seller price `$40`, true restored value `$118`, starting range `$20–$80`, silver `925` clue range `$70–$150`, and brush/polish restoration steps. A future camera should be added as another definition plus assets and localized content, without copying the game flow.

The current Three.js watch is a clearly marked dev placeholder. It proves front/back rotation, a clue hotspot, lighting and material changes. Replace it later with an owned or commissioned GLB/glTF asset with a visible hallmark and appropriate materials.

## Clues and valuation

The silver hallmark is a data clue with an id, localized labels, position and valuation range. The inspect scene exposes a subtle hotspot only when the back of the object is facing the player. The UI receives valuation data from `ValuationSystem`; clues do not directly update UI components.

## Restoration

The initial condition is about 42%. Five brush strokes reach about 68%, then four polish strokes reach about 91%. The temporary renderer uses dirty, clean and polished material states. The system is ready for a future dirt, oxidation, scratch and roughness mask implementation.

## Transaction safety

BUY checks the decision phase, ownership flags and available cash before spending `$40`. SELL checks ownership and the sold flag before adding `$118`, XP and profit. Both state changes are saved after the transaction, so repeated clicks cannot duplicate rewards.

## Known limitations and technical debt

- The watch geometry is a placeholder, not final art.
- Audio uses generated oscillator tones instead of final licensed assets.
- The main JavaScript bundle is above Vite's 500 kB warning threshold; code splitting should be addressed before portal release.
- The renderer has quality structure and a capped DPR, but a full device profiler and shadow presets are still small.
- The first slice has no backend, account system, real SDK, monetization or second item.

## Future item order

1. Vintage Camera
2. Fake Luxury Watch
3. PixelBox 84
4. Painting
5. Mystery Estate Item

The full sequence and milestone gates are in `docs/MVP_ROADMAP.md`.
