# AGENTS.md

This file is the source of truth for coding agents in this repository. `CLAUDE.md` only points here. When this file and another doc disagree about layering or current behavior, follow this file and the source tree.

## Product

Professional-grade 3D house builder for DIY home builders and renovators in Sweden. The 2D floor plan is the single source of truth. 3D views, area calculations, and municipality-ready building permit (bygglov, SS 21054:2020) documents are derived from it.

Background: [`conductor/product.md`](conductor/product.md). Permit data: [`src/core/domain/Bygglov.ts`](src/core/domain/Bygglov.ts).

## Commands

```bash
npm run dev            # Vite dev server with HMR
npm run build          # tsc -b && vite build
npm run lint           # ESLint (flat config)
npm run preview        # Preview the production build
npm run test           # Vitest watch mode
npm run test:coverage  # Vitest with the v8 coverage report

# One file
npx vitest run src/core/geometry/RoomFinder.test.ts
```

Before committing, run `npm run test -- --run`, `npm run build`, and `npm run lint`. Vitest strips types without checking them; `tsc -b` (via `build`) catches strict-mode errors the tests miss.

`@rollup/rollup-win32-x64-msvc` is an `optionalDependency` so `npm install` succeeds on Linux and macOS. Leave it there.

## Architecture

React 19, TypeScript, Vite. Three.js is rendered with React Three Fiber. `core` is framework-agnostic; `ui` is React.

### Principles

- **Floor plan is king.** 2D geometry is the source of truth. 3D is a derived view.
- **Deterministic.** Geometry and domain code are pure: `f(input) = output`, with no side effects.
- **Layered dependencies.** Lower layers never import higher ones. `adapters/` never imports React. `geometry/` has no building concepts and does not import `domain`, `state`, `ui`, or `adapters`.

```
ui → adapters → state → domain → geometry
```

### Where code lives

| Path | Role |
| --- | --- |
| `src/core/geometry/` | Pure math: vectors, polygons, `RoomFinder` |
| `src/core/domain/` | Building entities, areas, bygglov |
| `src/core/state/store.ts` | Single Zustand + Immer store (`useEditorStore`) |
| `src/adapters/rendering/` | Domain → Three.js. Pure render data, then `SceneBuilder` |
| `src/ui/editor/` | SVG floor plan, toolbar, property inspector |
| `src/ui/viewport/` | R3F canvas, `BuildingModel`, `ErrorBoundary` |

Shorter overview: [`ARCHITECTURE.md`](ARCHITECTURE.md). Stack: [`conductor/tech-stack.md`](conductor/tech-stack.md).

### Data flow

A click in `FloorPlanEditor` calls a `useEditorStore` action. Zustand and Immer update the project. `addWall`, `removeWall`, and `removeNode` rebuild that floor's rooms with `RoomFinder.findRooms()`. React re-renders the SVG overlays, and `BuildingModel` rebuilds the Three.js scene through `adapters/rendering`.

## Domain essentials

All entities are `Record<EntityId, Entity>` maps on `Project`. Links between entities are string IDs (`wall.startNodeId`), never object references. IDs are UUID v4.

Rooms are never created by hand. `RoomFinder` rebuilds a floor's rooms whenever its walls change. Full shapes: [`src/core/domain/types.ts`](src/core/domain/types.ts). Actions: [`src/core/state/store.ts`](src/core/state/store.ts).

Defaults: wall thickness `0.2` m and height `2.4` m (`store.ts`); opening width `0.9` m, height `2.1` m, type `door` (`FloorPlanEditor.tsx`).

**Units are meters.** Geometry uses standard math coordinates (Y up). The SVG `viewBox` is in meters and Y-down, so no extra transform is applied. Three.js maps plan `(x, y)` to world `(X = x, Z = -y)` with world Y up — see `planToGround` in [`src/adapters/rendering/coordinates.ts`](src/adapters/rendering/coordinates.ts).

Tools are `select | wall | room | opening`. Inside a Zustand `set()` callback, mutate `state` directly; Immer writes the next immutable snapshot.

**Invariant:** after any store action, no wall references a missing node and no opening references a missing wall. New deletion actions must keep that. See [`src/core/state/store.test.ts`](src/core/state/store.test.ts).

