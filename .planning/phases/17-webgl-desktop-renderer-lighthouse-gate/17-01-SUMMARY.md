---
phase: 17-webgl-desktop-renderer-lighthouse-gate
plan: 01
subsystem: ui
tags: [react, three.js, webgl, lazy-loading, suspense, error-boundary, capability-detection, vitest, tdd, code-splitting]

# Dependency graph
requires:
  - phase: 15-accessible-constellation-seo-fallback
    provides: SvgConstellation renderer + props contract (nodes/edges/layout/highlightedSkillIds/selectedSkillId/yearRange/justFilteredId/theme/lang/t/onSelectSkill/onHoverSkill)
  - phase: 15-accessible-constellation-seo-fallback
    provides: usePrefersReducedMotion SSR-safe matchMedia pattern (SvgConstellation.js:32-59) — mirrored in useRendererCapability
  - phase: 16-filters-floating-experiencecard
    provides: hoveredSkillId state + onHoverSkill callback owned by useConstellation (lines 55, 73, 132) — BLOCKER 2 surface
  - phase: 16-filters-floating-experiencecard
    provides: GameMode renderer slot wrapper + data-game-interactive attribute (Phase 16 D-16-CLICK-OUTSIDE contract)
provides:
  - Reactive useRendererCapability hook returning 'webgl' | 'svg' enum with 4 gates + URL override
  - RendererErrorBoundary lifted from GameMode (renamed + [renderer-fallback] log prefix)
  - WebGLConstellation Slice 1 minimal renderer (1 Point node, aria-hidden canvas, props-contract parity with SvgConstellation)
  - GameMode wired to branch on capability via lazy + Suspense + ErrorBoundary
  - hoveredSkillId flowing from useConstellation to BOTH renderer slots via shared rendererProps spread
  - WebGLConstellation lazy chunk physically split out of mobile GameMode bundle
  - GameMode.test.js SC-5 verification (Test A webgl mount, Test B svg direct, Test C live-swap state preservation)
affects: [17-02-PLAN, 17-03-PLAN, 17-04-PLAN, 17-05-PLAN, Phase 18+, three.js renderer evolution, Lighthouse mobile gate]

# Tech tracking
tech-stack:
  added: ["three ^0.169 (named-imports tree-shaken target ~40 kB gz)"]
  patterns:
    - "React.lazy() at module scope (Pattern G) — never inside component body to avoid infinite chunk re-fetch"
    - "Suspense fallback = SvgConstellation per Pattern H (SVG IS the loading state, not a spinner)"
    - "ErrorBoundary fallback = SvgConstellation per Pitfall 12 (chunk-fetch + shader-compile + ctx-init all degrade gracefully)"
    - "vi.hoisted({ capabilityState }) + vi.mock single-mock-factory driver for per-test capability branch selection"
    - "Capability hook gates evaluated in order: URL override → viewport ≥1024 → !reduced-motion → !saveData → !2g → WebGL ctx"
    - "Per-test vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({}) overrides global null stub in src/test/setup.js (Pitfall 1)"
    - "vi.mock('three') with fake WebGLRenderer constructor for jsdom (Pitfall 7)"
    - "console.error('[renderer-fallback]', ...) greppable prefix in DevTools (Pattern I)"

key-files:
  created:
    - src/game/useRendererCapability.js
    - src/game/useRendererCapability.test.js
    - src/game/RendererErrorBoundary.js
    - src/game/RendererErrorBoundary.test.js
    - src/game/renderers/WebGLConstellation.js
    - src/game/renderers/WebGLConstellation.test.js
  modified:
    - src/game/GameMode.js
    - src/game/GameMode.test.js
    - package.json
    - package-lock.json

