---
phase: 20-3d-constellation
plan: 03
subsystem: game
tags: [hook, click-vs-drag, uat, bundle-gate-close, lighthouse]
requirements: [DEPTH-01]
status: pending-checkpoint
created: 2026-06-10
duration: ~22min (mid-plan resume — Task 1 RED/GREEN already on base; this agent ran renderer integration + Task 2 + Task 3 prep)
completed_tasks: 2_of_3 (Task 3 is a blocking human-verify checkpoint)
dependency_graph:
  requires: [20-01-SUMMARY.md, 20-02a-SUMMARY.md, 20-02b-SUMMARY.md]
  provides: [useClickVsDrag hook wired into WebGLConstellation, 3-tier bundle-gate ladder, 20-UAT.md scaffold]
  affects: [src/game/renderers/WebGLConstellation.js, src/game/renderers/WebGLConstellation.test.js, scripts/check-bundle-gate.mjs, .planning/phases/20-3d-constellation/20-UAT.md]
tech_stack:
  added: []
  patterns:
    - "useRef + pickAtRef body-level ref to expose effect-scoped pickAt() to a useCallback-stable hook onClick"
    - "useRef + onSelectSkillRef mirror so the hook does not re-arm when onSelectSkill identity changes across parent renders"
    - "jsdom defensive setPointerCapture/releasePointerCapture/hasPointerCapture stubs per-test (OrbitControls assumes spec-complete pointer-capture API)"
    - "4-tier bundle-gate ladder via throw → CLI catch → process.exit(1) (HARD FAIL) vs console.warn (WARN, no exit) vs console.log (INFO) vs silent (tier 1)"
key_files:
  created:
    - .planning/phases/20-3d-constellation/20-UAT.md
    - .planning/phases/20-3d-constellation/20-03-SUMMARY.md
  modified:
    - src/game/renderers/WebGLConstellation.js
    - src/game/renderers/WebGLConstellation.test.js
    - scripts/check-bundle-gate.mjs
decisions:
  - "D-20-CLICK-DRAG-THRESHOLD wired end-to-end: useClickVsDrag hook (committed in base 470c033) integrated into WebGLConstellation pointerup path; legacy click listener removed; CRIT-02 ordering preserved (OrbitControls first → pick handlers second → hook arbitrates before onSelectSkill)."
  - "Plan §interfaces specified WEBGL_HARD_KB=130 with HARD FAIL above. Implementation uses throw new Error(...) in the gate body so the existing CLI catch (process.exit(1)) handles the exit. The script keeps a single process.exit(1) location — simpler than scattering process.exit calls across both the mobile and WebGL HARD paths."
  - "Renderer integration uses a body-level useRef('pickAtRef') populated by the effect rather than re-wiring useClickVsDrag inside the effect closure. This keeps the hook's useCallback identity stable across pick-handler effect re-runs and avoids unmount→remount oscillations on every nodes/layout/onHoverSkill change."
metrics:
  duration: "~22 min wall-clock"
  completed_date: "2026-06-10"
  tasks_completed_this_agent: 2  # Task 1 renderer integration + Task 2 (Step A + Step B)
  tests_passing: 293
  tests_baseline_pre_plan: 291
  tests_delta_this_agent: "+2 (new WebGLConstellation pointer-arbitration tests)"
  files_created: 2
  files_modified: 3
  commits_this_agent: 3
---

# Phase 20 Plan 03: useClickVsDrag Integration + Bundle-Gate 3-Tier Ladder + UAT Scaffold Summary

useClickVsDrag is wired into the WebGLConstellation pick path with the legacy `'click'` listener removed (CRIT-02 mitigation completed); the bundle-gate now carries a 3-tier WebGL chunk ladder per checker Warning #4 (≤60 silent / 60-125 INFO / 125-130 WARN / >130 HARD FAIL); and 20-UAT.md scaffold lives in the phase directory with 8 test-matrix items + Lighthouse mobile row + v3.9 carried deferred bullets, awaiting the Task 3 human-verify sweep.

## One-Line Summary

useClickVsDrag arbitrates click vs drag in the WebGL renderer (5px mouse / 8px touch / 250ms; D-20-CLICK-DRAG-THRESHOLD), bundle-gate ladder hardened (HARD FAIL above 130 kB gz), UAT scaffold ready for operator sweep.

## Plan Scope Recap

