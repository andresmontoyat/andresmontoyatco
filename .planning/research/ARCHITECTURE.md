# Architecture Research — v3.10 3D Constellation Integration

**Domain:** React + three.js raw interactive visualization (single feature inside an established hexagonal-light React portfolio)
**Researched:** 2026-06-08
**Confidence:** HIGH — full code inventory of every integration point loaded; verdicts grounded in the actual current `src/game/**` source, not assumptions.

> **Note:** Replaces the prior v3.4-era ARCHITECTURE.md (which covered the original portfolio redesign architecture). v3.10 is a single-REQ milestone scoped to integrating 3D depth into the existing Phase 17 WebGL renderer — this document only addresses that integration surface.

> **Scope:** This is NOT new-architecture research. v3.10 adds 3D depth to existing WebGL constellation. The hexagonal-light layering (`GameMode` orchestrator → `useConstellation` state hook → pure data fns → renderer adapter) is LOCKED. This document maps where 3D code lands inside that locked structure, what new files vs modified files are needed, and which Phase 17 decisions need to be explicitly revisited.

---

## 1. Existing Architecture Map (Phase 17 lock-in)

### System Overview — current

```
┌──────────────────────────────────────────────────────────────────────┐
│                      Composition layer (App.js)                       │
│                                                                       │
│  ViewModeContext → <App/> → <GameMode/> | <DevMode/>                  │
└────────────────────────────────────┬──────────────────────────────────┘
                                     ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    Orchestrator (src/game/GameMode.js)                │
│  - module-scope: buildConstellationGraph(EXPERIENCE, SKILLS)          │
│                  computeLayout(GRAPH_NODES) → { [id]: {x,y} }         │
│                  React.lazy(() => import('./renderers/WebGL…'))       │
│  - body:        useRendererCapability() → 'webgl'|'svg'               │
│                  useConstellation(GRAPH_NODES) → cons state           │
│                  rendererProps = {...cons + layout + theme + lang}    │
│  - render:      <SkillFilters/> + <RendererErrorBoundary> +           │
│                 (capability==='webgl' ? <Suspense><WebGL…> : <Svg…>)  │
│                 + <ExperienceCard/> + <ConstellationFallback/>        │
└────────────────────────────────────┬──────────────────────────────────┘
                                     ↓
                         (props-down only — GAME-01 contract)
                                     ↓
┌────────────────────────────┬────────────────────────────────────────┐
│ State hook                  │ Renderers (props-identical contract)  │
│ src/game/useConstellation   │ src/game/renderers/                    │
│ - selectedSkillId           │ ├── SvgConstellation.js (eager)        │
│ - hoveredSkillId  ← D-17    │ │   ^ static path; always available    │
│ - selectedSkills[]          │ │                                       │
│ - yearRange, category       │ └── WebGLConstellation.js (lazy chunk) │
│ - justFilteredId (flash)    │     ^ three.js raw + ShaderMaterial    │
│ - derived highlightedIds    │     ^ OrthographicCamera (2D-in-3D)    │
│ - callbacks (onSelect/Hover)│     ^ rAF loop + visibilitychange      │
└────────────────────────────┴────────────────────────────────────────┘
                                     ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    Pure data layer (zero React)                       │
│  src/data/skills.js          → SKILLS map + categories + aliases     │
│  src/data/experience.js      → 12 jobs with tech[] arrays            │
│  src/game/constellation.graph.js → buildConstellationGraph(EXP,SK)   │
│        → { nodes:[{id,category,count,color,years}], edges:[{s,t,w}] }│
│  src/game/constellation.layout.js → computeLayout(nodes)             │
│        → { [nodeId]: {x:number, y:number} }      ← **2D today**      │
│  src/game/filters.js         → composeFilters, visibleSkillIds       │
│  src/game/RendererErrorBoundary.js → sticky fallback <Svg…> on throw │
│  src/game/useRendererCapability.js → 'webgl'|'svg' (5 gates)         │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities — LOCKED post-Phase 17

| Component | Responsibility | Owns state? |
|-----------|----------------|-------------|
| `GameMode.js` | Compose graph + layout at module load; wire renderer based on capability | No (delegates) |
| `useConstellation.js` | All UI state — selection, hover, filters, flash timer | YES — single source of truth |
| `useRendererCapability.js` | 5-gate detection: viewport / RM / saveData / network / WebGL ctx; URL override | YES — `cap` matchMedia-reactive |
| `RendererErrorBoundary.js` | Catch lazy-chunk fetch + shader compile + ctx creation; render `props.fallback` | YES — `hasError` |
| `WebGLConstellation.js` | three.js raw scene; reads props only; emits hover/select via callbacks | NO internal hover (D-17-HOVERED-PROP) |
| `SvgConstellation.js` | SVG path; props-identical to WebGL; reads `hoveredSkillId` prop too | Internal `hoveredNodeId` legacy useState (Phase 15) |
| `computeLayout()` | Pure: nodes[] → `{[id]: {x, y}}` deterministic radial | NO — pure fn |

**Phase 17 decisions that lock the current shape:**
- **D-17-EXTRACT** — capability detection + ErrorBoundary lifted out of `GameMode.js` into standalone files. NEW code should NOT collapse them back.
- **D-17-HOVERED-PROP** — hover lives in `useConstellation`; renderers callback-out only. Hard rule. v3.10 must NOT introduce internal hover/rotation state that contradicts this without an explicit decision flag.
- **D-17-PRIMITIVES** — Points + LineSegments + raw `ShaderMaterial` (~50 LOC GLSL). Existing vertex shader already handles per-vertex `position` + DPR sizing + drift + flash. Trivially extends to `z` — see §3.
- **D-17-VISUAL** — flat 2D-in-3D `OrthographicCamera(0, 1000, 0, 1000, -1, 1)`. **This is the decision v3.10 explicitly overrides.**
- **GAME-01** — single props-contract between SVG ↔ WebGL renderers. Survives intact (props don't change). The *picture* diverges; the *interface* does not.

---

## 2. v3.10 Integration Map — where new code lands

```
┌──────────────────────────────────────────────────────────────────────┐
│  CHANGED FILES (extend in place, do NOT create new layers)            │
│                                                                       │
│  src/game/constellation.layout.js                                    │
│      computeLayout(nodes) → {[id]: {x, y, z}}    ← EXTENDED          │
│                                                                       │
│  src/game/constellation.layout.test.js                                │
│      + z assertions (range, category-z clustering, determinism)      │
│                                                                       │
│  src/game/renderers/WebGLConstellation.js                            │
│      OrthographicCamera → PerspectiveCamera                          │
│      + OrbitControls import from 'three/examples/jsm/…'               │
│      + camera + controls refs                                         │
│      + idle auto-rotate vs user-drag state machine                   │
│      + click-vs-drag threshold logic on existing pointer-pick effect │
│      VERTEX_SHADER: positions[i*3+2] = pos.z instead of 0            │
│                    (one-line shader change for size attenuation)     │
│                                                                       │
│  src/game/renderers/WebGLConstellation.test.js                       │
│      Sanity tests stay (3D math not asserted; integration only)      │
│                                                                       │
│  src/game/renderers/SvgConstellation.js     NO CHANGE                │
│      Drops z silently; treats layout[id] as {x, y, ...}              │
│                                                                       │
│  src/game/useConstellation.js               NO CHANGE                │
│      No camera state added here (see §5)                             │
│                                                                       │
│  src/game/GameMode.js                       NO CHANGE                │
│      rendererProps stay identical                                     │
│      LAYOUT just happens to carry .z now                             │
│                                                                       │
│  src/game/useRendererCapability.js          NO CHANGE                │
│      WebGL availability already gates 3D too — 3D adds nothing to    │
│      the capability test (see §6)                                    │
│                                                                       │
│  src/game/RendererErrorBoundary.js          NO CHANGE                │
│      PerspectiveCamera + OrbitControls failures bubble identically   │
│      to current shader-compile failures (see §7)                     │
│                                                                       │
│  src/data/skills.js                         NO CHANGE                │
│      Category-z values live in constellation.layout.js, NOT here     │
│      (file comments explicitly forbid bleeding visual data in)       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  NEW FILES — minimize, prefer extending existing                      │
│                                                                       │
│  src/game/useClickVsDrag.js          (RECOMMENDED — see §8)          │
│      Tiny hook (~30 LOC): exports {onPointerDown, isDrag}            │
│      Pure function preferred IF state is non-React — keep optional   │
│                                                                       │
│  src/game/useClickVsDrag.test.js                                     │
│      Pure unit tests — vitest jsdom safe (no canvas)                 │
└──────────────────────────────────────────────────────────────────────┘
```

**Bottom line:** ~2 file modifications carry 80% of the work. 1 small new hook (or inline if hook ceremony isn't justified). Zero new "layers" or "modules". No new directories. No new state owners.

---

## 3. Layout extension contract — Question 1

**Answer: EXTEND `computeLayout()` to return `{x, y, z}`. Do NOT create `build3DLayout()`.**

### Rationale

1. **Backwards compatibility is free.** SVG renderer reads `layout[id].x` + `.y` and ignores `.z` silently — JavaScript object-key access doesn't care about extra keys. No code change in `SvgConstellation.js`.
2. **GameMode `LAYOUT` constant stays identical.** `const LAYOUT = computeLayout(GRAPH_NODES)` keeps the same call signature. Module-load timing unchanged.
3. **One layout source of truth.** Two functions = two graph-position implementations to keep in sync. Phase 14 D-14-01-LAYOUT logged "pure, deterministic, no force" — extending preserves that contract verbatim.
4. **Test reuse.** Existing 4 tests in `constellation.layout.test.js` keep passing — they assert `typeof pos.x === 'number'` and `typeof pos.y === 'number'`; they do not assert "object has only x,y" or `Object.keys(pos).length === 2`. New tests append rather than rewrite.

### New signature

```js
// src/game/constellation.layout.js
/**
 * @returns {Object} Map of node.id → { x, y, z }
 * x, y ∈ [0, 1000]  (unchanged)
 * z ∈ [-Z_RANGE, +Z_RANGE]  (NEW — category-z clustering)
 */
