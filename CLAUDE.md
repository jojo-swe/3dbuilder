# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Context

This is a **professional-grade 3D house builder** for DIY home builders and renovators in Sweden. The 2D floor plan is the single source of truth — 3D views, area calculations, and municipality-ready building permit (bygglov) documents are all derived from it.

## Build & Development Commands

```bash
npm run dev           # Start Vite dev server with HMR
npm run build         # TypeScript compile (tsc -b) + Vite production build
npm run lint          # ESLint (flat config, TypeScript + React Hooks plugins)
npm run preview       # Preview production build locally
npm run test          # Vitest in watch mode
npm run test:coverage # Vitest with v8 coverage report

# Run a single test file
npx vitest run src/core/geometry/RoomFinder.test.ts
```

## Architecture Overview

Built with **React 19 + TypeScript + Vite**. The app is split into a framework-agnostic `core` and a React `ui` layer. 3D rendering uses Three.js via React Three Fiber.

### Core Principles

- **Floor Plan is King**: The 2D geometry is the single source of truth. 3D is a derived view.
- **Deterministic**: `f(Input) = Output`. No side effects in geometry/domain code.
- **Layered dependency**: `ui` → `adapters` → `state` → `domain` → `geometry`. Lower layers never import from higher ones. `adapters/` never imports React.

### Data Flow

```
User click → FloorPlanEditor → useEditorStore action
  → Zustand/Immer mutates project
  → addWall triggers RoomFinder.findRooms() (auto room detection)
  → React re-renders SVG overlays; BuildingModel rebuilds the scene via adapters/rendering
```

## Directory Structure

```
src/
├── core/
│   ├── geometry/       # Pure math — no building concepts
│   │   ├── types.ts        # Vector2, LineSegment, Polygon, EPSILON
│   │   ├── Vector2Math.ts  # 2D vector ops, snap, projections
│   │   ├── PolygonUtils.ts # Shoelace area, winding order
│   │   ├── LineUtils.ts    # Segment snapping utilities
│   │   └── RoomFinder.ts   # Graph-traversal room detection algorithm
│   ├── domain/         # Building entities — uses geometry
│   │   ├── types.ts        # EntityId, Node, Wall, Room, Opening, Floor, Project
│   │   ├── Bygglov.ts      # Swedish building permit data (SS 21054:2020)
│   │   ├── DomainFactory.ts # createNode(), createWall() factory functions
│   │   ├── RoomUtils.ts    # getPolygon(), toSvgPath() for rooms
│   │   └── AreaService.ts  # calculateAreas() — total & per-room
│   └── state/
│       └── store.ts    # Single Zustand + Immer store (useEditorStore)
├── adapters/
│   └── rendering/      # Domain → Three.js. No React.
│       ├── coordinates.ts   # planToGround / planToWorld / wallAngleY (2D plan → 3D world)
│       ├── wallGeometry.ts  # buildWallRenderData — pure: wall + openings → box parts
│       ├── floorGeometry.ts # buildFloorRenderData — pure: room polygon → floor shape
│       ├── SceneBuilder.ts  # buildSceneGroup / disposeGroup — instantiates THREE objects
│       └── index.ts         # Barrel export
└── ui/
    ├── editor/
    │   ├── FloorPlanEditor.tsx  # SVG 2D editor, wall/opening drawing
    │   ├── Toolbar.tsx          # Tool selector (select/wall/room/opening)
    │   └── PropertyInspector.tsx # Right panel — wall/room property editing
    └── viewport/
        ├── Viewport3D.tsx       # React Three Fiber canvas, lighting, OrbitControls
        └── BuildingModel.tsx    # Thin host: mounts buildSceneGroup(project) as a <primitive>
```

## Core Domain Model (`src/core/domain/types.ts`)

Node-edge graph structure. All entities are stored as `Record<EntityId, Entity>` maps in the Project:

```typescript
type EntityId = string; // UUID v4

interface Node     { id, x, y }                                          // connection point
interface Wall     { id, startNodeId, endNodeId, thickness, height, material? } // edge
interface Room     { id, name, boundaryWallIds, floorId }                // auto-detected loop
interface Opening  { id, wallId, distFromStart, width, height, altitude, type } // door/window
interface Floor    { id, name, levelIndex, elevation, wallIds, roomIds } // multi-storey grouping
interface Project  { id, name, nodes, walls, rooms, openings, floors, version, bygglov? }

type MaterialType = 'plaster_white' | 'brick_red' | 'wood_panel';
type OpeningType  = 'window' | 'door';
```

