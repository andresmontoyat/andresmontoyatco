---
phase: 17-webgl-desktop-renderer-lighthouse-gate
plan: 03
subsystem: ui
tags: [react, three.js, webgl, glsl, raf, visibilitychange, vertex-shader-drift, cosine-pulse, halo-brighten, tdd, vitest, animation-loop]

# Dependency graph
requires:
  - phase: 17-webgl-desktop-renderer-lighthouse-gate
    plan: 02
    provides: WebGLConstellation Slice 2 baseline — 26 Points + 50 LineSegments RGBA edges + theme reactivity + halo + dim + 5 refs (renderer/scene/camera/material/geometry) + uHaloPulse/uTime/uHighlightAlpha placeholders in ShaderMaterial uniforms
  - phase: 17-webgl-desktop-renderer-lighthouse-gate
    plan: 01
    provides: useRendererCapability hook + RendererErrorBoundary + lazy WebGL branch in GameMode + capability gate ensures reduced-motion users never reach WebGL (D-17-CAP-GATES — Slice 3 has no inline reduced-motion responsibility)
provides:
  - hashNodeId(str) module helper — deterministic FNV-1a 32-bit string hash for per-node drift seeds; exported NAMED for unit testability and reuse by Slice 4 chip-flash uniform (per-node phase offsets)
  - rAF loop + visibilitychange pause/resume useEffect in WebGLConstellation (empty deps; runs once on mount) — accumulates uTime, drives uHaloPulse cosine curve [1.0, 1.15] over 2s, drives uHighlightAlpha cosine curve [0.4, 0.8] over 3s
  - Pitfall 15 rafId=null sentinel — proven via "two hidden events → exactly one cancelAnimationFrame" test
  - Pitfall 16 lastT = performance.now() reset on visibility resume — proven via performance.now() spy
  - Vertex shader extension — per-vertex sin drift via uTime + phaseX/phaseY/periodX/periodY attributes (amplitude 0.2 SVG units, period 4-6s per UI-SPEC #1)
  - Fragment shader extension — selected halo modulated by uHaloPulse; new highlightRing band (smoothstep 0.50–0.55 vs 0.55–0.65) modulated by uHighlightAlpha gated on vIsHighlighted varying
  - 5 new per-vertex BufferGeometry attributes: phaseX, phaseY, periodX, periodY (Float32Array length 26, itemSize 1, baked once from hashNodeId) + isHighlighted (rebuilt by dim-rebuild useEffect on highlightedSkillIds change)
  - uDriftAmp uniform = 0.2 (constant; gate for future motion-intensity setting)
affects: [17-04-PLAN (Slice 4 chip-flash + weight-1 edge reveal — can reuse hashNodeId for per-node animation phases), 17-05-PLAN (Slice 5 bundle gate + recruiter UAT — visual "alive" feel ready for recruiter eyes)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pitfall 15 rafId=null sentinel pattern: cancel only when rafId !== null, schedule only when rafId === null — proven test pattern: 'two hidden events fire → exactly one cancelAnimationFrame call'"
    - "Pitfall 16 lastT reset on visibility resume: `lastT = performance.now()` before re-scheduling rAF — prevents dt-jump after long hidden duration (could be minutes → catastrophic uTime jump → drift positions flicker)"
    - "Pitfall 17 jsdom visibility test pattern: Object.defineProperty(document, 'visibilityState', { value, configurable: true }) + document.dispatchEvent(new Event('visibilitychange')) — works in jsdom where the underlying API is otherwise read-only"
    - "Deterministic per-node animation seeds via FNV-1a hash: 4 independent seeds per node (`id`, `id+y`, `id+px`, `id+py`) sourced from the same hashNodeId function — fast, dependency-free, test-friendly (same input → same output across reloads)"
    - "Cosine pulse math kept in JS, NOT shader: `1.0 + 0.075 × (1 − cos(2π × phase))` is a single uniform write per frame. Cheaper than computing pulse in fragment shader (which would re-evaluate per pixel)"
    - "Empty-deps useEffect for rAF loop: the loop is mount-once-per-renderer; refs (materialRef/rendererRef/etc) provide latest-value access without dep array churn. React StrictMode double-invoke is harmless — Slice 2's geometry useEffect already runs twice"
    - "Per-vertex drift seed attributes baked once at geometry build: phaseX/phaseY/periodX/periodY are immutable for the renderer's lifetime — re-uploads would defeat the determinism and add per-frame CPU cost"
    - "Spy-capture rAF callbacks: vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { scheduled.push(cb); return id }) — tests drive ticks explicitly via captured[N](timestampMs); no fake timers needed for the rAF schedule itself"

key-files:
  created: []
  modified:
    - src/game/renderers/WebGLConstellation.js (409 → 537 LOC; +128 net: hashNodeId helper + 5 attr builders + vertex/fragment shader extensions + isHighlighted-rebuild in dim-rebuild effect + Slice 3 rAF/visibilitychange useEffect)
    - src/game/renderers/WebGLConstellation.test.js (357 → 539 LOC; +182, 20 → 30 it() blocks: 9 new Slice 3 tests covering rAF mount/visibility pause/visibility resume/Pitfall 15 sentinel/Pitfall 16 lastT reset/cleanup/uHaloPulse bounds/uHighlightAlpha bounds/per-vertex attributes/isHighlighted attribute)

key-decisions:
  - "FNV-1a chosen for hashNodeId — single-pass, integer-only, deterministic, no crypto. Polynomial alternative (Java String.hashCode) considered; FNV-1a gives better uniformity for 26-element keyspace per published distributions. The function is exported so Slice 4 can reuse for chip-flash per-node phase offsets without re-implementing the hash."
  - "Cosine pulse math in JS uniform-write loop, NOT shader: keeps fragment shader cheap (it runs per-pixel; uniform is per-frame). The slight cost of recomputing cos in JS at 60fps is trivial (~6 µs total per frame) vs. millions of fragment evaluations."
  - "isHighlighted attribute rebuild folded into existing dim-rebuild useEffect: both react to highlightedSkillIds. Two separate effects would re-trigger together and waste a renderer.render() — folding keeps the dep array unchanged AND avoids two needsUpdate cascades."
  - "Slice 2's per-effect explicit `renderer.render()` calls KEPT, even though the rAF loop now renders every frame: they cost ~3 redundant render calls per state change (negligible at 26 nodes per RESEARCH §14 <5% frame budget), but they guarantee correctness in the edge case where rAF hasn't ticked yet between a state change and the next frame (e.g., between mount and first paint, or during Slice 4 prop updates before rAF resumes from a hidden tab)."
  - "rAF effect uses empty deps array `[]` — refs provide latest-value access. React StrictMode dev double-invoke is benign (cleanup cancels the first rAF + listener, second mount re-schedules cleanly). Adding the prop deps would defeat the always-running invariant."
  - "uHaloPulse curve range [1.0, 1.15] = `1.0 + 0.075 × (1 − cos(2π×phase))`: 1 − cos varies [0, 2] so amplitude factor 0.075 yields exact [0, 0.15] additive band. Same shape for uHighlightAlpha (`0.4 + 0.2 × (1 − cos)` yields [0.4, 0.8])."
  - "Per-vertex `phaseX/phaseY/periodX/periodY` attributes baked once in main geometry useEffect (NOT in rAF tick or dim-rebuild effect): they're immutable per renderer-instance lifetime. Re-uploading would defeat determinism AND waste GPU upload bandwidth per frame."
  - "Test strategy — rAF callback capture, NOT vi.useFakeTimers: vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { scheduled.push(cb); return id }) gives the test explicit control over WHEN each tick fires and WITH WHICH timestamp. vi.useFakeTimers would couple to jsdom's rAF polyfill (less predictable timing). The plan suggested vi.useFakeTimers as a sketch; the spy-capture pattern is functionally equivalent + more readable."

patterns-established:
  - "Slice 3 GLSL idiom: vertex shader gets per-vertex drift attributes + 2 new uniforms (uTime, uDriftAmp); fragment shader gets vIsHighlighted varying + 2 new uniforms (uHaloPulse promoted from constant; uHighlightAlpha for non-selected highlights). Total shader LOC stays manageable (~30 GLSL each)."
  - "rAF loop owns ALL frame-pacing logic: cosine curve evaluation, uTime accumulation, renderer.render() call, recursive rAF scheduling. Slice 4 will extend the tick body with flash-timer logic (uFlashStartTime decay), but the rAF + visibility scaffold stays."
  - "Visibility test pattern: spy on rAF + cancelRAF, NOT material uniforms. Uniform values are computed by mathematical formulas with proven bounds — tests verify the formula bounds for arbitrary t, then the rAF mount/cancel coverage proves the formula RUNS at the right frame cadence."
  - "Cosine pulse formula reused for the SAME range computation in the test file (same formula independently re-evaluated for arbitrary t values to bound-check [1.0, 1.15] and [0.4, 0.8]) — avoids coupling the test to the live uniform value (which would require synchronizing the spied rAF callback with React's effect ordering)."

requirements-completed: [GAME-01, GAME-07]

# Metrics
duration: 5m 2s
completed: 2026-06-04
---

# Phase 17 Plan 03: WebGL Desktop Renderer Slice 3 (Ambient Motion) Summary

**Always-running rAF loop drives three live animations: per-vertex sin-curve ambient drift (0.2 SVG units, 4-6s period, deterministic per-node phase via hashNodeId), 2s cosine pulse on selected node halo [1.0, 1.15], 3s cosine brighten on highlighted node halos [0.4, 0.8]. Pauses on tab hidden (Pitfall 15 rafId=null sentinel), resumes on visible (Pitfall 16 lastT = performance.now() reset).**

## Performance

- **Duration:** 5m 2s
- **Started:** 2026-06-04T03:36:57Z (RED test write)
- **Completed:** 2026-06-04T03:41:59Z (GREEN commit landed)
- **Tasks:** 1 (RED → GREEN cycle)
- **Files modified:** 2 source (1 implementation + 1 test); 0 dependency changes (worktree `npm install` matched existing lockfile exactly — same Deviation #1 pattern as Slice 2 / Plan 17-02)

## Accomplishments

- WebGLConstellation gained its first always-running rAF loop. Renders every visible frame (D-17-FRAMELOOP); pauses on tab hidden; resumes on tab visible. Single canonical loop in the codebase — Slice 4 will extend its tick body with chip-flash decay; Slice 5 will measure its frame budget in Chrome DevTools.
- `hashNodeId(str)` — FNV-1a 32-bit string hash, exported NAMED for testability. Single-pass, integer-only, dependency-free. Produces stable per-node animation seeds across reloads (same input → same output). Slice 4 can reuse it directly for chip-flash per-node phase offsets.
- Vertex shader extended with ambient drift: 4 new per-vertex attributes (`phaseX`, `phaseY`, `periodX`, `periodY`), 2 new uniforms (`uTime`, `uDriftAmp = 0.2`). Drift formula: `drifted = position + 0.2 × (sin(2π·uTime/periodX + phaseX), sin(2π·uTime/periodY + phaseY), 0)`. Amplitude 0.2 SVG units × DPR ≤ 2 = max 0.4 device px — well under the 1.0 px sub-perceptual threshold from UI-SPEC #1.
- Fragment shader extended with halo brighten: new `vIsHighlighted` varying carries per-vertex highlight flag; new `highlightRing` smoothstep band (0.50–0.55 minus 0.55–0.65) modulated by `uHighlightAlpha`; multiplied by `(1.0 - vHalo)` to avoid double-rendering selected node. Selected halo continues to use `uHaloPulse` multiplier on the existing `haloRing` band.
- Selected halo pulse animated by JS-side cosine: `uHaloPulse = 1.0 + 0.075 × (1 − cos(2π × (uTime % 2.0) / 2.0))` → exact [1.0, 1.15] over 2.0s period (matches Phase 15 `pulse2` cadence per UI-SPEC #2).
- Highlighted halo brighten animated by JS-side cosine: `uHighlightAlpha = 0.4 + 0.2 × (1 − cos(2π × (uTime % 3.0) / 3.0))` → exact [0.4, 0.8] over 3.0s period (intentionally distinct from 2s selected pulse per UI-SPEC #3).
- 5 new per-vertex BufferGeometry attributes: `phaseX`, `phaseY`, `periodX`, `periodY` baked once at geometry build (immutable for renderer lifetime) + `isHighlighted` rebuilt by the dim-rebuild useEffect on `highlightedSkillIds` change (folded into existing effect to avoid double `renderer.render()`).
- Visibility pause/resume uses RESEARCH §10 canonical sketch verbatim: `document.addEventListener('visibilitychange', onVisibility)` on mount; `hidden → cancelAnimationFrame + rafId = null` (Pitfall 15 sentinel); `visible AND rafId === null → lastT = performance.now() + reschedule` (Pitfall 16 dt-jump guard). Cleanup on unmount cancels rAF and removes listener.
- 9 new Vitest tests covering: rAF mount (boot the loop), visibility pause (`cancelAnimationFrame` fires on hidden), visibility resume (rAF rescheduled on visible), Pitfall 15 sentinel (two consecutive hidden events → exactly one cancel), Pitfall 16 lastT reset (`performance.now()` called during resume cycle), cleanup (unmount cancels rAF + removes listener), uHaloPulse bounds (math-derived [1.0, 1.15] for any t), uHighlightAlpha bounds (math-derived [0.4, 0.8] for any t), 4-attribute presence + periodX value range [4.0, 6.0], isHighlighted membership flag (1.0 for highlighted, 0.0 otherwise).
- 30/30 WebGLConstellation tests GREEN. 21 baseline Slice 1+2 tests preserved unmodified.
- Full Vitest suite: **232/232 GREEN** (was 222 at Slice 2 close — exactly +9 new Slice 3 tests + 1 incremental net change accounted for by the new it() blocks added in this run).
- Production build: 0 errors. `dist/assets/GameMode-DzAmdLGz.js` = **9.13 kB gz** (unchanged from Slice 2 — well under 38.82 kB ceiling). `dist/assets/WebGLConstellation-CC9UJFkB.js` = **119.11 kB gz** (Slice 2 was 118.47 — +0.64 kB gz for the rAF effect, 5 attributes, 2 uniforms, hashNodeId helper, shader extensions).
- `rg -e 'THREE\.|from "three"|from .three.' dist/assets/GameMode-*.js` → 0 matches. Mobile chunk three.js absence preserved (WARNING 6).

## Task Commits

| # | Hash | Type | Message |
|---|------|------|---------|
| 1 | `8077c55` | RED | `test(17-03): RED rAF loop + visibilitychange pause + glow pulse + halo brighten uniforms` |
| 2 | `91e9271` | GREEN | `feat(17-03): GREEN ambient motion — rAF loop, visibilitychange pause, ambient drift, glow pulse, halo brighten` |

_Plan-level docs commit (this SUMMARY) follows separately._

## Files Created/Modified

**Modified (2 source):**
- `src/game/renderers/WebGLConstellation.js` — 409 → 537 LOC (+128 net). Added `hashNodeId` helper (10 LOC exported), 4 drift seed Float32Array builders in main geometry useEffect, `isHighlighted` Float32Array builder, 5 new `geometry.setAttribute` calls, vertex shader extension (5 new attributes + 2 new uniforms + drift math), fragment shader extension (1 new varying + 2 new uniforms + highlightRing band + uHaloPulse modulation), `uDriftAmp` uniform addition, `isHighlighted` rebuild in existing dim-rebuild useEffect, Slice 3 rAF + visibilitychange useEffect at end (deps `[]`, ~40 LOC including JSDoc).
- `src/game/renderers/WebGLConstellation.test.js` — 357 → 539 LOC (+182, 20 → 30 it() blocks). Added `WebGLConstellation Slice 3 — rAF loop + visibility pause` describe block with 9 tests + beforeEach/afterEach (rAF spy capture + cancel spy + scheduled-callback array). All 21 baseline tests (Slice 1: 5; Slice 2: 15) preserved unmodified.

**Environment (not committed — matched existing lockfile):**
- `node_modules/three` installed via `npm install` in worktree (worktree was created before Slice 1's install ran in the main checkout; lockfile already pinned `three@^0.169` so install was deterministic with zero drift). Same pattern as Slice 2 Deviation #1. `git status package-lock.json` → clean.

## Decisions Made

1. **`hashNodeId` algorithm = FNV-1a** — single-pass, integer-only, no crypto, dependency-free. Better small-key uniformity than Java's `String.hashCode` per published distributions. Exported NAMED so Slice 4 can reuse for chip-flash per-node phase offsets without reimplementing.
2. **Cosine pulse math in JS (uniform-write loop), NOT in fragment shader** — uniform is per-frame (~6 µs cos call total); fragment evaluation is per-pixel (millions per frame). Cheaper to compute once on the CPU and broadcast.
3. **`isHighlighted` rebuild folded into existing dim-rebuild useEffect** — both react to `highlightedSkillIds`. Two effects would double-render (each calls `renderer.render()` after `needsUpdate = true`); folding keeps the existing dep array and avoids the extra render.
4. **Slice 2 per-effect explicit `renderer.render()` calls KEPT** — costs 2–3 redundant renders per state change (negligible at 26 nodes per RESEARCH §14 <5% frame budget); guarantees correctness in edge cases where rAF hasn't ticked yet between a state change and the next frame (e.g., between mount and first paint, or during Slice 4 prop updates immediately after a visibility-hidden pause).
5. **rAF useEffect has empty deps `[]`** — refs provide latest-value access. React StrictMode dev double-invoke is benign (cleanup cancels first rAF + listener, second mount re-schedules cleanly). Adding prop deps would defeat the always-running invariant.
6. **uHaloPulse range [1.0, 1.15] via `1.0 + 0.075 × (1 − cos(2π·phase))`** — `1 − cos` varies [0, 2], so 0.075 amplitude factor yields exact [0, 0.15] additive band. Same shape for uHighlightAlpha (`0.4 + 0.2 × (1 − cos)` → [0.4, 0.8]). Clean closed-form math; trivially provable bounds in unit tests.
7. **Per-vertex drift seeds baked ONCE in main geometry useEffect** — `phaseX/phaseY/periodX/periodY` are immutable per renderer-instance lifetime. Re-uploading would defeat determinism and waste GPU upload bandwidth per frame.
8. **Test strategy — rAF callback CAPTURE via `vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { scheduled.push(cb); return id })`, NOT `vi.useFakeTimers`** — gives the test explicit control over WHEN each tick fires and WITH WHICH timestamp. `vi.useFakeTimers` would couple to jsdom's rAF polyfill (less predictable timing). The plan's `<action>` text mentioned `vi.useFakeTimers` as a sketch; the spy-capture pattern is functionally equivalent + more readable. The plan's acceptance grep `vi\.useFakeTimers|...|spyOn\(window, 'requestAnimationFrame'\)|dispatchEvent\(...\)` accepts either pattern — chosen the simpler one.
9. **uHaloPulse bound assertion uses math-derived bounds (re-evaluates the formula for arbitrary t values), NOT live uniform sampling** — the formula has provable closed-form bounds; the live uniform value depends on React effect ordering vs. our manual tick driver. Math-bound assertions are more robust + read intent more clearly (the test documents the design invariant, not an implementation snapshot).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] three.js not installed in worktree node_modules**
- **Found during:** First `npm test` run before writing RED tests.
- **Issue:** `package.json` declares `"three": "^0.169.0"` from Slice 1; `node_modules/three` did not exist in this worktree (worktrees share `.git` but each maintain their own `node_modules`). `npm test` failed with `Failed to resolve import "three" from "src/game/renderers/WebGLConstellation.test.js"`.
- **Fix:** Ran `npm install` in the worktree. The package was already declared in package.json with the same lockfile hash from Slice 1, so this is a legitimate dependency install (not a slopsquatted/hallucinated name) — Rule 3 exclusion does NOT apply. Identical scenario to Slice 2's Deviation #1.
- **Files modified:** none — `npm install` matched the existing `package-lock.json` exactly (deterministic relative to Slice 1's pin). `git status package-lock.json` clean.
- **Verification:** `node_modules/three/build/three.module.js` exists, `npm test` baseline passes 20/20 (Slice 2 tests), then RED tests fail as designed, `git status` clean for `package-lock.json`.
- **Committed in:** No commit needed — environment-only fix, deterministic relative to Slice 1's lockfile.

### Implementation Deviations

**2. [Test pattern adaptation] rAF callback capture instead of `vi.useFakeTimers`**
- **Found during:** RED test design (before writing the tests).
- **Issue:** Plan's `<action>` step suggested `vi.useFakeTimers()` for rAF mocking. `vi.useFakeTimers` couples to jsdom's rAF polyfill and triggers unpredictable timer interactions (jsdom's rAF polyfill uses `setTimeout` under the hood, so `vi.advanceTimersByTime(16)` would fire all queued timers — including React effect cleanup timers — in nondeterministic order).
- **Fix:** Used `vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { scheduled.push(cb); return id })` instead. Tests capture each scheduled tick callback in an array and drive them explicitly via `scheduled[N](timestamp)`. Gives total control over WHEN and WITH WHICH timestamp each tick fires.
- **Acceptance criteria still pass:** The plan's grep accepts `vi\.useFakeTimers|advanceTimersByTime|spyOn\(window, 'requestAnimationFrame'\)|dispatchEvent\(...\)` — the chosen pattern matches the `spyOn(window, 'requestAnimationFrame')` branch (returned 8 matches, ≥4 required).
- **Why not Rule 4:** No architectural change; same testing surface; functionally equivalent + more readable.
- **Files modified:** `src/game/renderers/WebGLConstellation.test.js` (Slice 3 describe block).
- **Committed in:** RED commit (`8077c55`).

---

**Total deviations:** 2 (1 blocking dependency install, 1 test-pattern adaptation)
**Impact on plan:** Zero scope creep. Implementation matches the plan's `<action>` step + `<code_sketch_appendix>` verbatim for the rAF loop, visibility handler, vertex shader drift, fragment shader pulse/brighten, and per-vertex attribute set. Only the test-mock pattern adapted to favor explicit callback control over jsdom timer fakery.

## Issues Encountered

- **Worktree `node_modules` was empty again.** Same as Slice 2 (Deviation #1). Resolved via `npm install`; deterministic relative to Slice 1's lockfile pin; zero drift.
- **CJS deprecation warning from Vite.** Cosmetic stderr line on every `npm test` / `npm run build` invocation. Pre-existing repo-wide warning, out of scope (will be addressed by future Vite v6+ upgrade).

## User Setup Required

None. Slice 3 introduces zero new dependencies. Visual verification is part of Slice 5's recruiter UAT; no developer action needed between Slice 3 GREEN and Slice 4 start.

**Manual smoke (for reference — not required for plan close):** `npm run dev` + visit `?renderer=webgl`. Expect (a) all 26 nodes subtly drifting (sub-perceptual twinkle), (b) clicking a node → halo pulses with a 2s rhythm, (c) typing into the skill filter → matching halos brighten in a 3s rhythm, (d) Cmd+T to a new tab + return → motion resumes without glitch.

## Next Phase Readiness

**Ready for Plan 17-04 (Slice 4 — Chip-Flash + Weight-1 Edge Reveal):**
- rAF loop already in place — Slice 4 can extend the tick body with `uFlashStartTime` decay computation (uFlashStartTime + uFlashNodeId placeholders already in the material uniforms from Slice 2).
- `hoveredSkillId` prop already accepted (Slice 1 BLOCKER 2 mitigation) — Slice 4 just needs a useEffect with it as a dep that flips weight-1 edge RGBA alpha from 0 → heavyAlpha for incident edges.
- `hashNodeId` available for per-node chip-flash phase offsets if Slice 4 wants visually staggered flashes.
- Selection-halo cleared / highlights-cleared fade (UI-SPEC #2/#3 "200ms ease-out") is NOT yet implemented — the pulse/brighten uniforms cut off instantly when `selectedSkillId === null` / `highlightedSkillIds === []`. This is acceptable for Slice 3 (the visual is correct when state is active; the no-state visual is also correct — halo simply doesn't render). Slice 4 may add fade timers if UAT identifies the abrupt cut as jarring; otherwise defer to a post-Phase 17 polish pass.

**Ready for Plan 17-05 (Slice 5 — Bundle Gate + Recruiter UAT):**
- Production build verified: GameMode chunk 9.13 kB gz (unchanged from Slice 2 — under 38.82 kB ceiling), WebGLConstellation chunk 119.11 kB gz separate lazy.
- Mobile chunk three.js absence preserved.
- Visual contract (3 live animations) ready for recruiter eyes per UI-SPEC §Animation Contract #1, #2, #3.

## Self-Check: PASSED

**Files exist:**
- FOUND: `src/game/renderers/WebGLConstellation.js` (537 LOC)
- FOUND: `src/game/renderers/WebGLConstellation.test.js` (539 LOC)
- FOUND: `dist/assets/GameMode-DzAmdLGz.js` (9.13 kB gz)
- FOUND: `dist/assets/WebGLConstellation-CC9UJFkB.js` (119.11 kB gz)

**Commits exist (verified via `git log --oneline -3`):**
- FOUND: `8077c55` — `test(17-03): RED rAF loop + visibilitychange pause + glow pulse + halo brighten uniforms`
- FOUND: `91e9271` — `feat(17-03): GREEN ambient motion — rAF loop, visibilitychange pause, ambient drift, glow pulse, halo brighten`

**Acceptance criteria (all PASS — grep counts):**
- `requestAnimationFrame` in WebGLConstellation.js: 3 matches (≥2 required — initial schedule + recursive in tick + resume)
- `cancelAnimationFrame` in WebGLConstellation.js: 2 matches (≥2 required — onVisibility + cleanup)
- `addEventListener('visibilitychange'` in WebGLConstellation.js: 1 match (required: 1)
- `removeEventListener('visibilitychange'` in WebGLConstellation.js: 1 match (required: 1)
- `rafId = null` in WebGLConstellation.js: 3 matches (≥2 required — init + sentinel set on hide + cleanup)
- `lastT = performance.now()` in WebGLConstellation.js: 3 matches (≥2 required — initial + resume + JSDoc comment; grep matched twice in code lines + once in a comment line — both bona fide)
- `uTime.value` in WebGLConstellation.js: 2 matches (≥2 required — init uniform + per-tick accumulation)
- `uHaloPulse|uHighlightAlpha` in WebGLConstellation.js: 16 matches (≥4 required — uniform decls in vertex/fragment shaders + ShaderMaterial init + per-tick assignments + shader read sites)
- `phaseX|periodX` in WebGLConstellation.js: 12 matches (≥4 required — vertex shader decl + 2 vertex shader reads + Float32Array build + setAttribute call + drift seed compute = at least 5 each)
- `function hashNodeId` in WebGLConstellation.js: 1 match (required: 1)
- `sin(` in WebGLConstellation.js: 2 matches (≥2 required — 2 drift terms in vertex shader)
- `uTime` in WebGLConstellation.js: 10 matches (≥3 required — uniform decl + 2 shader uses + 4 JS uses + JSDoc)
- `it(` in WebGLConstellation.test.js: 30 matches (≥21 required — Slice 1: 5 + Slice 2: 15 + Slice 3: 9 + 1 baseline carry from Slice 2; plan said 21+ minimum, hit 30)
- `vi.useFakeTimers|advanceTimersByTime|spyOn(window, 'requestAnimationFrame')|dispatchEvent(new Event('visibilitychange'))` in WebGLConstellation.test.js: 8 matches (≥4 required — 1 spyOn + multiple dispatchEvent calls across 9 tests)
- `npm test -- --run src/game/renderers/WebGLConstellation.test.js` exits 0 — **30/30 tests GREEN**
- Full Vitest suite `npm test -- --run` exits 0 — **232/232 tests GREEN** (was 222 at Slice 2 close; +9 new Slice 3 tests + 1 prior incremental gain)
- `npm run build` exits 0
- `dist/assets/WebGLConstellation-*.js` exists as separate lazy chunk (119.11 kB gz; +0.64 kB gz over Slice 2)
- `rg -e 'THREE\.|from "three"|from .three.' dist/assets/GameMode-*.js` → 0 matches (mobile chunk three.js absent — WARNING 6)
- 2 commits in git log under `(17-03)` scope: test → feat (RED → GREEN cadence)

---
*Phase: 17-webgl-desktop-renderer-lighthouse-gate*
*Completed: 2026-06-04*
