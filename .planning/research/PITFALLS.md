# Domain Pitfalls — v3.10 3D Constellation

**Domain:** Adding genuine 3D + drag-to-rotate to an existing 2D three.js raw WebGL constellation (React lazy chunk) under a hard Lighthouse mobile gate, WCAG 2.1 AA, prefers-reduced-motion contract, and 261/261 test baseline.
**Researched:** 2026-06-08 (supersedes 2026-04-21 v3.4-era pitfalls file)
**Scope:** v3.10 integration pitfalls against the v3.8 Phase 17 architecture (D-17-*) — not generic three.js gotchas.
**Confidence:** HIGH for code-grounded pitfalls (read against `src/game/renderers/WebGLConstellation.js`, `src/test/setup.js`, `scripts/check-bundle-gate.mjs`, `constellation.layout.js`); MEDIUM for ecosystem patterns (OrbitControls + React strictmode, fat-line geometry size).

---

## Critical Pitfalls

Mistakes that cause rewrites, ship-blocking regressions against locked v3.8 contracts, or HARD-gate failures.

---

### CRIT-01: Re-using the existing Slice 3 rAF loop for OrbitControls without re-rendering on `change`

**What goes wrong:** Developer wires `new OrbitControls(camera, canvas)` but leaves the Slice 3 always-running rAF loop (`WebGLConstellation.js:670-713`) as the only render trigger. Drag feels laggy or only updates on `uTime` tick boundaries, not at pointer velocity. OR: developer adds `controls.addEventListener('change', renderer.render)` AND keeps the rAF loop → renders fire twice per frame, doubling GPU cost on the lazy chunk that's already at 117 kB gz earning its keep.

**Why it happens:** Slice 3 spec assumed flat geometry with shader-driven uTime drift — the rAF loop drives `material.uniforms.uTime.value` accumulation. When 3D camera state changes via OrbitControls (which mutates `camera.position` outside React state), the existing `renderer.render(scene, camera)` call inside `tick()` already picks it up, BUT only at the rAF cadence — which is correct. The bug is when devs add the `change` listener thinking it's needed.

**Consequences:** Either visible drag stutter (single-render path that misses the listener), or 120 Hz GPU work doubled into 240 Hz (double-render path) → desktop fan-spin, recruiters with hot laptops, possible TTI regression flagged by Lighthouse desktop preset.

**Prevention:**
- Keep the existing rAF loop as the SINGLE render driver. Do NOT add `controls.addEventListener('change', ...)`.
- Add `controls.update()` INSIDE `tick()` BEFORE `renderer.render()` (only needed when `enableDamping=true` or `autoRotate=true`).
- Verify with a single targeted unit test: assert `renderer.render` mock is called once per rAF tick when controls is active.

**Warning signs (grep / review):**
- `rg "controls\.addEventListener" src/game/renderers/` → must return zero matches
- `rg "requestAnimationFrame" src/game/renderers/WebGLConstellation.js` → must return exactly the existing Slice 3 callsite (one rAF chain), not two
- Two `renderer.render(scene, camera)` calls inside a single rAF closure

**Test that catches this:** `WebGLConstellation.test.js` — mock rAF, assert `renderer.render` called exactly N times after N rAF ticks (N×1, not N×2).

**Violates which Phase 17 decision:** D-17-FRAMELOOP (single rAF loop, visibilitychange pause). Phase 20 planner must call this out explicitly.

---

### CRIT-02: OrbitControls swallows the canvas pointermove → onSelectSkill / onHoverSkill stops firing

**What goes wrong:** `OrbitControls` attaches its own `pointerdown/move/up` listeners to the canvas DOM element with passive=false. It calls `e.preventDefault()` and `e.stopPropagation()` during drag to lock viewport pan/zoom on mobile. The Phase 17 Slice 4 pointer-pick handlers (`WebGLConstellation.js:604-659`) attach to the same canvas. Result: clicks during/after drag don't reach `onClick` → node selection breaks. Hover position drifts because pointermove is consumed.

**Why it happens:** OrbitControls intercepts to implement its own gesture state machine. The existing handlers were the only consumer; v3.10 introduces a second consumer that's invisibly higher-priority.

**Consequences:** Hard breaks GAME-04 (click skill → ExperienceCard opens) and the Slice 4 weight-1 edge reveal on hover. UAT-blocking. Caught only on integration, not unit test.

**Prevention:**
- **Click-vs-drag gate (UI-SPEC contract for Phase 20):** track `pointerdown` position; if `pointerup` arrives within 5 px AND <250 ms AND OrbitControls did not enter drag state (`!controls.enabled || controls.getDistance() unchanged`), treat as click → call pickAt + onSelectSkill. Otherwise consume as drag.
- Attach the new click-gate listener with `{ capture: true }` BEFORE OrbitControls instantiation, OR listen on a transparent overlay div positioned above the canvas.
- Set `controls.enablePan = false` (no panning needed for a centered constellation) to reduce gesture conflict surface.

**Warning signs (grep / review):**
- `rg "addEventListener\('click'" src/game/renderers/WebGLConstellation.js` → must NOT exist alongside `new OrbitControls(...)` without a click-gate ref
- PR diff that adds OrbitControls without adding a `pointerDownPos.current` ref
- Missing `controls.enablePan = false`

**Test that catches this:**
- `WebGLConstellation.test.js` — simulate pointerdown→pointerup at same coords, assert `onSelectSkill` fires
- Simulate pointerdown → 20px drag → pointerup at far coord, assert `onSelectSkill` does NOT fire

**Violates which Phase 17 decision:** D-17-HOVERED-PROP (callback-out only; hook is single source of truth) — gate must preserve the "always emit on click" contract OR break GAME-04. Phase 20 should add D-20-CLICK-DRAG-THRESHOLD as a logged decision.

---

### CRIT-03: Mobile bundle leakage — OrbitControls import accidentally lands in `GameMode-*.js`

**What goes wrong:** Developer adds `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'` at the top of `WebGLConstellation.js`. Since Vite's tree-shaking + chunk-splitting derives chunk membership from import graph, OrbitControls is correctly isolated to the WebGL chunk **as long as** `WebGLConstellation.js` itself is only imported via `React.lazy(() => import('./renderers/WebGLConstellation.js'))`. BUT: if any test file, story, or stray import outside the lazy boundary references the renderer directly, OrbitControls becomes a static dep of GameMode and lands in the mobile chunk.

**Why it happens:** Test files (`WebGLConstellation.test.js`) static-import the renderer for testing. Vite's `optimizeDeps` may pre-bundle for dev, but the production graph is what matters. If a production code path (e.g., a hover-state debug component) static-imports the renderer, the lazy boundary leaks.

