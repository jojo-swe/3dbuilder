# AGENTS.md

This file is the source of truth for coding agents in this repository. `CLAUDE.md` only points here. When this file and another doc disagree about layering or current behavior, follow this file and the source tree.

## Product

Professional-grade 3D house builder for DIY home builders and renovators in Sweden. The 2D floor plan is the single source of truth. 3D views, area calculations, and municipality-ready building permit (bygglov, SS 21054:2020) documents are derived from it.

Background: [`conductor/product.md`](conductor/product.md). Permit data: [`src/core/domain/Bygglov.ts`](src/core/domain/Bygglov.ts).

## Commands

```bash
npm run dev            # Vite dev server with HMR
npm run build          # tsc -b && vite build
npm run lint           # ESLint (flat config)
npm run preview        # Preview the production build
npm test               # Vitest, single run
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Vitest with the v8 coverage report (writes git-ignored coverage/)

# One file
npx vitest run src/core/geometry/RoomFinder.test.ts
```

Before committing, run `npm test`, `npm run build`, and `npm run lint`. CI (`.github/workflows/ci.yml`) runs lint, test, and build on every push and pull request. Vitest strips types without checking them; `tsc -b` (via `build`) catches strict-mode errors the tests miss.

`@rollup/rollup-win32-x64-msvc` is an `optionalDependency` so `npm install` succeeds on Linux and macOS. Leave it there.

## Architecture

React 19, TypeScript, Vite. Three.js is rendered with React Three Fiber. `core` is framework-agnostic; `ui` is React.

### Principles

- **Floor plan is king.** 2D geometry is the source of truth. 3D is a derived view.
- **Deterministic.** Geometry and domain code are pure: `f(input) = output`, with no side effects.
- **Layered dependencies.** Lower layers never import higher ones. `adapters/` never imports React. `geometry/` has no building concepts and does not import `domain`, `state`, `ui`, or `adapters`.

```
ui → adapters → state → domain → geometry
```

### Where code lives

| Path | Role |
| --- | --- |
| `src/core/geometry/` | Pure math: vectors, polygons, `RoomFinder` |
| `src/core/domain/` | Building entities, areas, bygglov |
| `src/core/state/store.ts` | Single Zustand + Immer store (`useEditorStore`) |
| `src/adapters/rendering/` | Domain → Three.js. Pure render data, then `SceneBuilder` |
| `src/ui/editor/` | SVG floor plan, toolbar, property inspector |
| `src/ui/viewport/` | R3F canvas, `BuildingModel`, `ErrorBoundary` |

Shorter overview: [`ARCHITECTURE.md`](ARCHITECTURE.md). Stack: [`conductor/tech-stack.md`](conductor/tech-stack.md).

### Data flow

A click in `FloorPlanEditor` calls a `useEditorStore` action. Zustand and Immer update the project. `addWall`, `removeWall`, and `removeNode` rebuild that floor's rooms with `RoomFinder.findRooms()`. React re-renders the SVG overlays, and `BuildingModel` rebuilds the Three.js scene through `adapters/rendering`.

## Domain essentials

All entities are `Record<EntityId, Entity>` maps on `Project`. Links between entities are string IDs (`wall.startNodeId`), never object references. IDs are UUID v4.

Rooms are never created by hand. `RoomFinder` rebuilds a floor's rooms whenever its walls change. Full shapes: [`src/core/domain/types.ts`](src/core/domain/types.ts). Actions: [`src/core/state/store.ts`](src/core/state/store.ts).

Defaults: wall thickness `0.2` m and height `2.4` m (`store.ts`); opening width `0.9` m, height `2.1` m, type `door` (`FloorPlanEditor.tsx`).

**Units are meters.** Geometry uses standard math coordinates (Y up). The SVG `viewBox` is in meters and Y-down, so no extra transform is applied. Three.js maps plan `(x, y)` to world `(X = x, Z = -y)` with world Y up — see `planToGround` in [`src/adapters/rendering/coordinates.ts`](src/adapters/rendering/coordinates.ts).

Tools are `select | wall | opening`. Inside a Zustand `set()` callback, mutate `state` directly; Immer writes the next immutable snapshot.