| Task | Type | Status |
|------|------|--------|
| Task 1: useClickVsDrag hook + tests + renderer integration | auto, tdd | Complete — base ref had RED (7dfa5e3) + GREEN (470c033); this agent landed the renderer integration (14c2adf) |
| Task 2 Step A: 3-tier WebGL bundle-gate ladder | auto | Complete — 043e39a |
| Task 2 Step B: 20-UAT.md scaffold | auto | Complete — 920f482 |
| Task 3: UAT 8-item sweep + Lighthouse mobile re-verify | checkpoint:human-verify | **PENDING — operator must execute** |

## Acceptance Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| `src/game/useClickVsDrag.js` exports default hook | PASS | Pre-base 470c033; `rg "export default function useClickVsDrag"` → 1 hit |
| Locked thresholds `DIST_THRESHOLD_MOUSE=5`, `DIST_THRESHOLD_TOUCH=8`, `TIME_THRESHOLD_MS=250` | PASS | `rg "^const DIST_THRESHOLD_MOUSE = 5"` → 1 hit (same for other two) |
| `pointerType === 'touch'` branch present | PASS | `rg "pointerType === 'touch'" src/game/useClickVsDrag.js` → 1 hit |
| `useClickVsDrag` imported + invoked in renderer | PASS | `rg "useClickVsDrag" src/game/renderers/WebGLConstellation.js` → 7 hits (import + invocation + comments) |
| Legacy `addEventListener('click', ...)` removed | PASS | `rg "addEventListener\\(['\"]click['\"]" src/game/renderers/WebGLConstellation.js` → 0 hits |
| Test suite GREEN | PASS | 293 / 293 passing (baseline 291 + 2 new pointer-arbitration tests) |
| useClickVsDrag tests 6/6 | PASS | `useClickVsDrag.test.js` reports 6 tests passing |
| Bundle gate exits 0 | PASS | `node scripts/check-bundle-gate.mjs` → exit 0; mobile 9.46 kB gz / WebGL 122.63 kB gz (INFO baseline tier) |
| `WEBGL_SOFT_CEIL_KB = 125` constant present | PASS | `rg "WEBGL_SOFT_CEIL_KB = 125"` → 1 hit |
| `WEBGL_WARN_KB = 130` constant present | PASS | `rg "WEBGL_WARN_KB = 130"` → 1 hit |
| `WEBGL_HARD_KB = 130` constant present | PASS | `rg "WEBGL_HARD_KB = 130"` → 1 hit |
| `WEBGL_TTI_WARN_KB = 60` preserved | PASS | `rg "WEBGL_TTI_WARN_KB = 60"` → 1 hit |
| `process.exit(1)` HARD-FAIL exit path | PASS | `rg "process\\.exit\\(1\\)"` → 1 hit (CLI catch handler); HARD FAIL throws → handler exits |
| Synthetic HARD FAIL validation | PASS | WEBGL_HARD_KB=10 locally → exit 1; reverted; 122.63 kB > 10 kB triggers HARD FAIL message |
| `20-UAT.md` exists with required sections | PASS | YAML front-matter + `## Scope` + `## Environment` + `## Test Matrix` (8 items) + `## Pass Criteria` + `## Notes / Findings` + v3.9 carried + Lighthouse Mobile + Bundle Gate Verification |
| UAT Item 8 references both `WEBGL_SOFT_CEIL_KB = 125` and `WEBGL_WARN_KB = 130` grep assertions | PASS | Bundle Gate Verification section explicit |

## Commits Landed (this agent)

| Hash | Subject |
|------|---------|
| 14c2adf | feat(20-03): wire useClickVsDrag into WebGLConstellation pick path (CRIT-02, D-20-CLICK-DRAG-THRESHOLD) |
| 043e39a | feat(20-03): 3-tier WebGL bundle-gate ladder (125/130 kB) — checker Warning #4 |
| 920f482 | test(20-03): UAT scaffold + Lighthouse mobile row + v3.9 debt bundling |

## Pre-existing Commits (base for resume)

| Hash | Subject |
|------|---------|
| 7dfa5e3 | test(20-03): RED — useClickVsDrag tests (D-20-CLICK-DRAG-THRESHOLD) |
| 470c033 | feat(20-03): useClickVsDrag hook — D-20-CLICK-DRAG-THRESHOLD GREEN |

## Bundle Snapshot (post-Plan-20-03 production build)

| Chunk | gz size | Tier | Notes |
|-------|---------|------|-------|
| GameMode-*.js (mobile) | 9.46 kB | PASS (under 14 kB WARN floor) | Mobile chunk holds zero `three/...` import strings (Plan 20-01 regex defense) |
| WebGLConstellation-*.js (desktop lazy) | 122.63 kB | INFO baseline (60 < x ≤ 125) | Plan 20-02b reported 122.37 kB; +0.26 kB from useClickVsDrag wiring (within noise floor) |