## Gotchas

### Room IDs are not stable

`addWall`, `removeWall`, and `removeNode` delete the affected floor's rooms and create new ones. Do not hold a room id (including in `selectedIds`) across a wall edit.

### A 3D failure must not blank the 2D editor

- Do not use drei `preset=` props (`<Environment preset>`, `<Stage environment>`, and the like). They fetch from a CDN at runtime and break offline and behind firewalls. Add the file under `public/` and reference it with `` `${import.meta.env.BASE_URL}…` ``. The bundled city HDR is `public/hdr/potsdamer_platz_1k.hdr` ([`public/hdr/README.md`](public/hdr/README.md)).
- Anything new that loads inside `<Canvas>` (textures, models, HDRs) needs its own `ErrorBoundary` and `Suspense`. A failed HDR should drop reflections only. The outer canvas boundary shows the same "3D preview is unavailable" fallback, and Retry remounts the canvas.
- Check WebGL2 with `WebGL.isWebGL2Available()` before mounting the canvas. R3F creates its renderer in an un-awaited effect, so a missing context is not caught by an error boundary.

### Floor meshes

`buildFloorRenderData` keeps plan `y` unchanged. The mesh's `-90°` rotation about X already sends shape `(x, y)` to world `(x, 0, -y)`. Negating `y` in the shape points as well mirrors the floor away from its walls. [`src/adapters/rendering/SceneBuilder.test.ts`](src/adapters/rendering/SceneBuilder.test.ts) asserts floor vertices land on `planToGround`; keep that test when changing the mapping.

### Walls, openings, and the 3D host

`buildWallRenderData` returns `null` for a missing node or a wall shorter than `0.01` m. Openings that run past either end of the wall are skipped. Overlapping openings are not handled.

Put 3D logic in `src/adapters/rendering/`. `BuildingModel` only mounts `buildSceneGroup(project)` and calls `disposeGroup` on the previous group. Render-data modules (`wallGeometry.ts`, `floorGeometry.ts`, `coordinates.ts`) stay free of Three.js and React so they can be unit-tested. `SceneBuilder` is what instantiates meshes.

### Drawing

The wall tool chains clicks on `activeFloorId`. A click within `NODE_RADIUS * 2` (`NODE_RADIUS` is `0.15` m) of an existing node reuses that node; that is how a chain closes into a room. A click within `snapGridSize` (`0.1` m) of the previous chain node is ignored (zero-length guard). Escape or right-click removes the dangling temp node and preview wall.

The opening tool searches within `0.5` m via `closestPointOnSegment` and places a door on click.

Manual click-path checks: [`.agents/skills/testing-3dbuilder/SKILL.md`](.agents/skills/testing-3dbuilder/SKILL.md).

## Testing

- Vitest, with tests next to the source: `Foo.ts` → `Foo.test.ts`.
- Geometry and domain tests need no DOM. Build fixtures with `DomainFactory` (`createNode`, `createWall`).
- Store tests drive `useEditorStore.getState()` and call `createProject()` in `beforeEach`.
- Test 3D behavior through the pure functions in `src/adapters/rendering/`. Component tests that need a DOM start with `// @vitest-environment jsdom` and use `@testing-library/react` (see `src/ui/viewport/ErrorBoundary.test.tsx`).
- Coverage: `npm run test:coverage`. Conductor tracks aim for more than 80% on new code ([`conductor/workflow.md`](conductor/workflow.md)).

## Style

Follow [`conductor/code_styleguides/typescript.md`](conductor/code_styleguides/typescript.md) (Google TypeScript Style Guide):

- `const` and `let` only. No `var`.
- Named exports only. No default exports.
- No `any`. Prefer `unknown` or a specific type.
- No `#private` fields. Use TypeScript `private`. Do not write `public`; it is the default.
- Single quotes. Template literals for interpolation.
- `===` and `!==`.
- Avoid `as` and `!` unless the assertion is justified.
- `UpperCamelCase` for types, `lowerCamelCase` for values, `CONSTANT_CASE` for global constants.
- Explicit semicolons.
- `/** JSDoc */` for public API docs, `//` for implementation notes. Do not restate the code.