**Default wall values** (defined in `store.ts`): `thickness: 0.2m`, `height: 2.4m`
**Default opening values** (defined in `FloorPlanEditor.tsx`): `width: 0.9m`, `height: 2.1m`, `type: 'door'`

## State Management (`src/core/state/store.ts`)

Single `useEditorStore` created with Zustand + Immer middleware. Immer allows mutable-style writes inside `set()`.

### State shape

```typescript
interface EditorState {
  project: Project;         // Full domain model
  selectedIds: EntityId[];  // Current selection
  activeTool: ToolType;     // 'select' | 'wall' | 'room' | 'opening'
  snapGridSize: number;     // Snap grid in meters (default 0.1)
  activeFloorId: EntityId | null; // Floor new walls are drawn on; set by createProject
}
```

### Actions

| Action | Description |
|--------|-------------|
| `createProject()` | Resets project, creates initial Ground Floor, sets `activeFloorId`, clears selection |
| `addNode(x, y)` | Creates node, returns its ID |
| `addWall(startId, endId, floorId)` | Creates wall, **triggers room auto-detection** |
| `addOpening(opening)` | Adds door/window directly to openings map |
| `updateWall(id, updates)` | Partial wall update via `Object.assign` |
| `updateRoom(id, updates)` | Partial room update via `Object.assign` |
| `moveNode(id, x, y)` | Repositions a node |
| `removeWall(id)` | Cascades: deletes the wall's openings and floor reference, then **re-runs room detection** |
| `removeNode(id)` | Cascades: deletes every attached wall (and their openings), then **re-runs room detection** per affected floor |
| `setTool(tool)` | Changes active tool |
| `select(ids)` | Updates selection |

**Room auto-detection**: `addWall`, `removeWall` and `removeNode` all rebuild the rooms of every affected floor by running `RoomFinder.findRooms()` on that floor's walls, deleting old rooms, and creating new ones. Room IDs are therefore **not stable** across wall edits — don't hold on to a room ID (e.g. in `selectedIds`) after changing walls.

**Invariant**: after any store action, no wall references a missing node and no opening references a missing wall. Any new deletion action must preserve this (see `store.test.ts`).

## Geometry Engine (`src/core/geometry/`)

All geometry code is pure functions — no state, no imports from `domain` or `ui`.

### RoomFinder (`RoomFinder.ts`)

The most important algorithm. Detects closed loops (rooms) using a directed graph traversal:

1. **`buildGraph(nodes, walls)`**: Creates a directed adjacency list. Each wall adds two directed edges (forward and backward). Edges at each node are **sorted by angle** (ascending).
2. **`RoomFinder.findRooms(nodes, walls)`**: Traverses all unvisited directed edges. At each node, finds the "turn left" next edge by looking at the edge *before* the back-edge in the angle-sorted list (index `backEdgeIdx - 1`, wrapping CCW). Loops with CCW winding (positive area in math coords) are kept as rooms; CW loops are exterior boundaries and discarded. Requires `pathWalls.length > 2` (minimum triangle).

### Vector2Math (`Vector2Math.ts`)

Key operations: `add`, `subtract`, `scale`, `magnitude`, `distance`, `normalize`, `dot`, `cross`, `equals` (with EPSILON tolerance), `snap(point, gridSize)`, `closestPointOnSegment(start, end, point)`, `angle(from, to)`.

### PolygonUtils (`PolygonUtils.ts`)

- `area(polygon)` — Shoelace formula; positive = CCW in math coords
- `isClockwise(polygon)` — Returns true if CW (i.e., exterior boundary)

### LineUtils (`LineUtils.ts`)

- `snapPointToNodes(point, nodes, tolerance)` — Snaps a point to any nearby node within tolerance

## UI Components

### FloorPlanEditor (`src/ui/editor/FloorPlanEditor.tsx`)

SVG-based 2D editor. The SVG `viewBox` is in **meters** (default `0 0 20 15`).

**Coordinate conversion**: `getMouseCoords()` uses `svg.getScreenCTM().inverse()` to transform screen pixels → SVG/meter coordinates.