export function computeLayout(nodes) { ... }
```

### Test additions

```js
// constellation.layout.test.js — APPEND, do not rewrite
describe('computeLayout - 3D depth', () => {
  it('should return z per node', () => {
    for (const node of nodes) expect(typeof layout[node.id].z).toBe('number')
  })

  it('should cluster z by category (same-cat = same z)', () => {
    // all nodes in 'cloud' share one z, all nodes in 'lang' share another, etc.
  })

  it('z should be deterministic across re-renders', () => {
    expect(computeLayout(nodes)[id].z).toBe(computeLayout(nodes)[id].z)
  })
})
```

### Tradeoff acknowledged

> *"But GAME-01 promised SVG and WebGL render the same thing."*

Yes — and they receive the same props. The promise was a **props contract**, not a **pixel contract**. Phase 17 already broke pixel parity (WebGL gets shader pulse / chip-flash via shader; SVG gets the same via CSS). The professional reframe: GAME-01 = "single data contract, adaptive fidelity per capability." Documented in §11 below.

---

## 4. Category-z values — Question 2

**Answer: Constants in `constellation.layout.js`. Do NOT bleed visual data into `src/data/skills.js`. Do NOT derive from centroid sort order.**

### Decision matrix

| Location | Pro | Con | Verdict |
|----------|-----|-----|---------|
| `constellation.layout.js` CATEGORY_Z constant | Co-located with x/y radial constants (CATEGORY_RING_RADIUS, NODE_CLUSTER_RADIUS); pure-data layer; one file to grep | Visual data not bundled with category names | **CHOSEN** |
| `src/data/skills.js` per-category `z` field on `SKILL_CATEGORIES` | DRY — z lives next to color | Bleeds visual concerns into the data layer; skills.js comments explicitly say `SKILL_CATEGORY_COLORS` are "DATA values…NOT styling tokens" — adding `z` would cross that boundary | Reject |
| Derived from `CATEGORY_ORDER` index | Auto-stays-deterministic; zero new constants | Couples z meaning to category sort order, which was alphabetical for rendering not for architecture-stack semantics; brittle — refactoring `CATEGORY_ORDER` order silently rearranges z | Reject |

### Recommended values

The SEED suggests "category-z clusters communicate architecture stack" — backend behind, frontend forward. Map current 8 categories onto z bands of ±150 (matches existing `CATEGORY_RING_RADIUS = 320` half-scale so depth feels proportional to the radial spread):

```js
// src/game/constellation.layout.js — NEW constant near CATEGORY_ORDER
const CATEGORY_Z = {
  // Forward (closest to camera) — recruiter-facing surface
  ai:       +150,   // most "wow" — AI tooling layer pops forward
  lang:     +75,    // languages + frameworks visible-stack
  // Middle plane (z≈0) — architecture spine
  arch:        0,
  data:      -25,
  // Mid-back — infrastructure
  cloud:    -75,
  devops:  -100,
  // Far back — foundation
  security: -125,
  hardware: -150,
}
```

Tunable in one place. Reasoning is documented in the constant block. UAT can flip values without touching call sites.

### Intra-cluster z jitter (optional polish)

A tiny `±10` per-node deterministic offset (`sin(hashNodeId(id))`) prevents same-cluster nodes from being coplanar — visually richer when rotating. Add only if UAT signals "looks like 8 flat cards stacked." Pure function; no test impact.

---

## 5. Camera state ownership — Question 3

**Answer: OrbitControls camera state (rotation, zoom, target) lives in `WebGLConstellation.js` internal `useRef`. Do NOT add it to `useConstellation`.**

### Rationale (against `useConstellation` ownership)

1. **Rotation is renderer-only.** SVG path has no camera. Lifting camera state to the shared hook would either:
   - leak WebGL-only concepts into a hook consumed by both renderers, OR
   - require conditional `if (renderer === 'webgl')` branching inside the hook — explicit anti-pattern in this codebase (Phase 17 D-17-HOVERED-PROP only lifted shared concepts).
2. **OrbitControls owns its own state inside three.js.** `controls.target`, `camera.position`, internal momentum — these are imperative DOM/WebGL state. Mirroring them in React state via `setState` would cause render thrash on every frame of damped rotation (60 setState/sec). Phase 17's rAF loop already proved the pattern: imperative animation state stays in refs.
3. **D-17-HOVERED-PROP precedent doesn't apply.** Hover was lifted because **both renderers + ExperienceCard + filters needed it**. Camera rotation is consumed by *nothing outside WebGL* — no filter cares about camera angle, no card position depends on it, no SVG fallback uses it.
4. **Recovery semantics are correct.** On WebGL → SVG fallback (error boundary trip), discarded camera state is GC'd with the renderer; SVG starts fresh. No persistence concerns.

### `useRef` shape — internal to WebGLConstellation

```js
// Inside WebGLConstellation component body
const cameraRef = useRef(null)              // EXISTS today (OrthographicCamera)
const controlsRef = useRef(null)            // NEW — OrbitControls instance
const idleTimerRef = useRef(null)           // NEW — last-interaction timestamp; rAF reads it for auto-rotate gating
const dragStartRef = useRef(null)           // NEW — {x, y} at pointerdown for click-vs-drag threshold
```

### One small exception — if "reset view" filter is added later

If a future REQ adds a "Reset view" button in `SkillFilters` (currently NOT in v3.10 scope), the *trigger* would lift to `useConstellation` as a `resetViewToken` counter, and `WebGLConstellation` would have a `useEffect([resetViewToken])` that calls `controls.reset()`. State stays imperative; only the *signal* crosses the boundary. Mark this as deferred, NOT v3.10.

---

## 6. Capability detection — Question 4

**Answer: NO CHANGE to `useRendererCapability.js`. 3D adds nothing to the gate.**

### Why current 5 gates suffice

```
Current gates (Phase 17):
1. viewport ≥1024px       ← desktop only
2. !prefers-reduced-motion ← static path for RM users
3. !navigator.connection.saveData
4. effectiveType ∉ ['2g','slow-2g']
5. WebGL ctx available    ← getContext('webgl2') || getContext('webgl')
```

Gates 1-5 already filter to "capable desktop with WebGL." PerspectiveCamera + OrbitControls are pure JS math on top of the same WebGL context — they do NOT require WebGL2, WebXR, or any new feature flag. If gate 5 passes (WebGL context creation succeeds), PerspectiveCamera works. `PerspectiveCamera` only depends on `Matrix4` math (always available); `OrbitControls` only depends on `EventListener` + `Vector3`/`Quaternion` math (always available).

### What COULD warrant a gate adjustment (deferred — out of v3.10 scope)

- **GPU tier detection** (via `unmasked vendor/renderer` string) — could downgrade to 2D-in-3D on integrated Intel HD 3000 class hardware. Premature for v3.10 — Phase 17 SC-4 Lighthouse gate already exercises the same WebGL pipeline; if 3D math becomes the bottleneck, gate adjustment is its own future REQ.
- **`prefers-reduced-data` media query** — Chrome 85+ feature query. Could double-gate alongside `saveData`. Not v3.10.

### Phase 17 D-17-EXTRACT survives

The `useRendererCapability` hook lifted out of `GameMode.js` keeps its public contract (`'webgl'|'svg'`). No new return values, no new params. Honored.

---

## 7. ErrorBoundary recovery — Question 5

**Answer: NO CHANGE to `RendererErrorBoundary`. PerspectiveCamera + OrbitControls failures share the same recovery path as current shader-compile failures.**

### What can fail in v3.10 (and why ErrorBoundary catches it)

| Failure | Where it surfaces | Boundary catches? |
|---------|-------------------|-------------------|
| `PerspectiveCamera` ctor throws | `useEffect` synchronous mount | **YES** — already inside the boundary subtree |
| `OrbitControls` import fails (chunk fetch) | `import()` rejection / Suspense path | **YES** — bubbles through Suspense → boundary |
| OrbitControls runtime: pointer event handler throws | Async event handler — **does NOT propagate to ErrorBoundary natively** | **NO — see mitigation** |
| Shader compile failure (z attribute typo) | useEffect synchronous | **YES** — same as Phase 17 |
| WebGL context lost (driver crash mid-frame) | rAF callback — async; not caught | **NO — already a known gap, Phase 17 inherited** |

### Mitigation for async OrbitControls handler errors

Wrap the controls' `change` listener body in try/catch + `setState(throwLater)` — the standard React pattern to re-throw async errors during render so an ErrorBoundary catches them. Not strictly required for v3.10 (OrbitControls is battle-tested three.js code) but a defensive 5-LOC addition keeps the contract clean.

```js
// Defensive wrap inside WebGLConstellation
const [errorToThrow, setErrorToThrow] = useState(null)
if (errorToThrow) throw errorToThrow

