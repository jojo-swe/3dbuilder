# Plan: Rendering Adapter (Three.js)

This plan covers the framework-agnostic Three.js rendering adapter that derives a live 3D scene
from the core domain model. Work follows TDD (tests first, confirm red, then implement to green).

## Phase 1: Pure Geometry-to-Mesh Conversion
- [x] Task: Coordinate mapping (`x -> X`, `-y -> Z`, height -> `Y`) [c9f2895]
    - [x] Write Tests: `planToGround`, `planToWorld`, `wallAngleY` in `coordinates.test.ts`
    - [x] Implement Feature: `src/adapters/rendering/coordinates.ts`
- [x] Task: Wall geometry conversion (centerline + thickness + height + openings) [c9f2895]
    - [x] Write Tests: solid wall box, opening split (solid/sill/lintel/glass), material color in `wallGeometry.test.ts`
    - [x] Implement Feature: `src/adapters/rendering/wallGeometry.ts`
- [x] Task: Floor geometry conversion (Room polygon -> flat shape) [c9f2895]
    - [x] Write Tests: polygon mapped with `-y`, degenerate polygon rejected in `floorGeometry.test.ts`
    - [x] Implement Feature: `src/adapters/rendering/floorGeometry.ts`

## Phase 2: Three.js Scene Assembly & Store Binding
- [x] Task: SceneBuilder builds THREE objects from the pure conversion data [40f5a16]
    - [x] Write Tests: wall group transform/children, floor mesh, project group counts in `SceneBuilder.test.ts`
    - [x] Implement Feature: `src/adapters/rendering/SceneBuilder.ts` (+ `index.ts` barrel)
- [x] Task: Connect adapter to the store in the UI viewport wrapper [40f5a16]
    - [x] Implement Feature: refactor `src/ui/viewport/BuildingModel.tsx` to render the adapter's
          scene group from `useEditorStore`; verify `Viewport3D.tsx` hosts it

## Definition of Done
- [x] All new pure functions have deterministic unit tests (Three.js mocked/avoided where possible).
- [x] `CI=true npm test` (coverage) passes with >80% coverage for the new module (adapters/rendering: ~96%).
- [x] `npm run lint` and `npm run build` pass.
- [x] Tasks marked complete with commit SHAs; git notes attached per `conductor/workflow.md`.
