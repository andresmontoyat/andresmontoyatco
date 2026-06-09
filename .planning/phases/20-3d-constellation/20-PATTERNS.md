# Phase 20: 3D Constellation — Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 13 (7 modified + 6 new)
**Analogs found:** 13 / 13 (100% — every new/modified file has a strong codebase analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/game/constellation.layout.js` (MOD) | data layer (pure fn) | transform / deterministic-output | (self — extend in place) | exact (in-place extension) |
| `src/game/constellation.layout.test.js` (MOD) | test (pure-fn) | assertion-only | (self — append cases) | exact (in-place extension) |
| `src/game/renderers/WebGLConstellation.js` (MOD) | renderer (canvas, useEffect orchestrator) | rAF-loop + event listeners + GPU-resource lifecycle | (self — extend in place; Phase 17 Slice 4 patterns) | exact (in-place extension) |
| `scripts/check-bundle-gate.mjs` (MOD) | build-config (Node ESM script) | filesystem read → regex match | (self — line 12 regex widening) | exact (regex-only edit) |
| `src/game/GameMode.js` (MOD) | orchestrator (renderer slot composer) | props-down + context | (self — slot OnboardingHint inside renderer wrapper) | exact (in-place extension) |
| `src/i18n/translations.js` (MOD) | i18n data | static dict lookup | (self — extend `t.game.*` namespace) | exact (in-place extension) |
| `tailwind.config.js` (MOD/verify) | build-config (Tailwind theme) | static config | (self — verify `animate-hint-fade-out` present) | verify-only |
| `src/game/useClickVsDrag.js` (NEW) | hook (thin, props-down) | event-listener attach + threshold math | `src/context/ViewModeContext.js` + `src/game/useRendererCapability.js` | role + flow match |
| `src/game/useClickVsDrag.test.js` (NEW) | test (pure jsdom unit) | assertion + RTL `renderHook` / `fireEvent` | `src/game/useConstellation.test.js` + `src/context/ViewModeContext.test.js` | role + flow match |
| `src/game/OnboardingHint.js` (NEW) | component (presentational button + lifecycle) | useEffect timer + localStorage gate + i18n | `src/game/renderers/SvgConstellation.js` (hint pill block lines 385-389) + `src/context/ViewModeContext.js` (localStorage pattern) | exact (hint-pill precedent) |
| `src/game/OnboardingHint.test.js` (NEW) | test (RTL render + interaction) | render + fireEvent + localStorage assertion | `src/game/renderers/SvgConstellation.test.js` + `src/context/ViewModeContext.test.js` | role + flow match |
| `.planning/phases/20-3d-constellation/20-UAT.md` (NEW) | docs (UAT scaffold) | manual checklist | `.planning/phases/16-filters-floating-experiencecard/16-UAT.md` | exact (Phase 16 UAT precedent) |

---

## Pattern Assignments

### `src/game/constellation.layout.js` (data layer, transform)

**Analog:** self — extend in place. Current pure-function shape (lines 1-81).

**Imports / module-scope constants pattern** (current lines 12-17 → extend by appending `CATEGORY_Z`):
```javascript
// EXISTING module-scope constants (lines 12-17)
const CATEGORY_ORDER = ['lang', 'ai', 'arch', 'cloud', 'devops', 'security', 'data', 'hardware']
const CANVAS_CENTER = { x: 500, y: 500 }
const CATEGORY_RING_RADIUS = 320
const NODE_CLUSTER_RADIUS = 80

// NEW (D-20-CONTEXT-ZMAP) — append after NODE_CLUSTER_RADIUS:
// CATEGORY_Z values are starting points — UAT-tunable. Consult v3.10-UAT.md
// before adjusting after milestone close.
const CATEGORY_Z = {
  ai: 150,
  lang: 75,
  arch: 0,
  data: -25,
  cloud: -75,
  devops: -100,
  security: -125,
  hardware: -150,
}
```

**JSDoc + return-shape pattern** (current lines 19-25 → update return shape comment):
```javascript
/**
 * Compute deterministic baked positions for a set of nodes, clustered by category.
 *
 * @param {Array} nodes - Array of node objects with { id, category }
 * @returns {Object} Map of node.id → { x, y, z }   // ← UPDATE: add z
 */
```

**Layout-assignment pattern** (current lines 61-76 → extend `layout[id] = {x, y}` to `{x, y, z}`):
```javascript
// EXISTING (line 63 — single-node branch)
layout[catNodes[0].id] = { x: centroid.x, y: centroid.y }
// EXTEND TO:
layout[catNodes[0].id] = { x: centroid.x, y: centroid.y, z: CATEGORY_Z[cat] ?? 0 }

// EXISTING (lines 72-75 — multi-node branch)
layout[catNodes[i].id] = {
  x: centroid.x + radius * Math.cos(angle),
  y: centroid.y + radius * Math.sin(angle),
}
// EXTEND TO:
layout[catNodes[i].id] = {
  x: centroid.x + radius * Math.cos(angle),
  y: centroid.y + radius * Math.sin(angle),
  z: CATEGORY_Z[cat] ?? 0,
}
```

**Key constraint:** Two assignment sites (lines 63 and 72-75) — both must be updated identically. `CATEGORY_Z[cat] ?? 0` defends against future category additions where the `CATEGORY_Z` map hasn't been updated yet.

---

### `src/game/constellation.layout.test.js` (test, pure-fn)

**Analog:** self — append 3 z-tests after existing `describe('computeLayout - category clustering', ...)` block (line 103).

**Imports + fixture builder pattern** (current lines 1-10):
```javascript
import { describe, it, expect } from 'vitest'
import { computeLayout } from './constellation.layout.js'
import { buildConstellationGraph } from './constellation.graph.js'
import EXPERIENCE from '../data/experience.js'
import { SKILL_CATEGORIES, SKILLS } from '../data/skills.js'

function buildTestNodes() {
  const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
  return nodes
}
```

**Existing test-shape pattern** (lines 12-31, for the new z-tests to mirror):
```javascript
describe('computeLayout - interface', () => {
  it('should return one position per node id', () => {
    const nodes = buildTestNodes()
    const layout = computeLayout(nodes)
    expect(typeof layout).toBe('object')
    expect(layout).not.toBeNull()
    for (const node of nodes) {
      expect(layout[node.id], `missing position for node ${node.id}`).toBeDefined()
      const pos = layout[node.id]
      expect(typeof pos.x).toBe('number')
      expect(typeof pos.y).toBe('number')
    }
  })
  // ...
})
```

**New z-tests to append (Plan 20-01 deliverable):**
- `describe('computeLayout - z storytelling (D-20-CONTEXT-ZMAP)', ...)` block with:
  1. `should assign a numeric z to every node` — mirror the `typeof pos.x === 'number'` style on `pos.z`.
  2. `should cluster nodes by category in z` — assert all nodes in a category share the same `.z` (e.g., all `lang` nodes have z=75).
  3. `should produce ≥ 2 distinct z values across the constellation` — defends CRIT-04 z=0 trap.
  4. `should keep z in range [-200, 200]` — defends MOD-01 z-clipping window.
  5. `should be deterministic across calls` (mirror line 34 pattern, adding `.z` comparison).

---

### `src/game/renderers/WebGLConstellation.js` (renderer, rAF + GPU lifecycle)

**Analog:** self — extend Phase 17 Slice 4 patterns in place. 725 LOC; integration sites are scattered — call them out precisely.

**Imports pattern** (current lines 1-13 — extend with PerspectiveCamera + OrbitControls):
```javascript
import React, { useRef, useEffect } from 'react'
import {
  Scene,
  OrthographicCamera,    // ← REMOVE (or keep if dual-path retained briefly)
  PerspectiveCamera,     // ← ADD (replaces OrthographicCamera)
  Vector3,               // ← ADD (perspective-aware pick math, MOD-08)
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  LineBasicMaterial,
  Points,
  LineSegments,
  Color,
} from 'three'
// ← ADD: modern addons path (bundle-gate regex MUST be widened first per Plan 20-01)
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
```

**Camera-swap pattern** (current line 250 — single-line replace):
```javascript
// EXISTING (line 250)
const camera = new OrthographicCamera(0, 1000, 0, 1000, -1, 1)
cameraRef.current = camera

// REPLACE WITH (D-20-VISUAL-3D):
const canvas = canvasRef.current
const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1)
const camera = new PerspectiveCamera(55, aspect, 10, 2000)
// D-20-CONTEXT-INITIAL-ANGLE — tilted ~15° azimuth, ~10° polar at orbit radius 500
camera.position.set(
  Math.sin((15 * Math.PI) / 180) * 500,  // ≈ 129
  Math.sin((10 * Math.PI) / 180) * 500,  // ≈ 87
  Math.cos((15 * Math.PI) / 180) * 500,  // ≈ 483
)
camera.lookAt(0, 0, 0)
cameraRef.current = camera
```

**Z-coordinate write-through** (current line 295 — change `0` to `pos.z ?? 0`):
```javascript
// EXISTING (line 295) — flat plane bug (CRIT-04)
positions[i * 3 + 2] = 0
// REPLACE WITH:
positions[i * 3 + 2] = pos.z ?? 0
```

**OrbitControls instantiation pattern** (NEW — add inside the same useEffect after camera setup, before scene.add):
```javascript
// D-20-VISUAL-3D — OrbitControls drag-to-rotate (PITFALLS §CRIT-02 ordering: attach FIRST, before our pick handlers in the separate useEffect below)
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.rotateSpeed = 0.6
controls.enableZoom = false       // protects page scroll
controls.enablePan = false        // prevents target drift
controls.enableKeys = false       // preserves Phase 15 D-15-KB-ACTIVATE (D-20-CONTEXT-KB-NOORBIT)
controls.minPolarAngle = Math.PI * 0.15
controls.maxPolarAngle = Math.PI * 0.85
// D-20-CONTEXT-AUTOROTATE-RESUME — defensive RM gate (belt-and-braces; useRendererCapability already routes RM users to SVG)
const prefersRM = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
controls.autoRotate = !prefersRM
controls.autoRotateSpeed = 0.5
controlsRef.current = controls