key-decisions:
  - "URL override semantics confirmed: ?renderer=webgl short-circuits all capability gates (debug/UAT only; user accepts responsibility for forcing WebGL on incapable client)"
  - "Module-scope helpers (LIGHT_THEME_STROKES, SIZING, computeRadius, edgeStrokeWidth) lifted verbatim into WebGLConstellation.js during Slice 1 to avoid re-touching the file in Slice 2 (declared with eslint-disable; not yet called)"
  - "vite.config.js requires NO optimizeDeps change for three.js — npm run dev boots cleanly in 385ms (WARNING 1 resolved)"
  - "GameMode.test.js extension uses vi.hoisted single-mock-factory pattern; baseline 14 tests default to capabilityState='svg' so they continue to exercise the SVG path unchanged"
  - "aria-live region promotion deferred per SUGGESTION 2 — SvgConstellation owns aria-live for Slice 1; WebGL session loses dynamic SR announcements but ConstellationFallback persists outside the renderer slot"

patterns-established:
  - "Pattern G: React.lazy() lives at module scope (line 33), BEFORE the GameMode function declaration (line 35)"
  - "Pattern H: Suspense fallback renders SvgConstellation (the SVG renderer IS the loading state); never a spinner"
  - "Pattern I: '[renderer-fallback]' console.error prefix for all renderer-degradation events (greppable in DevTools)"
  - "BLOCKER 2 pattern: hoveredSkillId sourced from useConstellation, spread to BOTH renderer slots via shared rendererProps object — WebGL consumes as prop, SvgConstellation receives extra prop and continues internal state (Phase 15 contract preserved)"
  - "Capability lift pattern: detectCapabilities() lifted from inline GameMode → useRendererCapability hook with addEventListener/addListener Safari 13 compat shim mirroring SvgConstellation usePrefersReducedMotion"
  - "Renderer ErrorBoundary lift pattern: ConstellationErrorBoundary class extracted from GameMode + renamed + log prefix changed in one atomic operation"

requirements-completed: [GAME-01, GAME-07]

# Metrics
duration: 10m 55s
completed: 2026-06-04
---

# Phase 17 Plan 01: WebGL Desktop Renderer Slice 1 (Walking Thin) Summary

**Capability-gated renderer selection: useRendererCapability hook + RendererErrorBoundary + Slice-1 WebGLConstellation (1 Point smoke) + GameMode lazy/Suspense wiring, with hoveredSkillId flowing to both renderers and three.js physically absent from the mobile chunk.**

## Performance

- **Duration:** 10m 55s
- **Started:** 2026-06-04T03:06:38Z
- **Completed:** 2026-06-04T03:17:33Z
- **Tasks:** 2
- **Files modified:** 10 (6 created, 4 modified — includes package-lock.json)

## Accomplishments

- Reactive `useRendererCapability` hook returns `'webgl' | 'svg'` based on 4 mandatory gates (viewport ≥1024px, !reduced-motion, !saveData, !2g effectiveType) + WebGL feature detect + `?renderer=svg|webgl` URL override; re-evaluates on viewport+motion matchMedia change events with Safari 13 addListener compat shim.
- `RendererErrorBoundary` lifted from `GameMode.js:46-67` inline class, renamed for clarity, log prefix changed to `[renderer-fallback]` (Pattern I — DevTools-greppable); sticky once tripped (no auto-reset until page reload).
- `WebGLConstellation` Slice 1 minimal: 1 white Point at `layout[nodes[0].id]`, named-import three.js (D-17-TREESHAKE), aria-hidden + tabIndex=-1 + data-testid="webgl-canvas"; consumes `hoveredSkillId` as a PROP (no internal hover useState — BLOCKER 2 resolved).
- `GameMode.js` cleaned up: 3 deletions (`detectCapabilities` function, `ConstellationErrorBoundary` class, `data-prefers-reduced-motion` attribute) + 4 additions (Suspense import, lazy WebGL at module scope, `useRendererCapability` call, shared `rendererProps` with `hoveredSkillId: cons.hoveredSkillId`).
- SC-5 verified by automated `GameMode.test.js` (3 new tests): Test A (capability='webgl' → WebGL canvas mounts via Suspense), Test B (capability='svg' → SvgConstellation direct mount, no Suspense flash, `data-renderer="svg"`), Test C (live-swap from SVG→WebGL preserves selection state via useConstellation living above the renderer slot).
- Production bundle verified: `dist/assets/GameMode-LgTogtax.js` = **9.13 kB gz** (well under 38.82 kB SC-3 ceiling), `dist/assets/WebGLConstellation-Bf7F8vNA.js` = **116.08 kB gz** separate lazy chunk; `rg "THREE\.|from 'three'"` on the mobile chunk → 0 matches (three.js physically absent).
- Full test suite: 207/207 green (was 183 baseline + 24 new across the 4 new test files).

