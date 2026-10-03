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

## Driving the app (agent-browser via CDP)

Use `agent-browser` to drive the real Electron app (skills: `agent-browser skills get core`, `... get electron`).

- Launch dev app with CDP + throwaway profile (protects real notes):
  `mkdir -p $TMPDIR/heynote-agent && env -u ELECTRON_RUN_AS_NODE HEYNOTE_CDP=9222 HEYNOTE_TEST_USER_DATA_DIR=$TMPDIR/heynote-agent npm run dev`
  (waits for `curl localhost:9222/json/version`, then `agent-browser connect 9222`)
- `agent-browser snapshot -i` → act on `@eN` refs → re-snapshot after changes. Use named sessions (`--session`) for isolation; don't touch the default shared session.
- Prefer `wait --text/--url/--fn` over fixed sleeps; avoid `networkidle`.
- CodeMirror notes: `fill` may not work; use `agent-browser keyboard type` / `keyboard inserttext`. To edit document text programmatically, get the view via `document.querySelector('.cm-editor').cmView.view` (not `.cm-content.cmView`) and `view.dispatch({changes: ...})`. Read text with `document.querySelector('.cm-content').innerText`.
- Screenshots: `screenshot --if-changed` for repeats; `--annotate` maps labels to refs. Preserve dark mode with `--color-scheme dark`.
