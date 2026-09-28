---
name: testing-3dbuilder
description: Test the 3dbuilder house editor end-to-end (2D floor plan, 3D viewport, wall properties). Use when verifying UI/rendering changes.
---

# Testing 3dbuilder

React 19 + TypeScript + Vite app. 2D floor-plan editor is the source of truth; the 3D viewport and areas are derived from it.

## Run locally
- Install: `npm install` (`@rollup/rollup-win32-x64-msvc` is an optionalDependency, so Linux/macOS skip it; no `--force` needed).
- Dev server: `npm run dev` → http://localhost:5173/ (add `-- --host 127.0.0.1` if needed).
- Tests: `npm run test:coverage`. Build: `npm run build`. Lint: `npm run lint` (0 errors; 3 warnings come from generated `coverage/` files if you've run coverage).

## Layout
Left toolbar (Select / Wall / Room / Opening / New Project) | 2D SVG editor (left half) | 3D viewport (right half) | right Property Inspector. A project with a Ground Floor is auto-created on load.

## Golden-path UI test
1. **Draw walls**: click the **Wall** tool, then click points in the 2D editor. Each click finalizes a wall and chains to the next; press **ESC** or right-click to finish (removes the trailing temp wall). N clicks → N-1 walls. Status bar shows live `Walls:`/`Rooms:` counts.
2. **Verify 3D**: the 3D viewport should show extruded wall meshes. NOTE: the camera starts at `[5,5,5]` looking at origin, but drawn walls are often far from origin, so the meshes can be off-screen at first — **scroll to zoom out and drag to orbit** until they appear. If nothing ever appears after orbiting, that's a real failure.
3. **Edit material**: switch to **Select**, click a wall in 2D (thin target — click precisely on the line; vertical walls are easier). Inspector shows Thickness (default 0.2 m), Height (default 2.4 m), Material. Change Material to **Brick (Red)** → that wall's 3D mesh should turn red (others stay white plaster).

## Room auto-detection
Draw 3 corners of a rectangle with the Wall tool, then click **on the first corner node** (within ~0.3 m). The wall tool snaps to that existing node, which closes the loop, and `Rooms:` in the status bar goes to 1. A blue room fill appears in 2D and a grey floor in 3D. The chain keeps going after closing, so press **ESC** to finish.
If `Rooms:` stays 0, check that the closing click actually landed on the first node. Clicks within one grid step (0.1 m) of the previous node are ignored on purpose (zero-length wall guard).

## Headless browsers / sandboxes
- **WebGL**: headless Chromium has no GPU. Launch with `--use-angle=swiftshader --enable-unsafe-swiftshader` for a working 3D pane. Without it you should see the "3D preview is unavailable" fallback while the 2D editor keeps working, which is itself a useful check.
- **HDR environment map**: `<Environment preset="city">` fetches `potsdamer_platz_1k.hdr` from a CDN. If the sandbox blocks it, the app still works (no reflections) and logs one expected "Uncaught Error … .hdr" plus a warning. To get reflections, serve a stand-in via request interception: a flat Radiance file `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 32 +X 64\n` followed by 64×32×4 bytes. Don't use 1×1: tiny maps make three.js emit an invalid shader.
- To reproduce the old blank-screen bug, abort `**/*.hdr` requests. On current code the editor must stay visible.

## Devin Secrets Needed
None — runs fully locally, no auth.
