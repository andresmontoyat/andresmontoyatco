# Technology Stack — v3.10 3D Constellation

**Project:** Carlos Montoya Portfolio — v3.10 milestone (DEPTH-01)
**Researched:** 2026-06-08
**Mode:** Project Research (delta from v3.8/v3.9 — additions only)
**Overall confidence:** HIGH (Context7 + npm registry + installed `node_modules` cross-verified)

> **Supersedes** the 2026-04-21 stack research (which targeted the original brownfield redesign baseline). The Vite 6 + React 18 + Tailwind 3.4 + three.js raw stack is now shipped and locked through Phase 17. This document records only the **deltas** required to add genuine 3D + drag-to-rotate to the existing WebGL constellation.

---

## TL;DR

Adding genuine 3D + drag-to-rotate to the existing three.js raw WebGL constellation requires **zero new npm packages**. The capability is delivered by:

1. Two new imports from the already-installed `three@0.169.0` package: `PerspectiveCamera` (already in `three` core) and `OrbitControls` (already in `three/examples/jsm/controls/OrbitControls.js` ship-with-package addon).
2. A z-axis extension to the pure `computeLayout()` function (no library).
3. ~80 LOC of integration code inside the existing `WebGLConstellation.js`.

**Confirmed costs:** `OrbitControls.js` raw = 32 134 bytes, gzipped = 6 850 bytes (measured against `node_modules` 2026-06-08). Seed estimate of "~5 kB gz" was within ±2 kB; the final figure after Rollup tree-shaking + minification will be **~5–7 kB gz** added to the existing 117 kB gz lazy desktop chunk.

**Explicitly NOT added:** `react-three-fiber`, `@react-three/drei`, `d3-force-3d`, `three-orbit-controls` npm shim. Rationale per dependency below.

---

## Current Stack — Unchanged (do not re-research)

| Layer | Tech | Version | Status |
|-------|------|---------|--------|
| Runtime | Node.js + npm | unpinned | unchanged |
| Build | Vite | 6.4.2 | unchanged |
| UI | React | 18.3.1 | unchanged |
| CSS | Tailwind | 3.4.19 | unchanged |
| WebGL | three.js (raw) | 0.169.0 | **kept** — see "Version compatibility" below |
| Test | Vitest + RTL | 2.1.9 / 16.3.0 | unchanged |
| Environment | jsdom | 25.0.1 | unchanged |
| Bundle analyzer | rollup-plugin-visualizer | 5.14.0 | unchanged |
| Lighthouse | lighthouse | 12.8.2 | unchanged |

---

## Additions / Changes for v3.10

### 1. `PerspectiveCamera` (from `three` core — already installed)

| Item | Value |
|------|-------|
| Import path | `import { PerspectiveCamera } from 'three'` |
| Package | `three@0.169.0` (existing dep) |
| Bundle impact | **~0 bytes** — `PerspectiveCamera` and `OrthographicCamera` share `Camera` base; swapping one ES import for the other is net-neutral after tree-shaking |
| Why | Required for genuine 3D perspective (foreshortening). `OrthographicCamera` cannot foreshorten — that is what makes the current "flat 2D-in-3D" aesthetic so flat |
| Confidence | HIGH — Context7 docs verified |

**Constructor (Context7 verified):** `new PerspectiveCamera(fov, aspect, near, far)`
- `fov`: vertical FOV in degrees, default `50`. **Recommended: `60`** (seed lock — gives a slight wide-angle feel without distortion; matches existing three.js samples for orbit-controlled scenes)
- `aspect`: canvas width/height. **Recommended: tracked live from `canvasRef.current.getBoundingClientRect()` (re-set on resize)**
- `near`: **Recommended `1`** (current ortho near=-1; perspective near must be > 0)
- `far`: **Recommended `2000`** (default; comfortable depth for the planned z-cluster spread of ±150 units around origin)

**Camera position:** `(0, 0, 800)` looking at origin works for the existing 1000×1000 layout footprint at fov=60. Confirm during Phase 20 execute by visually centering nodes.

---

### 2. `OrbitControls` (from `three/addons` — already installed)

