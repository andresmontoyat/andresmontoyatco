---
phase: 20-3d-constellation
plan: 02a
subsystem: renderer
tags: [webgl, three.js, perspective-camera, orbit-controls, shader, size-attenuation, edge-falloff, context-loss, resize-observer, vitest, tdd]

# Dependency graph
requires:
  - phase: 20-3d-constellation
    plan: 01
    provides: CATEGORY_Z + computeLayout {x,y,z} + widened bundle-gate THREE_JS_PATTERN
  - phase: 17-webgl-desktop-renderer-lighthouse-gate
    provides: WebGLConstellation lazy chunk + useRendererCapability + RendererErrorBoundary + single rAF loop (D-17-FRAMELOOP)
provides:
  - PerspectiveCamera(fov=55, aspect, near=10, far=2000) at tilted ~15° azimuth / ~10° polar (D-20-CONTEXT-INITIAL-ANGLE) replacing OrthographicCamera
  - OrbitControls (three/addons) with damping/clamp/autoRotate; first-drag permanent autoRotate dismiss (D-20-CONTEXT-AUTOROTATE-RESUME)
  - VERTEX_SHADER size-attenuation via perspectiveScale / -mvPosition.z + clamp [1, 64] (CRIT-05)
  - Custom edge ShaderMaterial with per-vertex viewDir.z falloff (MOD-04 Option A) + depthWrite=false (MOD-02)
  - Vector3.project(camera) + depth-scaled radius pointer-pick (MOD-08)
  - webglcontextlost handler → GameMode forceSvgFallback state → silent SVG swap (D-20-CONTEXT-LOSS)
  - ResizeObserver wiring keeps PerspectiveCamera.aspect + uCanvasHeight uniform synced
  - Canvas touch-action: none (MIN-03) + cursor grab/grabbing/pointer states
  - onFirstDrag callback writes cam-3d-hint-seen (defensive for Plan 20-02b hint suppression)