**Grid**: Two-level SVG pattern — 1m minor grid (light) and 5m major grid (darker). `NODE_RADIUS = 0.15m`.

**Tool behaviors**:
- `wall`: First click creates two overlapping nodes (start + temp); mouse move repositions temp node via `moveNode`; each subsequent click finalizes a wall and creates a new temp node, forming a chain. The in-progress preview wall's ID is kept in `previewWallIdRef`. ESC or right-click cancels and removes the dangling temp node/wall. Walls are drawn on `activeFloorId`.
  - **Node snapping**: a click within `NODE_RADIUS * 2` of an existing node reuses that node (via `findExistingNode`) instead of creating a duplicate. This is what lets a chain close into a room.
  - **Zero-length guard**: a click within `snapGridSize` of the previous chain node is ignored.
- `opening`: Mouse proximity search (< 0.5m) finds the closest wall via `closestPointOnSegment`; shows a live preview rect; click places a door `Opening`.
- `select`: Click on wall/room sets `selectedIds`.

**Rendering order** (bottom to top): grid background → room fills → walls → openings → nodes → status bar overlay.

### Toolbar (`src/ui/editor/Toolbar.tsx`)

Left 64px vertical strip. Buttons for Select, Wall, Room, Opening tools + New Project. Uses `lucide-react` icons.

### PropertyInspector (`src/ui/editor/PropertyInspector.tsx`)

Right 256px panel. Shows properties of the first selected entity:
- **Wall**: thickness (m), height (m), material dropdown (`plaster_white | brick_red | wood_panel`)
- **Room**: name input, area display (m², read-only), area type selector (BOA/BIA — currently disabled)

Displays entity UUID (first 8 chars).

### Viewport3D (`src/ui/viewport/Viewport3D.tsx`)

React Three Fiber `<Canvas>` with:
- Camera: position `[5, 5, 5]`, FOV 45
- Lighting: `ambientLight` (intensity 0.5) + `directionalLight` with shadows
- `<OrbitControls>` from `@react-three/drei`
- Grid helper + "city" environment preset
- Background: `#111827`

### BuildingModel (`src/ui/viewport/BuildingModel.tsx`)

Thin React host. Subscribes to `project`, calls `buildSceneGroup(project)` in a `useMemo`, mounts the result via `<primitive object={group} />`, and calls `disposeGroup` on the previous group when it changes. **Put 3D logic in `src/adapters/rendering/`, not here.**

## Rendering Adapter (`src/adapters/rendering/`)

Converts the domain model to Three.js in two stages, so the geometry math is testable without WebGL:

1. **Pure render data** (`wallGeometry.ts`, `floorGeometry.ts`, `coordinates.ts`): plain objects (positions, box sizes, colors). No Three.js, no React. Unit-tested directly.
2. **Instantiation** (`SceneBuilder.ts`): turns render data into `THREE.Group`/`THREE.Mesh`. `disposeGroup` frees geometries and materials, so always call it when discarding a group.

**Coordinate mapping** (2D → 3D): `x → X`, `-y → Z`, height extrusion → `Y` (see `coordinates.ts`).

**`buildWallRenderData`**: Returns `null` for a missing node or a wall shorter than 0.01 m. Otherwise it splits the wall lengthwise into `WallPart`s (`solid` segments around each opening, plus `sill` / `lintel` / translucent `glass` for the opening), positioned in the wall group's local frame with `+X` along the wall. Openings that extend past either end of the wall are skipped. Overlapping openings are **not** handled yet.

**`buildFloorRenderData`**: Floor shape from the room polygon (`RoomUtils.getPolygon`), lying flat at `FLOOR_ELEVATION` (0.01 m). Shape points keep plan `y` **unchanged**, because the mesh's `-90°` X rotation already sends shape `(x, y)` to world `(x, 0, -y)`. Negating `y` as well mirrors floors away from their walls (this was a real bug). `SceneBuilder.test.ts` asserts floor vertices land on `planToGround`, so keep that test when changing the mapping.

## Bygglov Extension (`src/core/domain/Bygglov.ts`)

Swedish building permit data structures following **SS 21054:2020**:

