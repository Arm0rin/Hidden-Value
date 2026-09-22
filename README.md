# Hidden Value

Hidden Value is a mobile first hybrid casual game about finding the value that other people overlook. The first vertical slice follows one old pocket watch from an uncertain offer to inspection, purchase, restoration, appraisal and sale.

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
- `src/content/items/pocketWatch.ts` is the data definition for the first item.
- `src/systems/ValuationSystem.ts`, `EconomySystem.ts` and `RestorationSystem.ts` contain business rules.
- `src/rendering/WatchCanvas.tsx` contains the temporary Three.js watch asset and Pointer Events interaction.
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

The current build contains one Pocket Watch vertical slice. It intentionally has no backend, production monetization, platform SDK, collection, auction, second currency, NPC dialogue or additional items. The watch uses material states for dirty, clean and polished conditions; a dirt-mask shader can be added later without changing the restoration contract.

Initial production bundle is currently a small Three.js web build, but the main JavaScript chunk is still above Vite's 500 kB warning threshold. Code splitting and asset loading should be revisited before portal launch.

## Next milestone

After the vertical slice is reviewed, generalize the item and renderer contracts, then add the Vintage Camera as the second data-driven item. See `docs/MVP_ROADMAP.md` and `docs/HIDDEN_VALUE_HANDOFF.md`.