// Pause-on-first-drag (permanent for session — D-20-CONTEXT-AUTOROTATE-RESUME)
const onControlsStart = () => {
  controls.autoRotate = false
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem('cam-3d-hint-seen', 'true') } catch (e) { /* blocked */ }
  }
  // Emit dismiss signal so OnboardingHint unmounts (see GameMode integration below)
  if (onFirstDrag) onFirstDrag()
}
controls.addEventListener('start', onControlsStart)
```

**Single-rAF tick() pattern** (current lines 674-690 — ADD `controls.update()` as the FIRST line of `tick()`, never a `'change'` listener):
```javascript
// EXISTING (line 674)
function tick(t) {
  const dt = (t - lastT) / 1000
  // ...
}

// EXTEND TO (D-17-FRAMELOOP preserved per CRIT-01):
function tick(t) {
  // D-20-VISUAL-3D — controls.update() FIRST per CRIT-01. NEVER add
  // controls.addEventListener('change', renderer.render) — would double GPU work.
  if (controlsRef.current) controlsRef.current.update()

  const dt = (t - lastT) / 1000
  // ... (existing uTime / uHaloPulse / uHighlightAlpha logic unchanged)
}
```

**Dispose discipline** (current lines 416-423 — MOD-05: `controls.dispose()` FIRST in cleanup):
```javascript
// EXISTING cleanup (lines 416-423)
return () => {
  // Pitfall 8: dispose GPU resources to prevent leak on renderer swap.
  geometry.dispose()
  material.dispose()
  edgeGeometry.dispose()
  edgeMaterial.dispose()
  renderer.dispose()
}