```typescript
type AreaType = 'BYA' | 'BTA' | 'BOA' | 'BIA';
// BYA = byggrätt/footprint, BTA = gross, BOA = living area, BIA = auxiliary
```

`BygglovData` includes municipality info, technical specs, and north direction. Attached to `Project` as optional `project.bygglov`.

## Testing Conventions

- Framework: **Vitest** with `describe` / `it` / `expect`
- Test files are **collocated** with source: `Foo.ts` → `Foo.test.ts`
- **No DOM** required for geometry/domain tests — pure unit tests
- Test data is built using `DomainFactory` helpers (`createNode`, `createWall`)
- Store tests (`src/core/state/store.test.ts`) drive the real Zustand store via `useEditorStore.getState()`; call `createProject()` in `beforeEach` to reset it
- UI components (`src/ui/`) currently have no tests; test 3D behaviour through the pure functions in `src/adapters/rendering/`
- End-to-end manual UI testing steps live in `.agents/skills/testing-3dbuilder/SKILL.md`
- Test coverage run with `vitest run --coverage` (v8 provider)
- Before committing, run `npm run test -- --run`, `npm run build` (includes `tsc -b`) and `npm run lint`. `tsc` catches strict-mode errors that Vitest does not, because Vitest strips types without checking them

**Environment note**: `@rollup/rollup-win32-x64-msvc` is in `optionalDependencies` so `npm install` succeeds on Linux/macOS. Do not move it back to `devDependencies`.

Example test pattern:
```typescript
import { describe, it, expect } from 'vitest';
import { RoomFinder } from './RoomFinder';
import { createNode, createWall } from '../domain/DomainFactory';

describe('RoomFinder', () => {
  it('should find a simple rectangular room', () => {
    // build nodes & walls via factory, call findRooms, assert loop count & contents
  });
});
```

## Code Style Guide

From `conductor/code_styleguides/typescript.md` (Google TypeScript Style Guide):

- **`const`/`let` only** — `var` is forbidden
- **Named exports only** — no default exports
- **No `any`** — prefer `unknown` or specific types
- **No `#private` fields** — use TypeScript `private` modifier
- **No `public` modifier** — it is the default; only add `private`/`protected`
- **Single quotes** for strings; template literals for interpolation
- **Triple equals** (`===`, `!==`) always
- **Avoid type assertions** (`as T`, `!`) — justify if used
- **Naming**: `UpperCamelCase` for types/classes/interfaces, `lowerCamelCase` for variables/functions, `CONSTANT_CASE` for global constants
- **Semicolons**: Always explicit — never rely on ASI
- **Comments**: `/** JSDoc */` for public API docs, `//` for implementation notes; never restate the code

## Key Conventions

- **Units**: Meters throughout — coordinates, wall dimensions, snap grid, node radius
- **Coordinate system**: Standard math convention (Y increases upward) in geometry code. SVG renders Y-down (no transform needed since viewBox units match). Three.js maps plan `(x, y)` → world `(X = x, Z = -y)` with world `Y` as vertical (`planToGround` in `adapters/rendering/coordinates.ts`).
- **Entity IDs**: UUID v4 via `uuid` package (`v4 as uuidv4`)
- **Tool state machine**: `select | wall | room | opening`
- **Entity storage**: All entities in `Record<EntityId, Entity>` maps on `Project` — never arrays
- **No object references**: Cross-entity links use string IDs only (e.g., `wall.startNodeId`, not `wall.startNode`)
- **Room creation**: Rooms are never manually created — they are always auto-detected by `RoomFinder` when walls change
- **Immer pattern**: Inside Zustand `set()`, mutate `state` directly; Immer produces the new immutable state

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript (strict) | ~5.9.3 |
| UI Framework | React | ^19.2.0 |
| Build Tool | Vite | ^7.2.4 |
| 3D Engine | Three.js | ^0.182.0 |
| 3D React Bindings | @react-three/fiber + @react-three/drei | ^9.4.2 / ^10.7.7 |
| State Management | Zustand + Immer | ^5.0.9 / ^11.1.0 |
| Icons | Lucide React | ^0.562.0 |
| ID Generation | uuid | ^13.0.0 |
| Testing | Vitest + @vitest/coverage-v8 | ^4.0.16 |
| Linting | ESLint (flat config) + typescript-eslint | ^9.39.1 |