| Item | Value |
|------|-------|
| **Modern import path** | `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'` |
| Legacy alias | `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'` (still works — `three/addons/*` is a 1:1 alias to `three/examples/jsm/*` per `package.json` exports map line `"./addons/*": "./examples/jsm/*"`) |
| **Use the `three/addons/` form** | Modern documented path on threejs.org/docs (Context7-verified). Plays correctly with Rollup ESM tree-shaking. |
| Source size | 32 134 bytes raw |
| Gzipped (pre-Vite/Rollup minify) | 6 850 bytes |
| Estimated final bundle add | **~5–7 kB gz** after Rollup minify (terser drops comments/whitespace + dead-branch elimination; OrbitControls has touch/keyboard/zoom paths we may not need but the file is monolithic — pan/zoom we plan to disable still ships as code) |
| Confidence on cost | HIGH (measured against installed file 2026-06-08) |

**Verified default config defaults (Context7):**
- `enableRotate: true` (default) — keep
- `enableZoom: true` (default) — **set to `false`** (scroll-wheel zoom hijack ruins page scroll UX)
- `enablePan: true` (default) — **set to `false`** (right-click pan is irrelevant for a star field)
- `enableDamping: false` (default) — **set to `true`** (smoothing makes drag feel premium; **requires `controls.update()` in rAF loop**)
- `dampingFactor: 0.05` (default when damping enabled)
- `autoRotate: false` (default) — see "Auto-rotate idle pattern" below
- `autoRotateSpeed: 2.0` (default = "30 seconds per orbit at 60fps")

**Events (Context7-verified):** `start`, `change`, `end` — fired on `controls` instance. Used by the click-vs-drag logic in section 5.

**WHY NOT `three-orbit-controls` npm package:** That is a 2017-era shim from before three.js shipped its own addons. It is deprecated, last published 2018, and re-exports an older copy of the same file we already get from `three/addons`. Adding it would duplicate code and pin a stale OrbitControls.

---

### 3. three.js version compatibility — keep `0.169.0`, do not bump

| Question | Answer | Source |
|----------|--------|--------|
| Latest three.js on npm (2026-06-08) | `0.184.0` | `npm view three version` |
| Installed | `0.169.0` (locked via `package-lock.json`) | `package.json` |
| Does `PerspectiveCamera` work on 0.169? | YES — present since r1 (2010) | three.js docs |
| Does `OrbitControls` work on 0.169? | YES — addon shipped in `examples/jsm/` since r109 (2019) | three.js docs |
| Has the OrbitControls API changed between r169 and r184? | NO breaking change in OrbitControls events/properties between r169 and r184 per three.js migration guide | Migration guide (training data + Context7 doc samples reference identical API) |
| Should we bump to `0.184.0`? | **NO** | See rationale ↓ |

**Rationale for staying on 0.169.0:** Phase 17 closed the Lighthouse mobile HARD gate against a build pinned to `three@0.169.0`. Bumping minor versions of three.js can shift the ShaderMaterial GLSL preamble (varying-prefix migration), the BufferAttribute API (e.g. `setUsage` deprecations), and the renderer color management defaults — any of which could silently regress the existing 26-node + 50-edge constellation. v3.10 scope is "add 3D + rotate", not "upgrade three.js". Pin remains `^0.169.0` in `package.json`; `package-lock.json` keeps the resolved version stable.

**Confidence:** HIGH on "0.169.0 supports both PerspectiveCamera and OrbitControls" (Context7 + installed file). MEDIUM on "no breaking change r169→r184 for the APIs we use" (verified the specific symbols we touch, not exhaustive). Phase 20 plan can re-check three.js MIGRATION.md if curious; **no version bump recommended**.

---

### 4. Bundle cost — confirmed via direct measurement

| Asset | Raw | Gzipped | Source |
|-------|-----|---------|--------|
| `three/examples/jsm/controls/OrbitControls.js` | 32 134 B | 6 850 B | `wc -c` + `gzip -c \| wc -c` on installed file, 2026-06-08 |
| Existing WebGL lazy chunk (Phase 17 close) | — | 117 000 B | Phase 17 SC-4 close report |
| Projected post-v3.10 WebGL lazy chunk | — | **~122–125 kB gz** | 117 + 5–7 kB OrbitControls (no other new code substantial enough to register) |
| Mobile SVG chunk | — | 8.91 kB gz | Phase 17 close — **MUST NOT CHANGE** |

**Bundle gate impact:** The desktop WebGL chunk has no Lighthouse HARD ceiling (only mobile does). `scripts/check-bundle-gate.mjs` enforces:
1. Mobile chunk ≤ 38.82 kB gz HARD — **untouched by v3.10** (mobile uses SvgConstellation, not WebGLConstellation)
2. three.js absence regex in mobile chunk — **stays clean** (we are not introducing any three import outside the `React.lazy`-gated path)
3. WebGLConstellation chunk existence — still satisfied