useEffect(() => {
  controlsRef.current.addEventListener('change', () => {
    try { renderer.render(scene, camera) }
    catch (e) { setErrorToThrow(e) }
  })
}, [])
```

### Boundary props stay identical

`<RendererErrorBoundary fallback={<SvgConstellation {...rendererProps}/>}>` — works without modification. If WebGL trips, user falls back to flat 2D SVG. That's the right product behavior: 3D failure on a desktop should NOT take the constellation down; SVG static is a graceful degradation.

---

## 8. Click-vs-drag — Question 6

**Answer: NEW thin hook `src/game/useClickVsDrag.js`. Do NOT inline in WebGLConstellation. Do NOT lift to useConstellation.**

### Rationale

- **Reusable.** Mobile SVG path future scenario: pinch-to-zoom + drag-to-pan (v3.11+ candidate). Same threshold logic applies — extracting now costs ~30 LOC, saves a copy-paste later.
- **Testable in pure jsdom.** Hook has no canvas, no WebGL — pointer-event objects are plain `{clientX, clientY}`. Vitest + RTL `renderHook` covers it without canvas mocks. Estimated 5-8 tests, all <5ms each.
- **NOT a useConstellation concern.** Click-vs-drag is a pointer-input post-processor, not application state. It transforms `pointerDown(x,y) + pointerUp(x,y)` into `clickEvent | dragEvent`. useConstellation only sees the resulting `onSelectSkill(id)` call — which already exists.

### Interface

```js
// src/game/useClickVsDrag.js — exported shape
export default function useClickVsDrag({ thresholdPx = 5 } = {}) {
  const downRef = useRef(null)

  const onPointerDown = useCallback((e) => {
    downRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const isDrag = useCallback((e) => {
    if (!downRef.current) return false
    const dx = e.clientX - downRef.current.x
    const dy = e.clientY - downRef.current.y
    return Math.hypot(dx, dy) >= thresholdPx
  }, [thresholdPx])

  return { onPointerDown, isDrag }
}
```

### Integration with existing pointer-pick effect

WebGLConstellation's existing `useEffect` already wires `pointermove + pointerleave + click` on `canvas`. The `click` handler gets one extra guard:

```js
const { onPointerDown, isDrag } = useClickVsDrag({ thresholdPx: 5 })

canvas.addEventListener('pointerdown', onPointerDown)
canvas.addEventListener('click', (e) => {
  if (isDrag(e)) return                   // ← suppress click on drag
  const matched = pickAt(e.clientX, e.clientY)
  if (matched != null && onSelectSkill) onSelectSkill(matched)
})
```

### Interaction with OrbitControls

OrbitControls consumes `pointerdown/pointermove/pointerup` *on the same canvas*. Two things must be true:
1. **Don't double-handle the same event:** OrbitControls calls `e.preventDefault()` internally on drag start. Our `click` listener fires only if pointerup arrives without an intervening drag — browser-native click dispatch already respects movement threshold (~3px on most platforms), but our explicit 5px threshold + `isDrag()` check is the load-bearing guarantee, not the browser's default.
2. **Event order:** controls' `pointermove` fires before our `pointermove` (both attached to same canvas; order is attach-order). Attach controls FIRST in the effect, then our pick handlers.

---

## 9. Test boundaries — Question 7

**Answer:** Layout tests stay pure + easy (vitest jsdom, no canvas). Renderer tests stay shallow + integration-focused (no 3D math assertions). OrbitControls is mockable in jsdom via `vi.mock('three/examples/jsm/controls/OrbitControls')`. NO new browser-only test suite needed for v3.10.

### Existing test impact analysis

| Test file | Impact of adding `.z` | Action |
|-----------|----------------------|--------|
| `constellation.layout.test.js` | Existing 4 tests still pass — they assert `typeof x === 'number'` and key count, NOT object-key shape | APPEND 3 z-specific tests (range, clustering, determinism) |
| `constellation.graph.test.js` | Graph fn returns nodes; layout is downstream; no impact | NO CHANGE |
| `WebGLConstellation.test.js` | Already shallow — mocks canvas context; doesn't test render math | NO CHANGE (or add 1 `canvas.getContext` was called assertion) |
| `SvgConstellation.test.js` | Reads `layout[id].x/y` — ignores z silently | NO CHANGE (regression check: verify SVG path still renders when layout has `.z`) |
| `GameMode.test.js` | Smoke-mounts component, mocks renderers | NO CHANGE |
| `useConstellation.test.js` | Hook tests; no layout dep | NO CHANGE |
| `useClickVsDrag.test.js` | NEW | 5-8 tests, pure jsdom |
| `useRendererCapability.test.js` | NO change to hook | NO CHANGE |

### Why renderer integration tests stay shallow

Vitest + jsdom cannot run WebGL — `getContext('webgl')` returns `null` in jsdom. Phase 17 already chose **NOT** to bring in headless GL (e.g. `headless-gl` npm pkg, ~30MB native bindings) — the cost-benefit (~30MB dep + flaky CI) lost to "manual UAT covers visual correctness." That decision stands for v3.10.

**Practical implication:** OrbitControls behavior (drag rotates camera by N degrees, auto-rotate idles after 4s) is **NOT** unit-testable in vitest. Coverage strategy:
- **Pure logic** (click-vs-drag threshold, idle timer state machine) → vitest unit tests
- **Integration** (camera + controls + scene compose correctly) → mock OrbitControls with `vi.mock` and assert that `controls.update()` and the dispose path are called
- **Visual correctness** (3D actually rotates, depth looks right) → manual UAT in v3.10's UAT.md, same pattern as Phase 17 Slice 5

### Mocking OrbitControls in vitest

```js
// In WebGLConstellation.test.js (or a vitest setup file if shared)
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    dispose: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    target: { set: vi.fn() },
    enableDamping: true,
    dampingFactor: 0.05,
    autoRotate: false,
    autoRotateSpeed: 0,
  })),
}))
```

This is the same pattern Phase 17 used to mock parts of `three` for `GameMode.test.js` after Slice 1 (Code-review remediation: GameMode canvas mock — see v3.8-ROADMAP Phase 15 entry).

---

## 10. Bundle strategy — Question 8

**Answer: OrbitControls lands in the existing WebGL lazy chunk. NO separate chunk. Verified by Vite/Rollup default behavior + current `vite.config.js` having no `manualChunks` override.**

### Why it lands in the same chunk automatically

`React.lazy(() => import('./renderers/WebGLConstellation'))` in `GameMode.js` already triggers Rollup's dynamic-import-based code splitting:
- Everything `WebGLConstellation.js` *statically* imports → bundled into the same chunk
- `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'` is a **static** import inside the lazy-imported module → falls into the same chunk