## Task Commits

Each task RED→GREEN cycle was committed atomically (8 commits total):

1. **Task 1.RED:** `55a07c1` — `test(17-01): RED useRendererCapability — 5 gates + URL override + reactivity`
2. **Task 1.GREEN:** `bccc292` — `feat(17-01): GREEN useRendererCapability hook — 4 gates + URL override + reactive matchMedia` (includes `three` install)
3. **Task 2.a.RED:** `71b6c34` — `test(17-01): RED RendererErrorBoundary — children/fallback/log-prefix/sticky`
4. **Task 2.a.GREEN:** `2519e96` — `feat(17-01): GREEN extract RendererErrorBoundary from GameMode + [renderer-fallback] log prefix`
5. **Task 2.b.RED:** `d66c806` — `test(17-01): RED WebGLConstellation Slice 1 smoke`
6. **Task 2.b.GREEN:** `3874cea` — `feat(17-01): GREEN WebGLConstellation Slice 1 — 1 Point render + aria-hidden canvas + hoveredSkillId prop`
7. **Task 2.c.RED:** `4916451` — `test(17-01): RED GameMode SC-5 capability-based renderer selection`
8. **Task 2.c.GREEN:** `a8bf568` — `feat(17-01): GREEN wire useRendererCapability + lazy WebGL branch + hoveredSkillId on both renderer slots + delete inline ConstellationErrorBoundary/detectCapabilities/data-prefers-reduced-motion`

_Plan-level docs commit (this SUMMARY) follows separately._

_Note: The plan acceptance criteria listed "9 atomic commits" but the lock-step is 4 RED→GREEN pairs = 8 commits (Task 1 is a single pair, Task 2 is three pairs). The 8-commit chain satisfies the spec intent of "RED→GREEN for each of 3 components + GameMode wire commit" — the wire commit is the GREEN of the 4th RED→GREEN pair._

## Files Created/Modified

**Created (6):**
- `src/game/useRendererCapability.js` (72 LOC) — pure-logic capability hook, zero three.js imports, addEventListener/addListener Safari 13 compat shim
- `src/game/useRendererCapability.test.js` (220 LOC, 12 it() blocks) — 5 gates × on/off + URL override × svg/webgl + SSR smoke + matchMedia reactivity + listener cleanup + memoization
- `src/game/RendererErrorBoundary.js` (35 LOC) — React 17 class ErrorBoundary, `[renderer-fallback]` log prefix, sticky state
- `src/game/RendererErrorBoundary.test.js` (71 LOC, 4 it() blocks) — children-render / fallback-render / log-prefix / sticky-on-rerender
- `src/game/renderers/WebGLConstellation.js` (155 LOC) — Slice 1 minimal: 1 Point, named-import three.js, dispose cleanup, hoveredSkillId-as-prop contract
- `src/game/renderers/WebGLConstellation.test.js` (101 LOC, 5 it() blocks) — mount-smoke + canvas a11y + WebGLRenderer constructor count + dispose-on-unmount + hoveredSkillId prop accepted

**Modified (4):**
- `src/game/GameMode.js` (177 → 165 LOC; 60 deletions + 48 insertions) — surgical: delete inline class+function+attribute, wire useRendererCapability + lazy + Suspense + ErrorBoundary + shared rendererProps with hoveredSkillId
- `src/game/GameMode.test.js` (153 → 261 LOC; +110 lines) — vi.hoisted({ capabilityState }) driver + vi.mock('./useRendererCapability') + vi.mock('three') + 3 new SC-5 it() blocks in dedicated describe; baseline 14 tests preserved unchanged
- `package.json` — added `"three": "^0.169.0"` to dependencies
- `package-lock.json` — three + transitive locks

## Decisions Made

