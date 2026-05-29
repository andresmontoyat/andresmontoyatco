---
phase: 14-foundation-data-layer-viewmode-toggle-test-infra
plan: "02"
subsystem: viewmode-toggle
tags: [viewmode, context, toggle, tdd, game-mode, a11y, i18n, persistence]
dependency_graph:
  requires:
    - "14-01: Vitest + RTL test runner (jsdom + setupFiles in vite.config.js)"
    - "14-01: src/test/setup.js (jest-dom + localStorage bridge)"
  provides:
    - "ViewModeContext: game|dev state, cam-viewmode localStorage, ?mode= precedence, window guard"
    - "ViewModeToggle: segmented pill, aria-pressed, 44px targets, bilingual, tokens-only"
    - "App.js: ViewModeProvider wired + crawlable game placeholder in <main>"
    - "Nav.js: ViewModeToggle in desktop cluster AND MobileMenu"
    - "translations.js: nav.modeGame/modeDev/viewModeToGame/viewModeToDev + game namespace"
  affects:
    - src/context/ViewModeContext.js
    - src/context/ViewModeContext.test.js
    - src/components/_shared/ViewModeToggle.js
    - src/components/_shared/ViewModeToggle.test.js
    - src/App.js
    - src/components/Nav.js
    - src/i18n/translations.js
    - src/test/setup.js
    - vite.config.js
tech_stack:
  added: []
  patterns:
    - "TDD: RED commit (tests) → GREEN commit (implementation) per task"
    - "Context API: createContext + useState(readInitial) + useCallback + useMemo value"
    - "?mode= query param wins over localStorage (allowlist-validated only, T-14-02)"
    - "window.localStorage bridge in setup.js (Node.js 22+ native localStorage workaround)"
    - "Segmented pill toggle: role=group + two <button type=button> + aria-pressed"
key_files:
  created:
    - src/context/ViewModeContext.js
    - src/context/ViewModeContext.test.js
    - src/components/_shared/ViewModeToggle.js
    - src/components/_shared/ViewModeToggle.test.js
  modified:
    - src/App.js
    - src/components/Nav.js
    - src/i18n/translations.js
    - src/test/setup.js
    - vite.config.js
decisions:
  - "ViewModeProvider placed INSIDE LanguageProvider so toggle/placeholder can read t.*"
  - "Inner MainContent component used to call useViewMode() inside the provider tree (mirrors SkipLink pattern)"
  - "window.localStorage bridged via setup.js because Node.js 26 native localStorage blocks vitest populateGlobal"
  - "vite.config.js environmentOptions.jsdom.url added for completeness (default already http://localhost:3000)"
  - "Game placeholder is a plain <section> with <h1> + <p> — no aria-hidden; crawlable by default"
  - "ViewModeToggle uses role=group (not role=radiogroup) to match LangPill precedent"
metrics:
  duration: "11 minutes"
  completed_date: "2026-05-29"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 5
---

# Phase 14 Plan 02: ViewMode Toggle + Context Summary

**One-liner:** ViewModeContext (cam-viewmode localStorage + ?mode= allowlist, game default per D5) wired into App.js + Nav.js with bilingual segmented pill toggle (aria-pressed, 44px targets, tokens-only) and crawlable game-mode placeholder; 57 tests green, production build passes.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 (RED) | ViewModeContext failing tests | `aea1b24` | src/context/ViewModeContext.test.js |
| 1 (GREEN) | ViewModeContext + copy keys | `b137f5d` | src/context/ViewModeContext.js, translations.js, setup.js, vite.config.js |
| 2 (RED) | ViewModeToggle failing tests | `d7ec0f3` | src/components/_shared/ViewModeToggle.test.js |
| 2 (GREEN) | ViewModeToggle component | `7cc1ff8` | src/components/_shared/ViewModeToggle.js |
| 3 | App/Nav wiring + placeholder | `24170f2` | src/App.js, src/components/Nav.js |

## Test Results

```
Test Files  6 passed (6)
     Tests  57 passed (57)
```