There is no scenario in Vite's default config (current `vite.config.js` has no `manualChunks`, no `output.experimentalMinChunkSize`) where a static import inside a dynamically-imported module produces a separate chunk.

### Bundle size delta — estimated

| Lib | Source | Min+gz |
|-----|--------|--------|
| OrbitControls.js | `three/examples/jsm/controls/OrbitControls.js` | ~4-5 kB gz (single file, ESM, tree-shakes well) |
| PerspectiveCamera | already bundled in `three` core import; replacing OrthographicCamera | ~0 kB delta (both already in core) |

Expected WebGL lazy chunk: 117 kB gz → **~121-122 kB gz** after v3.10. Comfortable headroom — Phase 17 ROADMAP notes "D-17-TREESHAKE target ~40 kB unreached" but ceiling is Lighthouse mobile gate (mobile chunk 38.82 kB — UNAFFECTED, three.js still desktop-only).

### Verification gate for v3.10 close

Use existing `scripts/check-bundle-gate.mjs` (Phase 17 Slice 5). The HARD gate is mobile chunk size — no new desktop gate is required. Add a soft assertion (WARN band) for WebGL chunk ≤ 130 kB gz to catch accidental tree-shake regressions. Cross-check with `dist/stats.html` (visualizer plugin already enabled).