**Invariant:** after any store action, no wall references a missing node and no opening references a missing wall. New deletion actions must keep that. See [`src/core/state/store.test.ts`](src/core/state/store.test.ts).

## Gotchas

### Room IDs are not stable

`addWall`, `removeWall`, and `removeNode` delete the affected floor's rooms and create new ones. Do not hold a room id (including in `selectedIds`) across a wall edit.

### A 3D failure must not blank the 2D editor

- Do not use drei `preset=` props (`<Environment preset>`, `<Stage environment>`, and the like). They fetch from a CDN at runtime and break offline and behind firewalls. Add the file under `public/` and reference it with `` `${import.meta.env.BASE_URL}…` ``. The bundled city HDR is `public/hdr/potsdamer_platz_1k.hdr` ([`public/hdr/README.md`](public/hdr/README.md)).
- Anything new that loads inside `<Canvas>` (textures, models, HDRs) needs its own `ErrorBoundary` and `Suspense`. A failed HDR should drop reflections only. The outer canvas boundary shows the same "3D preview is unavailable" fallback, and Retry remounts the canvas.
- Check WebGL2 with `WebGL.isWebGL2Available()` before mounting the canvas. R3F creates its renderer in an un-awaited effect, so a missing context is not caught by an error boundary.

### Floor meshes

`buildFloorRenderData` keeps plan `y` unchanged. The mesh's `-90°` rotation about X already sends shape `(x, y)` to world `(x, 0, -y)`. Negating `y` in the shape points as well mirrors the floor away from its walls. [`src/adapters/rendering/SceneBuilder.test.ts`](src/adapters/rendering/SceneBuilder.test.ts) asserts floor vertices land on `planToGround`; keep that test when changing the mapping.

### Walls, openings, and the 3D host

`buildWallRenderData` returns `null` for a missing node or a wall shorter than `0.01` m. Openings that run past either end of the wall are skipped. Overlapping openings are not handled.

Put 3D logic in `src/adapters/rendering/`. `BuildingModel` only mounts `buildSceneGroup(project)` and calls `disposeGroup` on the previous group. Render-data modules (`wallGeometry.ts`, `floorGeometry.ts`, `coordinates.ts`) stay free of Three.js and React so they can be unit-tested. `SceneBuilder` is what instantiates meshes.

### Drawing

The wall tool chains clicks on `activeFloorId`. A click within `NODE_RADIUS * 2` (`NODE_RADIUS` is `0.15` m) of an existing node reuses that node; that is how a chain closes into a room. A click within `snapGridSize` (`0.1` m) of the previous chain node is ignored (zero-length guard). Escape or right-click removes the dangling temp node and preview wall.

The opening tool searches within `0.5` m via `closestPointOnSegment` and places a door on click.

With the select tool, Delete or Backspace removes the selected wall (ignored while focus is in an input, select, or textarea).

### Styling

Tailwind is not installed. Utility class names like `w-64` or `absolute bottom-4` do nothing. Use the classes in `src/index.css` or inline styles.

Manual click-path checks: [`.agents/skills/testing-3dbuilder/SKILL.md`](.agents/skills/testing-3dbuilder/SKILL.md).

## Testing

- Vitest, with tests next to the source: `Foo.ts` → `Foo.test.ts`.
- Geometry and domain tests need no DOM. Build fixtures with `DomainFactory` (`createNode`, `createWall`).
- Store tests drive `useEditorStore.getState()` and call `createProject()` in `beforeEach`.
- Test 3D behavior through the pure functions in `src/adapters/rendering/`. Component tests that need a DOM start with `// @vitest-environment jsdom` and use `@testing-library/react` (see `src/ui/viewport/ErrorBoundary.test.tsx`).
- Coverage: `npm run test:coverage`. Conductor tracks aim for more than 80% on new code ([`conductor/workflow.md`](conductor/workflow.md)).

## Style

Follow [`conductor/code_styleguides/typescript.md`](conductor/code_styleguides/typescript.md) (Google TypeScript Style Guide):

