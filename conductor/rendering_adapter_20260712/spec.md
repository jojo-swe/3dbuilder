# Specification: Rendering Adapter (Three.js)

## Overview
Create the rendering adapter that turns the core domain model (`Node`, `Wall`, `Room`) into a
live Three.js scene. This fulfils the **Real-time 3D Preview** product goal: an instant, live
visualization of the 2D floor plan in 3D. The 2D floor plan remains the single source of truth
(see `ARCHITECTURE.md` / `CLAUDE.md`); the 3D scene is a **derived view**.

## Core Requirements
- **Coordinate mapping:** Map the 2D floor-plan coordinate system to the Three.js world using
  `x -> X`, `-y -> Z`, and height extrusion along `Y` (SVG Y-down inverted for 3D), exactly as
  documented in `CLAUDE.md`.
- **Wall meshes:** Build wall meshes from wall centerlines (start/end `Node`), `thickness`, and
  `height`. A wall is positioned at its midpoint and rotated to its centerline angle. Openings
  (doors/windows) split the wall into solid segments plus sill/lintel/glass parts.
- **Floor meshes:** Build floor meshes from detected `Room` polygons (traced via `RoomUtils.getPolygon`).
- **Live scene:** Subscribe to the `useEditorStore` state so the scene rebuilds whenever the
  project changes.
- **Framework-agnostic core:** The adapter core must not import React. Pure geometry-to-mesh
  conversion is expressed as deterministic pure functions; Three.js scene assembly is imperative
  and React-free. The React UI layer only hosts the canvas and mounts the adapter output.

## Technical Constraints
- Location: `src/adapters/rendering/` (the **Adapters** layer described in `tech-stack.md`).
- Respect the layered dependency rule (`ui -> state -> domain -> geometry`). The adapter may depend
  on `core` (domain, geometry, state) and Three.js, but never on `ui`.
- Pure geometry conversion functions return plain data (no Three.js, no React) so they are trivially
  testable and deterministic (`f(Input) = Output`).
- TypeScript strict, Google TS style (named exports only, no `any`, `===`, single quotes, semicolons).

## Success Criteria
- Given a wall between two nodes, the adapter produces a group placed at the wall midpoint, rotated
  to the wall angle, containing a solid box of the correct length/height/thickness.
- Given a wall with an opening, the wall is split into the expected solid segments plus sill/lintel
  parts and a glass placeholder, none overlapping the opening void.
- Given a detected `Room`, the adapter produces a flat floor mesh whose shape vertices are the room
  polygon mapped with `-y`.
- Coordinate mapping converts `(x, y)` plan points to `(x, height, -y)` world points.
- Building a project group yields one wall group per wall and one floor mesh per room.
- Unit tests cover the pure conversion functions and the scene assembly, with >80% coverage for the
  new module.
