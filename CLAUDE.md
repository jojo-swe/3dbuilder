# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript compile + Vite production build
npm run lint         # ESLint
npm run test         # Vitest (watch mode)
npm run test:coverage # Vitest with coverage
npx vitest run src/core/geometry/RoomFinder.test.ts  # Run single test file
```

## Architecture Overview

This is a **floor plan editor** with real-time 3D preview, built with React + TypeScript + Vite. Users draw walls in a 2D SVG editor, and rooms are automatically detected and rendered in a synchronized 3D viewport.

### Core Domain Model (`src/core/domain/types.ts`)

The data model uses a node-edge graph structure:
- **Node**: A point (x, y) where walls can connect
- **Wall**: An edge between two nodes with thickness, height, and material
- **Room**: A closed loop of walls (auto-detected, not manually created)
- **Opening**: A door/window placed along a wall at a distance from start
- **Floor**: Groups walls and rooms by level (elevation)
- **Project**: Root container holding all entities as `Record<EntityId, Entity>` maps

### State Management (`src/core/state/store.ts`)

Single Zustand store with Immer middleware. Key patterns:
- All entity mutations go through store actions (`addWall`, `moveNode`, etc.)
- Room detection runs automatically when walls are added via `RoomFinder.findRooms()`
- Entity references use string IDs, not object references

### Geometry Engine (`src/core/geometry/`)

- **RoomFinder**: Detects closed loops using graph traversal with the "Left Hand Rule" (CCW winding). Builds adjacency list with directed edges sorted by angle.
- **PolygonUtils**: Shoelace area calculation, winding order detection
- **Vector2Math**: 2D vector operations, snapping, projections
- **LineUtils**: Segment intersection, point-to-line distance

### UI Components

- **FloorPlanEditor** (`src/ui/editor/`): SVG-based 2D editor with grid snap. Uses `viewBox` coordinates in meters (20x15m default view). Mouse position → SVG coordinates via `getScreenCTM().inverse()`.
- **Viewport3D** (`src/ui/viewport/`): Three.js via React Three Fiber. `BuildingModel` extrudes walls to 3D geometry.
- **Toolbar/PropertyInspector**: Tool selection and entity property editing

### Bygglov Extension (`src/core/domain/Bygglov.ts`)

Swedish building permit (bygglov) data structures. Area types follow SS 21054:2020 standard:
- BYA (footprint), BTA (gross), BOA (living), BIA (auxiliary)

## Key Conventions

- Units are **meters** throughout (wall thickness, coordinates, snap grid)
- All coordinates use standard math convention (Y increases upward in geometry, though SVG renders Y-down)
- Entity IDs are UUIDs generated via `uuid` package
- Tool state machine: `select | wall | room | opening`