- `const` and `let` only. No `var`.
- Named exports only. No default exports.
- No `any`. Prefer `unknown` or a specific type.
- No `#private` fields. Use TypeScript `private`. Do not write `public`; it is the default.
- Single quotes. Template literals for interpolation.
- `===` and `!==`.
- Avoid `as` and `!` unless the assertion is justified.
- `UpperCamelCase` for types, `lowerCamelCase` for values, `CONSTANT_CASE` for global constants.
- Explicit semicolons.
- `/** JSDoc */` for public API docs, `//` for implementation notes. Do not restate the code.

## Privacy / Integritet

Inga privata uppgifter får committas, och de får inte stå i PR-text (titel, beskrivning eller kommentar). Det gäller:

- personlig e-post — använd GitHubs noreply-adress i stället
- telefonnummer
- postadresser och hemadresser
- namn på privatpersoner
- interna IP-adresser
- Tailscale-värdnamn
- användarnamn i sökvägar
- nycklar och tokens
- innehåll i `.env`

Kör `pre-commit install` lokalt så att gitleaks granskar staged ändringar mot `.gitleaks.toml` före varje commit.

Agenter som hittar privata uppgifter maskerar dem med platshållare och skriver aldrig ut själva värdet i en commit, en pull request eller en logg. Använd till exempel `<email>`, `<user>`, `192.168.x.y`, `10.x.y.z`, `100.64.0.x` och `<host>.ts.net`.

---

<!-- agents-handover:rules -->
## Gemensamma agentregler (multi-agent)
Gemensamma regler för alla AI-agenter (Claude Code, Codex, molnagenter m.fl.) som arbetar i det här repot.
Flera agenter kan jobba här parallellt – utgå alltid från att någon annan kan ha pågående arbete.

### Innan du börjar

1. **Läs `HANDOVER.md`** – aktuellt läge, pågående arbete, nästa steg och kända problem.
2. **Kolla läget i git:**
   ```sh
   git status
   git fetch --all --prune
   git branch -a
   gh pr list --state open
   ```
3. **Gör inte om något som redan pågår.** Finns det en öppen PR, en aktiv branch eller en rad under
   "Pågående arbete" i `HANDOVER.md` som rör samma sak – bygg vidare på den eller fråga användaren.
4. Har arbetskatalogen ocommittade ändringar som inte är dina: rör dem inte. Använd en egen
   `git worktree` eller fråga användaren.

### Under arbetet

- **En branch per uppgift**, namnformat: `agent/<verktyg>/<kort-beskrivning>`
  (t.ex. `agent/claude/fix-login-timeout`, `agent/codex/add-csv-export`).
- Registrera ditt arbete under "Pågående arbete" i `HANDOVER.md` tidigt (agent, branch, status).
- **Committa ofta** med tydliga meddelanden.
- **Fråga alltid användaren innan destruktiva git-kommandon:** `push --force`, `reset --hard`,
  `clean -fd`, radera brancher (lokalt eller remote), `rebase` av delade brancher, `checkout -- .`.

### Innan sessionen avslutas

- **Inget arbete får lämnas ocommittat.** Committa (vid behov som WIP) och **pusha alltid** din branch.
- **Uppdatera `HANDOVER.md`:** aktuellt läge, pågående arbete, nästa steg, kända problem och en ny rad
  i loggen (datum, agent, vad som gjordes).
- Om repot saknar `AGENTS.md` eller `HANDOVER.md`: skapa dem från mallen
  (https://github.com/jojo-swe/repo-template) innan du börjar.

### Repo-specifikt (autodetekterat 2026-11-04)

#### Bygga och testa

- Installera: `npm install`
- dev: `npm run dev`  (`vite`)
- build: `npm run build`  (`tsc -b && vite build`)
- test: `npm run test`  (`vitest run`)
- lint: `npm run lint`  (`eslint .`)
- CI: GitHub Actions (`ci.yml`, `privacy-guard.yml`)

#### Struktur

- `.agents/` (1 filer)
- `.github/` (2 filer)
- `conductor/` (13 filer)
- `docs/` (2 filer)
- `public/` (3 filer)
- `src/` (40 filer)
- Filer i roten: `.gitignore`, `.gitleaks.toml`, `.pre-commit-config.yaml`, `AGENTS.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `eslint.config.js`, `index.html`, `package-lock.json`, `package.json`, `README.md`, `tsconfig.app.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`

#### Övrigt

<!-- Konventioner, miljövariabler, deploy, saker agenter ska undvika. -->