1. **URL override short-circuits all gates** (D-17-OVERRIDE confirmed): `?renderer=webgl` forces WebGL even when viewport <1024 — user accepts responsibility. Documented inline in `detect()` comment.
2. **Module-scope helpers lifted verbatim during Slice 1**: LIGHT_THEME_STROKES + SIZING + computeRadius + edgeStrokeWidth ported from SvgConstellation.js but declared with `eslint-disable no-unused-vars` — avoids re-touching WebGLConstellation.js in Slice 2 just to add them.
3. **No `optimizeDeps.include: ['three']` needed**: WARNING 1 smoke verified `npm run dev` boots in 385ms with no three-related stderr; vite.config.js unchanged.
4. **vi.hoisted single-mock-factory pattern** for GameMode.test.js: cleaner than per-describe re-mocking; baseline 14 tests default to `capabilityState.value = 'svg'` so they exercise the SVG path unchanged, SC-5 tests flip the value per scenario, `afterEach` resets to 'svg'.
5. **aria-live region NOT promoted to GameMode** (SUGGESTION 2): SvgConstellation owns `<div role="status" aria-live="polite">` (line 386); WebGL session loses dynamic SR announcements during WebGL but `ConstellationFallback` outside the renderer slot persists. Promotion deferred to a future plan if dynamic SR is required under WebGL.
6. **8 commits instead of plan's stated "9"**: TDD cadence is 4 RED→GREEN pairs (Task 1 = 1 pair; Task 2 = 3 pairs). The plan's "9-commit" count miscounted — 8 commits satisfy the spec intent of one RED + one GREEN per component (capability hook, ErrorBoundary, WebGLConstellation, GameMode wire/SC-5).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] useRendererCapability cleanup test mock instance-tracking**
- **Found during:** Task 1 GREEN verification
- **Issue:** Test asserted `removeSpy` was called on the first mock instance returned per matchMedia query, but my matchMedia mock returns a fresh instance per call (correct for purity). `useRendererCapability` calls matchMedia 3× per query during mount (initial detect() → setState init → useEffect attach), creating 3 separate mock instances per query; only the LAST one has its removeEventListener invoked on unmount.
- **Fix:** Changed assertion from `find(first match).removeSpy.toHaveBeenCalled()` → `filter(all matches).filter(any-removeSpy-called).length ≥ 1` — proves cleanup ran without coupling to which instance got attached.
- **Files modified:** `src/game/useRendererCapability.test.js` (cleanup test only)
- **Verification:** 12/12 capability tests green; behavior of the hook unchanged (still detaches both viewport + motion listeners on unmount).
- **Committed in:** `bccc292` (Task 1 GREEN — folded into the GREEN commit since the fix was a test-mock adjustment, not a behavior change).

---

**Total deviations:** 1 auto-fixed (1 blocking — test-mock instance-tracking)
**Impact on plan:** No scope creep. The hook implementation matches the canonical RESEARCH §6 sketch verbatim; only the test assertion adapted to the necessarily-fresh-instance mock pattern.

## Issues Encountered

