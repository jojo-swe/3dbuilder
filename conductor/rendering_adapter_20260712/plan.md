# Plan: Rendering Adapter (Three.js)

This plan covers the framework-agnostic Three.js rendering adapter that derives a live 3D scene
from the core domain model. Work follows TDD (tests first, confirm red, then implement to green).

## Phase 1: Pure Geometry-to-Mesh Conversion
- [ ] Task: Coordinate mapping (`x -> X`, `-y -> Z`, height -> `Y`)
    - [ ] Write Tests: `planToGround`, `planToWorld`, `wallAngleY` in `coordinates.test.ts`
    - [ ] Implement Feature: `src/adapters/rendering/coordinates.ts`
- [ ] Task: Wall geometry conversion (centerline + thickness + height + openings)
    - [ ] Write Tests: solid wall box, opening split (solid/sill/lintel/glass), material color in `wallGeometry.test.ts`
    - [ ] Implement Feature: `src/adapters/rendering/wallGeometry.ts`
- [ ] Task: Floor geometry conversion (Room polygon -> flat shape)
    - [ ] Write Tests: polygon mapped with `-y`, degenerate polygon rejected in `floorGeometry.test.ts`
    - [ ] Implement Feature: `src/adapters/rendering/floorGeometry.ts`

## Phase 2: Three.js Scene Assembly & Store Binding
- [ ] Task: SceneBuilder builds THREE objects from the pure conversion data
    - [ ] Write Tests: wall group transform/children, floor mesh, project group counts in `SceneBuilder.test.ts`
    - [ ] Implement Feature: `src/adapters/rendering/SceneBuilder.ts` (+ `index.ts` barrel)
- [ ] Task: Connect adapter to the store in the UI viewport wrapper
    - [ ] Implement Feature: refactor `src/ui/viewport/BuildingModel.tsx` to render the adapter's
          scene group from `useEditorStore`; verify `Viewport3D.tsx` hosts it

## Definition of Done
- All new pure functions have deterministic unit tests (Three.js mocked/avoided where possible).
- `CI=true npm test` (coverage) passes with >80% coverage for the new module.
- `npm run lint` and `npm run build` pass.
- Tasks marked complete with commit SHAs; git notes attached per `conductor/workflow.md`.
