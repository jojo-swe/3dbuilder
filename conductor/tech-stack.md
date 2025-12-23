# Technology Stack

## Core Language
- **TypeScript:** The project uses TypeScript for strict type safety and reliability, which is critical for the complex geometry and domain logic.

## Frontend Framework
- **React (via Vite):** The UI is built with React 19, utilizing Vite for a fast development experience and optimized builds.

## 3D Graphics & Visualization
- **Three.js:** The underlying 3D engine.
- **@react-three/fiber (R3F):** A React renderer for Three.js, allowing declarative 3D scene composition.
- **@react-three/drei:** A collection of useful helpers and abstractions for R3F.

## State Management
- **Zustand:** A small, fast, and scalable state-management solution.
- **Immer:** Used alongside Zustand to allow working with immutable state in a more convenient, mutable style.

## Utilities & Libraries
- **UUID:** For generating unique identifiers for domain entities (walls, rooms, etc.).
- **Lucide React:** For a consistent and clean icon set.

## Architecture
- **Layered Architecture:**
    - **Core:** Contains pure domain logic, geometry math, and state management. Independent of the UI.
    - **Adapters:** Bridges the core logic to external systems (e.g., Rendering via Three.js, Exporting to PDF).
    - **UI:** The React view layer that interacts with the user and reflects the state.
