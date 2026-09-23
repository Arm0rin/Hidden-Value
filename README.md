# Hidden Value

Hidden Value is a mobile first hybrid casual game about finding the value that other people overlook. The first playable slice now follows an old pocket watch, a vintage rangefinder camera, a suspicious luxury watch, a PixelBox 84 console and a provenance-heavy painting from an uncertain offer to inspection, purchase, restoration, appraisal and sale.

## Tech stack

- TypeScript
- Vite
- Three.js
- Preact
- HTML/CSS and Pointer Events
- Vitest for business logic tests

The runtime is platform neutral. The current working adapter is `WebAdapter`; Yandex and CrazyGames adapters are architecture placeholders and contain no SDK integration.

## Local development

```bash
npm install
npm run dev
```

Open the local Vite URL in a browser. Add `?debug=1` for developer controls.

## Build and tests

```bash
npm run build
npm test
```

The build runs TypeScript checking before Vite production bundling. Tests cover valuation, economy, save migration, flow guards and the exactly once pocket watch transaction path.

## Architecture

```text
UI (Preact)
  -> Game / GameFlow
  -> gameplay systems
  -> GameState
  -> services
  -> PlatformAdapter
  -> WebAdapter (localStorage and guest fallback)
```

Gameplay systems do not call `localStorage`, `YaGames`, `CrazyGames.SDK` or an analytics provider directly.

Important modules:

- `src/app/Game.ts` owns the vertical slice orchestration.
- `src/core/GameFlow.ts` owns valid scene transitions.
- `src/content/items/` contains data definitions for the pocket watch, vintage camera, suspicious luxury watch, PixelBox 84 and painting.
- `src/systems/ValuationSystem.ts`, `EconomySystem.ts` and `RestorationSystem.ts` contain business rules.
- `src/rendering/ItemCanvas.tsx` selects the item renderer; `WatchCanvas.tsx` and `CameraCanvas.tsx` provide the Three.js assets and Pointer Events interaction.
- `src/rendering/DeviceProfiler.ts` selects LOW/MEDIUM/HIGH rendering settings and caps device pixel ratio.
- `src/services/SaveService.ts` migrates and persists only game state.
- `src/platform/PlatformAdapter.ts` is the platform boundary.

## Folder structure

```text
src/
  app/             bootstrap and game orchestration
  content/         item definitions and default state
  core/            state, events and flow types
  locales/         ru/en translations
  platform/        Web, Yandex and CrazyGames adapter boundaries
  rendering/       Three.js placeholder watch renderer
  services/        save, localization, audio and analytics abstractions
  systems/         valuation, economy and restoration rules
  ui/              Preact application
tests/             business logic and transaction tests
docs/              handoff and roadmap
```

## Adding a new item

1. Add an `ItemDefinition` under `src/content/items/`.
2. Provide a stable id, localized display key, valuation ranges, clues and restoration steps.
3. Add the model through the renderer's future GLB/glTF asset service; do not copy the game flow.
4. Add localized strings and business logic tests for the new data.

The current watch mesh is explicitly a dev placeholder. A final asset should be an owned or commissioned GLB/glTF model with front/back detail, a visible hallmark, material states and an appropriate license.

## Current scope and limitations

The current build contains five data-driven item loops: Pocket Watch, Vintage Camera, Suspicious Luxury Watch, PixelBox 84 and Painting. PixelBox adds a repair tradeoff before restoration: a cheaper quick repair or a more expensive precision repair with a higher resale value. Painting adds provenance clues and a sale decision between guaranteed dealer cash and a risky auction. The workshop now tracks level, collection progress and the next collection goal between deals. It intentionally has no backend, production monetization, platform SDK, second currency or NPC dialogue. Every item uses the shared timed restoration contract: seven seconds of cleaning followed by five seconds of polishing.

Initial production bundle is currently a small Three.js web build, but the main JavaScript chunk is still above Vite's 500 kB warning threshold. Code splitting and asset loading should be revisited before portal launch.

## Next milestone

The next milestone is the Collection and Auction House expansion. See `docs/MVP_ROADMAP.md` and `docs/HIDDEN_VALUE_HANDOFF.md`.