affects: [20-02b-PLAN (consumes effectiveCapability gate + cam-3d-hint-seen flag), 20-03-PLAN (useClickVsDrag hook layers in front of pointer-pick + UAT bundles)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PerspectiveCamera matrices forced via updateMatrixWorld(true) + updateProjectionMatrix() before first paint — required because Vector3.project(camera) in pointer-pick runs BEFORE the renderer's first render call would auto-sync matrices"
    - "OrbitControls 'start' listener: sets controls.autoRotate=false, dragHappenedRef.current=true, fires props.onFirstDrag (permanent dismiss; reload restores)"
    - "Hover/select autoRotate pause gated by dragHappenedRef so first-drag dismiss is truly permanent for the session"
    - "Edge ShaderMaterial: attribute vec4 color; → varying vec4 vColor; + varying vec3 vViewPosition; fragment computes fade = clamp(1.2 - abs(normalize(vViewPosition).z), 0.0, 1.0); preserves weight-1/weight-2 alpha (vColor.a) multiplied by view-angle fade"
    - "Test-fixture skill-0 anchored at world (0,0,0) — projects to canvas-center under PerspectiveCamera looking at origin; click at canvas-center reliably hits skill-0 for pick callback tests"
    - "Bundle-gate first real OrbitControls import in production code — Plan 20-01 widened regex defends the supply-chain invariant; build artifact verified clean post-commit"

key-files:
  modified:
    - src/game/renderers/WebGLConstellation.js (+221 / -22 — see commit f82aaab diff)
    - src/game/renderers/WebGLConstellation.test.js (FIXTURE_LAYOUT skill-0 → world origin; 2 pick tests updated to canvas-center coords)
    - src/game/GameMode.js (forceSvgFallback useState + effectiveCapability + onFirstDrag/onContextLost callbacks)

key-decisions:
  - "D-20-VISUAL-3D LOCKED — PerspectiveCamera supersedes Phase 17's OrthographicCamera (D-17-VISUAL flat 2D-in-3D ortho). fov=55 per research SUMMARY.md §Conflicts; initial angles UAT-tunable ±5° within polar clamp"
  - "D-20-CONTEXT-INITIAL-ANGLE LOCKED — camera spawns at ~15° azimuth / ~10° polar so 3D depth is obvious frame 0 without requiring drag"
  - "D-20-CONTEXT-AUTOROTATE-RESUME LOCKED — first drag permanently disables autoRotate for the page session; no idle-timeout re-resume; reload restores"
  - "D-20-CONTEXT-LOSS LOCKED — silent SVG swap via GameMode forceSvgFallback useState; no error banner, no aria-live shout (preserves UI-SPEC §ErrorBoundary Visual Continuity)"
  - "OnboardingHint + i18n keys DEFERRED to Plan 20-02b per planner Blocker #2 (~50% context budget per plan). Renderer-slot scaffolding (forceSvgFallback + cam-3d-hint-seen flag write) lives in 20-02a so the 20-02b pill conditional has its gate ready"
  - "Edge material migrated LineBasicMaterial → custom ShaderMaterial — required for MOD-04 Option A per-vertex view-angle alpha falloff. Line2/LineGeometry REJECTED per PITFALLS MOD-04 (~10 kB gz over budget)"
  - "PerspectiveCamera matrix sync inside the same useEffect via updateMatrixWorld(true) + updateProjectionMatrix() — pointer-pick uses Vector3.project before the first renderer.render() auto-syncs matrices, so explicit sync is required"

patterns-established:
  - "Pattern: WebGL renderer ResizeObserver — camera.aspect + uniforms.uCanvasHeight.value resync on canvas DOM box change; disconnect in cleanup before dispose"
  - "Pattern: cursor state machine — isDragging flag in pointermove handler closure switches between grab/grabbing/pointer based on hover match + drag state"
  - "Pattern: forceSvgFallback as renderer-slot guard — GameMode owns the boolean; child renderer fires onContextLost; parent re-renders to swap component"
  - "Pattern: dragHappenedRef permanent latch — gates hover/select autoRotate re-enable so first-drag dismiss is truly final until reload"

requirements-completed: [] # DEPTH-01 partial — renderer core only; Plan 20-02b adds hint, Plan 20-03 closes UAT

# Metrics
completed: 2026-06-09
---

# Phase 20 Plan 02a: WebGL Renderer Core (PerspectiveCamera + OrbitControls + Shader + Context-Loss) Summary

**Landed genuine 3D depth on capable desktops — PerspectiveCamera replaces OrthographicCamera at tilted initial angle, OrbitControls drag-to-rotate with damping + polar clamp + first-drag permanent autoRotate dismiss, VERTEX_SHADER perspective size-attenuation (CRIT-05), custom edge ShaderMaterial per-vertex view-angle alpha falloff (MOD-04 Option A), Vector3.project pointer-pick (MOD-08), webglcontextlost silent SVG swap (D-20-CONTEXT-LOSS). Mobile SVG path UNCHANGED. RM users continue on SVG.**

## Accomplishments

- **Imports & refs (Phase A-B).** Replaced `OrthographicCamera` import with `PerspectiveCamera` + `Vector3`; added `OrbitControls` from `three/addons/controls/OrbitControls.js`. Added `controlsRef` + `dragHappenedRef` useRefs at function-top.
- **PerspectiveCamera + OrbitControls (Phase C).** `PerspectiveCamera(55, aspect, 10, 2000)` at ORBIT_RADIUS=500, position `(sin15°*500, sin10°*500, cos15°*500)`, lookAt(0,0,0), `updateMatrixWorld(true)` + `updateProjectionMatrix()` so pointer-pick `Vector3.project(camera)` works before the first paint. OrbitControls instantiated with the LOCKED config: `enableDamping=true`, `dampingFactor=0.06`, `rotateSpeed=0.6`, `enableZoom=false`, `enablePan=false`, `enableKeys=false`, polar clamp `[π·0.15, π·0.85]`, `autoRotateSpeed=0.5`, `target.set(0,0,0)`. Defensive `prefersRM` gate: `controls.autoRotate = !prefersRM`. `'start'` listener sets `controls.autoRotate=false`, `dragHappenedRef.current=true`, fires `props.onFirstDrag?.()` (D-20-CONTEXT-AUTOROTATE-RESUME — permanent for the session).
- **Z write-through (Phase D / CRIT-04).** `positions[i*3+2] = pos.z ?? 0` at both node assignment site and edge endpoint sites. Closes the z=0 trap at the source — Plan 20-01's CATEGORY_Z output now reaches the GPU.
- **VERTEX_SHADER size-attenuation (Phase E / CRIT-05).** Added `uniform float uCanvasHeight;` + `uniform float uFovRad;`. Computed `mvPosition = modelViewMatrix * vec4(drifted, 1.0)` once; replaced `gl_PointSize` formula with `clamp(size * uDpr * (1.0 + (uHaloPulse - 1.0) * halo) * flashScale * (perspectiveScale / max(-mvPosition.z, 0.001)), 1.0, 64.0)` where `perspectiveScale = uCanvasHeight / (2.0 * tan(uFovRad / 2.0))`. `gl_Position = projectionMatrix * mvPosition;` reuses the single matrix multiply.
- **Edge alpha falloff (Phase F / MOD-04 Option A).** Migrated edge material `LineBasicMaterial → ShaderMaterial`. New `EDGE_VERTEX_SHADER` passes `vViewPosition` varying; new `EDGE_FRAGMENT_SHADER` computes `fade = clamp(1.2 - abs(normalize(vViewPosition).z), 0.0, 1.0)` and multiplies `vColor.a * fade`. `depthWrite: false` on the material (MOD-02 z-fighting mitigation).
- **Pointer-pick rewrite (Phase G / MOD-08).** Replaced 2D ortho `(pos.x/1000)*rect.width` math with `Vector3.set(pos.x, pos.y, pos.z??0).project(camera)`. Screen mapping: `projX = (v.x*0.5 + 0.5) * rect.width`, `projY = (-v.y*0.5 + 0.5) * rect.height`. `depthScale = max(0.4, 1.0 - v.z * 0.3)` keeps far-clipped nodes pickable.
- **ResizeObserver (Phase H).** New `ResizeObserver` inside scene-setup useEffect resyncs `camera.aspect`, `camera.updateProjectionMatrix()`, and `material.uniforms.uCanvasHeight.value` on canvas DOM box change.
- **Single rAF preservation (Phase I / CRIT-01).** `controlsRef.current.update()` is the FIRST line of the existing `tick(t)` function — preserves D-17-FRAMELOOP single rAF; no `'change'` listener anywhere.
- **Hover/select autoRotate pause (Phase J / MIN-01).** New useEffect with `[hoveredSkillId, selectedSkillId]` deps; if `dragHappenedRef.current` true → no-op (permanent dismiss); else `c.autoRotate = !prefersRM && hoveredSkillId == null && selectedSkillId == null`.
- **Context-loss handlers (Phase K / D-20-CONTEXT-LOSS).** `onContextLost` calls `e.preventDefault()` then `onContextLostProp?.()` → GameMode flips `forceSvgFallback=true`. `onContextRestored` is a defensive no-op (stay on SVG once swapped — MOD-06).
- **Cleanup discipline (Phase L / MOD-05).** `controlsRef.current.dispose()` FIRST, removes `'start'` + webglcontextlost/restored listeners, disconnects ResizeObserver, THEN disposes geometry/material/edgeGeometry/edgeMaterial/renderer.
- **Canvas CSS (Phase M / MIN-03).** Tailwind `touch-none` utility added to `className` (yields `touch-action: none`). Cursor states `grab` idle / `grabbing` during drag / `pointer` on hovered node driven by `canvas.style.cursor` mutations inside pointermove/down/up handlers.
- **GameMode scaffolding (Phase N).** Added `const [forceSvgFallback, setForceSvgFallback] = useState(false)` + `const effectiveCapability = forceSvgFallback ? 'svg' : capability`. Renderer-slot conditional now reads `effectiveCapability`. `onFirstDrag` callback writes `cam-3d-hint-seen='true'` via try/catch-guarded localStorage (defensive for Plan 20-02b hint suppression). `onContextLost` callback flips `forceSvgFallback`. **NO** `OnboardingHint` import, **NO** `t.game.hint.drag` keys — boundary integrity preserved for 20-02b.
- **Test-fixture adjustment.** `FIXTURE_LAYOUT[skill-0] = (0, 0, 0)` so it projects to canvas-center under the PerspectiveCamera looking at world origin. Updated the 2 pointer-pick tests (`pointermove over a node` and `click over a node`) to use `clientX=500, clientY=500` (canvas center on the 1000×1000 mocked rect).

## Verification

- **Tests:** `npm test` → **271/271 GREEN** (same as Plan 20-01 baseline; no new tests added — visual checkpoint validates renderer behavior).
- **Build:** `npm run build` exits 0.
- **Bundle-gate:** `node scripts/check-bundle-gate.mjs` exits 0:
  - Mobile chunk `GameMode-K1OKYIFq.js` = **9.01 kB gz** (PASS; under 38.82 kB HARD ceiling; +0.09 kB over Plan 20-01 baseline due to GameMode `useState` + `useCallback` additions).
  - WebGL chunk `WebGLConstellation-CQxoJf1J.js` = **122.33 kB gz** (WARN; ~+5 kB over Plan 20-01 baseline — matches plan's predicted ~6 kB OrbitControls cost; Plan 20-03 lands the 3-tier bundle-gate WARN-ladder verdict).
  - Mobile chunk contains **NO** `three/...` import string — Plan 20-01 widened regex defends the supply-chain invariant against the first real OrbitControls import in production.
- **Grep matrix (Plan 20-02a acceptance criteria):** all clean.
  - `PerspectiveCamera` → 4 hits (import + instantiation + 2 comments)
  - `OrthographicCamera` → 0 hits (replaced)
  - `from 'three/addons/controls/OrbitControls'` → 1 hit
  - `controls.addEventListener('change'` (with `rg -v '^#'` filter) → 0 hits (CRIT-01 guard)
  - `positions[i*3+2] = 0` → 0 hits; `positions[i*3+2] = pos.z` → 1 hit (Alert A2 / CRIT-04 mitigation)
  - `uCanvasHeight` → 5 hits (shader decl + uniforms init + ResizeObserver update + comments)
  - `uFovRad` → 3 hits
  - `Vector3` → 3 hits (import + 2 usages); `.project(camera)` → 3 hits
  - `controls.dispose()` → 1 hit (Alert A4 / MOD-05)
  - `webglcontextlost` → 2 hits (addEventListener + removeEventListener)
  - `preventDefault` → 2 hits
  - `enableKeys = false` / `enableZoom = false` / `enablePan = false` → 1 hit each
  - `touch-none` (Tailwind utility for `touch-action: none`) → 1 hit (MIN-03)
  - `aria-hidden="true"` + `tabIndex={-1}` preserved (MIN-04/05)
  - `forceSvgFallback` in GameMode → 2 hits; `onFirstDrag` → 2 hits; `onContextLost` → 3 hits; `cam-3d-hint-seen` → 2 hits
  - `OnboardingHint` in GameMode → 0 hits (DEFERRED to 20-02b)

## Task Commit

Single atomic commit per plan acceptance criteria:

1. **Task 1 (Phases A-N):** `f82aaab` — `feat(20-02a): genuine 3D renderer — PerspectiveCamera + OrbitControls + shader size-attenuation + context-loss handlers + GameMode forceSvgFallback (D-20-VISUAL-3D, Alerts A2..A12)`

## Files Modified

- `src/game/renderers/WebGLConstellation.js` (+221 / -22)
  - Imports: `OrthographicCamera` → `PerspectiveCamera`; added `Vector3`; added `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'`.
  - Function-top: `controlsRef` + `dragHappenedRef` useRefs.
  - VERTEX_SHADER: added `uCanvasHeight` + `uFovRad` uniforms; mvPosition once; `gl_PointSize` clamped [1, 64] with perspective size-attenuation.
  - NEW edge shader pair: `EDGE_VERTEX_SHADER` + `EDGE_FRAGMENT_SHADER` (custom ShaderMaterial replaces LineBasicMaterial).
  - Props destructure adds `onFirstDrag`, `onContextLost: onContextLostProp`.
  - Scene-setup useEffect: PerspectiveCamera + matrix sync + OrbitControls + 'start' listener + context-loss listeners + ResizeObserver + cursor='grab' default + new uniforms in material init.
  - Edge geometry: z write-through via `src.z ?? 0` / `tgt.z ?? 0`; edge material is ShaderMaterial with depthWrite=false.
  - Pointer-pick: `Vector3.project(camera)` + depth-scaled radius.
  - Hover/select autoRotate useEffect (gated by dragHappenedRef + prefersRM).
  - tick(): `controls.update()` is FIRST line.
  - Cleanup: controls FIRST, then listeners, ResizeObserver, GPU resources.
- `src/game/renderers/WebGLConstellation.test.js` (+10 / -7)
  - `FIXTURE_LAYOUT[skill-0] = (0, 0, 0)` with z added to all entries.
  - 2 pointer-pick tests updated to `clientX=500, clientY=500` (canvas-center under perspective projection).
- `src/game/GameMode.js` (+27 / -3)
  - Imports `useState`, `useCallback` added to React import.
  - `forceSvgFallback` useState + `effectiveCapability` ternary; renderer-slot conditional and FpsCounter dev-only gate consume `effectiveCapability`.
  - `onFirstDrag` (writes cam-3d-hint-seen via try/catch) + `onContextLost` (setForceSvgFallback) callbacks via `useCallback`.
  - WebGLConstellation JSX passes `onFirstDrag` + `onContextLost` props.

## Decisions Made

1. **PerspectiveCamera matrix sync up-front.** Vector3.project(camera) in pointer-pick runs before the renderer's first auto-render would sync matrices. Calling `camera.updateMatrixWorld(true)` + `camera.updateProjectionMatrix()` explicitly right after `lookAt(0,0,0)` ensures matrixWorldInverse + projectionMatrix are valid for pick math before first paint. Also necessary for the test environment where renderer.render is mocked.
2. **Edge material migration LineBasicMaterial → ShaderMaterial.** Required for MOD-04 Option A (per-vertex view-angle alpha falloff). The custom shader pair adds ~30 lines but stays inside the same useEffect; bundle impact negligible vs Line2/LineGeometry alternative (~10 kB gz over budget — rejected per PITFALLS MOD-04 Option B).
3. **dragHappenedRef as permanent latch.** Hover/select autoRotate pause useEffect short-circuits if `dragHappenedRef.current` is true so the first-drag dismiss can never be un-paused mid-session. Reload is the only way to restore autoRotate.
4. **Test fixture skill-0 at world origin.** Cleanest deterministic projection target — the camera looks at (0,0,0), so any point at world origin projects to NDC (0,0) → canvas center. Two pointer-pick tests adapted to canvas-center coords.
5. **OnboardingHint + i18n keys hard-deferred.** Boundary integrity for Plan 20-02b — the renderer-slot already exposes `effectiveCapability` and writes `cam-3d-hint-seen`, so 20-02b inherits a clean gate. The forbidden-grep regression catches premature integration.
6. **Initial canvas dimension fallback (800×600).** When `canvas.clientWidth` / `clientHeight` are 0 (jsdom / pre-layout SSR), aspect falls back to `800 / 600`. ResizeObserver resyncs on first paint. Without the fallback, `aspect = 0/1 = 0` would produce a broken projection matrix.

## Deviations from Plan

### Auto-fixed during execution

**1. Initial canvas dimensions are 0 in test environment**
- **Found during:** First test run after Phase C landed.
- **Issue:** `canvas.clientWidth / Math.max(canvas.clientHeight, 1)` returned 0/1 = 0 under jsdom (no CSS layout). PerspectiveCamera with aspect=0 yields a degenerate projection matrix — Vector3.project(camera) returned NaN.
- **Fix:** Added `const initW = canvas.clientWidth || 800; const initH = Math.max(canvas.clientHeight || 600, 1); const aspect = initW / initH`. ResizeObserver resyncs on first real layout.
- **Verification:** All 41 WebGLConstellation tests pass.

**2. PerspectiveCamera matrixWorldInverse uninitialized until first render**
- **Found during:** Pointer-pick tests `pointermove over a node` + `click over a node` failed — `expect(onHoverSkill).toHaveBeenCalledWith('skill-0')` got `null`.
- **Issue:** Vector3.project(camera) reads `camera.matrixWorldInverse` + `camera.projectionMatrix`. Three.js auto-syncs both during `renderer.render(scene, camera)`. The test mock makes renderer.render a no-op, so the matrices stayed identity → projected (0,0,0) → degenerate NDC → no node hit.
- **Fix:** Added `camera.updateMatrixWorld(true)` + `camera.updateProjectionMatrix()` immediately after `camera.lookAt(0,0,0)`. Also required for any production pick that fires before the first frame would have synced matrices.
- **Verification:** Both pick tests pass.

**3. FIXTURE_LAYOUT skill-0 position incompatible with perspective math**
- **Found during:** Same failing pick tests.
- **Issue:** Old fixture put `skill-0 = (x:100, y:100)` and asserted click at `(100, 100)` pixel coords. Under perspective projection, world (100, 100, 0) does NOT project to NDC (-0.8, -0.8) (which the old 2D ortho math implicitly assumed).
- **Fix:** Anchored `FIXTURE_LAYOUT[skill-0]` at world origin (0, 0, 0). Updated the 2 failing test click coords to `(500, 500)` — canvas-center under perspective. Other layout entries retained their fixture positions (skill-1..skill-25 still used for geometry attribute-length tests; their projection coords don't conflict with the canvas-center click).
- **Verification:** Both pick tests pass; 271/271 full suite GREEN.

**4. Forbidden-grep false positives from documentation comments**
- **Found during:** Grep-matrix sanity check post-build.
- **Issue:** Acceptance criteria forbade `OnboardingHint` in GameMode and `controls.addEventListener('change'` in WebGLConstellation. My initial comments referenced these strings as "FORBIDDEN to add X" annotations — false positives.
- **Fix:** Rewrote both comments to convey the same warning without including the forbidden literal substring (`"hint pill"` instead of `"OnboardingHint"`; "Do NOT couple OrbitControls 'change' to renderer.render" instead of `"controls.addEventListener('change'"`).
- **Verification:** Grep matrix now returns 0 hits for both forbidden patterns.

**Total deviations:** 4 auto-fixed. No scope creep. No new tests added (Task 2 visual checkpoint validates renderer behavior on real GPU).

## Issues Encountered

- **No new dependencies added** — `three@0.169.0` already installed; OrbitControls is part of the `three/addons/*` subpath that was always available but never imported.
- **Test environment limitations** — jsdom cannot execute WebGL shaders; `getContext` is mocked to `{}`. All test assertions are limited to constructor calls, attribute-length checks, uniform values, and mocked-event dispatch. **Real-GPU behavior (perspective foreshortening, drag-rotate inertia, autoRotate cadence, context-loss recovery) MUST be verified by the human visual checkpoint (Task 2).**

## User Setup Required

None for the code change. **Task 2 (manual visual smoke checkpoint) requires a real capable-desktop browser** (Chrome stable on macOS / Safari 17+ / Firefox stable on viewport ≥1024px). See `20-02a-PLAN.md` §Task 2 for the 10-item checklist + DevTools-driven context-loss procedure.

## Plan 20-02a Task 2: PENDING — Human Visual Checkpoint

Task 1 (renderer + GameMode code) is **complete and committed** (`f82aaab`). Task 2 is a `checkpoint:human-verify` gate — cannot be executed in an automated session because:

- jsdom cannot execute WebGL; perspective foreshortening, drag rotation, autoRotate, and context-loss recovery require a real GPU + real browser.
- Cursor state transitions (grab → grabbing → pointer) are observable only in a live DOM.
- `localStorage` flag write after first drag is observable only in DevTools.

**10 verification items deferred to human operator** (per 20-02a-PLAN.md §Task 2):

1. Tilted 3D obvious frame 0 (perspective foreshortening without drag).
2. Auto-rotate idle spin ~30 s/orbit.
3. Cursor state map (grab idle / grabbing drag / pointer hover).
4. Drag-rotate with damping + polar clamp.
5. Auto-rotate permanent pause on first drag.
6. Auto-rotate hover/select pause (only before first drag).
7. `prefers-reduced-motion` path stays on SVG.
8. webglcontextlost silent SVG swap.
9. Click-to-select preserved (pre-Plan-20-03 baseline; Plan 20-03 tightens via useClickVsDrag).
10. localStorage `cam-3d-hint-seen='true'` after first drag.

**Operator next step:** Run `npm run build && npx serve dist` on a capable desktop → walk the 10 checks → log result in `.planning/phases/20-3d-constellation/20-02a-HUMAN-UAT.md` (or inline in this SUMMARY's checkpoint section when Plan 20-03 closes).

## Next Phase Readiness

**Ready for Plan 20-02b (OnboardingHint + i18n keys):**

- `effectiveCapability` is the gate for the pill: `effectiveCapability === 'webgl'` AND `localStorage.getItem('cam-3d-hint-seen') !== 'true'` AND `!prefersRM` → render the pill.
- `cam-3d-hint-seen` flag is already being written from the first-drag callback in GameMode — Plan 20-02b's pill suppression on next visit works defensively even if a user drags during the 20-02a interim.
- Tailwind keyframes `animate-fade-in` + `animate-hint-fade-out` are pre-existing (tailwind.config.js:94+100) — Plan 20-02b consumes; this plan did NOT touch them per Alert A7.

**Ready for Plan 20-03 (useClickVsDrag hook + UAT + bundle gate close):**

- Existing pointer-pick still uses `click` event → ExperienceCard opens. Plan 20-03's `useClickVsDrag` hook layers in front to tighten the threshold to 5 px + 250 ms (8 px on touch) — replaces the raw click handler.
- Bundle-gate WebGL chunk WARN currently fires at 122.33 kB gz; Plan 20-03's 3-tier ladder gives a structured PASS / WARN / FAIL verdict band.

**No blockers carry forward.** All Phase 20-02a acceptance criteria PASS.

## Self-Check: PASSED

**Files exist:**
- FOUND: `src/game/renderers/WebGLConstellation.js` with `PerspectiveCamera` + `OrbitControls` + new uniforms + Vector3.project pick + context-loss handlers + cleanup discipline.
- FOUND: `src/game/GameMode.js` with `forceSvgFallback` + `effectiveCapability` + callback wiring; NO `OnboardingHint` import.
- FOUND: `src/game/renderers/WebGLConstellation.test.js` with adjusted FIXTURE_LAYOUT + pointer-pick tests.

**Commit exists (verified via `git log --oneline -1`):**
- FOUND: `f82aaab feat(20-02a): genuine 3D renderer — PerspectiveCamera + OrbitControls + shader size-attenuation + context-loss handlers + GameMode forceSvgFallback (D-20-VISUAL-3D, Alerts A2..A12)`

**Acceptance criteria (all PASS):**
- All 16 grep-matrix assertions in `20-02a-PLAN.md §<acceptance_criteria>` return expected hit counts.
- `npm test` exits 0; 271/271 GREEN (no regression from Plan 20-01 baseline; no new tests added).
- `npm run build` exits 0.
- `node scripts/check-bundle-gate.mjs` exits 0; mobile chunk 9.01 kB gz (under 38.82 kB HARD); WebGL chunk 122.33 kB gz reported (Plan 20-03 closes verdict).
- Manual visual smoke checkpoint (Task 2) **PENDING** — see "Plan 20-02a Task 2: PENDING" section above.

---
*Phase: 20-3d-constellation*
*Completed: 2026-06-09 (Task 1) / Task 2 pending operator visual verification*