**Consequences:** Mobile chunk crosses 38.82 kB gz HARD ceiling → `scripts/check-bundle-gate.mjs:40` throws → CI fails → Lighthouse mobile gate at risk. The check-bundle-gate `THREE_JS_PATTERN` regex (`THREE\.|from\s*['"]three['"]`) at `check-bundle-gate.mjs:12` already catches the three.js core leak, but OrbitControls' import string is `three/examples/jsm/controls/OrbitControls.js` — the existing `from\s*['"]three['"]` alternation does NOT match this (regex requires literal `'three'`, not `'three/...'`). Phase 20 MUST widen the regex.

**Prevention:**
- Lazy-import OrbitControls dynamically INSIDE the WebGLConstellation useEffect: `const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')`. Belt-and-braces against accidental static-import leakage from outside the lazy boundary.
- Add a Phase 20 regression case to `scripts/check-bundle-gate.test.mjs`: fixture mobile chunk containing the string `OrbitControls` → expect HARD FAIL.
- Update `THREE_JS_PATTERN` in `check-bundle-gate.mjs:12` to explicitly include `three/examples` paths: `/THREE\.|from\s*['"]three(\/[^'"]+)?['"]/`.

**Warning signs (grep / review):**
- `rg "OrbitControls" dist/assets/GameMode-*.js` after build → must be empty
- `rg "import.*OrbitControls" src/` should appear ONLY inside `WebGLConstellation.js` and its test
- A new direct (non-lazy) import of `WebGLConstellation` from any file under `src/game/` outside `GameMode.js`

**Test that catches this:** Extend `scripts/check-bundle-gate.mjs` with `ORBITCONTROLS_PATTERN = /OrbitControls/` and run against mobile chunk; HARD FAIL on match.

**Violates which Phase 17 decision:** D-17-LIB (three.js raw, lazy-only on desktop) and GAME-07 (Lighthouse mobile HARD gate). Most expensive failure mode — would unship the milestone.

---

### CRIT-04: PerspectiveCamera + flat z=0 layout = visually identical to current OrthographicCamera (seed promise unmet)

**What goes wrong:** Developer swaps `OrthographicCamera(0, 1000, 0, 1000, -1, 1)` (`WebGLConstellation.js:250`) for `new PerspectiveCamera(60, aspect, 1, 1000)` but the layout still returns `{x, y}` with `z=0` set implicitly at `WebGLConstellation.js:295`. Result: all 26 points sit on a single plane, perspective fov has nothing to project, rotation just spins a flat disc. Recruiter sees no 3D — milestone goal unmet, 117 kB gz still doesn't earn its bundle cost.

**Why it happens:** The renderer's geometry-build loop hard-codes `positions[i * 3 + 2] = 0` at line 295. Even if `computeLayout` is extended to return `{x, y, z}`, the renderer must read `pos.z`. Easy to forget — only one line change, but invisible in 2D-only tests.

**Consequences:** Whole milestone delivers nothing visually. SEED-3D-CONSTELLATION promise unmet. Lazy chunk grows +5 kB (OrbitControls + perspective math) for zero recruiter-visible difference.

**Prevention:**
- Phase 20 layout plan MUST extend `computeLayout` (`src/game/constellation.layout.js:25`) to return `{x, y, z}` with category-z clusters (per SEED §"Data layer"). REJECT a "z=0 + only swap camera" implementation as an architectural failure.
- Add a test: `constellation.layout.test.js` — assert at least 2 distinct `z` values across categories; assert `z` range ≥ 100 (visually meaningful depth at fov=60, camera distance 500).
- Update the BufferGeometry build loop at `WebGLConstellation.js:293-295` to read `pos.z` (NOT hardcode 0).

**Warning signs (grep / review):**
- `rg "positions\[i \* 3 \+ 2\] = 0" src/game/renderers/` → must NOT exist after v3.10
- `computeLayout` return shape still `{x, y}` after Phase 20 → CRIT layout failure
- PR diff that only touches `WebGLConstellation.js` and not `constellation.layout.js`

**Test that catches this:**
- `constellation.layout.test.js` — assert returned positions have `z` property; assert distinct z values per category
- `WebGLConstellation.test.js` — assert position attribute z-component reads from layout, not 0

**Violates which Phase 17 decision:** D-14-01-LAYOUT (must extend to 3D, not abandon) and D-17-VISUAL (must replace flat 2D-in-3D ortho with genuine perspective). Seed §Risks/Concerns #3.

---

### CRIT-05: `sizeAttenuation`-free Points shader → giant up-close nodes, vanishing far ones

**What goes wrong:** The current vertex shader sets `gl_PointSize = size * uDpr * (1.0 + (uHaloPulse - 1.0) * halo) * flashScale` (`WebGLConstellation.js:173`) — pure NDC sizing, no distance attenuation. This was correct for `OrthographicCamera` where distance doesn't change apparent size. Under `PerspectiveCamera`, points are now at varying `-mvPosition.z` distances. Without `* (perspectiveScale / -mvPosition.z)` correction:
- Nodes that rotate toward the camera grow to full canvas-width blobs (size attribute is in NDC units, looks huge when "close")
- Nodes far from camera stay the same NDC size, look mis-scaled vs perspective expectation, edges connect them at wrong-feeling depths

**Why it happens:** Shader was written for ortho where `gl_PointSize` in NDC = consistent screen pixels. Perspective requires `gl_PointSize = size * uDpr * (perspectiveScale / -mvPosition.z)` where `perspectiveScale = canvasHeight / (2 * tan(fov/2))`. ThreeJS `PointsMaterial` has `sizeAttenuation: true` flag that auto-generates this, but raw `ShaderMaterial` doesn't — you write the math.

**Consequences:** Visually broken — recruiter sees pulsing giant orbs and tiny invisible far points. Worse than 2D flat. UAT fail. Possibly Lighthouse perf hit if giant points cause large fragment shader overdraw (close points cover huge screen area at high alpha).

**Prevention:**
- Update VERTEX_SHADER (`WebGLConstellation.js:133-176`) with size attenuation:
  ```glsl
  vec4 mvPosition = modelViewMatrix * vec4(drifted, 1.0);
  float perspectiveScale = uCanvasHeight / (2.0 * tan(uFovRad / 2.0));
  gl_PointSize = size * uDpr * (1.0 + (uHaloPulse - 1.0) * halo) * flashScale * (perspectiveScale / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  ```
