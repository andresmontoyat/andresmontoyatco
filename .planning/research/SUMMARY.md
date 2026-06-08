# Project Research Summary — v3.10 3D Constellation (DEPTH-01)

**Project:** Carlos Montoya Portfolio — v3.10 milestone
**Domain:** Interactive 3D skill-constellation upgrade (single REQ on top of an established React + three.js raw WebGL renderer)
**Researched:** 2026-06-08
**Confidence:** HIGH (Context7 + npm registry + direct `node_modules` measurement + full code inventory of every integration point)

> **Mode:** Delta research against the already-shipped v3.8 / v3.9 baseline. This is **not** new-project research — it scopes the additions needed to convert the existing 2D-in-3D `OrthographicCamera` WebGL constellation into genuine 3D + drag-to-rotate, with the Phase 17 architecture (`GameMode` → `useConstellation` → adaptive renderer) LOCKED.

---

## Executive Summary

**v3.10 ships genuine 3D + drag-to-rotate on the existing desktop WebGL renderer with zero new npm packages.** The capability is delivered entirely by two imports from the already-installed `three@0.169.0` package (`PerspectiveCamera` from core + `OrbitControls` from `three/addons/controls/OrbitControls.js`), a category-z extension to the pure `computeLayout()` function, and ~60 LOC of integration code in `WebGLConstellation.js`. **Direct measurement of `node_modules` (2026-06-08): OrbitControls = 32 134 B raw / 6 850 B gz — final tree-shaken cost ~5–7 kB gz on top of the existing 117 kB gz lazy desktop chunk.** Mobile SVG path is untouched; the Lighthouse mobile HARD gate (Perf ≥95 / A11y 100 / BP 100 / SEO 100) stays cleared by construction (lazy boundary in `GameMode.js` already isolates three.js to desktop).

**Recommended approach (research-derived):** Three sequential plans mirroring Phase 17's vertical-slice pattern — (1) data layer: extend `computeLayout()` to return `{x, y, z}` with deterministic CATEGORY_Z constants in the layout module (NOT in `src/data/skills.js`); (2) renderer: swap `OrthographicCamera` → `PerspectiveCamera(fov=55)`, add `OrbitControls` with damping + auto-rotate + polar clamp, update VERTEX_SHADER with size-attenuation by depth; (3) interaction polish + UAT: new thin `useClickVsDrag.js` hook (5 px + 250 ms threshold), bundle-gate regex fix, manual UAT sweep. Total estimate: 3–5 days. `react-three-fiber` is REJECTED (preserves D-17-LIB) and `d3-force-3d` is REJECTED (preserves D-14-01-LAYOUT determinism).

**Key risk + mitigation:** The dominant ship-blocker is a **BUG in `scripts/check-bundle-gate.mjs:12`** — the existing `THREE_JS_PATTERN` regex matches only literal `from 'three'`, not `from 'three/examples/...'` or `from 'three/addons/...'`, so an accidental leak of OrbitControls into the mobile chunk would pass the gate silently. This MUST be fixed **before** the OrbitControls import lands. Secondary risks: (a) `z=0` trap — if `computeLayout` ships with z but `WebGLConstellation.js:295` keeps `positions[i*3+2] = 0`, recruiter sees zero visual change; (b) shader size-attenuation must be added (`gl_PointSize *= perspectiveScale / -mvPosition.z` formula) or near nodes become canvas-sized blobs; (c) auto-rotate must NOT defeat `prefers-reduced-motion` (already enforced by `useRendererCapability` gating WebGL away from RM users; belt-and-braces defensive gate inside renderer). All 6 critical pitfalls are catchable in code review + 1 layout test + Phase 20 UAT checklist.

---

## Key Findings

### Recommended Stack — Zero new dependencies

Existing stack (Vite 6.4.2 / React 18.3.1 / Tailwind 3.4.19 / `three@0.169.0` / Vitest 2.1.9 + RTL 16.3.0) carries v3.10 without change. The "additions" are two new ES imports from the already-installed three.js package.