### Anti-pattern to avoid

**DO NOT** create `src/game/renderers/WebGLConstellation3D.js` as a separate file. Reasons:
1. Two parallel renderer files = two `React.lazy` boundaries = either both load (waste) or you wire complex selection
2. Doubles the maintenance surface for shader changes (each pixel polish edit happens in 2 files)
3. Splits the Phase 17 props contract test target

The 3D upgrade IS the WebGL renderer now — same file, same name, same lazy import.

---

## 11. GAME-01 divergence documentation — Question 9

**Answer:** Reframe GAME-01 in `v3.10-REQUIREMENTS.md` as "adaptive-fidelity contract" with the props-identical guarantee preserved. Add a Key Decision row in `PROJECT.md`. No codebase-level CLAUDE.md edit needed (existing wording already capability-tiered).

### Three-tier documentation

**1. `PROJECT.md` — Key Decisions table — NEW row at milestone close:**
```
| v3.10 reframes GAME-01 as "single props contract, adaptive visual
fidelity" (D-v3.10-DIVERGE) | SVG mobile path stays 2D flat — desktop
WebGL gets genuine 3D with PerspectiveCamera + OrbitControls — explicit
recognition that the picture differs across renderers | ✓ Accepted at
v3.10 plan |
```

**2. `v3.10-REQUIREMENTS.md` — DEPTH-01 acceptance criteria — NEW constraint clause:**
```
DEPTH-01 acceptance:
- Layout signature {x, y, z} consumed by both renderers (SVG ignores z silently)
- Props contract between SvgConstellation and WebGLConstellation identical
  (same prop names, same prop types, same callback signatures)
- Visual rendering EXPLICITLY DIVERGES: SVG = flat 2D, WebGL = genuine 3D.
  This is feature, not bug — adaptive fidelity per capability tier.
```

