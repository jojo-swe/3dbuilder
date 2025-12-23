# Plan: Core Geometry Engine

This plan covers the implementation of the core wall and room detection logic.

## Phase 1: Wall Domain & Snapping [checkpoint: c3e70b9]
- [x] Task: Define Wall and Point types with validation logic [38f7b35]
    - [ ] Write Tests: Validate wall creation and basic properties
    - [ ] Implement Feature: Create Wall entity in `src/core/domain/types.ts`
- [x] Task: Implement wall snapping utility [207de4e]
    - [ ] Write Tests: Test snapping between wall endpoints with tolerance
    - [ ] Implement Feature: Snapping logic in `src/core/geometry/LineUtils.ts`
- [x] Task: Conductor - User Manual Verification 'Phase 1: Wall Domain & Snapping' (Protocol in workflow.md) [c3e70b9]

## Phase 2: Room Detection Engine
- [x] Task: Implement wall graph construction [f2040f5]
    - [ ] Write Tests: Verify graph nodes and edges from a set of walls
    - [ ] Implement Feature: Graph building logic in `src/core/geometry/RoomFinder.ts`
- [x] Task: Implement closed loop detection [9905a63]
    - [ ] Write Tests: Test loop finding with simple and complex wall layouts
    - [ ] Implement Feature: Loop detection algorithm in `src/core/geometry/RoomFinder.ts`
- [ ] Task: Implement Room generation and Area calculation
    - [ ] Write Tests: Verify room area for different wall thicknesses
    - [ ] Implement Feature: Room entity and AreaService in `src/core/domain/`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Room Detection Engine' (Protocol in workflow.md)