**Confidence on no mobile regression:** HIGH (the lazy boundary is `React.lazy(() => import('./renderers/WebGLConstellation.js'))` from GameMode.js — adding the OrbitControls import inside WebGLConstellation.js stays inside the desktop-only chunk).

---

### 5. Click-vs-drag — DO NOT use OrbitControls events alone

**The problem:** Current canvas has an `onClick` listener that calls `onSelectSkill(matched)` on the picked node (WebGLConstellation.js lines 646–649). When OrbitControls is attached, a "click" that involves any micro-drag will both rotate the camera AND fire `onSelectSkill` — recruiter ends up selecting a skill they did not mean to.

**The pattern (Context7-verified — three.js manual `indexed-textures.html`):**

```js
const maxClickTimeMs = 200
const maxMoveDeltaSq = 5 * 5  // 5 px threshold, squared to skip sqrt
let startTimeMs = 0
let startX = 0
let startY = 0

function onPointerDown(e) {
  startTimeMs = performance.now()
  startX = e.clientX
  startY = e.clientY
}

function onClick(e) {
  const dt = performance.now() - startTimeMs
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  const moveSq = dx * dx + dy * dy
  if (dt > maxClickTimeMs) return        // too slow → drag
  if (moveSq > maxMoveDeltaSq) return    // too far → drag
  const matched = pickAt(e.clientX, e.clientY)
  if (matched != null && onSelectSkill) onSelectSkill(matched)
}
```

**Recommended thresholds (locked from Context7 example):**
- Time: **200 ms** (above this → assume drag)
- Movement: **5 px** in any direction (above this → assume drag)
- These are both/and — both must pass to count as a click

**WHY NOT OrbitControls `start`/`end` events alone:** `controls.addEventListener('start', ...)` fires on `pointerdown` regardless of whether the user actually drags. A naïve "set isDragging=true on start, suppress click if isDragging" would suppress every click. The time+distance threshold pattern is what the official three.js manual recommends for exactly this case.

**Pointer events:** keep the existing `pointermove` / `pointerleave` listeners for hover (BLOCKER 2 from Phase 17 — `onHoverSkill` callback contract). Hover during a drag is acceptable (no functional harm) and may even be desirable visual feedback.

**Confidence:** HIGH (Context7 source: three.js manual `indexed-textures.html` is the canonical reference for this exact pattern).

---

### 6. Auto-rotate idle pattern — use OrbitControls.autoRotate

**Recommendation:** Use `controls.autoRotate = true` + `controls.autoRotateSpeed`. **Do NOT hand-roll a custom rAF rotation loop.**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| `controls.autoRotate = true` | Built-in, ~0 LOC, respects damping, integrates with user-drag-then-resume | Always rotates azimuth around `controls.target` (no axis choice) — fine for constellation centered at origin | **RECOMMEND** |
| Custom rAF uniform | Full control over axis, can do non-azimuthal motion | More code, must coordinate with OrbitControls' own rotation math, risk of fighting damping | Avoid unless azimuth feels wrong in UAT |

**Required wiring (from Context7 docs):**
1. `controls.autoRotate = true`
2. `controls.autoRotateSpeed = 1.0` (default 2.0 = 30 s/orbit at 60 fps. **Recommended 1.0** = 60 s/orbit — leisurely; recruiter has time to read before camera reframes)
3. **MUST call `controls.update()` in the rAF tick** — both `enableDamping` and `autoRotate` require this. Existing tick function in WebGLConstellation.js line 674 already runs every frame; add `controlsRef.current?.update()` as first line of `tick()`.

**Idle detection:** Optional polish — pause auto-rotate while user is actively dragging by toggling `controls.autoRotate = false` on `controls` `start` event, re-enable on `controls` `end` event + a delay (e.g. 3 s of inactivity). MVP can ship with always-on auto-rotate; user drag interrupts via OrbitControls' own input handling. Iterate in UAT if recruiters find it disorienting.

**`prefers-reduced-motion`:** Reduced-motion users are already gated to SvgConstellation before WebGLConstellation mounts (Phase 17 `useRendererCapability`). No auto-rotate logic needs to gate on this — it never runs for those users.

**Confidence:** HIGH (Context7 `webgpu_tsl_vfx_linkedparticles.html` and OrbitControls `autoRotateSpeed` doc verified).

---