- Add `uCanvasHeight` and `uFovRad` uniforms, update on resize.
- Cap `gl_PointSize = clamp(..., 1.0, 64.0)` to defend against z-near-clip extreme magnification on aggressive rotation.

**Warning signs (grep / review):**
- `rg "gl_PointSize" src/game/renderers/WebGLConstellation.js` shows the original ortho formula unchanged after Phase 20
- Missing `mvPosition.z` reference in the vertex shader
- Missing `uCanvasHeight` / `uFovRad` uniforms

**Test that catches this:** Hard to unit-test (shader runs on GPU which jsdom doesn't have). Catch via UAT visual check: rotate constellation 90°, observe nodes at front vs back retain reasonable size ratio (front no more than ~2× back). Add to Phase 20 UAT checklist.

**Violates which Phase 17 decision:** D-17-PRIMITIVES (Points + ShaderMaterial — shader needs minor update for size attenuation by depth). SEED §"Decisions to revisit" explicitly flags this. Phase 20 plan MUST include shader update or fail SEED §Risks #1.

---

### CRIT-06: Auto-rotate fights `prefers-reduced-motion` → WCAG violation

**What goes wrong:** Developer enables `controls.autoRotate = true; controls.autoRotateSpeed = 2.0` for ambient idle motion. The Phase 17 `useConstellation` hook already gates reduced-motion users to the SVG path via `usePrefersReducedMotion()` (`useConstellation.js:25-49`), BUT the gate is at the renderer-capability layer (which renderer to mount), not inside the WebGL renderer. If a Phase 20 change relaxes that gate (e.g., "show WebGL to reduced-motion users but turn off animation"), autoRotate keeps spinning — direct WCAG 2.3.3 / 2.2.2 violation.

**Why it happens:** OrbitControls' `autoRotate` is a property on the controls instance, set during init. It runs whenever `controls.update()` is called. Easy to add to init code, easy to forget the reduced-motion branch.

**Consequences:** Vestibular-triggering rotation for sensitive users. WCAG 2.1 AA fail. Lighthouse A11y score drop from 100 → ~90s (motion violation flag). Hard-gate failure: A11y 100 is in the Lighthouse HARD gate.

**Prevention:**
- Keep the existing `usePrefersReducedMotion` gate at the `useRendererCapability` layer — DO NOT mount WebGL for reduced-motion users (preserves Phase 17 contract).
- Defensive layer inside the renderer: `controls.autoRotate = !prefersReducedMotion.matches` (re-read inside the useEffect that creates controls).
- Auto-pause autoRotate on user interaction:
  ```js
  controls.addEventListener('start', () => { controls.autoRotate = false })
  // Optional: resume after N seconds idle
  ```
- Auto-pause on hover (recruiter examining a node shouldn't fight rotation): pause when `hoveredSkillId != null`, resume when null + timeout.

**Warning signs (grep / review):**
- `rg "autoRotate" src/game/renderers/` lacks a corresponding `prefersReducedMotion` check in the same useEffect
- Missing `controls.addEventListener('start', ...)` to pause autoRotate on drag
- `controls.autoRotate = true` set unconditionally in renderer init

**Test that catches this:**
- `WebGLConstellation.test.js` — mock `prefersReducedMotion = true`, assert `controls.autoRotate === false`
- Lighthouse A11y check in Phase 20 close (re-run `lighthouse:mobile && lighthouse:check`)

**Violates which Phase 17 decision:** D-17-RM-GATE (reduced-motion users gated to SVG before WebGL mounts — `WebGLConstellation.js:670` rAF loop assumes RM users never reach this code). And GAME-06 (A11y reduced-motion path). Phase 20 must reaffirm this gate as a HARD invariant.

---

## Moderate Pitfalls

Mistakes that cause visible bugs but are catchable in code review or UAT, not ship-blocking.

---

### MOD-01: Z-clipping at default near/far planes when categories span large z range

**What goes wrong:** Developer sets `new PerspectiveCamera(60, aspect, 1, 1000)` and chooses category-z clusters at `z = -400, -200, 0, 200, 400`. Camera at `(0, 0, 500)` sees the back layer at distance 900 (within far=1000), but on user rotation to a side angle, far nodes can swing to distance >1000 and get clipped (pop out of view abruptly). Or: rotation brings near nodes to distance <1, near-plane clips them.

**Why it happens:** Camera distance to a rotating point depends on the orbit radius, not just z. With camera at distance 500 and node-cluster at z=-400, OrbitControls rotation around origin places the node at varying distances [100, 900].

**Consequences:** Recruiter sees a node abruptly vanish during rotation. Looks broken, not delightful.

**Prevention:**
- Choose near/far conservatively: `near = 10, far = 2000` for a max orbit radius of ~600 with cluster z range ±200.
- Constrain category-z cluster range: `z ∈ [-150, +150]` (per SEED procedural option: `z = -150 + Math.sin(node.idx) * 100`).
- Set `controls.minDistance = 200; controls.maxDistance = 800` to bound user-driven zoom.
- Add an axes helper in dev mode to visualize clipping during build.

**Warning signs (grep / review):**
- PR diff that sets `near < 5` or `far > 5000` (z precision suffers at extreme ratios)
- Category-z values with `|z| > 200`

**Test that catches this:**
- `constellation.layout.test.js` — assert all `z` values fall within `[-200, 200]`
- Manual UAT: rotate 360° on each axis, no node disappears

**Violates which Phase 17 decision:** None directly, but SEED §"Data layer" recommends category-z clusters — Phase 20 must constrain magnitude.

---

### MOD-02: Z-fighting between overlapping points and edges in 3D depth

**What goes wrong:** When two nodes happen to project to similar screen positions at similar depths, their alpha-blended sprites flicker as fragments compete for the depth buffer. Edges (LineSegments) drawn at the same z as nodes also flicker against node sprites. Z-fighting is amplified when `near/far` ratio is large (poor depth precision).

**Why it happens:** Points use circular-sprite alpha discard (`WebGLConstellation.js:210`), not pure depth-tested geometry. WebGL z-buffer precision is non-linear — most precision is near the near plane.

**Consequences:** Flickering edges/points during rotation, especially under autoRotate. Visually annoying.

**Prevention:**
- Disable depth-write on the edge material to let nodes always win: `edgeMaterial.depthWrite = false`. Render edges first (already the order at `WebGLConstellation.js:411-412`).
- Set `material.depthTest = true; material.depthWrite = true` on Points but the alpha-discard `if (alpha < 0.01) discard` (`WebGLConstellation.js:210`) already handles transparent fragments correctly.
- Keep near plane reasonably far from origin: `near = 10` not `near = 0.1`.
- If z-fighting persists at category-cluster boundaries, add tiny per-node z-jitter: `z + (hashNodeId(node.id) % 100) / 10` (±5 units).

**Warning signs (grep / review):**
- All category-z values are identical integers (cluster collisions)
- `edgeMaterial.depthWrite` not explicitly set to `false`

**Test that catches this:** Visual UAT only. Hard to unit-test on jsdom.

**Violates which Phase 17 decision:** None — refinement, not contract.

---

### MOD-03: Click-vs-drag — 1-2px touch jitter registers as drag, blocking click-to-select on mobile

**What goes wrong:** Phase 20 implements a 5px drag threshold per CRIT-02 prevention. On capacitive touchscreens, a "tap" typically registers `pointerdown` then a 1-3px pointer drift during the finger contact (touch noise) before `pointerup`. If the threshold is too tight (3 px), every tap registers as a tiny drag → click never fires → node selection broken on mobile.

But wait: per the project constraint, mobile uses SVG path (`useRendererCapability` gates WebGL to desktop). So this is desktop touch-laptop hybrids (Surface, touch-screen iMacs, MacBook trackpad with touch hover, drawing tablets) and Chrome devtools mobile-emulation mode (used in UAT).

**Why it happens:** Touchscreen drivers report continuous pointermove events even during a "stationary" finger contact due to capacitive sensor noise. 5px threshold compensates for this; <5px does not.

**Consequences:** Recruiter on a Surface laptop or touch-iMac taps a node → nothing happens → frustration. NOT caught by mouse-only tests.

**Prevention:**
- Threshold = 5 px in screen pixels (NOT device pixels), per SEED `click-vs-drag threshold (≥5px before suppressing click-to-select node)`.
- Also gate on time: drag-window <250 ms = click, ≥250 ms = drag-confirmed.
- Track `pointerType` from PointerEvent: if `pointerType === 'touch'`, bump threshold to 8 px.
- Use `pointercancel` event to abort drag-tracking when the browser cancels the gesture (scroll start, switch tab).

**Warning signs (grep / review):**
- Threshold constant `< 5`
- Missing `pointerType` branch
- Missing `pointercancel` listener cleanup in useEffect

**Test that catches this:**
- `WebGLConstellation.test.js` — simulate pointerdown at (100, 100), pointermove to (102, 101), pointerup at (102, 101) → assert `onSelectSkill` fires (within threshold)
- Simulate pointerdown to pointerup 6 px apart → assert `onSelectSkill` does NOT fire

**Violates which Phase 17 decision:** None directly. Phase 20 should log D-20-CLICK-DRAG-THRESHOLD = 5px screen-space + 250ms.

---

### MOD-04: Edge LineSegments become invisible-thin 1-px lines in 3D depth

**What goes wrong:** Current edges use `LineBasicMaterial` (`WebGLConstellation.js:406-409`) which renders as 1-pixel lines regardless of depth or DPR — a WebGL hardware limitation, not three.js. In 2D ortho this looked fine. In 3D with perspective, edges going "into the screen" become near-invisible (1 px is below the visual-discrimination threshold at angled views).

**Why it happens:** OpenGL `gl.LINES` primitive ignores `lineWidth` on most platforms (Chrome enforces width=1). Edges look thin in 3D because they ARE one pixel.

**Consequences:** Constellation looks like "floating points without connections" when rotated. Loses the graph structure (which is core to GAME-02 metaphor).

**Prevention options:**
- **Option A (recommended for v3.10 — fits budget):** Boost edge visibility via fragment-shader alpha multiplier dependent on angle to view. Custom `ShaderMaterial` for edges with `gl_FragColor.a *= 1.2 - abs(normalView.z)` — no geometry change, +0 kB.
- **Option B (rejected — bundle cost):** Switch to `Line2 / LineGeometry / LineMaterial` from `three/examples/jsm/lines/*` — adds ~10 kB gz (over the +5 kB OrbitControls budget = +15 kB total → desktop chunk 117 → ~132 kB, OVER the v3.10 budget ~125 kB ceiling).
- **Option C (compromise):** Render each edge as a thin cylindrical tube via `CylinderGeometry` — geometry-heavy, ~50 edges × 8 segments = 400 triangles, fine for desktop, +1-2 kB but heavy DOM-tree on inspection. NOT recommended.
- **Option D (cheapest):** Make important edges (weight ≥2) render as Points-strips with billboarded quads — heavier visual presence. Most complex, NOT recommended for time-boxed v3.10.

**Warning signs (grep / review):**
- PR diff that imports `Line2` or `LineGeometry` from `three/examples/jsm/lines/` → bundle cost exceeds budget
- Edge material change without depth-write reconsidered
- UAT note: "edges look thin in 3D"

**Test that catches this:** Visual UAT only. Cannot unit-test.

**Violates which Phase 17 decision:** D-17-LIB (three.js raw, treeshake target) — Option B would blow the budget. Phase 20 must pick Option A (custom shader alpha boost).

---

### MOD-05: OrbitControls + React StrictMode double-mount creates orphaned event listeners

**What goes wrong:** React 18+ in dev mode runs effects twice intentionally (StrictMode "double-invoke effects to surface side-effect leaks"). If the renderer useEffect creates OrbitControls but the cleanup doesn't call `controls.dispose()`, the first invocation leaks listeners on `document` (OrbitControls attaches `keydown`, `wheel`, `contextmenu` to document/window, not just the canvas). Second invocation registers a new set. In dev: 2× listener pile-up per remount. In production: only 1× set, fine, BUT this masks a regression that triggers on legitimate prop changes that retrigger the useEffect.

**Why it happens:** OrbitControls listeners are attached imperatively in its constructor (DOM event handlers). The class exposes `.dispose()` which removes them — must be called in the useEffect cleanup. The existing renderer at `WebGLConstellation.js:416-423` disposes geometry/material/renderer but doesn't yet know about controls.

**Consequences:** Dev console shows memory growing on remounts. Production gets stale listeners on legitimate prop-change-driven useEffect re-runs (theme switch, node-set update). Eventually input events fire on disposed cameras → console errors → recruiter sees red error overlay if `RendererErrorBoundary` (`WebGLConstellation.js:417` context) hasn't been re-verified for this case.

**Prevention:**
- Add to the renderer-setup useEffect cleanup at `WebGLConstellation.js:416`:
  ```js
  return () => {
    controls.dispose() // FIRST — before renderer.dispose
    geometry.dispose()
    material.dispose()
    edgeGeometry.dispose()
    edgeMaterial.dispose()
    renderer.dispose()
  }
  ```
- Verify with React StrictMode enabled (check `src/main.jsx` or equivalent for `<React.StrictMode>` wrapper) — Phase 17 confirmed setup is StrictMode-friendly.

**Warning signs (grep / review):**
- `new OrbitControls(...)` without a matching `controls.dispose()` in cleanup
- Cleanup function size grew without `controls.dispose()` line

**Test that catches this:**
- `WebGLConstellation.test.js` — mount + unmount + assert no `console.error` (catches stale listener errors)
- Manual check: dev tools "Memory" tab snapshot before/after 10 remounts, assert no growth in `OrbitControls` instances

**Violates which Phase 17 decision:** Implicit Phase 17 cleanup pattern at `WebGLConstellation.js:416-423`. Phase 20 must extend, not break.

---

### MOD-06: WebGL context loss not handled — recruiter switches tabs, returns, scene gone

**What goes wrong:** The browser can discard a WebGL context under memory pressure (multi-tab, mobile background, GPU process restart). When the recruiter returns to the tab, the canvas is black. The Phase 17 rAF loop pauses on `visibilitychange` (`WebGLConstellation.js:692-702`) but does NOT handle `webglcontextlost` / `webglcontextrestored` events.

**Why it happens:** WebGL spec allows context loss. three.js emits events if you bind handlers via `renderer.domElement.addEventListener('webglcontextlost', ...)`. Without handlers, scene state on GPU is gone, CPU side has stale references, next render call no-ops or throws.

**Consequences:** Recruiter returning from "look at another tab" gets a black box where the constellation was. `RendererErrorBoundary` doesn't catch this (no error thrown, just silent no-op). Recruiter's last impression: broken site.

**Prevention:**
- Add to renderer setup:
  ```js
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    // Stop rAF, mark scene as needs-rebuild
  })
  canvas.addEventListener('webglcontextrestored', () => {
    // Rebuild geometry/material from scratch (use existing useEffect re-trigger logic)
  })
  ```
- Simpler fallback: on `webglcontextlost`, call `props.onContextLost?.()` callback → parent `GameMode` swaps to SVG renderer (use the existing `useRendererCapability` fallback path).

**Warning signs (grep / review):**
- `rg "webglcontextlost" src/game/` → must exist after v3.10 close
- Missing `e.preventDefault()` in context-lost handler (without it, three.js auto-fails the restore)

**Test that catches this:**
- Hard to unit-test jsdom (no real WebGL). Add to Phase 20 UAT: open game mode, switch tabs for 5 minutes, return → constellation still renders.

**Violates which Phase 17 decision:** None directly — Phase 17 didn't address this. Phase 20 SHOULD add D-20-CONTEXT-LOSS as a defensive measure given the rAF loop / visibility pause assumes context survives backgrounding.

---

### MOD-07: jsdom + vitest cannot test 3D layout / OrbitControls — false confidence from mocked tests

**What goes wrong:** The existing test infra (`src/test/setup.js:9-11`) stubs `HTMLCanvasElement.prototype.getContext = () => null`. ALL three.js GPU code paths are unreachable in unit tests. Phase 20 tests for OrbitControls, perspective camera matrix, click-vs-drag thresholds will compile and run, but assertions can't verify shader behavior, camera projection, or actual GPU rendering. Result: tests pass green, UAT reveals 5 bugs.

**Why it happens:** jsdom doesn't implement HTMLCanvasElement.prototype.getContext (it would require a full Canvas2D + WebGL implementation). Phase 17 explicitly chose to stub to null so SVG path resolves cleanly. Phase 20 inherits this constraint.

**Consequences:** Test coverage metric stays at ~261 GREEN but actual 3D code is unverified by automated tests. Phase 14 saw a related pattern: `setup.js` documents 21 tests breaking when localStorage bridge was removed (lines 22-25) — same root cause class: environment stub assumption baked into many tests.

**Prevention:**
- ACCEPT the limitation. Test what jsdom CAN test:
  - Click-vs-drag math (pure functions extracted from event handlers)
  - `computeLayout` 3D z values (pure function, fully testable)
  - OrbitControls option-setting (constructor args, autoRotate=false on RM)
  - `controls.dispose()` called on cleanup (mock OrbitControls module, assert dispose-call)
  - Bundle-gate regex for OrbitControls leakage (Node-side scripts)
- For shader / camera projection / actual render: rely on Phase 20 UAT (visual sweep on real browser).
- Add a Phase 20 plan dedicated to UAT script (mirror Phase 17 17-UAT.md scaffold).
- Don't extract testable units into "looks tested" wrappers — extract them HONESTLY: e.g., put `isClickWithinThreshold(downPos, upPos, deltaMs, pointerType)` in a pure module testable in isolation.

**Warning signs (grep / review):**
- New 3D-specific test mocks that DON'T document what they cannot verify
- Test file growth proportional to feature code WITHOUT a corresponding UAT.md scaffold
- Tests asserting `renderer.render` was called — meaningless without GPU output

**Test that catches this (meta):** Code review on `WebGLConstellation.test.js` — does every new test description reflect a thing actually verified, or a thing we wish we verified? Reject "tests" that just exercise code paths without assertions.

**Violates which Phase 17 decision:** D-14-02-LOCALSTORAGE-BRIDGE pattern (Phase 14 setup.js explicitly documents jsdom gaps). Phase 20 inherits the pattern — DO NOT remove the `getContext = () => null` stub.

---

### MOD-08: Pointer pick under 3D projection — picks miss small distant nodes

**What goes wrong:** Phase 17 pointer-pick uses `Math.hypot(px - projX, py - projY) <= pickRadius` (`WebGLConstellation.js:619-624`) — 2D distance in canvas pixels. In 3D, projection of a node to screen depends on perspective: a node at z=-400 projects to fewer canvas pixels than at z=+400. The `computeRadius(node.count, maxCount, 'desktop')` returns NDC-style radii. After perspective projection, a small distant node has ~10% the screen radius of a near node.

**Why it happens:** The existing pick math assumes ortho projection (`(pos.x / 1000) * rect.width`). In 3D, `pos.x, pos.y` are world coords and screen position requires `vec4 clip = projMatrix * viewMatrix * vec4(pos, 1); screenX = (clip.x/clip.w + 1) * 0.5 * rect.width;`.

**Consequences:** Recruiter hovers a "back layer" node, hover doesn't register (pick radius doesn't match projected size). False negative on hover for ~half the nodes. Weight-1 edge reveal stops working on distant nodes. GAME-04 selection works erratically on rotated views.

**Prevention:**
- Replace the 2D ortho pick math with proper Vector3.project() + perspective-aware radius scale:
  ```js
  const screenPos = new Vector3(pos.x, pos.y, pos.z).project(camera)
  const sx = (screenPos.x + 1) * 0.5 * rect.width
  const sy = (1 - (screenPos.y + 1) * 0.5) * rect.height
  // perspective scale factor (matches CRIT-05 shader math)
  const perspectiveScale = rect.height / (2 * Math.tan(fovRad / 2))
  const projectedRadius = computeRadius(...) * perspectiveScale / Math.abs(camera.position.z - pos.z)
  const pickRadius = projectedRadius + 8 // 8px slack
  ```
- Alternative: use three.js `Raycaster` with `params.Points.threshold` set per-frame to a depth-scaled value. Heavier (per-frame raycasting cost), but always correct.

**Warning signs (grep / review):**
- `WebGLConstellation.js:619` math unchanged after v3.10 (`(pos.x / 1000) * rect.width` is ortho-only)
- Missing `Vector3.project(camera)` call in pick path
- Constant pickRadius across all nodes regardless of camera distance

**Test that catches this:** Pure-function test of `projectNodeToScreen(node, camera, canvasSize)` — extract math, unit-test against known camera positions and node coords. Cannot test the full event flow on jsdom.

**Violates which Phase 17 decision:** D-17-HOVERED-PROP (hover callback contract) — if hover stops firing, the prop never updates and the hook can't drive the shader. Indirect violation of GAME-04 selection.

---

### MOD-09: GAME-01 props-contract divergence between SVG + WebGL renderers

**What goes wrong:** Phase 17 locked the props contract: SVG and WebGL renderers receive identical `{ nodes, edges, layout, highlightedSkillIds, selectedSkillId, hoveredSkillId, yearRange, justFilteredId, theme, lang, onSelectSkill, onHoverSkill }` (visible at `WebGLConstellation.js:215-229`). v3.10 introduces 3D layout `{x, y, z}`. SVG renderer cannot meaningfully render z. Options:
- SVG ignores z (current 2D layout used) → contract drift: same props, different visual outputs.
- SVG projects z to opacity/size dim → adds complexity to mobile, +bundle, may exceed mobile ceiling.
- Layout returns BOTH `{x, y}` 2D AND `{x, y, z}` 3D objects, renderers pick → schema split, breaks "same props" symmetry.

**Why it happens:** GAME-01 was a Phase 17 design lock to maintain renderer-swap-ability. v3.10 SEED explicitly accepts the divergence as "adaptive fidelity" (SEED §Risks #1).

**Consequences:** If unmanaged: future renderer additions (e.g., reduced-motion middle path) inherit unclear contract. If managed: clean documented divergence with versioned contract.

**Prevention:**
- Layout returns `{x, y, z}` always. SVG renderer reads only `x, y` (ignores z).
- Add a logged decision D-20-PROPS-CONTRACT: "z is present in layout; SVG ignores; WebGL projects."
- Update `src/game/renderers/SvgConstellation.js` with a 1-line `// z ignored — SVG is 2D-only by design (GAME-01 adaptive fidelity, SEED-3D-CONSTELLATION accepted divergence)` comment near the layout-consumption site.
- Update the existing layout test to assert the renderer-shared `{x, y}` invariant still holds (both renderers see same x, y).

**Warning signs (grep / review):**
- PR that adds z handling to SvgConstellation → contract drift toward complexity (and mobile bundle bloat)
- Missing comment in SvgConstellation explaining the deliberate ignore
- Layout shape diverges per renderer (two layout functions)

**Test that catches this:** `constellation.layout.test.js` — assert layout shape uniform across both renderer consumers (same call returns same object regardless of which renderer reads).

**Violates which Phase 17 decision:** GAME-01 (single props contract spirit) — must be explicitly reframed in Phase 20 milestone log, not silently broken. Seed §Risks/Concerns #1 anticipated this.

---

## Minor Pitfalls

Small but real — catch in code review.

---

### MIN-01: Auto-rotate fights hover-pause

**What goes wrong:** AutoRotate continues spinning while user hovers a node trying to read its label. Recruiter clicks the node → ExperienceCard opens → autoRotate keeps spinning the underlying constellation in the background → visual distraction.

**Prevention:** Pause autoRotate when `hoveredSkillId != null` OR `selectedSkillId != null`:
```js
useEffect(() => {
  if (!controlsRef.current) return
  controlsRef.current.autoRotate =
    !prefersReducedMotion &&
    hoveredSkillId == null &&
    selectedSkillId == null
}, [hoveredSkillId, selectedSkillId, prefersReducedMotion])
```

**Catches:** Code review of the useEffect that wires autoRotate.

---

### MIN-02: Keyboard nav for rotation — should arrow keys orbit?

**What goes wrong:** Phase 15 implemented roving-tabindex keyboard nav (D-15-KB-ACTIVATE) — arrow keys navigate node-to-node. OrbitControls' default keyboard mapping (arrow keys pan camera, +/- zoom) conflicts. Without disabling, arrow keys do both.

**Prevention:**
- Set `controls.enableKeys = false` at init — disables OrbitControls keyboard handling.
- Preserve Phase 15 arrow-key node-traversal pattern.
- If keyboard-rotation is needed for a11y (defensible), use Shift+Arrow for rotation, plain Arrow for node-nav — document in `useConstellation.js`.

**Catches:** `rg "enableKeys" src/game/renderers/` — must be `false`.

---

### MIN-03: Touch-action CSS missing → page scrolls during drag rotate

**What goes wrong:** On mobile (and touchscreen desktop), user drags to rotate but the browser also scrolls the page. OrbitControls calls `preventDefault` on its handlers, but the canvas needs `touch-action: none` CSS to fully suppress scroll.

**Prevention:** Add to `webgl-canvas` class (in `src/index.css` or via Tailwind utility):
```css
.webgl-canvas { touch-action: none; }
```

**Catches:** Manual mobile UAT (Chrome devtools touch emulation). Add to Phase 20 UAT checklist.

---

### MIN-04: Screen reader announcement during rotation

**What goes wrong:** Canvas is `aria-hidden="true"` (`WebGLConstellation.js:718`) so SR users get the sr-only ConstellationFallback (Phase 15 contract). No SR announcement of "constellation is rotating" — correct, by design. BUT: developer may add an `aria-label="3D rotatable constellation"` on the canvas thinking it helps. This would make SR users hear "image" or "graphics" without any context, which is worse than aria-hidden.

**Prevention:** KEEP `aria-hidden="true"` on canvas. SR users use ConstellationFallback DOM list — unchanged.

**Catches:** `rg "aria-hidden" src/game/renderers/WebGLConstellation.js` → must remain `"true"`.

---

### MIN-05: focus-visible ring missing during drag

**What goes wrong:** Canvas has `tabIndex={-1}` (`WebGLConstellation.js:719`) — not keyboard-focusable. Fine. But if a future change makes it focusable, no `:focus-visible` styling will mean keyboard users can't tell when canvas has focus.

**Prevention:** Keep canvas `tabIndex={-1}`. Keyboard nav lives on the role=application wrapper (Phase 15 D-15-KB-ACTIVATE).

**Catches:** `rg "tabIndex" src/game/renderers/WebGLConstellation.js` → must remain `-1`.

---

### MIN-06: Lighthouse desktop perf regression from first-frame raycasting

**What goes wrong:** Per MOD-08, if pick math is replaced with three.js `Raycaster` and runs on EVERY pointermove (Lighthouse desktop preset emulates throttled CPU), first-paint TTI grows. Desktop Lighthouse isn't a HARD gate, but per project Core Value ("stop recruiters mid-scroll"), slow desktop feel hurts conversion.

**Prevention:**
- Throttle pointermove to ~60 Hz (`requestAnimationFrame`-coalesced): only run pick math once per frame, not per pointermove event.
- Or: keep the math-based pick (MOD-08 fix), avoid Raycaster overhead.

**Catches:** Lighthouse desktop run before/after Phase 20 close. Compare TTI delta.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Phase Plan to Cover |
|-------------|----------------|------------|---------------------|
| Layout extension (constellation.layout.js) | CRIT-04 z=0 trap; MOD-01 z magnitude; MOD-09 contract drift | Test asserts z values present, range ≤ ±200; SVG renderer ignores z via comment | Phase 20 Plan 1 (layout + tests) |
| Renderer perspective swap (WebGLConstellation.js) | CRIT-05 size attenuation; MOD-02 z-fighting; MOD-04 thin edges | Shader uniforms uCanvasHeight/uFovRad; edge depthWrite=false; edge alpha-by-angle in fragment shader | Phase 20 Plan 2 (renderer + UAT) |
| OrbitControls integration | CRIT-01 double rAF; CRIT-02 click-vs-drag; CRIT-03 bundle leak; MOD-05 dispose missing; MIN-02 enableKeys | Single rAF, click-gate ref, lazy-import, dispose in cleanup, enableKeys=false | Phase 20 Plan 2 |
| Auto-rotate ambient | CRIT-06 RM violation; MIN-01 hover-pause; MIN-03 touch-action | Defensive RM gate inside renderer; pause on hover/select; CSS touch-action:none | Phase 20 Plan 2 |
| Hover pick under 3D projection | MOD-08 raycaster misses on small distant nodes | Replace ortho pick math with Vector3.project + perspective radius scale | Phase 20 Plan 2 |
| Tests + UAT | MOD-07 jsdom 3D blind spot | Extract pure functions (click-gate, projection, RM gate) for unit test; UAT.md plan for visual sweep | Phase 20 Plan 3 (UAT scaffold) |
| Bundle gate | CRIT-03 OrbitControls leakage | Update `THREE_JS_PATTERN` regex to catch `three/examples/...`; add ORBITCONTROLS pattern; HARD-fail if mobile chunk grows; warn band for webgl chunk > 125 kB | Phase 20 Plan 3 (close gate) |
| Context loss | MOD-06 black box on tab return | Add webglcontextlost/restored handlers, swap to SVG fallback via existing capability hook | Phase 20 Plan 2 (defensive) |

---

## Cross-Phase Integration Pitfalls (v3.8 architecture ↔ v3.10 additions)

| v3.8 contract | v3.10 risk | Required reaffirmation |
|---------------|------------|------------------------|
| D-14-01-LAYOUT (deterministic, zero d3-force) | Tempting to reach for d3-force-3d (~15 kB gz) for nice z-spread | REJECT d3-force-3d. Use category-z clusters per SEED §"Data layer". Phase 20 must log this rejection. |
| D-17-LIB (three.js raw, lazy-only) | OrbitControls static-imports can leak to mobile (CRIT-03) | Dynamic `await import(...)` inside useEffect; update bundle-gate regex |
| D-17-VISUAL (flat 2D-in-3D ortho) | This is the decision being REPLACED — must explicitly supersede | Phase 20 logs D-20-VISUAL-3D superseding D-17-VISUAL |
| D-17-PRIMITIVES (Points + ShaderMaterial) | Shader needs size attenuation update (CRIT-05) | Extend, don't replace; preserve Slice 3 ambient drift + Slice 4 chip-flash code paths |
| D-17-FRAMELOOP (single rAF, visibility pause) | Adding `controls.addEventListener('change', ...)` doubles render (CRIT-01) | KEEP single rAF; add `controls.update()` inside `tick()` only |
| D-17-HOVERED-PROP (callback-out only) | Click-vs-drag gate must preserve "always emit onSelect on confirmed click" (CRIT-02) | Gate decides confirmed-click; on confirm, emit via callback unchanged |
| D-17-EDGE-RGBA (alpha in 4th component, not pre-multiplied) | New per-vertex angle-fade for thin-edge fix (MOD-04) must compose with existing alpha logic | Multiply alpha in fragment shader, not pre-multiply RGB |
| GAME-01 (single props contract) | Layout shape changes to {x, y, z} (MOD-09) | Reframe as "adaptive fidelity" per SEED §Risks #1; log D-20-PROPS-CONTRACT |
| GAME-06 (reduced-motion path) | Auto-rotate could violate (CRIT-06) | Defensive RM gate at renderer + capability gate at orchestrator (belt-and-braces) |
| GAME-07 (Lighthouse mobile HARD gate) | Bundle leakage (CRIT-03) directly threatens | Bundle-gate test extended; CI fails on regex match |

---

## Decision Violations to Flag if Proposed in Phase 20 Planning

| Proposal | Decision Violated | Why Reject |
|----------|-------------------|------------|
| "Use react-three-fiber to make this easier" | D-17-LIB (three.js raw — no R3F overhead) | R3F adds ~25 kB gz + reconciler overhead; current Phase 17 contract is raw three.js. Major architectural change inappropriate for a +5 kB OrbitControls upgrade. |
| "Use d3-force-3d for organic z-spread" | D-14-01-LAYOUT (deterministic, zero d3-force) | +15 kB gz over budget; non-deterministic positions break Phase 14 layout tests; SEED §"Data layer" explicitly rejects. |
| "Switch to Line2/LineGeometry for thick edges" | D-17-LIB tree-shake target | +10 kB gz over the +5 kB OrbitControls budget = ~+15 kB total → desktop chunk 117 → ~132 kB OVER ~125 kB ceiling. Use shader-based alpha boost (MOD-04 Option A) instead. |
| "Show WebGL with autoRotate disabled to reduced-motion users" | D-17-RM-GATE (RM gated to SVG before WebGL mounts) | Doubles A11y review surface; SVG path is the established RM contract. Defensive RM gate inside renderer is belt-and-braces, NOT a relaxation of the capability gate. |
| "Add a Phase 20 mode toggle: 2D / 3D user preference" | GAME-05 (toggle scope: game/dev only) + scope discipline | Scope creep. Single REQ (DEPTH-01) / 1 phase. User preference for 3D depth is out of scope; reduced-motion handles the "less motion" need already. |
| "Move WebGLConstellation out of lazy chunk for faster first paint" | D-17-LIB lazy boundary, GAME-07 mobile gate | Static-imports three.js into main bundle → mobile bundle crosses HARD ceiling. Lazy chunk exists specifically to protect mobile. |
| "Replace `OrthographicCamera` swap with `PerspectiveCamera` only (no layout z change)" | D-14-01-LAYOUT extension, SEED §"Data layer" | CRIT-04 — visually identical result, milestone delivers nothing. Layout MUST extend. |
| "Add Stats.js / dat.gui for tuning" | D-17-LIB tree-shake target | Dev-only tools; if added, must be tree-shaken via `import.meta.env.DEV` guard (same pattern as Phase 17 `FpsCounter.js`). Otherwise +bundle. |
| "Run all 3D tests via headless-gl / @react-three/test-renderer" | MOD-07 + project scope | New dep, new test infra cost; per project retrospective "test infra deferral now has visible cost" but new infra for one phase is poor ROI. Extract pure functions (CRIT-02 click-gate, MOD-08 projection) and test those instead. |

---

## Pitfall Severity → Phase 20 Plan Coverage Matrix

| Pitfall | Severity | Detection Cost | Plan covering it |
|---------|----------|----------------|------------------|
| CRIT-01 single rAF | Critical | Code review + targeted test | Plan 2 (renderer) |
| CRIT-02 click-vs-drag | Critical | Unit test + UAT | Plan 2 + Plan 3 UAT |
| CRIT-03 bundle leakage | Critical | Bundle-gate test (Node CI) | Plan 3 (bundle gate update) |
| CRIT-04 z=0 trap | Critical | Layout test | Plan 1 (layout) |
| CRIT-05 sizeAttenuation | Critical | Visual UAT only | Plan 2 + Plan 3 UAT |
| CRIT-06 autoRotate vs RM | Critical | Lighthouse A11y re-run | Plan 2 + Plan 3 UAT |
| MOD-01 z-clipping | Moderate | UAT rotation sweep | Plan 1 (layout constraint) + Plan 3 UAT |
| MOD-02 z-fighting | Moderate | Visual UAT | Plan 3 UAT |
| MOD-03 touch jitter | Moderate | Touch UAT (Chrome devtools) | Plan 2 + Plan 3 UAT |
| MOD-04 thin edges | Moderate | Visual UAT | Plan 2 (shader fix) |
| MOD-05 dispose missing | Moderate | StrictMode dev console | Plan 2 (cleanup) |
| MOD-06 context loss | Moderate | Long UAT (5min tab switch) | Plan 2 (defensive) |
| MOD-07 jsdom blind spot | Moderate | Plan structure | Plan 3 (UAT.md scaffold) |
| MOD-08 pointer pick | Moderate | Pure-function unit test | Plan 2 |
| MOD-09 contract drift | Moderate | Decision log | Plan 1 (decision) |
| MIN-01 hover-pause | Minor | Code review | Plan 2 |
| MIN-02 enableKeys | Minor | Code review | Plan 2 |
| MIN-03 touch-action | Minor | CSS review | Plan 2 |
| MIN-04 aria-hidden | Minor | Code review | Plan 2 |
| MIN-05 focus-visible | Minor | Code review | Plan 2 |
| MIN-06 Lighthouse desktop | Minor | Lighthouse desktop run | Plan 3 UAT |

---

## Sources

### Code-grounded (HIGH confidence)
- `src/game/renderers/WebGLConstellation.js` — full Phase 17 renderer (Slice 1-4)
- `src/game/constellation.layout.js` — `computeLayout` 2D radial baked
- `src/game/useConstellation.js` — hook with `usePrefersReducedMotion` + hover/select state ownership
- `src/test/setup.js` — jsdom canvas stub + localStorage bridge
- `scripts/check-bundle-gate.mjs` — HARD/WARN/PASS bundle gate with three.js regex
- `.planning/PROJECT.md` — constraints, Key Decisions
- `.planning/seeds/SEED-3D-CONSTELLATION.md` — anticipated risks #1 (renderer divergence), #2 (drag-vs-click), #3 (z-cluster UAT), #4 (mobile gap)
- `.planning/milestones/v3.8-ROADMAP.md` — Phase 14 + Phase 17 locked decisions
- `.planning/RETROSPECTIVE.md` — cross-milestone lessons (test-infra cost; doc-drift; UAT deferral pattern)

### Ecosystem patterns (MEDIUM confidence — verified against three.js docs at threejs.org/docs)
- `OrbitControls.dispose()` requirement for React effect cleanup
- `OrbitControls` default `enablePan: true, enableKeys: true` requiring explicit override
- WebGL `gl.LINES` 1-pixel hardware limitation on Chrome
- `webglcontextlost`/`restored` event spec — three.js `WebGLRenderer.onContextLost` callback hook
- React 18 StrictMode double-effect contract (React docs)
- `touch-action: none` CSS for canvas gesture isolation (MDN)
- Capacitive touchscreen 1-3px noise — common 5-8px threshold UX guidance

### Inferred / not externally verified (LOW-MEDIUM confidence)
- Specific +5 kB gz size of OrbitControls — derived from SEED-3D-CONSTELLATION estimate, not measured against current three.js minor version. Phase 20 should measure via `npm run build` + `du -h dist/assets/WebGLConstellation-*.js`.
- ~10 kB gz Line2 cost — public three.js benchmarks; not project-measured.
- Lighthouse desktop sensitivity to first-frame raycasting — extrapolated from desktop CPU emulation, not measured for this site.
