# Architecture Documentation - 3D House Builder

## 1. Overview

This application is a professional-grade house editor designed to derive accurate 3D geometry, legal documents, and construction data from a 2D floor plan source of truth.

## 2. Core Principles

- **Floor Plan is King**: The 2D geometry is the single source of truth. 3D is a derived view.
- **Deterministic**: $f(Input) = Output$. No side effects in geometry generation.
- **Layered**: UI depends on State, State depends on Domain/Geometry. Domain depends on nothing.

## 3. Directory Structure

### `src/core`

The "brain" of the application. Framework-agnostic.

- **`geometry/`**: Pure math. `Vector2`, `Line`, `Polygon`. No building concepts here.
- **`domain/`**: Building entities. `Wall`, `Room`, `Floor`. Uses `geometry`.
- **`state/`**: Application state management (Zustand). Handles undo/redo, selection, and tools.

### `src/adapters`

Bridges between the `core` and external worlds.

- **`rendering/`**: Three.js rendering logic. Observes `core` state and updates the scene.
- **`export/`**: Adapters for PDF/DXF generation.

### `src/ui`

The view layer (React).

- **`components/`**: Reusable UI atoms (Buttons, Inputs).
- **`editor/`**: Application-specific panels (Toolbar, Property Inspector).
- **`viewport/`**: The Canvas wrapper.

## 4. Data Flow

1. **User Action** (Click) -> **UI Component**
2. **UI Component** dispatches **Action** -> **State Manager**
3. **State Manager** updates **Domain Model** (e.g., adds a wall)
4. **Domain Model** triggers **Derivation** (e.g., recalculates rooms)
5. **State Store** emits update
6. **React UI** re-renders overlays
7. **Three.js Adapter** updates 3D meshes

## 5. Technology Stack

- **Language**: TypeScript (Strict)
- **Frontend**: React + Vite
- **3D Engine**: Three.js (managed via adapter, not R3F state directly, to decouple geometry)
- **State**: Zustand + Immer
- **Styles**: CSS Modules / Vanilla CSS Variables

## 6. Key Invariants

- Walls are represented by a start and end point (centerline).
- Thickness is a property of the wall.
- Rooms are auto-detected closed loops of walls.
- IDs are UUID v4.