**3. CODEBASE-LEVEL `CLAUDE.md` / Architecture section — NO update needed.**
The locked architectural doc already says: "Adaptive render: full WebGL on desktop, lightweight SVG/DOM on mobile." Original wording was already capability-tiered; 3D fits inside that contract. No retroactive doc edit.

### Why NOT a root-level `ARCHITECTURE.md`

The portfolio doesn't have a root-level `ARCHITECTURE.md`. The closest equivalent is `CLAUDE.md` Architecture section + the milestone roadmap files. v3.10's milestone ROADMAP is the canonical landing place. Adding a hypothetical root ARCHITECTURE.md just for this seed is over-architecting docs.

---

## 12. Build order recommendation

Phase 20 (the one v3.10 phase per PROJECT.md) should ship as **3 plans, sequential**, mirroring Phase 17's vertical-slice pattern:

```
Plan 20-01 — Data layer (layout extension + tests)        ← ~1 day
  1. Add CATEGORY_Z constant + z computation to computeLayout()
  2. Append 3 z-specific tests to constellation.layout.test.js
  3. Verify all 261 existing tests stay GREEN
  4. Verify SVG renderer still renders correctly (layout[id].z is silently ignored)
  GATE: tests pass + dev server shows SVG path unchanged

Plan 20-02 — WebGL renderer (perspective + OrbitControls)  ← ~2 days
  1. PerspectiveCamera replaces OrthographicCamera (~5 LOC)
  2. positions[i*3+2] = pos.z in geometry build (~1 LOC)
  3. OrbitControls import + instantiate in useEffect + dispose in cleanup
  4. Idle auto-rotate state machine (rAF reads lastInteraction ref)
  5. Theme + dim + halo effects unchanged (operate on uniforms/attributes, not camera)
  6. Mock OrbitControls in WebGLConstellation.test.js sanity test
  GATE: dev server shows rotating 3D + manual UAT visual check

Plan 20-03 — Click-vs-drag hook + UAT                      ← ~1 day
  1. NEW src/game/useClickVsDrag.js (~30 LOC) + unit tests
  2. Wire into existing pointer-pick effect in WebGLConstellation
  3. UAT.md with rotation feel, click reliability, mobile SVG unchanged,
     prefers-reduced-motion still SVG, error fallback still works
  4. Bundle gate check (WebGL chunk soft ≤130 kB gz)
  GATE: UAT 8/8 pass + bundle gate green
```

