# HANDOVER.md

Överlämning mellan agenter och sessioner. Läs innan du börjar, uppdatera innan du slutar.

## Aktuellt läge

*Senast inventerat 2026-11-04 av Claude (Cowork).*

Projekt: A 2D floor-plan editor (SVG) with a live 3D preview (React Three Fiber). Draw walls in plan view; rooms are detected from closed wall loops and extruded into 3D as you draw.

- Huvudbranch: `master`
- Senaste commit på `master`: 2026-11-01 `434697f` Add privacy guard scanning for the checked-out tree (#16)
- Öppna PR:er: 9
- Andra brancher på remote: 14

## Pågående arbete

| Agent/vem | Branch | Status | Beskrivning |
|-----------|--------|--------|-------------|
| app/dependabot | `dependabot/npm_and_yarn/multi-a4e871beb4` | PR #15 öppen, uppdaterad 2026-10-26 | build(deps): bump @vitest/mocker, @vitest/coverage-v8 and vitest |
| app/dependabot | `dependabot/npm_and_yarn/vite-7.3.7` | PR #14 öppen, uppdaterad 2026-10-26 | build(deps-dev): bump vite from 7.3.0 to 7.3.7 |
| app/dependabot | `dependabot/npm_and_yarn/humanfs/node-0.16.8` | PR #13 öppen, uppdaterad 2026-10-15 | build(deps-dev): bump @humanfs/node from 0.16.7 to 0.16.8 |
| app/dependabot | `dependabot/npm_and_yarn/multi-34ef287347` | PR #11 öppen, uppdaterad 2026-10-15 | build(deps): bump fflate |
| app/dependabot | `dependabot/npm_and_yarn/multi-b04dc22ff7` | PR #10 öppen, uppdaterad 2026-10-15 | build(deps): bump brace-expansion |
| app/dependabot | `dependabot/npm_and_yarn/baseline-browser-mapping-2.11.28` | PR #9 öppen, uppdaterad 2026-10-15 | build(deps-dev): bump baseline-browser-mapping from 2.9.11 to 2.11.28 |
| app/dependabot | `dependabot/npm_and_yarn/source-map-js-1.2.2` | PR #8 öppen, uppdaterad 2026-10-15 | build(deps): bump source-map-js from 1.2.1 to 1.2.2 |
| app/dependabot | `dependabot/npm_and_yarn/multi-e773253fe8` | PR #7 öppen, uppdaterad 2026-10-15 | build(deps): bump @vitest/mocker, @vitest/coverage-v8 and vitest |
| app/dependabot | `dependabot/npm_and_yarn/js-yaml-4.3.2` | PR #6 öppen, uppdaterad 2026-10-15 | build(deps-dev): bump js-yaml from 4.1.1 to 4.3.2 |
| Cursor | `cursor/privacy-guard-22d1` | branch utan PR, senaste commit 2026-11-01 | Add privacy guard scanning for the checked-out tree |
| Cursor | `cursor/agents-md-source-of-truth-2e4c` | branch utan PR, senaste commit 2026-10-02 | docs: make AGENTS.md the agent source of truth |
| Claude | `claude/add-claude-documentation-Svwix` | branch utan PR, senaste commit 2026-09-29 | feat(viewport): bundle the environment HDR instead of fetching it from a CDN |
| Devin | `devin/1783859844-rendering-adapter` | branch utan PR, senaste commit 2026-07-12 | conductor(plan): Mark rendering adapter tasks complete |
| Devin | `devin/update-skills-1783562955` | branch utan PR, senaste commit 2026-07-09 | Add testing skill for 3dbuilder |

## Nästa steg

- Granska och besluta om de öppna PR:erna ovan (merga eller stäng).
- Gå igenom brancher utan PR: öppna PR, merga eller radera (fråga användaren innan radering).
- Fyll på "Bygga och testa" i AGENTS.md om något saknas eller är fel.

## Kända problem

- Inga dokumenterade ännu.

## Senaste commits

- 2026-11-01 `434697f` Add privacy guard scanning for the checked-out tree (#16)
- 2026-10-26 `7e23cd4` docs: replace the Vite template README with a project README
- 2026-10-26 `e0eb109` fix(editor): shorten the status bar hint so it fits on one line
- 2026-10-26 `11dbc08` docs: document CI, npm test, delete key and the no-Tailwind rule
- 2026-10-26 `4380bea` refactor(toolbar): remove the no-op Room tool and decorative Layers button
- 2026-10-26 `3bfa015` feat(editor): delete the selected wall with Delete or Backspace
- 2026-10-26 `ef90af4` fix(ui): replace dead Tailwind class names with real CSS
- 2026-10-26 `abf341a` ci: run lint, tests and build on push and pull request
- 2026-10-26 `cf98a7f` build: stop tracking coverage output and make npm test non-interactive
- 2026-10-02 `5d82b1a` docs: make AGENTS.md the agent source of truth (#5)

## Logg

| Datum | Agent | Vad som gjordes |
|-------|-------|-----------------|
| 2026-11-04 | Claude (Cowork) | Lade till AGENTS.md, HANDOVER.md och CLAUDE.md; inventerade PR:er, brancher och commits. |