// EXTEND TO:
return () => {
  // MOD-05 — controls.dispose() FIRST so React StrictMode double-mount
  // doesn't leak event listeners.
  if (controlsRef.current) {
    controlsRef.current.removeEventListener('start', onControlsStart)
    controlsRef.current.dispose()
    controlsRef.current = null
  }
  geometry.dispose()
  material.dispose()
  edgeGeometry.dispose()
  edgeMaterial.dispose()
  renderer.dispose()
}
```

**`webglcontextlost` / `webglcontextrestored` handlers** (NEW — D-20-CONTEXT-LOSS; add inside same useEffect, after canvas event wiring):
```javascript
// D-20-CONTEXT-LOSS — defensive; SVG swap is preferred (MOD-06)
function onContextLost(e) {
  e.preventDefault()  // signals "we will recover" to the browser
  if (onContextLossCallback) onContextLossCallback()  // GameMode swaps to SVG via capability hook
}
function onContextRestored() {
  // Defensive: prefer to STAY on SVG once swapped. No re-mount of WebGL.
}
canvas.addEventListener('webglcontextlost', onContextLost)
canvas.addEventListener('webglcontextrestored', onContextRestored)
// ... add corresponding removeEventListener in cleanup
```

**Pointer-pick rewrite pattern** (current lines 615-630 — MOD-08: replace `pos.x / 1000 * rect.width` with `Vector3.project(camera)`):
```javascript
// EXISTING flat 2D pick (lines 619-621)
const projX = (pos.x / 1000) * rect.width
const projY = (pos.y / 1000) * rect.height
const dist = Math.hypot(px - projX, py - projY)

// REPLACE WITH (D-20-VISUAL-3D pointer-pick):
const v = new Vector3(pos.x, pos.y, pos.z ?? 0)
v.project(camera)  // NDC: -1..+1
const projX = (v.x * 0.5 + 0.5) * rect.width
const projY = (-v.y * 0.5 + 0.5) * rect.height
// Depth-scaled pick radius — far nodes need smaller pick area in screen space.
// `v.z` is post-projection depth ∈ [-1, +1]; pull depth scale factor from it.
const depthScale = Math.max(0.4, 1.0 - v.z * 0.3)
const dist = Math.hypot(px - projX, py - projY)
const radius = computeRadius(node.count, maxCount, 'desktop') * depthScale
const pickRadius = radius + 8
```

**`useClickVsDrag` integration pattern** (NEW — Plan 20-03 wiring inside existing pointer event useEffect ~line 615):
```javascript
// Replace existing `function onClick(e)` (line 646) with click-vs-drag-gated handler:
const dragRef = useRef({ startX: 0, startY: 0, startT: 0, isDrag: false, pointerType: 'mouse' })

function onPointerDown(e) {
  dragRef.current = {
    startX: e.clientX,
    startY: e.clientY,
    startT: performance.now(),
    isDrag: false,
    pointerType: e.pointerType || 'mouse',
  }
}

function onPointerUp(e) {
  const { startX, startY, startT, pointerType } = dragRef.current
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  const dist = Math.hypot(dx, dy)
  const dt = performance.now() - startT
  const distThreshold = pointerType === 'touch' ? 8 : 5  // MOD-03
  const timeThreshold = 250
  if (dist < distThreshold && dt < timeThreshold) {
    // CLICK confirmed — fire pick
    const matched = pickAt(e.clientX, e.clientY)
    if (matched != null && onSelectSkill) onSelectSkill(matched)
  }
  // else DRAG — OrbitControls already consumed the gesture
}

canvas.addEventListener('pointerdown', onPointerDown)
canvas.addEventListener('pointerup', onPointerUp)
// Remove the existing 'click' listener — pointerup is now the click path.
```

**Shader size-attenuation extension** (current VERTEX_SHADER lines 133-176 — CRIT-05: add `uCanvasHeight` + `uFovRad` uniforms + perspective formula):
```glsl
// EXISTING (line 173)
gl_PointSize = size * uDpr * (1.0 + (uHaloPulse - 1.0) * halo) * flashScale;