Vite reports `125.57 kB gz` for the WebGL chunk in its build log; the bundle-gate script measures `122.63 kB gz` via Node `zlib.gzipSync`. Discrepancy is build-tool compression-level difference. The **bundle-gate measurement is authoritative for the ladder verdict** — the script's number is what the CI gate enforces.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] jsdom OrbitControls uncaught exception on `pointerdown` dispatch**

- **Found during:** Task 1 — first test run after wiring `useClickVsDrag` into the renderer
- **Issue:** `OrbitControls.onPointerDown` calls `this.domElement.setPointerCapture(e.pointerId)` unconditionally. jsdom's `HTMLCanvasElement` does NOT implement `setPointerCapture`. The renderer integration test previously dispatched a `'click'` MouseEvent — which did NOT route through OrbitControls — so the missing API was never exercised. Now that we dispatch `pointerdown`/`pointerup` to drive the hook path, OrbitControls' listener fires and throws `TypeError: this.domElement.setPointerCapture is not a function` as an uncaught exception (assertions still passed because the hook listener fires too).
- **Fix:** Per-test stub `canvas.setPointerCapture = () => {}; canvas.releasePointerCapture = () => {}; canvas.hasPointerCapture = () => false`. Applied in both new pointer-arbitration tests inside `WebGLConstellation.test.js`. Local stubs (not global) — keeps the rest of the suite explicit about which tests trigger pointer-capture surface.
- **Files modified:** `src/game/renderers/WebGLConstellation.test.js`
- **Commit:** 14c2adf

### Plan-vs-Brief Reconciliation

**Task 2 commit granularity.** Plan 20-03 §Task 2a calls for a single atomic commit covering the ladder edit + UAT scaffold (`feat(20-03): 3-tier bundle-gate ladder + UAT scaffold (checker Warning #1+#4)`). The orchestrator brief (task_2_brief in the spawn prompt) explicitly requested **two atomic commits**: `feat(20-03): 3-tier WebGL bundle-gate ladder (125/130 kB)` and `test(20-03): UAT scaffold + Lighthouse mobile row + v3.9 debt bundling`. Followed the brief — split into 043e39a (gate) + 920f482 (UAT). Rationale: the two artifacts have orthogonal concerns (script ladder vs documentation scaffold) and split commits make Task 3 review cleaner. Acceptance criteria do not require a single commit — they only require the constants/sections to exist.

## Tests Added in This Agent's Run

| File | Test name | Purpose |
|------|-----------|---------|
| `src/game/renderers/WebGLConstellation.test.js` | `canvas pointerdown + pointerup over a node within click threshold calls props.onSelectSkill(id) — Plan 20-03 useClickVsDrag path (D-20-CLICK-DRAG-THRESHOLD)` | Replaces the prior `'click'` MouseEvent test; verifies pointerup-via-hook path |
| `src/game/renderers/WebGLConstellation.test.js` | `canvas pointerdown + pointerup past 5px drag threshold does NOT call onSelectSkill — CRIT-02 mitigation (Plan 20-03)` | Defends GAME-04 under OrbitControls gesture state |
| `src/game/renderers/WebGLConstellation.test.js` | `source code contains NO addEventListener("click", ...) — Plan 20-03 removed legacy click path in favor of useClickVsDrag pointerup arbitration` | Static negative assertion preserves CRIT-02 mitigation against future regression |

## Threat Surface Scan

No new security-relevant surface introduced. All edits are within the existing threat model:
- `T-20-03-Repud`: useClickVsDrag arbitration unit-tested at hook level (6 tests) and renderer-integration level (2 new tests). Deterministic.
- `T-20-03-DoS`: `useClickVsDrag` invocation moved to body-level scope with stable callback (reads from `onSelectSkillRef`). Effect deps include `hookOnPointerDown` / `hookOnPointerUp` which are useCallback-stable; no unmount-loop.
- `T-20-03-SC`: 3-tier ladder narrows the HARD-ceiling deferral to a 5 kB empirical-data window around WARN — strictly tighter than the prior single-WARN gate.

No threat flags raised.

## Known Stubs

None. All Plan 20-03 artifacts are functional or scaffolded with explicit pending markers (20-UAT.md `### N` rows + `## Notes / Findings` block).

## Deferred Issues / Out of Scope