**Core technologies (deltas only):**
- **`PerspectiveCamera` (three core)** — provides foreshortening that `OrthographicCamera` cannot. ~0 bytes bundle delta (Camera base class shared).
- **`OrbitControls` (`three/addons/controls/OrbitControls.js`)** — drag-to-rotate + damping + auto-rotate + polar-angle clamp. 6 850 B gz measured; ~5–7 kB gz after Rollup terser minify. Use the modern `three/addons/*` import path (1:1 alias to `three/examples/jsm/*` per `three/package.json` exports map).
- **three.js stays pinned at `0.169.0`** — `^0.184.0` is latest but v3.10 scope is "add 3D + rotate", not "upgrade three.js". Bumping risks ShaderMaterial GLSL preamble and color-management default shifts that could silently regress the Phase 17 Lighthouse-gated build.

**Explicitly REJECTED (with rationale):**
- `@react-three/fiber` + `@react-three/drei` (~60 kB gz combined) — D-17-LIB locked; no functional gain for 26 Points + 50 LineSegments imperative scene.
- `d3-force-3d` (~15 kB gz) — D-14-01-LAYOUT mandates deterministic baked layout; non-deterministic physics is the exact anti-pattern.
- `three-orbit-controls` npm package — deprecated 2018 shim; duplicates the `three/addons/` copy we already have.
- `Line2 / LineGeometry` from `three/examples/jsm/lines/*` (~10 kB gz) — would push desktop chunk over the ~125 kB soft ceiling. Use shader-based alpha angle-fade instead.

**Conflicts resolved by synthesizer:**

| Topic | STACK.md said | FEATURES.md said | Adopted | Why |
|-------|---------------|------------------|---------|-----|
| `fov` | unspecified (mentioned "60 OK") | 55 (cites portfolio-scale safe range) | **fov=55** | Features research cites recruiter-conversion convention; 60 → fisheye risk on widescreen, 50 → too telephoto. **Note: PROJECT.md currently says `fov=60`; v3.10 plan must update to 55 with logged D-20-VISUAL-3D rationale.** |
| Click-vs-drag threshold | 200 ms (three.js manual) | 250 ms (Cortico industry standard) | **5 px + 250 ms** | Features cites industry UX convention; capacitive touch noise (1–3 px) demands ≥5 px screen-space + 250 ms time budget |
| Auto-rotate speed | `autoRotateSpeed=1.0` (~60 s/orbit) | `autoRotateSpeed=0.5` (~30 s/orbit) | **0.5 (~30 s/orbit)** | Features cites recruiter-conversion convention (Sketchfab / configurator default); fast enough to telegraph interactivity, slow enough to read |
| Bundle estimate | 32 134 B / 6 850 B gz **measured** | "~5 kB gz" estimate (deferred to verification) | **6 850 B gz measured (~5–7 kB gz after Rollup minify)** | Direct `wc -c` + `gzip -c | wc -c` on installed file beats estimates |

### Expected Features

Single REQ scope: **DEPTH-01** — "genuine 3D constellation on WebGL desktop." Sub-features partitioned by priority:

**Must have (table stakes — P1 for v3.10.0):**
- `PerspectiveCamera` (fov=55) — without this, nothing is 3D
- 3D layout with category-z clusters (deterministic) — without depth-per-node, camera swap shows zero visual change
- `OrbitControls` drag-to-rotate — `enableDamping=true`, `dampingFactor=0.06`, `rotateSpeed=0.6`, `enableZoom=false`, `enablePan=false`, `enableKeys=false`, polar-angle clamped (`minPolarAngle ≈ π × 0.15`, `maxPolarAngle ≈ π × 0.85`)
- Click-vs-drag threshold (5 px + 250 ms) — preserves GAME-04 "click skill → ExperienceCard opens"
- Size-attenuated points (custom shader edit: `gl_PointSize *= perspectiveScale / -mvPosition.z`)
- Cursor grab/grabbing (CSS-only)
- `prefers-reduced-motion` preserved (already gated to SVG by `useRendererCapability`; defensive gate inside renderer for belt-and-braces)
- All v3.8/v3.9 a11y + filters + ExperienceCard behavior intact