// REPLACE WITH (CRIT-05 size-attenuation by depth):
// uCanvasHeight (px) + uFovRad (radians) uploaded from JS on mount + resize.
float perspectiveScale = uCanvasHeight / (2.0 * tan(uFovRad / 2.0));
float depthFactor = perspectiveScale / max(-mvPosition.z, 0.001);
gl_PointSize = clamp(
  size * uDpr * (1.0 + (uHaloPulse - 1.0) * halo) * flashScale * depthFactor,
  1.0,
  64.0
);
```

`mvPosition` must already exist or be computed: add `vec4 mvPosition = modelViewMatrix * vec4(drifted, 1.0);` before `gl_PointSize`, then reuse `mvPosition` for `gl_Position`.

**New uniforms** (added to `material.uniforms`, current lines 339-355):
```javascript
uCanvasHeight: { value: canvas.clientHeight || 600 },  // updated on ResizeObserver
uFovRad: { value: (55 * Math.PI) / 180 },              // constant for current fov
```

---

### `scripts/check-bundle-gate.mjs` (build-config, regex match)

**Analog:** self — single-line regex widening at line 12.

**Current bug** (line 12):
```javascript
const THREE_JS_PATTERN = /THREE\.|from\s*['"]three['"]/
```

**Fix (CRIT-03 — must land BEFORE OrbitControls import in Plan 20-01):**
```javascript
// Widened to catch `three`, `three/addons/*`, `three/examples/jsm/*` leaks
const THREE_JS_PATTERN = /THREE\.|from\s*['"]three(\/[^'"]+)?['"]/
```

**Regression-fixture pattern** (current usage at line 33 — error-throw shape preserved):
```javascript
// EXISTING (line 33) — leave as-is; only the regex above changes
if (THREE_JS_PATTERN.test(mobileBuf.toString())) {
  throw new Error(`HARD FAIL: ${mobileChunk} contains three.js — Lighthouse mobile gate at risk`)
}
```

**Optional but recommended add (Plan 20-01):** add a small unit test or inline self-test confirming the new regex matches `from 'three/addons/controls/OrbitControls.js'` AND `from 'three/examples/jsm/controls/OrbitControls.js'` — both should HARD-FAIL the mobile chunk.

---

### `src/game/GameMode.js` (orchestrator, props-down)

**Analog:** self — slot `<OnboardingHint />` button inside the renderer wrapper (per UI-SPEC line 141, "lean toward `GameMode.js`").

**Current renderer-slot block** (lines 116-132):
```javascript
<RendererErrorBoundary fallback={<SvgConstellation {...rendererProps} />}>
  <div
    data-game-interactive
    className="w-full max-w-3xl relative flex-1 min-h-0 pb-20 md:pb-24"
    data-testid="renderer-slot"
    data-theme={theme}
    data-renderer={capability}
  >
    {capability === 'webgl' ? (
      <Suspense fallback={<SvgConstellation {...rendererProps} />}>
        <WebGLConstellation {...rendererProps} />
      </Suspense>
    ) : (
      <SvgConstellation {...rendererProps} />
    )}
  </div>
</RendererErrorBoundary>
```

**Extension (Plan 20-02 — add OnboardingHint inside the relative-positioned wrapper above SkillFilters):**
```javascript
<RendererErrorBoundary fallback={<SvgConstellation {...rendererProps} />}>
  <div
    data-game-interactive
    className="w-full max-w-3xl relative flex-1 min-h-0 pb-20 md:pb-24"
    data-testid="renderer-slot"
    data-theme={theme}
    data-renderer={capability}
  >
    {capability === 'webgl' ? (
      <Suspense fallback={<SvgConstellation {...rendererProps} />}>
        <WebGLConstellation
          {...rendererProps}
          onFirstDrag={() => { /* setOnboardingHintDismissed(true); see hook */ }}
        />
      </Suspense>
    ) : (
      <SvgConstellation {...rendererProps} />
    )}
    {/* D-20-CONTEXT-HINT — only renders when capability='webgl' && !RM && !seen */}
    {capability === 'webgl' && <OnboardingHint t={t} />}
  </div>
</RendererErrorBoundary>
```

**Import to add** (after line 14):
```javascript
import OnboardingHint from './OnboardingHint'
```

---

### `src/i18n/translations.js` (i18n data, dict lookup)

**Analog:** self — Phase 15 `t.game.hintPill` precedent at line 32 EN (and corresponding ES line ~248).

**Existing namespace shape** (lines 24-63 EN):
```javascript
game: {
  loadingTitle: 'Game mode is loading',
  // ...
  hintPill: 'Click a star · Toca una estrella',  // Phase 15 — concatenated bilingual
  skillSelected: '{name} selected — {n} experience{s}. Press Esc to clear.',
  // ...
}
```

**Pattern: nested namespace** — UI-SPEC line 137-145 mandates `hint.drag` nested key (leaves room for `hint.zoom`, `hint.reset` in v3.10.1+).

**Addition (Plan 20-02) — EN branch:**
```javascript
game: {
  // ... existing keys preserved ...
  hint: {
    drag: 'drag to rotate',
  },
}
```

**Addition (Plan 20-02) — ES branch (mirror at ~line 248):**
```javascript
game: {
  // ... existing keys preserved ...
  hint: {
    drag: 'arrastra para rotar',
  },
}
```

Lowercase, no trailing period, no concatenation — matches Phase 15 hint-pill voice per UI-SPEC §Copywriting Contract.

---

### `tailwind.config.js` (build-config, theme)

**Analog:** self — verify-only. Re-using existing `animate-hint-fade-out` (line 100, keyframe at line 141-145) and `animate-fade-in` (line 94).

**No changes required.** Both keyframes already present:
```javascript
animation: {
  'fade-in':      'fadeIn 0.5s ease-out',                // line 94 — pill mount
  'hint-fade-out': 'hintFadeOut 600ms ease-in forwards', // line 100 — pill dismiss
},
keyframes: {
  fadeIn:      { from: { opacity: '0' }, to: { opacity: '1' } },     // lines 115-118
  hintFadeOut: {
    '0%':   { opacity: '1' },
    '80%':  { opacity: '1' },
    '100%': { opacity: '0', pointerEvents: 'none' },                 // lines 141-145
  },
},
```

`hintFadeOut` already sets `pointerEvents: 'none'` at end — ideal for auto-dismiss + cleanup.

**Planner alert:** Do NOT redefine `hint-fade-out` or `fade-in`. Apply with `motion-safe:` prefix only (e.g., `motion-safe:animate-fade-in`, `motion-safe:animate-hint-fade-out`).

---

### `src/game/useClickVsDrag.js` (NEW, hook)

**Closest analog:** combination of —
- `src/game/useRendererCapability.js` (thin hook returning derived value, useState+useEffect attach/detach pattern)
- `src/context/ViewModeContext.js` lines 27-45 (useCallback-wrapped stable handlers)

**Imports + module-scope constants pattern** (from `useRendererCapability.js` lines 1-16):
```javascript
import { useRef, useCallback } from 'react'

// D-20-CLICK-DRAG-THRESHOLD — locked thresholds (see PHASE 20-CONTEXT-* + UI-SPEC §Click-vs-drag threshold)
const DIST_THRESHOLD_MOUSE = 5      // px screen-space
const DIST_THRESHOLD_TOUCH = 8      // px — MOD-03 capacitive touch noise
const TIME_THRESHOLD_MS = 250       // industry convention (Cortico)
```

**Hook body pattern** (mirrors `useCallback`-wrapped stable handlers from `useConstellation.js` lines 69-75):
```javascript
// eslint-disable-next-line no-unused-vars
export default function useClickVsDrag({ onClick } = {}) {
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startT: 0,
    isDrag: false,
    pointerType: 'mouse',
  })

  const onPointerDown = useCallback((e) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startT: typeof performance !== 'undefined' ? performance.now() : Date.now(),
      isDrag: false,
      pointerType: e.pointerType || 'mouse',
    }
  }, [])

  const onPointerUp = useCallback((e) => {
    const ref = dragRef.current
    const dx = e.clientX - ref.startX
    const dy = e.clientY - ref.startY
    const dist = Math.hypot(dx, dy)
    const dt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - ref.startT
    const distThreshold = ref.pointerType === 'touch' ? DIST_THRESHOLD_TOUCH : DIST_THRESHOLD_MOUSE
    const isClick = dist < distThreshold && dt < TIME_THRESHOLD_MS
    if (isClick && onClick) onClick(e)
  }, [onClick])

  return { onPointerDown, onPointerUp, isDragRef: dragRef }
}
```

**Pattern constraints applied:**
- No DOM access at module scope (jsdom-testable).
- `performance.now()` guarded by `typeof performance !== 'undefined'` (matches `usePrefersReducedMotion` defensive pattern in `useConstellation.js` line 22-23).
- `useCallback` keeps handlers stable for `useEffect` deps in renderer (matches `useConstellation.js` line 69 pattern).
- Default-export, no named exports — matches all hooks in `src/game/`.
- Returned `isDragRef` is a ref, not state — avoids 60 setState/sec re-renders during drag (matches Phase 17 ARCHITECTURE.md camera-state-ownership rationale).

---

### `src/game/useClickVsDrag.test.js` (NEW, pure jsdom unit)

**Closest analog:** `src/context/ViewModeContext.test.js` (pure jsdom + renderHook + assertion) + `src/game/useConstellation.test.js` (hook test patterns).

**Imports + test-shape pattern** (mirror existing tests):
```javascript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useClickVsDrag from './useClickVsDrag.js'