**Why layout first:** Pure function; if z values are visually wrong (architecture stack reads backwards, ordering confusing) the fix is one constant block edit. Avoid compounding camera tuning AND z-band tuning in the same plan.

**Why interaction last:** Click-vs-drag only matters once rotation works. Building it before 20-02 means writing a hook with no integration target.

---

## 13. Mapping back to Phase 17 decisions

| Phase 17 decision | v3.10 status | Action required |
|-------------------|--------------|-----------------|
| **D-17-EXTRACT** (capability + ErrorBoundary lifted out of GameMode) | PRESERVED | No collapse — new code must respect the lifted structure |
| **D-17-HOVERED-PROP** (hover lives in useConstellation, renderers callback-out) | PRESERVED | Camera state is the only NEW state; it goes to useRef in WebGL (explicitly NOT lifted because it's renderer-only — see §5 rationale) |
| **D-17-VISUAL** (flat 2D-in-3D Orthographic aesthetic) | **OVERRIDDEN** | Log as D-v3.10-VISUAL replaces D-17-VISUAL |
| **D-17-PRIMITIVES** (Points + ShaderMaterial) | EXTENDED | VERTEX_SHADER `positions[i*3+2] = 0` becomes `pos.z`; ~1 LOC; size-attenuation by depth happens naturally via projection matrix |
| **D-17-LIB** (three.js raw, no helper libs) | EXTENDED (small) | OrbitControls IS a three.js helper (`/examples/jsm/`); accept this exception explicitly. Log as D-v3.10-CONTROLS. Tradeoff: hand-rolling pointer→quaternion math is ~80 LOC vs OrbitControls' battle-tested damping/momentum |
| **D-17-EDGE-RGBA** (BufferAttribute itemSize=4 for alpha) | PRESERVED | No edge work in v3.10 |
| **D-17-LIGHTHOUSE-FLOW** (`lighthouse:mobile && lighthouse:check`) | PRESERVED | Run at v3.10 close — same gate, mobile path untouched, should pass identically |
| **D-14-01-LAYOUT** (deterministic radial, zero d3-force) | EXTENDED | z is deterministic constant per category; preserves zero-physics rule. d3-force-3d explicitly REJECTED — SEED already flags this |
| **GAME-01** (props-identical SVG ↔ WebGL contract) | REFRAMED | "Props-identical, fidelity-divergent" — see §11 |

---

## 14. Anti-Patterns to Avoid

### Anti-Pattern 1: Creating `build3DLayout()` as a parallel function

**What people do:** Write a new function next to `computeLayout()` for 3D so SVG and WebGL "stay clean."
**Why it's wrong:** Two layout sources of truth = two paths to keep deterministic + two test fixtures + two places to refactor when categories change. JavaScript ignores extra object keys; SVG never sees z.
**Do this instead:** Extend `computeLayout()` to `{x, y, z}`. SVG ignores. Done.

### Anti-Pattern 2: Lifting camera state to `useConstellation`

**What people do:** Apply D-17-HOVERED-PROP precedent and put camera rotation/zoom in the shared hook for "consistency."
**Why it's wrong:** SVG renderer has no camera. Forces conditional renderer-coupled code into a shared hook. Causes 60 setState/sec render thrash during damped rotation.
**Do this instead:** `useRef` inside WebGLConstellation. Imperative camera state stays in three.js where it belongs.

### Anti-Pattern 3: Separate WebGLConstellation3D.js file

**What people do:** Create a second renderer file to "preserve" the 2D one for fallback.
**Why it's wrong:** WebGL fallback is already SVG (RendererErrorBoundary fallback). A second WebGL file would never be reached. Doubles the maintenance surface for every shader edit.
**Do this instead:** Extend WebGLConstellation.js in place. Git history preserves the 2D version if needed.

### Anti-Pattern 4: Inlining click-vs-drag inside `pointerdown` event handler

**What people do:** Add a `dragDistance > 5 ? bail : pick` inline in the existing pointer-pick useEffect.
**Why it's wrong:** Not testable without canvas. Mixes pointer-pick math with input-classification math. Can't reuse the threshold for future SVG drag-to-pan.
**Do this instead:** Tiny `useClickVsDrag()` hook (~30 LOC). Pure unit-testable. Reusable.

### Anti-Pattern 5: Letting OrbitControls' pointer handler hijack our pick `click`

**What people do:** Wire OrbitControls and our click handler in unspecified order; assume browser sorts it out.
**Why it's wrong:** Order matters — OrbitControls calls preventDefault on its drag events; our click handler must guard with `isDrag(e)` not rely on OrbitControls suppressing the click.
**Do this instead:** Attach OrbitControls first, our handlers second; guard our click with explicit `isDrag(e)` check using the 5px threshold from useClickVsDrag.

### Anti-Pattern 6: Bleeding `z` values into `src/data/skills.js`

**What people do:** Add a `z` field next to `color` on `SKILL_CATEGORIES` "because it's per-category data anyway."
**Why it's wrong:** `skills.js` comments explicitly establish the data-vs-visual boundary ("color is DATA…NOT styling tokens"). Adding z crosses that line and invites every future visual decision (rotation amplitude, halo intensity) to follow.
**Do this instead:** Keep `CATEGORY_Z` in `constellation.layout.js` next to `CATEGORY_RING_RADIUS`.

---

## 15. Integration Points Summary

### Internal Boundaries (data flow)

| Boundary | Communication | v3.10 change |
|----------|---------------|--------------|
| `experience.js` → `buildConstellationGraph()` | Pure function call | NONE |
| `buildConstellationGraph()` → `computeLayout()` | Pure: nodes → positions | Positions gain `.z` |
| `computeLayout()` → `GameMode.LAYOUT` | Module-load constant | NONE (still `const LAYOUT = computeLayout(GRAPH_NODES)`) |
| `GameMode` → renderer | `rendererProps` spread | NONE — props identical |
| Renderer ← `useConstellation` | `cons.*` consumed | NONE |
| `WebGLConstellation` → OrbitControls | NEW imperative wiring inside useEffect | NEW |
| `WebGLConstellation` → camera/scene/renderer refs | Existing useRef pattern | EXTENDED (1 new ref for controls, +1 for idle timer) |
| pointer events on canvas → `onSelectSkill` prop | Callback up | Click-vs-drag gate inserted between pick + callback |
| pointer events on canvas → OrbitControls.update() | NEW | NEW — attached BEFORE our handlers |

### External dependencies (third-party touchpoints)

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| `three` (core) | Static import in lazy-loaded module | `OrthographicCamera` → `PerspectiveCamera` swap; both already bundled |
| `three/examples/jsm/controls/OrbitControls.js` | Static import in lazy-loaded module | NEW — ~5 kB gz; lands in WebGL chunk; mockable in vitest |

---

## 16. Confidence calibration

- **HIGH** confidence on file boundaries, integration points, and Phase 17 decision preservation — backed by direct inspection of `GameMode.js`, `useConstellation.js`, `WebGLConstellation.js`, `useRendererCapability.js`, `RendererErrorBoundary.js`, `constellation.layout.js`, `constellation.layout.test.js`, `vite.config.js`.
- **HIGH** confidence on test boundaries — the existing test files do not over-specify object shape, so extending the layout signature is safe.
- **MEDIUM** confidence on OrbitControls bundle size (~5 kB gz) — based on community-reported numbers for `three/examples/jsm/controls/OrbitControls.js`; recommend bundle-visualizer check at end of Plan 20-02 to confirm.
- **MEDIUM** confidence on category-z values (the specific numbers ±150 etc.) — these are design proposals, not measurements. UAT will tune them.
- **MEDIUM** confidence on async OrbitControls handler errors falling outside the ErrorBoundary — React's stance on async errors is well-documented (boundaries catch render+lifecycle+commit; not async/event), but the practical likelihood of OrbitControls throwing async is low.

---

## 17. Sources

- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/.planning/PROJECT.md` — milestone scope + Key Decisions table
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/.planning/seeds/SEED-3D-CONSTELLATION.md` — original seed, technical breakdown, risks
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/.planning/milestones/v3.8-ROADMAP.md` — Phase 17 decisions (D-17-EXTRACT, D-17-HOVERED-PROP, D-17-VISUAL, D-17-PRIMITIVES, D-17-LIB, D-17-EDGE-RGBA, D-17-LIGHTHOUSE-FLOW)
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/src/game/GameMode.js` — orchestrator current shape
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/src/game/useConstellation.js` — state hook current shape
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/src/game/renderers/WebGLConstellation.js` — renderer current shape (Slice 4 final)
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/src/game/constellation.layout.js` — pure layout function
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/src/game/constellation.layout.test.js` — test surface for layout
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/src/game/useRendererCapability.js` — 5-gate detection
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/src/game/RendererErrorBoundary.js` — fallback recovery pattern
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/src/data/skills.js` — skill category map (z values would be antagonistic here per file comments)
- `/Users/andres/Library/Mobile Documents/com~apple~CloudDocs/Development/repositories.nosync/codehunters/andresmontoyatco/vite.config.js` — verifies no `manualChunks` override; dynamic-import chunking is Rollup default

---

*Architecture research for: v3.10 3D constellation upgrade (PerspectiveCamera + OrbitControls layered on existing WebGL renderer)*
*Researched: 2026-06-08*