- **Pre-existing lint errors** in `WebGLConstellation.js` (`no-bitwise` at L128/L129, `no-unused-vars` at L542/L640, `no-shadow` at L916) untouched. None introduced by this plan; existed pre-base. Logged for follow-up.
- **Pre-existing lint errors** in `WebGLConstellation.test.js` (`no-underscore-dangle` for `__filename` / `__dirname` at L14/L15) untouched. These are required by ESM `import.meta.url` → `fileURLToPath` pattern; would need an `eslint-disable` annotation or config update. Logged for follow-up.
- **Task 3 manual UAT sweep** is the explicit `checkpoint:human-verify` next step — see checkpoint return at end of this agent's run.

## Self-Check: PASSED

- File `src/game/useClickVsDrag.js`: FOUND (base ref).
- File `src/game/useClickVsDrag.test.js`: FOUND (base ref).
- File `src/game/renderers/WebGLConstellation.js`: FOUND (Task 1 modified — verified rg `useClickVsDrag` returns 7 hits).
- File `src/game/renderers/WebGLConstellation.test.js`: FOUND (Task 1 modified — verified 44 tests passing).
- File `scripts/check-bundle-gate.mjs`: FOUND (Task 2 Step A modified — verified all 4 constants present + exit 0).
- File `.planning/phases/20-3d-constellation/20-UAT.md`: FOUND (Task 2 Step B created — verified 8 test matrix items + v3.9 carried section).
- Commit `14c2adf`: FOUND.
- Commit `043e39a`: FOUND.
- Commit `920f482`: FOUND.

## Checkpoint State (Task 3 — Operator Hand-off)

Task 3 is a **`checkpoint:human-verify`** gate. The orchestrator must:

1. Spawn an operator session OR delegate to the project owner.
2. Operator runs the prescribed commands (NOT runnable from a worktree-isolated agent):
   - `npm run build && npm run preview` (production preview server)
   - `npm run lighthouse:mobile && npm run lighthouse:check`
   - Manual 8-item UAT sweep against the preview URL in Chrome stable
   - Real-device pass for v3.9 carried items (iPhone 14 / Pixel 7 + desktop browser without prefers-reduced-motion)
3. Operator fills `.planning/phases/20-3d-constellation/20-UAT.md` `## Notes / Findings` + the Lighthouse Mobile score table + each `### N. result:` row.
4. On UAT 8/8 PASS + Lighthouse HARD gate intact + bundle exit 0: type `approved` to the orchestrator; the closing commit `docs(20-03): UAT 8/8 PASS + Lighthouse mobile HARD gate re-verified (v3.10 close)` lands.
5. Any FAIL items route to a v3.10.1 micro-milestone or Phase 20 Plan 04 per CONTEXT §deferred.

Milestone v3.10 close depends on this checkpoint resolving green.

## Milestone v3.10 Readiness

Source-code surface for v3.10 is **complete pending Task 3 verdict**. All 4 D-20-* decisions backed by code + tests:

| Decision | Code | Tests | UAT row |
|----------|------|-------|---------|
| D-20-VISUAL-3D (OrbitControls + tilted initial camera) | Plan 20-02a | 24 in `WebGLConstellation.test.js` 3D camera + controls block | Item 1 + Item 2 |
| D-20-CONTEXT-AUTOROTATE-RESUME (permanent pause on first drag) | Plan 20-02a | dragHappenedRef latch tests | Item 3 |
| D-20-CONTEXT-HINT (bilingual OnboardingHint pill) | Plan 20-02b | 6 tests in `OnboardingHint.test.js` | Item 8 |
| D-20-PLANETS-TIER (top-K=6 halos + larger radii) | Plan 20-02b | graph + WebGL + SVG tests | Item 7 |
| D-20-CLICK-DRAG-THRESHOLD (5/8/250) | Plan 20-03 (this) | 6 hook tests + 2 renderer-integration tests + 1 static negative assertion | Item 4 |

On Task 3 GREEN: tag candidate `v3.10` ready.

## Open Items Routing (v3.10.1 / Phase 20 Plan 04 candidates)

Per CONTEXT §deferred (carried forward intentionally):
- Camera-state persistence across reloads (orbit angle in localStorage).
- "Reset view" button overlay.
- Per-category depth color shift (subtle palette modulation by category cluster).
- Fog falloff at far edge of the orbit volume (perspective depth cue beyond foreshortening).
- WebGL chunk size optimization back toward the ≤60 kB silent tier (current 122 kB is INFO baseline — within soft contract but visible in TTI).