### 7. NO `d3-force-3d` — extend `computeLayout()` with deterministic z

| Question | Answer |
|----------|--------|
| Do we need a physics engine for 3D layout? | **NO** |
| Why not? | D-14-01-LAYOUT mandates **deterministic** baked layout (zero d3-force in client). Same principle applies in 3D: layout must be reproducible across reloads, testable in pure Vitest, and free of frame-coupled physics. |
| What replaces d3-force-3d? | Extension of `src/game/constellation.layout.js` `computeLayout()` to return `{x, y, z}` per node. The recommended approach (seed-aligned): **category-z clusters** — each category gets a deterministic z plane. |

**Recommended z assignment (matches seed SEED-3D-CONSTELLATION):**

```js
// Add to src/game/constellation.layout.js
const CATEGORY_Z = {
  // backend/data layers visually "deeper"
  hardware: -200,
  data:     -150,
  arch:     -100,
  cloud:     -50,
  security:    0,
  devops:     50,
  ai:        100,
  lang:      150,  // "closest" / most-touched / most-recruiter-facing
}

// In computeLayout(), inside the cluster loop:
const z = CATEGORY_Z[cat] ?? 0
layout[catNodes[i].id] = {
  x: centroid.x + radius * Math.cos(angle),
  y: centroid.y + radius * Math.sin(angle),
  z,  // NEW
}
```

**Why this z ordering (design rationale, not stack-locked):** The seed proposes that z communicates "architecture stack" — hardware/data at the bottom (z most negative = deepest), application languages at the top (z most positive = closest to viewer). Recruiter intuitively reads "this guy stacks his abstractions correctly." Phase 20 plan can revisit specific values during UAT.

**Alternatives considered & rejected:**

| Alternative | Why rejected |
|-------------|--------------|
| `d3-force-3d` (~15 kB gz) | Violates D-14-01-LAYOUT (non-deterministic, requires physics ticks, baked positions are the whole point) |
| `procedural z = sin(idx) * 100` | Loses semantic meaning. Category-z carries information; pure-math z is just noise. Cheaper but less interesting. |
| Per-node random z with seeded PRNG | Same problem — semantically empty, just adds depth without communicating anything |
| `three-forcegraph` library | Brings d3-force-3d transitively + much larger bundle + opinionated rendering that fights existing ShaderMaterial code |

