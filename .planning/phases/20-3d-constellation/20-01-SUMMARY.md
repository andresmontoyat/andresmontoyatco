---
phase: 20-3d-constellation
plan: 01
subsystem: data-layer
tags: [layout, bundle-gate, vitest, tdd, regex, category-z, supply-chain]

# Dependency graph
requires:
  - phase: 17-webgl-desktop-renderer-lighthouse-gate
    provides: WebGLConstellation lazy chunk + capability gate + Lighthouse mobile HARD gate baseline (CRIT-03 surface)
  - phase: 14-foundation-data-layer-viewmode-toggle-test-infra
    provides: deterministic radial category-centroid layout in src/game/constellation.layout.js (D-14-01-LAYOUT)
provides:
  - CATEGORY_Z constants block (8 categories, z ∈ [-150, +150]) per D-20-CONTEXT-ZMAP
  - computeLayout() returns {x, y, z} for every node — SVG ignores, WebGL projects (D-20-PROPS-CONTRACT)
  - Widened THREE_JS_PATTERN regex catches three/addons/* + three/examples/jsm/* leaks (CRIT-03 fix)
  - THREE_JS_PATTERN named export for testability
  - 5 bundle-gate regression tests under src/scripts/check-bundle-gate.test.mjs (Vitest default discovery)
  - 5 z-storytelling tests under src/game/constellation.layout.test.js (z present + clustered + range + bounded + deterministic)
affects: [20-02a-PLAN (consumes pos.z + relies on bundle-gate guarding OrbitControls import), 20-02b-PLAN, 20-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Test file location under src/ to match Vitest default discovery glob src/**/*.test.{js,mjs,ts} (Warning #5 mitigation — no vite.config.js change)"
    - "Named export of regex constant for direct unit-testing (THREE_JS_PATTERN)"
    - "CATEGORY_Z lookup with ?? 0 fallback at both assignment sites (single-node + multi-node branches)"
    - "Comment-block 'UAT-tunable' annotation per Alert A14 — values consultable in v3.10-UAT.md post-milestone"

key-files:
  created:
    - src/scripts/check-bundle-gate.test.mjs
  modified:
    - scripts/check-bundle-gate.mjs (regex widened + named export added)
    - src/game/constellation.layout.js (CATEGORY_Z + {x,y,z} return)
    - src/game/constellation.layout.test.js (z storytelling describe block appended)

key-decisions:
  - "D-20-CONTEXT-ZMAP LOCKED at values: ai=150, lang=75, arch=0, data=-25, cloud=-75, devops=-100, security=-125, hardware=-150 — architecture-stack narrative front-to-back, UAT-tunable per Alert A14"
  - "D-20-PROPS-CONTRACT enforced at source: computeLayout returns identical {x,y,z} shape; SVG renderer ignores z silently (no SvgConstellation.js change required this plan)"
  - "Bundle-gate test file located at src/scripts/check-bundle-gate.test.mjs (NOT top-level scripts/) — matches Vitest default discovery; no vite.config.js mutation"
  - "THREE_JS_PATTERN promoted to named export for direct unit-testing; runtime callsite in check-bundle-gate.mjs unchanged"

patterns-established:
  - "Pattern: regex regression coverage via named-export + colocated test under src/ — usable for any future regex-driven build gate"
  - "Pattern: CATEGORY_Z lookup table with ?? 0 fallback — keeps unknown categories from crashing layout (defensive against future skill-data drift)"

requirements-completed: [] # DEPTH-01 partial — data layer foundation only; full closure at Plan 20-03

# Metrics
completed: 2026-06-09
---

# Phase 20 Plan 01: Data Layer + Bundle-Gate Foundation Summary

**Extends computeLayout() to {x, y, z} with deterministic CATEGORY_Z architecture-stack narrative (D-20-CONTEXT-ZMAP) and widens bundle-gate THREE_JS_PATTERN regex to catch three/addons/* leaks BEFORE Plan 20-02a's first OrbitControls import — supply-chain invariant stays continuously enforced.**

## Accomplishments

- **Task 1 — Bundle-gate regex widened (CRIT-03 fix).** `THREE_JS_PATTERN` in `scripts/check-bundle-gate.mjs` widened from `/THREE\.|from\s*['"]three['"]/` to `/THREE\.|from\s*['"]three(\/[^'"]+)?['"]/` — now catches `three/addons/controls/OrbitControls.js`, `three/examples/jsm/controls/OrbitControls.js`, and any future `three/...` subpath. Pattern promoted to named export for direct unit-testing.
- **Task 1 — Regression fixture (Warning #5 mitigation).** Test file at `src/scripts/check-bundle-gate.test.mjs` (under `src/` so Vitest default discovery picks it up — no `vite.config.js` change required). 5 cases: literal `'three'` path, `'three/addons/*'` path, `'three/examples/jsm/*'` path, `THREE.` namespace access, no-match negative case.
- **Task 2 — CATEGORY_Z constants block (D-20-CONTEXT-ZMAP).** 8 categories mapped front-to-back as architecture-stack narrative: `ai: 150, lang: 75, arch: 0, data: -25, cloud: -75, devops: -100, security: -125, hardware: -150`. Comment-block "UAT-tunable; consult v3.10-UAT.md before adjusting after milestone close" per Alert A14.
- **Task 2 — computeLayout() returns {x, y, z}.** Both assignment sites (single-node line 78, multi-node line 87) extended with `z: CATEGORY_Z[cat] ?? 0`. JSDoc `@returns` updated to `Map of node.id → { x, y, z }`.
- **Task 2 — 5 z-storytelling tests appended** under new describe block `'computeLayout - z storytelling (D-20-CONTEXT-ZMAP)'`: z present (typeof number), z clustered by category (lang=75, ai=150, hardware=-150), ≥2 distinct values + range ≥100 (CRIT-04 defense), every z in [-200, 200] (MOD-01 defense), deterministic across calls.
- **Full test suite: 271/271 GREEN** — was 261 baseline + 5 bundle-gate + 5 z-tests.
- **Bundle-gate verification post-commit:** `npm run build && node scripts/check-bundle-gate.mjs` → exits 0; `GameMode-*.js = 8.92 kB gz` (no regression vs v3.9 baseline); `WebGLConstellation-*.js = 117.05 kB gz` WARN (pre-existing Phase 17 finding, unchanged).
- **SVG renderer path unchanged** — `SvgConstellation.js` reads only `pos.x` and `pos.y`, silently ignores `.z` per D-20-PROPS-CONTRACT.

## Task Commits

4 atomic commits (2 RED + 2 GREEN pairs):

1. **Task 1 RED:** `73aad6a` — `test(20-01): RED — bundle-gate regex regression tests for three/addons/*`
2. **Task 1 GREEN:** `8c9849d` — `feat(20-01): widen bundle-gate regex to catch three/addons/* leaks (CRIT-03)`
3. **Task 2 RED:** `4715117` — `test(20-01): RED — z storytelling tests for computeLayout (D-20-CONTEXT-ZMAP)`
4. **Task 2 GREEN:** `4dbbfa2` — `feat(20-01): extend computeLayout with CATEGORY_Z z-coord (D-20-CONTEXT-ZMAP)`

## Files Created/Modified

**Created (1):**
- `src/scripts/check-bundle-gate.test.mjs` — 5 it() blocks asserting widened regex behavior; colocated under `src/` for Vitest default discovery.

**Modified (3):**
- `scripts/check-bundle-gate.mjs` — `THREE_JS_PATTERN` widened + promoted to `export const`. Runtime behavior unchanged for v3.9-shaped chunks (`three/...` matches were never present); new behavior triggers when 20-02a lands OrbitControls.
- `src/game/constellation.layout.js` — `+18 / -2`. CATEGORY_Z block (10 lines including UAT-tunable comment) inserted after `NODE_CLUSTER_RADIUS`; both layout assignment sites extended with `z: CATEGORY_Z[cat] ?? 0`; JSDoc `@returns` updated.
- `src/game/constellation.layout.test.js` — new describe block with 5 it() cases appended after existing `'computeLayout - category clustering'` block.

## Decisions Made

1. **D-20-CONTEXT-ZMAP values locked** at `ai=150, lang=75, arch=0, data=-25, cloud=-75, devops=-100, security=-125, hardware=-150`. Range 300 satisfies CRIT-04 floor (≥100) with margin; bounded within MOD-01 range [-200, 200] with 50-unit safety on each end before `near=10/far=2000` perspective frustum clipping risk.
2. **`?? 0` fallback** kept at both assignment sites rather than throwing on unknown category — defends against future skill-data drift (new category added to `skills.js` without updating CATEGORY_Z) by degrading to a single-plane z=0 for that category, NOT crashing layout.
3. **Test file under `src/scripts/`** instead of top-level `scripts/` — matches Vitest default discovery glob (`src/**/*.test.{js,mjs,ts}`), zero `vite.config.js` change. Warning #5 mitigation.
4. **Named-export the regex constant** rather than mocking the entire module — lets the test directly assert pattern behavior without spinning up the bundle inspection script.

## Deviations from Plan

None. Both tasks executed RED→GREEN per spec. Tests added: 5 + 5 = 10 (target was ≥3+≥3; spec body specified 5 each).

## Issues Encountered

None during execution. Plan spec was unambiguous; both tasks landed in a single RED→GREEN cycle each.

## User Setup Required

None. Zero new dependencies, zero env changes, zero dashboard config.

## Next Phase Readiness

**Ready for Plan 20-02a (WebGL renderer core: PerspectiveCamera + OrbitControls + shader size-attenuation):**

- `pos.z` available on every layout entry — WebGLConstellation BufferAttribute write at line 295 can drop `positions[i*3+2] = 0` in favor of `positions[i*3+2] = layout[id].z ?? 0` (CRIT-04 z=0 trap closed at the source).
- Bundle-gate regex guards the first OrbitControls import — Plan 20-02a's `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'` will be flagged by the gate IF it leaks into the mobile chunk; current build proves the gate exits 0 against a clean (pre-OrbitControls) build.
- SVG path verified visually unchanged at dev-server — D-20-PROPS-CONTRACT enforced at source layer.

**No blockers carry forward.** WebGLConstellation chunk WARN (~117 kB gz) is a pre-existing Phase 17 finding unchanged by this plan; it remains a Phase 20-02b / Phase 21 candidate for revisit (D-17-BUNDLE).

## Self-Check: PASSED

**Files exist:**
- FOUND: `src/scripts/check-bundle-gate.test.mjs`
- FOUND: `scripts/check-bundle-gate.mjs` with named export `THREE_JS_PATTERN`
- FOUND: `src/game/constellation.layout.js` with `const CATEGORY_Z` + `z: CATEGORY_Z[cat] ?? 0` at both sites
- FOUND: `src/game/constellation.layout.test.js` with `'z storytelling'` describe block

**Commits exist (verified via `git log --oneline -4`):**
- FOUND: 73aad6a (Task 1 RED)
- FOUND: 8c9849d (Task 1 GREEN)
- FOUND: 4715117 (Task 2 RED)
- FOUND: 4dbbfa2 (Task 2 GREEN)

**Acceptance criteria (all PASS):**
- `rg "^const CATEGORY_Z" src/game/constellation.layout.js` → 1 hit
- `rg "UAT-tunable" src/game/constellation.layout.js` → 1 hit (Alert A14)
- `rg "CATEGORY_Z\[cat\] \?\? 0" src/game/constellation.layout.js` → 2 hits (both assignment sites)
- `rg "z storytelling" src/game/constellation.layout.test.js` → 1 hit (new describe)
- `rg "^export const THREE_JS_PATTERN" scripts/check-bundle-gate.mjs` → 1 hit
- `npm test` exits 0; 271/271 GREEN (net +10 over 261 baseline)
- `npm run build && node scripts/check-bundle-gate.mjs` exits 0; `GameMode-*.js = 8.92 kB gz` (no regression)

---
*Phase: 20-3d-constellation*
*Completed: 2026-06-09*