New tests in this plan:
- `ViewModeContext.test.js`: 13 tests (default game, persistence, toggle, validation, ?mode= precedence, invalid param, throw safety)
- `ViewModeToggle.test.js`: 8 tests (rendering, aria-pressed, pill aria-label, click/keyboard, persistence)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Node.js 26 native localStorage blocks vitest populateGlobal**
- **Found during:** Task 1 test execution
- **Issue:** Node.js 22+ exposes a native `localStorage` on `globalThis`. Vitest's `populateGlobal` skips keys already defined in Node's global scope — so the jsdom localStorage never propagates to `window.localStorage` in the test environment. Both `localStorage` and `window.localStorage` returned `undefined` inside tests and inside React components rendered in tests.
- **Fix:** Extended `src/test/setup.js` to bridge `jsdom.window.localStorage` (the jsdom instance) onto both `globalThis` and `window` via `Object.defineProperty` after the jsdom environment is ready. Also added `environmentOptions.jsdom.url` to `vite.config.js` (the default is already `http://localhost:3000`, but made explicit).
- **Files modified:** `src/test/setup.js`, `vite.config.js`
- **Commits:** `b137f5d`
- **Impact:** The bridge is invisible to application code (which runs in a real browser where `window.localStorage` always works); it only affects the test environment. The fix unblocks all 13 ViewModeContext tests and enables all future component tests that touch localStorage.

## TDD Gate Compliance

Both TDD tasks (Task 1 and Task 2) completed the full RED → GREEN cycle:

| Gate | Task 1 | Task 2 |
|------|--------|--------|
| RED (test commit) | `aea1b24` | `d7ec0f3` |
| GREEN (impl commit) | `b137f5d` | `7cc1ff8` |

RED gate verified: both test commits ran with 0 tests collected (module not found → all 13/8 tests fail), confirming the tests were genuinely failing before implementation.

## Verification

- `npm run test:run` exits 0: 57 tests green (36 from plan 14-01 + 13 ViewModeContext + 8 ViewModeToggle)
- `npm run build` exits 0: 812ms, 175.89 kB main bundle
- `rg -c "modeGame" src/i18n/translations.js` → 2 (EN + ES)
- `rg -c "ViewModeToggle" src/components/Nav.js` → 3 (1 import + 2 render sites)
- `rg -n "#[0-9a-fA-F]{3,6}" src/components/_shared/ViewModeToggle.js` → no matches (tokens only)
- `rg -n "ViewModeProvider|useViewMode" src/App.js` → 4 lines (import + inner component + provider wrap)
- Game placeholder at App.js lines 39-50 has NO `aria-hidden` attribute
- `?mode=` query param validated against `VALID_MODES` allowlist before any state assignment (T-14-02 mitigated)
- `fd vitest.config` → no results (no separate vitest.config created)
- No `.jsx` files created

## Known Stubs

- **Game placeholder** (src/App.js MainContent): The game-mode branch renders a heading (`t.game.loadingTitle`) and body (`t.game.loadingBody`) as real DOM text. This is an intentional stub per the plan — Phase 15 replaces it with the full constellation renderer. The placeholder is crawlable and provides meaningful content to SR/ATS/SEO (GAME-06 partial obligation).

## Threat Flags

None — no new network endpoints or auth paths. The `?mode=` input boundary is mitigated by the VALID_MODES allowlist (T-14-02). Placeholder copy comes from the static `translations.js` dictionary; no `dangerouslySetInnerHTML` introduced (T-14-XSS accepted per plan).

## Note for Phase 15

The game subtree in App.js `MainContent` is the plug point for Phase 15's constellation renderer. Replace the `<section>…</section>` placeholder block with the renderer component. `useViewMode()` is exported from `src/context/ViewModeContext.js` as `{ viewMode, setViewMode, toggleViewMode }`.

## Self-Check: PASSED

Files exist:
- src/context/ViewModeContext.js: FOUND
- src/context/ViewModeContext.test.js: FOUND
- src/components/_shared/ViewModeToggle.js: FOUND
- src/components/_shared/ViewModeToggle.test.js: FOUND
- src/App.js (modified): FOUND
- src/components/Nav.js (modified): FOUND
- src/i18n/translations.js (modified): FOUND

Commits exist:
- aea1b24 (test RED ViewModeContext): FOUND
- b137f5d (feat GREEN ViewModeContext): FOUND
- d7ec0f3 (test RED ViewModeToggle): FOUND
- 7cc1ff8 (feat GREEN ViewModeToggle): FOUND
- 24170f2 (feat App/Nav wiring): FOUND
