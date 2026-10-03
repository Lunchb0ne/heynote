# Heynote

Electron scratchpad app. Vue 3 (Options API) + Pinia renderer, CodeMirror 6 editor, Vite build.

## Commands

- `npm run dev` — Electron app with Vite dev server
- `npm run test` — Playwright tests against the webapp (`vite --port=3000 webapp`, auto-started)
- `npx playwright test tests/playwright/<file>.spec.js` — single spec
- `npm run test:e2e` — Electron e2e specs (`*-e2e.spec.js`, tagged `@e2e`)
- `npm run test:main` — Vitest for main-process code (`tests/main`)
- `npm run build_grammar` — regenerate `src/editor/lang-heynote/parser.js` after editing `heynote.grammar`. Never hand-edit `parser.js`/`parser.terms.js`.
- `npx vue-tsc --noEmit` — type check

## Layout

- `electron/main` — main process (file library, menu, ripgrep search, auto-update); `electron/preload` — bridge exposed as `window.heynote`
- `webapp/bridge.js` — browser stand-in for the Electron bridge; Playwright tests run against this, so bridge API changes must be mirrored here
- `src/editor` — CodeMirror extensions; `lang-heynote` is the Lezer grammar for the block-based note format (`∞∞∞lang` delimiters)
- `src/stores` — Pinia stores; `src/components` — Vue SFCs (Options API, no `<script setup>`)
- `src/common` — code shared by main and renderer (e.g. `note-format.js`)
- `tests/playwright/test-utils.js` — `HeynotePage` helper; use it in new specs

## Conventions

- Match surrounding code: plain JS in most files, TS only where already used.
- `patches/` is applied by `patch-package` on install.