function makePointerEvent(overrides = {}) {
  return {
    clientX: 0,
    clientY: 0,
    pointerType: 'mouse',
    ...overrides,
  }
}
```

**Test cases to deliver (Plan 20-03, ~5-8 tests, all <5 ms):**
```javascript
describe('useClickVsDrag', () => {
  it('should fire onClick when pointer moves <5px and <250ms (mouse)', () => {
    const onClick = vi.fn()
    const { result } = renderHook(() => useClickVsDrag({ onClick }))
    act(() => result.current.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 })))
    act(() => result.current.onPointerUp(makePointerEvent({ clientX: 102, clientY: 101 })))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should NOT fire onClick when pointer moves ≥5px (mouse) — drag confirmed', () => {
    const onClick = vi.fn()
    const { result } = renderHook(() => useClickVsDrag({ onClick }))
    act(() => result.current.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 })))
    act(() => result.current.onPointerUp(makePointerEvent({ clientX: 110, clientY: 100 })))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should bump distance threshold to 8px on pointerType === touch (MOD-03)', () => {
    const onClick = vi.fn()
    const { result } = renderHook(() => useClickVsDrag({ onClick }))
    // 7px move on touch — still a click (under 8px)
    act(() => result.current.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100, pointerType: 'touch' })))
    act(() => result.current.onPointerUp(makePointerEvent({ clientX: 107, clientY: 100, pointerType: 'touch' })))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should NOT fire onClick when ≥9px on touch — drag confirmed', () => { /* mirror above with 9px */ })
  it('should NOT fire onClick when ≥250ms held — long-press not a click', () => { /* mock performance.now */ })
  it('should be no-op when onClick is not provided', () => { /* useClickVsDrag() — no throw */ })
})
```

**Mock pattern for `performance.now`** (Plan 20-03 may need this for time-threshold test) — use Vitest's `vi.spyOn(performance, 'now').mockReturnValueOnce(...)`.

---

### `src/game/OnboardingHint.js` (NEW, component)

**Closest analog:** `src/game/renderers/SvgConstellation.js` lines 385-389 (hint-pill JSX precedent) + `src/context/ViewModeContext.js` lines 7-19 (localStorage gate with try/catch).

**Phase 15 hint-pill JSX precedent** (`SvgConstellation.js` lines 385-389):
```javascript
{prefersReducedMotion && !hasInteracted && (
  <p className="text-center mt-4 text-xs font-mono text-hintPill-text bg-hintPill-bg rounded-full px-3 py-2 inline-block">
    {t.game.hintPill}
  </p>
)}
```

**localStorage-gate pattern** (from `ViewModeContext.js` lines 7-19 + 30-36):
```javascript
function readSeenFlag() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('cam-3d-hint-seen') === 'true'
  } catch (e) {
    return false
  }
}

