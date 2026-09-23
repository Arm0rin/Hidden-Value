# Hidden Value Handoff

## Product idea

Hidden Value is a premium casual game about discovering the hidden value of old, dirty or suspicious objects. The player's pleasure comes from reducing uncertainty: inspect an object, find a clue, narrow the valuation range, make a purchase decision, restore the object and sell it for a profit.

The current MVP proves the item loop with an old silver pocket watch, a vintage rangefinder camera, a suspicious luxury watch, a PixelBox 84 console and a provenance-heavy painting. Each item is selected from a shared data contract, while its renderer, clue pattern and optional repair or sale decision remain distinct. The Workshop scene now anchors progression with a persistent level, collection strip and next-item goal.

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

- `ValuationSystem`: returns `trueValue`, `knownMin`, `knownMax` and confidence from the latest discovered clue.
- `EconomySystem`: checks balance and applies spend/earn operations.
- `RestorationSystem`: reusable timed brush and polish tools update condition and visual material state. Every item requires seven seconds of cleaning and five seconds of polishing. Items may also expose data-driven repair options before restoration.
- `SaveService`: handles empty, corrupt and partial saves and writes `saveVersion`.
- `AnalyticsService`: provides the event contract with a development console implementation.
- `AudioService`: provides master/music/sfx/ambient controls and lightweight feedback tones.
- `LocalizationService`: loads Russian and English dictionaries.
- `DeviceProfiler`: selects LOW/MEDIUM/HIGH renderer settings and caps DPR for portal devices.
- Workshop meta: derives level from completed items and displays collection progress from `completedItemIds`.

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

## ItemDefinition and item data

Items are data-driven. `pocket_watch_01` defines the seller price `$40`, true restored value `$118`, starting range `$20–$80` and a silver `925` clue. `vintage_camera_01` defines a `$55` purchase, `$176` restored value, a multi-coated lens clue and a rare serial-plate clue. `fake_luxury_watch_01` defines a `$24` purchase, `$42` restored value and UV/serial replica clues. `pixel_box_84` defines a `$46` purchase, a rare revision clue set and quick versus precision repair options. `painting_47` defines a `$75` purchase, provenance clues and dealer versus auction sale options. All use the same GameFlow, timed restoration contract and transaction guards.

The current Three.js watch and camera are clearly marked dev placeholders. They prove front/back rotation, item-specific clue hotspots, lighting and material changes. Replace them later with owned or commissioned GLB/glTF assets with appropriate licenses.

## Clues and valuation

The silver hallmark is a data clue with an id, localized labels, position and valuation range. The inspect scene exposes a subtle hotspot only when the back of the object is facing the player. The UI receives valuation data from `ValuationSystem`; clues do not directly update UI components.

## Restoration

Restoration is driven by elapsed pointer movement rather than item-specific stroke counts. Cleaning takes seven seconds and polishing takes five seconds for every current and future item. PixelBox adds a repair decision before the tools become available: quick repair costs `$8`, while precision repair costs `$24` and increases resale value by `$38`. Painting adds a sale decision after restoration: dealer sale is guaranteed at `$190`, while auction has a 58% chance of `$285`, a `$105` fallback and a `$12` fee. The temporary renderers use dirty, clean and polished material states. The system is ready for a future dirt, oxidation, scratch and roughness mask implementation.

## Transaction safety

BUY checks the decision phase, ownership flags and available cash before spending `$40`. SELL checks ownership and the sold flag before adding `$118`, XP and profit. Both state changes are saved after the transaction, so repeated clicks cannot duplicate rewards.

## Known limitations and technical debt

- The watch and camera geometry are placeholders, not final art.
- Audio uses generated oscillator tones instead of final licensed assets.
- The main JavaScript bundle is above Vite's 500 kB warning threshold; code splitting should be addressed before portal release.
- The renderer has quality structure and a capped DPR, but a full device profiler and shadow presets are still small.
- The first two item loops have no backend, account system, real SDK or monetization.

## Future item order

1. Workshop Meta
2. Collections
3. Auction House expansion

The full sequence and milestone gates are in `docs/MVP_ROADMAP.md`.