**Should have (differentiators — P2 for v3.10.0 if scope allows, else v3.10.1):**
- Auto-rotate idle spin (`autoRotateSpeed=0.5`, ~30 s/orbit) with pause-on-interaction + pause-on-hover/select
- First-render bilingual onboarding hint ("drag to rotate" / "arrastra para rotar") with 5 s auto-dismiss and localStorage `cam-3d-hint-seen` flag
- Fog falloff via shader uniforms (custom ShaderMaterial doesn't auto-pick up `scene.fog`)

**Defer (v3.11+, only if new milestone opens):**
- Camera-state persistence across viewmode toggle (`{phi, theta}` in `cam-viewmode` namespace)
- "Reset view" button (lifted as `resetViewToken` counter in `useConstellation`, NOT camera state)
- Per-category depth color shift
- **Reject permanently:** WebXR/VR, accelerometer parallax, post-processing bloom, mobile WebGL, free-look first-person camera, scroll-to-zoom, OrbitControls pan

### Architecture Approach

**Locked structure (Phase 17, do NOT collapse):** `App.js → GameMode.js (orchestrator) → useConstellation (state hook, single source of truth) → adaptive renderer (SvgConstellation eager | WebGLConstellation lazy via React.lazy)`. v3.10 fits **entirely inside** `WebGLConstellation.js` + pure data layer extension; **no new layers, no new directories, no new state owners.**

**Major components touched (extend-in-place):**
1. **`src/game/constellation.layout.js`** (+12 LOC) — `computeLayout(nodes) → {[id]: {x, y, z}}`. New `CATEGORY_Z` constant block (NOT in `src/data/skills.js` — bleeds visual data into data layer; skills.js comments explicitly forbid this). Recommended z bands ∈ [−150, +150], 8 categories mapped front-to-back as architecture stack: `ai +150 → lang +75 → arch 0 → data −25 → cloud −75 → devops −100 → security −125 → hardware −150`.
2. **`src/game/renderers/WebGLConstellation.js`** (+40 LOC, −8 LOC) — `OrthographicCamera` → `PerspectiveCamera(55, aspect, 10, 2000)`; add `controlsRef` + `dragStartRef` + (optional) `idleTimerRef` `useRef`s; add `controls.update()` as first line of existing `tick()` (single rAF preserved); update VERTEX_SHADER to read `pos.z` and apply size attenuation; update pointer-pick math to use `Vector3.project(camera)` with perspective-aware pick radius.
3. **`src/game/useClickVsDrag.js`** (NEW, ~30 LOC) — thin testable hook exposing `{ onPointerDown, isDrag }`. Pure jsdom-testable (no canvas). Estimated 5–8 unit tests, all <5 ms.

**Boundaries preserved (do NOT change):**
- `SvgConstellation.js` — reads `layout[id].x` + `.y`, silently ignores `.z`. NO CHANGE. Adaptive-fidelity divergence is the feature, not a bug.
- `useConstellation.js` — camera state (rotation, zoom, target) stays in `WebGLConstellation` `useRef`. Lifting would (a) leak WebGL-only concept into a hook consumed by both renderers and (b) cause 60 setState/sec render thrash on damped rotation.
- `useRendererCapability.js` — 5 gates already filter "capable desktop with WebGL"; PerspectiveCamera + OrbitControls add no new capability requirements.
- `RendererErrorBoundary.js` — PerspectiveCamera + OrbitControls failures bubble identically to current shader-compile failures.
- `GameMode.js` — `rendererProps` unchanged. `LAYOUT` constant just happens to carry `.z` now.

**GAME-01 contract reframe:** "Identical props contract, **adaptive visual fidelity**." Props (names, types, callback signatures) stay identical between renderers. Pixels diverge (SVG flat 2D, WebGL genuine 3D). This is the feature, not contract drift — already accepted in SEED §Risks #1.

### Critical Pitfalls

**6 critical (ship-blocking) — all must be handled in Phase 20:**

1. **Bundle-gate regex BUG (`scripts/check-bundle-gate.mjs:12`)** — existing `THREE_JS_PATTERN = /THREE\.|from\s*['"]three['"]/` matches only literal `'three'`. OrbitControls imports as `from 'three/addons/controls/OrbitControls.js'` → bypasses gate silently. **Fix MANDATORY before OrbitControls import lands.** Update to `/THREE\.|from\s*['"]three(\/[^'"]+)?['"]/`. Add a regression fixture: mobile chunk containing string `OrbitControls` → HARD FAIL.
2. **`z=0` trap (CRIT-04)** — if `WebGLConstellation.js:295` keeps `positions[i*3+2] = 0` after layout extension, all 26 nodes sit on one plane, perspective has nothing to project, rotation spins a flat disc. **Layout test must assert ≥2 distinct z values + z range ≥100.**
3. **OrbitControls swallows click → onSelectSkill stops firing (CRIT-02)** — OrbitControls attaches its own pointerdown/move/up listeners with `preventDefault`. Fix: `useClickVsDrag` hook with 5 px + 250 ms threshold, attach OrbitControls FIRST in effect, our pick handlers SECOND. Set `controls.enablePan = false` to reduce gesture conflict surface.
4. **Size-attenuation missing under perspective (CRIT-05)** — current shader sets `gl_PointSize = size * uDpr * ...` (NDC sizing, correct for ortho). Under perspective without `* (perspectiveScale / -mvPosition.z)`, near nodes become canvas-sized blobs and far nodes vanish. **Add `uCanvasHeight` + `uFovRad` uniforms + clamp `gl_PointSize` ∈ [1, 64].**
5. **Double rAF / double render (CRIT-01)** — D-17-FRAMELOOP locks single rAF loop. Do NOT add `controls.addEventListener('change', renderer.render)` — would double GPU work. Add only `controls.update()` as first line of existing `tick()`.
6. **Auto-rotate vs `prefers-reduced-motion` (CRIT-06)** — `useRendererCapability` already gates RM users to SVG before WebGL mounts; defensive in-renderer gate (`controls.autoRotate = !prefersReducedMotion.matches`) is belt-and-braces. Auto-pause on interaction (`controls.addEventListener('start', () => controls.autoRotate = false)`) + auto-pause on hover/select.

**Notable moderate (9):** z-clipping at extreme near/far ratios (MOD-01 — keep `near=10, far=2000`, z ∈ [−150, +150]); z-fighting (MOD-02 — `edgeMaterial.depthWrite = false`, optional ±5 unit hash-jitter); 1–2 px touch jitter blocks click on touch-screen desktop (MOD-03 — bump threshold to 8 px when `pointerType === 'touch'`); thin LineSegment edges in 3D (MOD-04 — shader alpha angle-fade, REJECT Line2 for bundle reasons); React StrictMode double-mount leaks listeners (MOD-05 — `controls.dispose()` FIRST in cleanup); WebGL context loss on tab return (MOD-06 — `webglcontextlost/restored` handlers swap to SVG via existing capability hook); jsdom blind spot for 3D math (MOD-07 — extract pure functions, accept UAT-only coverage for shader/projection); pointer-pick math under perspective (MOD-08 — `Vector3.project(camera)` + depth-scaled pick radius); GAME-01 contract divergence (MOD-09 — document as D-20-PROPS-CONTRACT).

**Notable minor (6):** auto-rotate vs hover (MIN-01 — pause when `hoveredSkillId != null`); `controls.enableKeys = false` (MIN-02 — preserves D-15-KB-ACTIVATE arrow-key node-nav); `touch-action: none` on canvas (MIN-03); keep canvas `aria-hidden="true"` + `tabIndex={-1}` (MIN-04/05 — keyboard nav lives on `role=application` wrapper); throttle pick math to rAF cadence (MIN-06 — Lighthouse desktop sensitivity).

**9 decision violations to REJECT if proposed in Phase 20 planning:** "use r3f", "use d3-force-3d", "use Line2 for thick edges", "show WebGL to RM users with autoRotate off", "add 2D/3D user preference toggle", "move WebGL out of lazy chunk", "perspective swap only (no layout z)", "add Stats.js / dat.gui", "introduce headless-gl test infra for one phase".

---

## Implications for Roadmap

Based on combined research, the milestone is **single-phase / 3-plans / 3–5 days**, mirroring Phase 17's vertical-slice cadence.

### Phase 20: 3D Constellation (single phase, 3 sequential plans)

**Rationale:** v3.10 is a single-REQ milestone (DEPTH-01). PROJECT.md scope is locked at "1 phase / 3 plans / 3-5 days". Architecture research confirms ~2 file modifications carry 80% of the work + 1 small new hook. No reason to split across phases.

#### Plan 20-01 — Data layer (layout + tests)
**Estimate:** ~1 day
**Rationale (build order — research-derived):** Layout first because it is pure function; if z values are visually wrong (architecture stack reads backwards, ordering confusing) the fix is one constant block edit. Avoids compounding camera tuning AND z-band tuning in the same plan.
**Delivers:** `computeLayout()` returns `{x, y, z}` with `CATEGORY_Z` constants in `constellation.layout.js`. 3 new tests appended to `constellation.layout.test.js` (z present + clustered + deterministic + range ∈ [−200, 200]). Bundle-gate regex fix lands here too (independent of OrbitControls import — defensive update).
**Addresses:** SEED §"Data layer", FEATURES P1 "3D layout: category-z".
**Avoids:** CRIT-04 (z=0 trap — caught by layout test); CRIT-03 (bundle-gate regex fixed before OrbitControls lands); MOD-01 (z range constrained in test); MOD-09 (D-20-PROPS-CONTRACT logged); decision violation "use d3-force-3d" (rejected via comment block).
**GATE:** All 261 existing tests stay GREEN + 3 new z-tests pass + dev server shows SVG path unchanged (`layout[id].z` silently ignored).

#### Plan 20-02 — WebGL renderer (PerspectiveCamera + OrbitControls + shader)
**Estimate:** ~2 days
**Rationale:** Largest LOC slice. Camera swap + OrbitControls instantiation + shader size-attenuation + click-vs-drag wiring + cleanup discipline all interact and benefit from being co-located.
**Delivers:** `OrthographicCamera` → `PerspectiveCamera(fov=55, aspect, near=10, far=2000)`; `OrbitControls` with `enableDamping=true`, `dampingFactor=0.06`, `rotateSpeed=0.6`, `enableZoom=false`, `enablePan=false`, `enableKeys=false`, polar clamp; `autoRotate=true` + `autoRotateSpeed=0.5` with pause-on-start + pause-on-hover/select + defensive RM gate; VERTEX_SHADER reads `pos.z` + applies size-attenuation (`* perspectiveScale / -mvPosition.z`, clamp [1, 64]); pointer-pick rewritten with `Vector3.project(camera)`; `controls.dispose()` first in cleanup; defensive `webglcontextlost`/`restored` handlers; `touch-action: none` on canvas; `useClickVsDrag` hook integrated.
**Uses:** `PerspectiveCamera` + `OrbitControls` from STACK.md; existing custom `ShaderMaterial` (D-17-PRIMITIVES extended, not replaced).
**Implements:** Renderer integration map from ARCHITECTURE.md §2; click-vs-drag pattern from FEATURES.md table-stakes; size-attenuation from PITFALLS CRIT-05.
**Avoids:** CRIT-01 (single rAF preserved — only `controls.update()` added inside `tick()`); CRIT-02 (click-vs-drag hook before pick); CRIT-05 (shader uniforms); CRIT-06 (defensive RM gate + auto-pause); MOD-02 / MOD-04 / MOD-05 / MOD-06 / MOD-08 / MIN-01 / MIN-02 / MIN-03 / MIN-04 / MIN-05.
**GATE:** Dev server shows rotating 3D + manual visual UAT smoke check (rotate 360°, no node disappears; click selects; hover registers on near AND far nodes).

#### Plan 20-03 — Click-vs-drag hook + UAT + bundle gate close
**Estimate:** ~1 day
**Rationale:** Hook is extracted as last step so it can be unit-tested independently AND wired into the renderer with confidence. UAT script + bundle-gate verification close the milestone.
**Delivers:** NEW `src/game/useClickVsDrag.js` (~30 LOC) + `useClickVsDrag.test.js` (5–8 pure jsdom tests for threshold math, `pointerType`-aware bumping to 8 px on touch). `20-UAT.md` checklist scaffold (rotation feel, click reliability, mobile SVG unchanged, RM still SVG, ErrorBoundary still works on synthetic shader error, context-loss survives 5-min tab switch, Lighthouse mobile gate re-verified). Bundle-gate WARN band at WebGL chunk ≤130 kB gz.
**Avoids:** MOD-03 (touch-jitter via `pointerType` branch); MOD-07 (UAT.md scaffold acknowledges jsdom limits honestly); MIN-06 (Lighthouse desktop check in UAT).
**GATE:** UAT 8/8 pass + bundle gate green + Lighthouse mobile re-verified ≥ Phase 17 baseline (mobile chunk untouched, expected to pass unchanged).

### Phase Ordering Rationale

- **Layout first** (pure-fn isolation — visual-design failures are cheap to fix in a constant block).
- **Renderer second** (largest integration surface — wants the layout shape and bundle-gate fix already in place).
- **Hook + UAT last** (hook needs an integration target; UAT needs the full picture working).
- **Single phase, not split** — v3.10 is single REQ. Phase 17 vertical-slice pattern works here too. Splitting into multiple phases would add ceremony cost without scope benefit.

### Research Flags

**Phases NOT needing `/gsd:plan-phase --research-phase` during planning:**
- **Phase 20 (all 3 plans):** Standard patterns from well-documented sources (three.js docs, OrbitControls source, Phase 17 precedent). STACK + FEATURES + ARCHITECTURE + PITFALLS research already covers the integration surface in detail. The milestone is small enough (3–5 days) that an additional research pass would be ceremony.

**Standing alerts during planning (carry forward as plan-phase reminders, not new research):**
- Re-read PITFALLS §"Decision Violations to Flag" before approving any Phase 20 plan — 9 violations are pre-rejected and any of them appearing in a plan PR should trigger immediate pushback.
- Confirm `scripts/check-bundle-gate.mjs:12` regex fix lands in Plan 20-01, NOT Plan 20-02 (it must precede the OrbitControls import to maintain "no leak" as a continuous invariant).
- Confirm PROJECT.md `fov=60` reference is corrected to `fov=55` at v3.10-REQUIREMENTS.md authoring time (this synthesizer recommends 55 per FEATURES.md rationale).

### New Decisions to Log in Phase 20

| Decision | Supersedes | Rationale |
|----------|------------|-----------|
| **D-20-VISUAL-3D** (PerspectiveCamera fov=55, OrbitControls, category-z layout) | D-17-VISUAL (flat 2D-in-3D ortho) | Genuine 3D + drag-to-rotate is the milestone goal; ortho was the placeholder it replaces |
| **D-20-CLICK-DRAG-THRESHOLD** (5 px screen-space + 250 ms time; 8 px on `pointerType === 'touch'`) | — (new) | Preserves GAME-04 click-to-select under OrbitControls gesture state; capacitive touch noise tolerance |
| **D-20-PROPS-CONTRACT** (layout `{x, y, z}` always; SVG ignores `z` silently; WebGL projects) | GAME-01 (reframed, not broken) | Adaptive fidelity per renderer capability tier; props stay identical, pixels diverge by design |
| **D-20-CONTEXT-LOSS** (`webglcontextlost`/`restored` handlers swap to SVG via capability hook) | — (defensive, new) | Phase 17 didn't address; tab-return black-box is a recruiter-visible failure mode |

### Documentation Updates (orchestrator action items at milestone close)

- `PROJECT.md` Key Decisions table: append 4 D-20 rows; update milestone status; correct `fov=60` → `fov=55` in DEPTH-01 description. Also flag GAME-01 reframe: "single props contract, adaptive visual fidelity."
- `v3.10-REQUIREMENTS.md` DEPTH-01 acceptance criteria: add D-20-PROPS-CONTRACT clause ("Layout signature `{x, y, z}` consumed by both renderers — SVG ignores `z` silently; props contract identical, visual rendering EXPLICITLY DIVERGES").
- No root `ARCHITECTURE.md` or codebase `CLAUDE.md` Architecture-section edit needed — existing wording is already capability-tiered ("Adaptive render: full WebGL on desktop, lightweight SVG/DOM on mobile").

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Context7 (`/mrdoob/three.js`) + npm registry + direct `wc -c` / `gzip -c` measurement on installed `node_modules` files. Modern import path `three/addons/controls/OrbitControls.js` verified against `three@0.169.0` `package.json` exports map. |
| Features | **HIGH** for camera/control patterns (three.js docs + Sketchfab/Google Earth/Cortico corroboration). **MEDIUM** on specific recruiter-conversion numbers (industry rules of thumb, not Carlos-audience data — auto-rotate speed, hint dismissal timing). |
| Architecture | **HIGH** | Full code inventory of every integration point (`GameMode.js`, `useConstellation.js`, `WebGLConstellation.js`, `useRendererCapability.js`, `RendererErrorBoundary.js`, `constellation.layout.js`, `constellation.layout.test.js`, `vite.config.js`). Phase 17 decisions explicit. |
| Pitfalls | **HIGH** for code-grounded pitfalls (read against actual `WebGLConstellation.js` line numbers, `check-bundle-gate.mjs:12` regex bug verified). **MEDIUM** for ecosystem patterns (OrbitControls + StrictMode, fat-line geometry size). |

**Overall confidence:** **HIGH** — every recommendation is anchored in either Context7-verified docs, direct measurement, or read code; conflicts between research files are surfaced and resolved with rationale rather than averaged.

### Gaps to Address

- **Specific CATEGORY_Z values are design proposals, not measurements.** UAT in Plan 20-03 is the validation path; expect to tune ±25 units per category band. Plan 20-01 should comment-block the values as "UAT-tunable; consult v3.10-UAT.md before adjusting after milestone close."
- **OrbitControls bundle cost after Rollup terser minify** is estimated at 5–7 kB gz (raw measured 6 850 B gz). Confirm via `dist/stats.html` (rollup-plugin-visualizer already enabled) at Plan 20-03 close.
- **Edge thin-line visibility under perspective** (MOD-04) has multiple mitigation options ranging from shader-alpha (Option A, recommended) to Line2 (Option B, REJECTED). Plan 20-02 should default to Option A and only escalate to fragment-shader changes if UAT shows edges read as floating points without connections.
- **Async OrbitControls handler errors falling outside the ErrorBoundary** — React's error-boundary semantics don't catch async/event errors natively. ARCHITECTURE.md §7 proposes a defensive `setErrorToThrow` + render-time `throw` pattern. Plan 20-02 can ship without this if OrbitControls handlers stay synchronous (low practical risk — three.js code is battle-tested), but it's listed in PITFALLS as 5-LOC belt-and-braces.
- **PROJECT.md says `fov=60`**; this synthesizer recommends `fov=55`. Discrepancy must be reconciled at v3.10-REQUIREMENTS.md authoring time. Recommendation: adopt 55 with D-20-VISUAL-3D rationale; update PROJECT.md DEPTH-01 wording.

---

## Sources

### Primary (HIGH confidence — Context7 + direct measurement + read code)
- **Context7 `/mrdoob/three.js`:** `PerspectiveCamera`, `OrbitControls` properties + events (`autoRotate`, `autoRotateSpeed`, `enableDamping`, `enableZoom`, `enablePan`, `start`/`change`/`end`), three.js manual `indexed-textures.html` (click-vs-drag 200 ms / 5 px pattern), `PointsMaterial.sizeAttenuation` semantics, custom shader size-attenuation formula `300.0 / -mvPosition.z`.
- **npm registry / `node_modules` measurement (2026-06-08):** `three@0.184.0` latest, `three@0.169.0` installed; OrbitControls.js raw 32 134 B / gz 6 850 B (`wc -c` + `gzip -c` on installed file); `three/package.json` exports map confirms `./addons/* = ./examples/jsm/*` 1:1 alias.
- **Read code:** `src/game/GameMode.js`, `src/game/useConstellation.js`, `src/game/renderers/WebGLConstellation.js` (725 LOC, Slice 4 final), `src/game/renderers/SvgConstellation.js`, `src/game/constellation.layout.js` (81 LOC), `src/game/constellation.layout.test.js`, `src/game/useRendererCapability.js`, `src/game/RendererErrorBoundary.js`, `src/data/skills.js`, `src/test/setup.js`, `scripts/check-bundle-gate.mjs`, `vite.config.js`, `package.json`.
- **Project planning artifacts:** `.planning/PROJECT.md`, `.planning/seeds/SEED-3D-CONSTELLATION.md`, `.planning/milestones/v3.8-ROADMAP.md` (Phase 14 + Phase 17 locked decisions D-14-01-LAYOUT, D-17-EXTRACT, D-17-HOVERED-PROP, D-17-VISUAL, D-17-PRIMITIVES, D-17-LIB, D-17-EDGE-RGBA, D-17-FRAMELOOP, D-17-LIGHTHOUSE-FLOW, D-17-RM-GATE, GAME-01..07).

### Secondary (MEDIUM confidence — community + industry consensus)
- [OrbitControls — three.js docs](https://threejs.org/docs/pages/OrbitControls.html)
- [Issue #9577 — speed/sensitivity tuning](https://github.com/mrdoob/three.js/issues/9577)
- [3D Data Viz with React+three.js — Peter Beshai (Cortico)](https://medium.com/cortico/3d-data-visualization-with-react-and-three-js-7272fb6de432) — click-vs-drag 250 ms industry convention
- [Issue #12150 — PointsMaterial sizeAttenuation + FOV](https://github.com/mrdoob/three.js/issues/12150)
- [WebXR Perspective Retrospective — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Perspective)
- [Designing Safer Web Animation — A List Apart](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/) — motion-sensitivity baseline
- [Discover three.js — Camera Controls Plugin](https://discoverthreejs.com/book/first-steps/camera-controls/)
- [Wawa Sensei R3F Camera Controls](https://wawasensei.dev/courses/react-three-fiber/lessons/camera-controls)

### Tertiary (LOW–MEDIUM confidence — inference / unmeasured)
- Specific +5–7 kB gz post-Rollup-terser estimate for OrbitControls — derived from raw + gz measurements; confirm via `dist/stats.html` at Plan 20-03 close.
- Specific category-z values (±150 etc.) — design proposals per SEED §"Data layer"; UAT-tunable.
- Lighthouse desktop sensitivity to first-frame raycasting — extrapolated from CPU emulation behavior; not measured for this site.

---
*Research synthesized: 2026-06-08*
*Ready for roadmap: yes — single phase (Phase 20) / 3 plans / 3–5 days, all 6 critical pitfalls have defined mitigations, 4 new decisions queued for milestone log*