function writeSeenFlag() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('cam-3d-hint-seen', 'true')
  } catch (e) {
    // blocked — ignore
  }
}
```

**Motion-safe gating pattern** (from `useConstellation.js` lines 21-49 — jsdom-defensive `usePrefersReducedMotion`):
```javascript
// Copy-VERBATIM the usePrefersReducedMotion from useConstellation.js lines 21-49
// (handles SSR + jsdom-without-matchMedia + Safari 13 addListener compat)
```

**Full component shape (Plan 20-02 deliverable, ~50 LOC):**
```javascript
import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'cam-3d-hint-seen'
const AUTO_DISMISS_MS = 5000
const FADE_IN_DELAY_MS = 800  // UI-SPEC §Motion — lets canvas appear first

const RM_QUERY = '(prefers-reduced-motion: no-preference)'
const isServer = typeof window === 'undefined'
const hasMatchMedia = !isServer && typeof window.matchMedia === 'function'

function usePrefersReducedMotion() {
  // VERBATIM copy from useConstellation.js lines 25-49
  // ...
}

function readSeenFlag() {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(STORAGE_KEY) === 'true' }
  catch (e) { return false }
}
function writeSeenFlag() {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, 'true') } catch (e) { /* blocked */ }
}

export default function OnboardingHint({ t }) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [visible, setVisible] = useState(false)
  const [seen] = useState(readSeenFlag)  // read once at mount

  useEffect(() => {
    if (prefersReducedMotion || seen) return undefined
    const showTimer = setTimeout(() => setVisible(true), FADE_IN_DELAY_MS)
    const dismissTimer = setTimeout(() => {
      setVisible(false)
      writeSeenFlag()
    }, FADE_IN_DELAY_MS + AUTO_DISMISS_MS)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
    }
  }, [prefersReducedMotion, seen])

  if (prefersReducedMotion || seen || !visible) return null

  const handleDismiss = () => {
    setVisible(false)
    writeSeenFlag()
  }

  return (
    <button
      type="button"
      onClick={handleDismiss}
      aria-label={`${t.game.hint.drag} — dismiss`}
      className="
        absolute left-1/2 -translate-x-1/2 bottom-[88px] z-20
        text-xs font-mono text-hintPill-text bg-hintPill-bg
        rounded-full px-4 py-2 min-h-[44px]
        motion-safe:animate-fade-in
      "
    >
      {t.game.hint.drag}
    </button>
  )
}
```

**Key constraints:**
- `useState(readSeenFlag)` (lazy initializer) — mirrors `ViewModeContext.js` line 28 pattern.
- Returns `null` early when not eligible — clean unmount, no zombie DOM (UI-SPEC §Accessibility).
- `<button type="button">` with 44×44 min height — UI-SPEC §Accessibility + Phase 4 RESP-03.
- Tailwind tokens only — no new tokens (UI-SPEC §Color "ZERO new color tokens").
- `motion-safe:` prefix on animation — preserves project convention (Phase 19 SVG twinkle pattern).

**Dismiss-on-first-drag wiring:** parent (`GameMode.js`) needs to read `localStorage.getItem('cam-3d-hint-seen')` lazily; the OnboardingHint reads its own state lazily so re-mounting after WebGL drag-write is sufficient. If immediate dismiss is required, hoist `seen` state to GameMode and pass as prop.

---

### `src/game/OnboardingHint.test.js` (NEW, RTL component test)

**Closest analog:** `src/game/renderers/SvgConstellation.test.js` (render + fireEvent) + `src/context/ViewModeContext.test.js` (localStorage assertion).

**Test-shape pattern** (mirror `SvgConstellation.test.js` lines 1-58):
```javascript
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import OnboardingHint from './OnboardingHint.js'
import translations from '../i18n/translations.js'

const t = translations.en