**Confidence:** HIGH on the rejection of d3-force-3d (decision D-14-01-LAYOUT is explicit). The specific z values are a design call — Phase 20 plan flagged to validate via 1-day UAT (per seed's "Risks / Concerns" #3).

---

### 8. Shader / size-attenuation by depth — custom ShaderMaterial update, NOT PointsMaterial

**Current state:** WebGLConstellation uses a custom `ShaderMaterial` (lines 334–356), not `PointsMaterial`. The shader computes `gl_PointSize` directly (line 173).

**`PointsMaterial.sizeAttenuation` does NOT apply** because that property is consumed by three.js's built-in PointsMaterial shader, which our custom ShaderMaterial bypasses entirely.

**What we need to add to VERTEX_SHADER:**

The current vertex shader (line 173) sets `gl_PointSize = size * uDpr * (1.0 + (uHaloPulse - 1.0) * halo) * flashScale;`. With PerspectiveCamera, points at z=-200 should appear smaller than points at z=+150. The standard three.js approach for size-attenuated points in a custom shader (Context7 verified pattern):

```glsl
vec4 mvPosition = modelViewMatrix * vec4(drifted, 1.0);
gl_PointSize = size * uDpr * (1.0 + (uHaloPulse - 1.0) * halo) * flashScale;
gl_PointSize *= (300.0 / -mvPosition.z);  // size attenuation by depth
gl_Position = projectionMatrix * mvPosition;
```

The `300.0 / -mvPosition.z` factor is the conventional three.js PointsMaterial attenuation formula (300 = scaleByViewport constant; the value should be tuned during Phase 20 to keep the existing front-plane size roughly matched).

**Confidence:** HIGH — this is the documented three.js pattern for perspective Point size attenuation in custom ShaderMaterial.

---

### 9. Vitest mocking — what additional mocks are needed

**Current state (src/test/setup.js):**
- `HTMLCanvasElement.prototype.getContext = () => null` — forces capability detection to "no WebGL" so SvgConstellation renders (line 9–11)
- `localStorage` / `sessionStorage` bridge for Node 22+

**Impact of OrbitControls on jsdom:** OrbitControls listens to `pointerdown`/`pointermove`/`pointerup`/`wheel`/`keydown` on the renderer's domElement. In jsdom these events exist but are inert (no real pointer hardware). Constructor itself only stores refs.

**The good news:** The existing `getContext = () => null` mock means WebGLConstellation **never actually instantiates** in unit tests — `detectCapabilities()` returns "no WebGL", `useRendererCapability` returns the SVG path, and `React.lazy(() => import('./WebGLConstellation.js'))` is never resolved. **No additional mocks needed for the current test strategy.**

**If we wanted to unit-test OrbitControls integration (not recommended for MVP):**
- jsdom does not implement `WebGLRenderingContext`, so OrbitControls' constructor call against `renderer.domElement` would crash on the WebGL renderer instantiation, not on OrbitControls itself
- Would need to mock `three` module's `WebGLRenderer`, `Scene`, etc. — Vitest `vi.mock('three', ...)` pattern
- **Recommended instead:** Test OrbitControls integration via manual UAT (Phase 20 UAT checklist), not via Vitest. Three.js + jsdom is a known-painful combo and the team has already accepted this approach in Phase 17 (Slice 1 mocks canvas to null; no integration tests for the WebGL renderer itself).

**Confidence:** HIGH — verified against existing test infra. **No setup.js changes recommended for Phase 20.**

---

### 10. Why NOT `react-three-fiber` (`@react-three/fiber`) — still

| Reason | Detail |
|--------|--------|
| D-17-LIB locked | Phase 17 explicitly chose `three` raw over react-three-fiber to control bundle floor |
| Bundle cost | `@react-three/fiber` adds ~25–35 kB gz on top of three core; `@react-three/drei` (the OrbitControls helper component) adds another ~30 kB gz. We need only ~5 kB gz of OrbitControls itself |
| Reconciler complexity | r3f's reconciler runs on top of React Fiber — for 26 Points + 50 edges + an existing imperative rAF loop, the reconciler is pure overhead |
| Migration cost | Phase 17 shipped ~500 LOC of imperative `useEffect` + `BufferGeometry` + `ShaderMaterial` code. Rewriting to declarative `<Points>` / `<LineSegments>` JSX with `useFrame` is a full refactor with regression risk against an already-shipped Lighthouse-gated build |
| What we gain by adding it | Almost nothing for this milestone — the only "ergonomic win" would be `<OrbitControls />` JSX, which is ~5 LOC of useEffect work in raw three.js |

**Locked:** Keep three.js raw. Do **not** add `@react-three/fiber` or `@react-three/drei`. This decision survives v3.10 unchanged.

---

## Installation

```bash
# Nothing to install. Both PerspectiveCamera and OrbitControls
# ship inside the already-installed three@0.169.0 package.
#
# Verify in code review that imports use these two exact paths:
#   import { PerspectiveCamera } from 'three'
#   import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
```

**No `package.json` change required for v3.10.** `npm install` is unnecessary. `package-lock.json` stays untouched.

---

## Integration points (where the new code lands)

| File | Change | Approx LOC |
|------|--------|-----------|
| `src/game/constellation.layout.js` | Extend `computeLayout()` to return `{x, y, z}` (CATEGORY_Z constant + add `z` key in cluster loop) | +12 LOC, -0 LOC |
| `src/game/constellation.layout.test.js` | Update layout shape assertions to `{x, y, z}` | +6 LOC |
| `src/game/renderers/WebGLConstellation.js` | Swap OrthographicCamera → PerspectiveCamera; add OrbitControls; add controlsRef; add `controls.update()` to rAF tick; add click-vs-drag threshold to existing onClick; update VERTEX_SHADER position attribute write to use `node.z`; add size-attenuation by depth to gl_PointSize | +40 LOC, -8 LOC |
| `src/game/renderers/SvgConstellation.js` | **NO CHANGE** — mobile SVG path stays 2D, ignores z (drop the z key on read) | 0 LOC |
| `src/test/setup.js` | **NO CHANGE** — existing getContext=null mock skips OrbitControls instantiation in unit tests | 0 LOC |
| `package.json` | **NO CHANGE** | 0 LOC |
| `vite.config.js` | **NO CHANGE** | 0 LOC |

**Total integration footprint:** ~58 LOC of net additions across 3 files. Matches seed estimate of "Mostly inside `src/game/constellation.layout.js` + `src/game/renderers/WebGLConstellation.js` + their tests. Zero new files."

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Camera | `PerspectiveCamera` (three core) | Keep `OrthographicCamera` + fake depth via per-node scale | Defeats the entire purpose of v3.10; foreshortening is what sells "3D" |
| Drag-to-rotate | `OrbitControls` from `three/addons` | Hand-rolled pointer event quaternion rotation | OrbitControls is 6.85 kB gz of well-tested, damping-aware, touch-aware code. Reimplementing well costs more LOC than we save |
| Drag-to-rotate | `OrbitControls` from `three/addons` | `TrackballControls` from `three/addons` | Trackball gives free-axis rotation (no "up" lock) — disorienting for a star field. OrbitControls' azimuth+polar with `up = +Y` lock matches recruiter expectations |
| Drag-to-rotate package | `three/addons` (ship-with-three) | `three-orbit-controls` npm package | Deprecated 2018 shim; duplicates code we already have |
| 3D layout | Extend `computeLayout()` with category-z | `d3-force-3d` (~15 kB gz) | Violates D-14-01-LAYOUT (non-deterministic); breaks baked-position contract |
| 3D layout | Category-z (semantic) | Procedural `sin(idx) * 100` (procedural) | Cheaper but semantically empty — wastes the opportunity to communicate architecture stacking |
| WebGL wrapper | three.js raw (status quo) | `@react-three/fiber` + `@react-three/drei` | +60 kB gz, requires full refactor of working shader code, no functional gain |
| Click-vs-drag | Time+distance threshold (200 ms / 5 px) | OrbitControls `start`/`end` events | `start` fires on every pointerdown — would suppress every click. Time+distance is what three.js manual itself recommends |
| Auto-rotate | `controls.autoRotate + autoRotateSpeed` | Custom rAF uniform | OrbitControls auto-rotate respects damping, integrates with user-drag interrupt for free |
| Size attenuation | Custom ShaderMaterial `gl_PointSize *= 300 / -mvPosition.z` | Migrate to PointsMaterial with `sizeAttenuation: true` | Would discard ~100 LOC of working custom GLSL (ambient drift, chip-flash, halo) — non-starter |

---

## Sources

**Context7 (HIGH confidence):**
- `/mrdoob/three.js` — Three.js library docs (resolved via `ctx7 library three`)
- `three/addons/controls/OrbitControls.js` modern import path — three.js docs `pages/OrbitControls.html` + manual `fundamentals.html` + `backgrounds.html`
- `PerspectiveCamera(fov, aspect, near, far)` constructor — three.js docs `pages/PerspectiveCamera.html.md`
- `OrbitControls.autoRotate` + `autoRotateSpeed` semantics — three.js docs `pages/OrbitControls.html`
- `OrbitControls.enableDamping` + `enableZoom` + `enablePan` properties — three.js docs `pages/OrbitControls.html`
- `OrbitControls` `start`/`change`/`end` events — three.js docs `pages/OrbitControls.html.md`
- Click vs drag pattern (200 ms / 5 px threshold) — three.js manual `indexed-textures.html`
- `PointsMaterial.sizeAttenuation` semantics — three.js docs `pages/PointsMaterial.html`
- Custom shader size-attenuation formula `300.0 / -mvPosition.z` — derived from three.js PointsMaterial built-in shader pattern (Context7 example snippets)

**Direct measurement (HIGH confidence):**
- npm registry: `three@0.184.0` latest, `three@0.169.0` installed (`npm view three version`)
- `OrbitControls.js` raw 32 134 B / gz 6 850 B (`wc -c` + `gzip -c` on `node_modules/three/examples/jsm/controls/OrbitControls.js`, 2026-06-08)
- `three/package.json` exports map confirms `./addons/* = ./examples/jsm/*` 1:1 alias

**Project context (HIGH confidence — read-in files):**
- `.planning/PROJECT.md` — milestone v3.10 scope
- `.planning/seeds/SEED-3D-CONSTELLATION.md` — seed scoping
- `.planning/milestones/v3.8-ROADMAP.md` — D-14-01-LAYOUT, D-17-LIB, D-17-PRIMITIVES, D-17-HOVERED-PROP locked
- `src/game/renderers/WebGLConstellation.js` — current implementation (725 LOC)
- `src/game/constellation.layout.js` — current 2D layout (81 LOC)
- `src/test/setup.js` — current jsdom canvas mock
- `vite.config.js` — Vite 6 + Vitest test config
- `package.json` — three@^0.169.0 confirmed
