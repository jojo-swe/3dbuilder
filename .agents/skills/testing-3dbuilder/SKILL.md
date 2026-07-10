---
name: testing-3dbuilder
description: Test the 3dbuilder house editor end-to-end (2D floor plan, 3D viewport, wall properties). Use when verifying UI/rendering changes.
---

# Testing 3dbuilder

React 19 + TypeScript + Vite app. 2D floor-plan editor is the source of truth; the 3D viewport and areas are derived from it.

## Run locally
- Install: `npm install --force` (plain `npm ci`/`npm install` fail on Linux because `@rollup/rollup-win32-x64-msvc`, a Windows-only pkg, is a normal devDependency → `EBADPLATFORM`).
- Dev server: `npm run dev` → http://localhost:5173/ (add `-- --host 127.0.0.1` if needed).
- Tests: `npm run test:coverage`. Build: `npm run build`. Lint: `npm run lint` (currently fails: 1 `no-explicit-any` in `BuildingModel.tsx` + `coverage/` files not ignored).

## Layout
Left toolbar (Select / Wall / Room / Opening / New Project) | 2D SVG editor (left half) | 3D viewport (right half) | right Property Inspector. A project with a Ground Floor is auto-created on load.

## Golden-path UI test
1. **Draw walls**: click the **Wall** tool, then click points in the 2D editor. Each click finalizes a wall and chains to the next; press **ESC** or right-click to finish (removes the trailing temp wall). N clicks → N-1 walls. Status bar shows live `Walls:`/`Rooms:` counts.
2. **Verify 3D**: the 3D viewport should show extruded wall meshes. NOTE: the camera starts at `[5,5,5]` looking at origin, but drawn walls are often far from origin, so the meshes can be off-screen at first — **scroll to zoom out and drag to orbit** until they appear. If nothing ever appears after orbiting, that's a real failure.
3. **Edit material**: switch to **Select**, click a wall in 2D (thin target — click precisely on the line; vertical walls are easier). Inspector shows Thickness (default 0.2 m), Height (default 2.4 m), Material. Change Material to **Brick (Red)** → that wall's 3D mesh should turn red (others stay white plaster).

## Known limitation — room auto-detection
Drawing a closed rectangle does NOT create a room (`Rooms:` stays 0). The wall tool never snaps clicks onto existing nodes (`snapPointToNodes` in `LineUtils.ts` is unused by `FloorPlanEditor.tsx`), so `RoomFinder` (graph keyed by node IDs) never sees a closed loop. Don't treat Rooms:0 as your own test bug — it's a product limitation. This may be fixed later by adding node snapping to the wall tool.

## Devin Secrets Needed
None — runs fully locally, no auth.