- **`gtimeout`/`timeout` not on macOS PATH** for the `npm run dev` WARNING 1 smoke. Worked around with `npm run dev > /tmp/vite-dev.log 2>&1 &` + `sleep 6` + `kill -TERM $!` pattern. Vite booted in 385ms; zero three-related stderr → WARNING 1 PASS confirmed.
- **`GameMode.test.js` already existed** with 16 baseline tests (Phase 14-16). Plan said "create new". Surgical APPEND of a new describe block + module-scope hoisted mock — baseline 14 tests (under the existing describe) preserved unchanged, 3 new SC-5 tests added under a new describe. Net: 17 tests in file (14 baseline + 3 SC-5; the 2 H1-derivation tests don't re-run as 'rendered component' so total is 1+13+3 = 17).

## User Setup Required

None. The plan introduces only the `three` dependency which `npm install` resolves automatically. No environment variables, no dashboard config, no external services. Slice 1 is a self-contained code change verified by Vitest + a manual smoke check (run `npm run dev`, visit `http://localhost:5173/?renderer=webgl` on a desktop ≥1024px viewport → see 1 white WebGL point; visit `?renderer=svg` → see the unchanged Phase 16 SVG constellation).

## Next Phase Readiness

**Ready for Plan 17-02 (Slice 2 — Full Graph Parity):**
- WebGLConstellation.js skeleton has all 13 contract props destructured (most as `eslint-disable no-unused-vars` placeholders) — Slice 2 just wires the existing destructure to per-vertex BufferAttributes for nodes + LineSegments for edges.
- Module-scope helpers (LIGHT_THEME_STROKES + SIZING + computeRadius + edgeStrokeWidth) already lifted into the file — Slice 2 calls them, no re-import needed.
- `useRendererCapability` + `RendererErrorBoundary` are LOCKED for the rest of Phase 17 per plan objective; Slices 2-5 extend only WebGLConstellation.js.
- GameMode `rendererProps` object is the stable contract — Slice 2-4 changes don't touch GameMode.js (props already flow correctly).
- Production bundle gates already pass at Slice 1 (GameMode chunk 9.13 kB gz; three.js absent) — Slice 5 bundle-gate script will mostly codify what the current build already demonstrates.

**Concerns:**
- WebGLConstellation chunk is 116.08 kB gz at Slice 1 (vastly above the ~40 kB gz target from D-17-TREESHAKE). This is because Slice 1's named imports drag in three's full geometry/material core. Slice 2's actual usage (BufferGeometry + LineSegments + Points + ShaderMaterial) won't change the chunk size meaningfully — three.js core is the floor. If the WARN-only desktop-lazy budget of 60 kB gz from D-17-BUNDLE matters, Phase 17 planner may need to revisit (e.g., dynamic-import only used three.js sub-paths, or accept the realistic ~110-130 kB gz floor for three.js raw). Flagged for plan 17-02 / 17-05 review.

## Self-Check: PASSED

**Files exist:**
- FOUND: `src/game/useRendererCapability.js`
- FOUND: `src/game/useRendererCapability.test.js`
- FOUND: `src/game/RendererErrorBoundary.js`
- FOUND: `src/game/RendererErrorBoundary.test.js`
- FOUND: `src/game/renderers/WebGLConstellation.js`
- FOUND: `src/game/renderers/WebGLConstellation.test.js`
- FOUND: `dist/assets/GameMode-LgTogtax.js`
- FOUND: `dist/assets/WebGLConstellation-Bf7F8vNA.js`

**Commits exist (verified via `git log --oneline main..HEAD`):**
- FOUND: 55a07c1 (RED useRendererCapability)
- FOUND: bccc292 (GREEN useRendererCapability)
- FOUND: 71b6c34 (RED RendererErrorBoundary)
- FOUND: 2519e96 (GREEN RendererErrorBoundary)
- FOUND: d66c806 (RED WebGLConstellation Slice 1)
- FOUND: 3874cea (GREEN WebGLConstellation Slice 1)
- FOUND: 4916451 (RED GameMode SC-5)
- FOUND: a8bf568 (GREEN GameMode wire)

**Acceptance criteria (all PASS):**
- 6 new files created (3 source + 3 colocated tests) + GameMode.test.js extended + GameMode.js modified + package.json updated
- useRendererCapability 12/12 GREEN (≥11 required)
- RendererErrorBoundary 4/4 GREEN
- WebGLConstellation 5/5 GREEN (Slice 1 smoke)
- GameMode 17/17 GREEN (14 baseline + 3 SC-5)
- Full vitest suite 207/207 GREEN (no regression from 183 baseline)
- `rg "class ConstellationErrorBoundary" src/game/GameMode.js` → 0
- `rg "function detectCapabilities" src/game/GameMode.js` → 0
- `rg "data-prefers-reduced-motion" src/game/GameMode.js` → 0
- `rg "hoveredSkillId: cons\.hoveredSkillId" src/game/GameMode.js` → 1 (BLOCKER 2 resolved)
- `package.json` has `"three": "^0.169.0"` in dependencies
- `npm run build` exits 0
- `dist/assets/WebGLConstellation-*.js` exists as separate lazy chunk
- `rg "THREE\.|from 'three'" dist/assets/GameMode-*.js` → 0 matches (mobile chunk three.js-free)

---
*Phase: 17-webgl-desktop-renderer-lighthouse-gate*
*Completed: 2026-06-04*