function makeMockMatchMedia(prefersReducedMotion = false) {
  return vi.fn().mockImplementation((q) => ({
    matches: q === '(prefers-reduced-motion: no-preference)' ? !prefersReducedMotion : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  window.matchMedia = makeMockMatchMedia(false)
  window.localStorage.clear()
  vi.useFakeTimers()
})
```

**Test cases to deliver (~5 tests):**
```javascript
describe('OnboardingHint', () => {
  it('does not render before FADE_IN_DELAY_MS elapses', () => { /* render + assert not in DOM */ })

  it('renders after 800ms fade-in delay', async () => {
    const { findByRole } = render(<OnboardingHint t={t} />)
    act(() => vi.advanceTimersByTime(800))
    expect(await findByRole('button')).toHaveTextContent(t.game.hint.drag)
  })

  it('does not render when localStorage cam-3d-hint-seen === "true"', () => {
    window.localStorage.setItem('cam-3d-hint-seen', 'true')
    const { container } = render(<OnboardingHint t={t} />)
    act(() => vi.advanceTimersByTime(900))
    expect(container.querySelector('button')).toBeNull()
  })

  it('does not render under prefers-reduced-motion: reduce', () => {
    window.matchMedia = makeMockMatchMedia(true)
    const { container } = render(<OnboardingHint t={t} />)
    act(() => vi.advanceTimersByTime(900))
    expect(container.querySelector('button')).toBeNull()
  })

  it('dismisses on click and sets cam-3d-hint-seen=true', () => {
    const { getByRole } = render(<OnboardingHint t={t} />)
    act(() => vi.advanceTimersByTime(900))
    fireEvent.click(getByRole('button'))
    expect(window.localStorage.getItem('cam-3d-hint-seen')).toBe('true')
  })

  it('auto-dismisses 5s after fade-in (sets cam-3d-hint-seen=true)', () => {
    render(<OnboardingHint t={t} />)
    act(() => vi.advanceTimersByTime(800 + 5000))
    expect(window.localStorage.getItem('cam-3d-hint-seen')).toBe('true')
  })
})
```

**Fake-timer pattern** — `vi.useFakeTimers()` + `vi.advanceTimersByTime()` matches Vitest convention; no existing analog uses fake timers yet in this codebase but Vitest supports natively (no setup change).

---

### `.planning/phases/20-3d-constellation/20-UAT.md` (NEW, docs scaffold)

**Closest analog:** `.planning/phases/16-filters-floating-experiencecard/16-UAT.md` (UAT checklist precedent — same milestone shape, manual visual verification scope).

**UAT scaffold structure to copy:**
- YAML front-matter (`phase: 20`, `slug: 3d-constellation`)
- `## Scope` section — what to UAT (rotation feel, click reliability, mobile SVG unchanged, RM still SVG, ErrorBoundary still works, context-loss survives, Lighthouse re-verify)
- `## Test Matrix` — table of test cases per UI-SPEC §State Transitions (frame-by-frame)
- `## Pass Criteria` — concrete checkboxes per UI-SPEC §Checker Sign-Off
- `## Environment` — desktop browsers, viewport sizes, RM toggle, theme toggle, language toggle
- `## Notes / Findings` — empty section for executor to fill in

**Key UAT items (from research SUMMARY.md Plan 20-03 deliverables):**
- [ ] Rotation feel — drag → camera rotates with damping; settles in <1s; no jitter on Mac trackpad
- [ ] Click reliability — quick tap → ExperienceCard opens; held drag → no spurious click; touch threshold (8px) verified on iPad / Surface
- [ ] Mobile SVG unchanged — open at 375px, 768px viewports → SVG path, no canvas
- [ ] RM still SVG — DevTools emulate `prefers-reduced-motion: reduce` → SVG path, no WebGL mount
- [ ] ErrorBoundary still works — synthetic shader compile error → SVG fallback (no error banner visible)
- [ ] Context-loss survives — DevTools "Lose context" extension → SVG swaps in cleanly
- [ ] Lighthouse mobile re-verify — Perf ≥95 / A11y 100 / BP 100 / SEO 100 (mobile chunk untouched, expected pass)
- [ ] Bundle gate green — `npm run check:bundle-gate` exits 0 with mobile chunk < 38.82 kB gz
- [ ] Onboarding hint pill — first visit shows pill after 800ms; auto-dismisses at 5s; localStorage flag persists; second visit no pill
- [ ] Keyboard nav unchanged — Tab into canvas → arrow keys walk node focus (Phase 15 D-15-KB-ACTIVATE)

---

## Shared Patterns

### Pattern S1: Defensive `prefers-reduced-motion` Gate

**Source:** `src/game/useConstellation.js` lines 21-49 (Josh Comeau `usePrefersReducedMotion` adapted for jsdom-without-matchMedia)
**Apply to:** `OnboardingHint.js` (mount gate), `WebGLConstellation.js` (defensive autoRotate gate inside renderer per CRIT-06)

```javascript
const RM_QUERY = '(prefers-reduced-motion: no-preference)'
const isServer = typeof window === 'undefined'
const hasMatchMedia = !isServer && typeof window.matchMedia === 'function'

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (isServer) return true
    if (!hasMatchMedia) return false
    return !window.matchMedia(RM_QUERY).matches
  })
  // ... useEffect listener attach/detach with Safari 13 compat shim
  return prefersReducedMotion
}
```

**Rationale:** belt-and-braces — even though `useRendererCapability` already routes RM users to SVG before WebGL mounts, defense-in-depth catches the edge case of media-query change during session.

---

### Pattern S2: `cam-*` localStorage Flag with try/catch Guard

**Source:** `src/context/ViewModeContext.js` lines 7-19 and 30-36
**Apply to:** `OnboardingHint.js` (`cam-3d-hint-seen` flag), `WebGLConstellation.js` (first-drag write)

```javascript
function readFlag(key) {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch (e) {
    return null
  }
}

function writeFlag(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch (e) {
    // blocked — ignore
  }
}
```

**Project convention:** `cam-*` prefix is reserved for portfolio localStorage keys. Existing keys: `cam-lang`, `cam-theme`, `cam-viewmode`. NEW: `cam-3d-hint-seen`.

---

### Pattern S3: `motion-safe:` Tailwind Prefix on Every Infinite Animation

**Source:** `tailwind.config.js` comment block at lines 102-103 + 109-112
**Apply to:** `OnboardingHint.js` (fade-in/out), any new animated surface

```javascript
// Correct:
<button className="motion-safe:animate-fade-in">

// WRONG — never use unprefixed:
<button className="animate-fade-in">
```

**Rationale:** Project-wide convention — all loop/infinite animations gated by `motion-safe:` so reduced-motion users see no animation regardless of JS RM checks.

---

### Pattern S4: useEffect Cleanup with Resource Disposal Order

**Source:** `WebGLConstellation.js` lines 416-423 (existing) + MOD-05 mitigation pattern (new)
**Apply to:** `WebGLConstellation.js` `OrbitControls` cleanup, any new useEffect with three.js resources

```javascript
useEffect(() => {
  // ... mount: create resources, attach listeners
  return () => {
    // CLEANUP ORDER MATTERS (MOD-05 — React StrictMode double-mount safety):
    // 1. Detach event listeners (no late callbacks)
    // 2. Dispose three.js resources (controls FIRST, geometry/material/renderer next)
    // 3. Null out refs (prevents stale-ref bugs in rAF tick)
  }
}, [/* deps */])
```

---

### Pattern S5: Props-Down Callback (no upward state lift)

**Source:** Phase 17 D-17-HOVERED-PROP enforced via `useConstellation.js` lines 69-75 + `WebGLConstellation.js` line 632-643
**Apply to:** `OnboardingHint` dismiss signal from `WebGLConstellation.onFirstDrag` → `GameMode` (NOT via context, NOT via global event)

```javascript
// CORRECT — useCallback-stable handler, props-down + callback-up
const onFirstDrag = useCallback(() => {
  // GameMode-local state or pass-through to OnboardingHint via prop
}, [])
<WebGLConstellation {...rendererProps} onFirstDrag={onFirstDrag} />

// WRONG — do NOT lift camera/drag state to useConstellation hook
//   (would cause 60 setState/sec re-render thrash on damped rotation)
```

---

## No Analog Found

(none — every file has a strong codebase analog)

---

## Critical Planner Alerts

These cross-file invariants must be enforced when plans are authored:

| # | Alert | Plan to Enforce |
|---|-------|-----------------|
| A1 | **Bundle-gate regex fix MUST land in Plan 20-01 BEFORE OrbitControls import** (CRIT-03 — current regex doesn't catch `three/addons/*`) | Plan 20-01 |
| A2 | **`positions[i*3+2] = pos.z ?? 0`** in `WebGLConstellation.js:295` — without this, layout z is silently zeroed and CRIT-04 z=0 trap activates | Plan 20-02 |
| A3 | **`controls.update()` inside `tick()` as FIRST line — NEVER `addEventListener('change', renderer.render)`** (CRIT-01 — preserves D-17-FRAMELOOP single-rAF contract) | Plan 20-02 |
| A4 | **`controls.dispose()` FIRST in cleanup** (MOD-05 — React StrictMode double-mount listener leak) | Plan 20-02 |
| A5 | **Add `uCanvasHeight` + `uFovRad` uniforms + perspective formula** (CRIT-05 — without size-attenuation under perspective, near nodes become canvas-sized blobs) | Plan 20-02 |
| A6 | **`useClickVsDrag` thresholds: 5px mouse / 8px touch / 250ms** — `pointerType === 'touch'` branch is MOD-03 mitigation, NOT optional | Plan 20-03 |
| A7 | **DO NOT redefine `animate-fade-in` or `animate-hint-fade-out` in `tailwind.config.js`** — both already exist; just apply with `motion-safe:` prefix | Plan 20-02 |
| A8 | **`OnboardingHint` lives in `GameMode.js` slot, NOT inside `WebGLConstellation.js`** (CONTEXT §code_context line 141 — leaves room for v3.10.1 SVG-path reuse) | Plan 20-02 |
| A9 | **Defensive `prefers-reduced-motion` gate INSIDE `WebGLConstellation.js`** even though `useRendererCapability` already filters RM (CRIT-06 belt-and-braces) | Plan 20-02 |
| A10 | **`webglcontextlost` / `webglcontextrestored` handlers swap to SVG silently — NO error banner, NO aria-live shout** (D-20-CONTEXT-LOSS + UI-SPEC §ErrorBoundary Visual Continuity) | Plan 20-02 |
| A11 | **Camera state stays in `WebGLConstellation` useRef — DO NOT lift to `useConstellation`** (Phase 17 ARCHITECTURE.md, would cause 60 setState/sec thrash) | Plan 20-02 |
| A12 | **`Vector3.project(camera)` pick math with depth-scaled pick radius** (MOD-08 — flat 2D pick math breaks under perspective for far nodes) | Plan 20-02 |
| A13 | **i18n key shape: nested `t.game.hint.drag`, NOT flat `t.game.hintDrag`** (UI-SPEC line 135-147 — leaves room for `hint.zoom`, `hint.reset` in v3.10.1) | Plan 20-02 |
| A14 | **`CATEGORY_Z` comment-block: "UAT-tunable; consult v3.10-UAT.md before adjusting after milestone close"** (CONTEXT §specifics; values are starting points) | Plan 20-01 |

---

## Metadata

**Analog search scope:** `src/game/`, `src/i18n/`, `src/context/`, `src/test/`, `scripts/`, `.planning/phases/16-*/`, `tailwind.config.js`
**Files scanned:** 14 (constellation.layout.js, constellation.layout.test.js, WebGLConstellation.js, SvgConstellation.js, SvgConstellation.test.js, useConstellation.js, useRendererCapability.js, GameMode.js, ViewModeContext.js, ThemeContext.js, translations.js, tailwind.config.js, check-bundle-gate.mjs, test/setup.js)
**Pattern extraction date:** 2026-06-08
**Phase 20 source decisions referenced:** D-20-CONTEXT-ZMAP, D-20-CONTEXT-INITIAL-ANGLE, D-20-CONTEXT-AUTOROTATE-RESUME, D-20-CONTEXT-HINT, D-20-CONTEXT-KB-NOORBIT, D-20-CONTEXT-LOSS, D-20-VISUAL-3D, D-20-CLICK-DRAG-THRESHOLD, D-20-PROPS-CONTRACT
**Phase 17 decisions preserved:** D-17-EXTRACT, D-17-HOVERED-PROP, D-17-PRIMITIVES, D-17-LIB, D-17-EDGE-RGBA, D-17-FRAMELOOP, D-17-RM-GATE
**Pitfalls mapped to patterns:** CRIT-01..06, MOD-01..09, MIN-01..06 (per `.planning/research/PITFALLS.md`)
