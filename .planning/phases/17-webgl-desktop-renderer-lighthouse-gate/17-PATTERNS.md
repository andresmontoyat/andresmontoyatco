# Phase 17: WebGL Desktop Renderer & Lighthouse Gate — Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 13 new/modified files across 5 MVP slices
**Analogs found:** 10 / 13 (3 have no in-repo analog — flagged for planner)

> CRITICAL CONVENTION REINFORCEMENT (Phase 14/15/16 verified): JSX lives in `.js` files (NEVER `.jsx`). `vite.config.js:21-23` esbuild `loader: 'jsx'` + `include: /src\/.*\.js$/`. No semicolons (`semi: 0`). No comma-dangle enforcement. Tests are **colocated** beside source (NEVER in `__tests__/` subdir). Use `motion-safe:` prefix on every animation utility. Use `data-game-interactive` attribute for click-outside allow-list.

---

## Pre-Existing Phase 17 Assets (LIFT, not CREATE)

Two assets already exist in `src/game/GameMode.js`. Phase 17 **promotes** them to standalone modules rather than authoring from scratch:

| Asset | Current location | Phase 17 destination | Action |
|---|---|---|---|
| `ConstellationErrorBoundary` class | `GameMode.js:46-67` (inline) | `src/game/RendererErrorBoundary.js` | EXTRACT — rename, accept `fallback` prop already does (line 63), one-line component usage |
| `detectCapabilities()` function | `GameMode.js:29-44` (inline) | `src/game/useRendererCapability.js` | LIFT + EXTEND — convert to reactive hook, add WebGL/SVG return semantic, add URL override + matchMedia listener |
| `usePrefersReducedMotion` (mirror pattern) | `SvgConstellation.js:32-59` (inline hook with SSR + addListener compat) | Pattern source for `useRendererCapability` matchMedia handling | COPY PATTERN (lines 37-59) — same SSR guard + addEventListener/addListener compat shim |
| `rollup-plugin-visualizer` | `vite.config.js:11-18` (already installed, emits `dist/stats.html` with gzipSize) | Phase 17 bundle gate uses existing stats infrastructure | NO INSTALL NEEDED |

---

## CRITICAL Test-Infra Pitfall (Pitfall 1 — flag for ALL WebGL tests)

**`src/test/setup.js:9-11` globally stubs `HTMLCanvasElement.prototype.getContext = () => null`.** This silences the jsdom stack trace for the Phase 15 SVG path but **BREAKS any test asserting WebGL detection succeeds**.

```js
// src/test/setup.js:9-11 — CURRENT STATE (load-bearing for SVG tests)
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null
}
```

**Phase 17 tests asserting WebGL-positive paths MUST override per-test:**
```js
// Pattern: vi.spyOn + mockReturnValue at test start, mockRestore in afterEach
let getContextSpy
beforeEach(() => {
  getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
})
afterEach(() => getContextSpy.mockRestore())

it('returns webgl when WebGL is supported', () => {
  getContextSpy.mockReturnValue({})  // truthy = WebGL present
  // ...
})
```

---

## File Classification

| Slice | New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| 1 | `src/game/useRendererCapability.js` (NEW) | hook (capability detect) | event-driven (matchMedia → renderer enum) | `SvgConstellation.js:32-59` `usePrefersReducedMotion` + `GameMode.js:29-44` `detectCapabilities` | exact (pattern composition) |
| 1 | `src/game/useRendererCapability.test.js` (NEW) | hook test | — | `src/game/useConstellation.test.js` (full file — 161 lines, renderHook + act pattern) | exact |
| 1 | `src/game/RendererErrorBoundary.js` (NEW — extracted) | error boundary class | event-driven (catch → fallback) | `GameMode.js:46-67` `ConstellationErrorBoundary` (lift verbatim, rename) | exact (self-extract) |
| 1 | `src/game/RendererErrorBoundary.test.js` (NEW) | class component test | — | none in repo (first ErrorBoundary test) | no analog (React 17 class pattern) |
| 1 | `src/game/renderers/WebGLConstellation.js` (NEW — Slice 1: 1-node Points smoke) | renderer component | request-response (props → GPU draw) | `src/game/renderers/SvgConstellation.js` (FULL FILE — props contract, sizing, dim/highlight predicates, theme reactivity) | role-match (contract parity, different impl tech) |
| 1 | `src/game/renderers/WebGLConstellation.test.js` (NEW) | RTL component test | — | `src/game/renderers/SvgConstellation.test.js` (existing 22 tests + `matchMedia` mock + `renderRenderer` helper) | role-match — special: vi.mock('three') + getContext spy |
| 1 | `src/game/GameMode.js` (EXTEND) | orchestrator (add renderer-slot conditional + lazy import) | request-response | itself (lines 136-159 renderer slot) + `src/App.js:11,40-47` (React.lazy + Suspense pattern) | exact (self-extend) |
| 2 | `src/game/renderers/WebGLConstellation.js` (EXTEND — 26 nodes + edges + theme + selected halo) | renderer (full parity) | request-response | `SvgConstellation.js:189-378` node geometry + edge logic + halo filter | role-match (port to shader uniforms) |
| 3 | `src/game/renderers/WebGLConstellation.js` (EXTEND — rAF loop + visibilitychange + ambient uniforms) | renderer (motion) | streaming (rAF tick) | NONE in repo (first rAF loop) — RESEARCH §10 sketch is canonical | no analog |
| 4 | `src/game/renderers/WebGLConstellation.js` (EXTEND — chip-flash + weight-1 edge reveal) | renderer (interaction) | event-driven | `SvgConstellation.js:281-289` chip-flash class + `SvgConstellation.js:217-234` weight-1 edge reveal | role-match (port to shader uniforms) |
| 5 | `scripts/check-bundle-gate.mjs` (NEW) | Node post-build CI script | batch (read dist → gz → assert bands) | none in repo (rollup-plugin-visualizer emits stats, but no CI gate exists) | no analog (RESEARCH §11 sketch is canonical) |
| 5 | `scripts/check-bundle-gate.test.mjs` (NEW) | Vitest with fs mock | — | none in repo (no script tests exist) | no analog (standard Vitest fs mock pattern) |
| 5 | `src/game/FpsCounter.js` (NEW — dev only, ~20 LOC) | tiny dev widget | streaming (rAF rolling avg) | none in repo (no FPS infra) | no analog — trivial useState + rAF |
| 5 | `package.json` (EXTEND — add `build:gate` script) | config | — | itself (lines 14-19 existing build + lighthouse scripts) | exact (self-extend) |

---

## Pattern Assignments — by Slice

### Slice 1 — Walking Thin

#### `src/game/useRendererCapability.js` (NEW)

**Analog 1 — `usePrefersReducedMotion` SSR + matchMedia pattern** (`SvgConstellation.js:32-59`):
```js
// SvgConstellation.js lines 32-59 — COPY this exact SSR guard + addListener compat shim
const QUERY = '(prefers-reduced-motion: no-preference)'
const isServer = typeof window === 'undefined'

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => (isServer ? true : !window.matchMedia(QUERY).matches)
  )
  useEffect(() => {
    if (isServer) return undefined
    const mql = window.matchMedia(QUERY)
    const handler = (e) => setPrefersReducedMotion(!e.matches)
    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
    } else {
      mql.addListener(handler)                  // Safari 13 fallback
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler)
      } else {
        mql.removeListener(handler)
      }
    }
  }, [])
  return prefersReducedMotion
}
```

**Analog 2 — current `detectCapabilities()` core logic** (`GameMode.js:29-44`):
```js
// GameMode.js lines 29-44 — LIFT this verbatim, EXTEND with: 1024px breakpoint,
// effectiveType 2g check, ?renderer URL override, return 'webgl'|'svg' enum
function detectCapabilities() {
  if (typeof window === 'undefined') {
    return { prefersReducedMotion: true, saveData: false, isMobile: true, hasWebGL: false }
  }
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const saveData = (typeof navigator !== 'undefined' && navigator.connection && navigator.connection.saveData) || false
  const isMobile = window.innerWidth < 768
  let hasWebGL = false
  try {
    const c = document.createElement('canvas')
    hasWebGL = !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch (e) {
    hasWebGL = false
  }
  return { prefersReducedMotion, saveData, isMobile, hasWebGL }
}
```

**Phase 17 composition — RESEARCH §6 canonical sketch (lines 226-286 of RESEARCH.md):**
```js
import { useState, useEffect } from 'react'

const isServer = typeof window === 'undefined'

function detect() {
  if (isServer) return 'svg'

  // URL override (highest priority — debug/UAT)
  const params = new URLSearchParams(window.location.search)
  const override = params.get('renderer')
  if (override === 'svg' || override === 'webgl') return override

  // 4 mandatory gates (any fail → svg)
  const viewportOK = window.matchMedia('(min-width: 1024px)').matches
  const motionOK   = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const conn       = navigator.connection
  const saveDataOK = !(conn?.saveData === true)
  const networkOK  = !['2g', 'slow-2g'].includes(conn?.effectiveType ?? '')

  if (!viewportOK || !motionOK || !saveDataOK || !networkOK) return 'svg'

  // WebGL feature detect (last — cheapest after other gates)
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('webgl2') || c.getContext('webgl')
    return ctx ? 'webgl' : 'svg'
  } catch {
    return 'svg'
  }
}

export default function useRendererCapability() {
  const [cap, setCap] = useState(detect)

  useEffect(() => {
    if (isServer) return undefined
    const viewport = window.matchMedia('(min-width: 1024px)')
    const motion   = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler  = () => setCap(detect())

    const attach = (mql) => (mql.addEventListener
      ? mql.addEventListener('change', handler)
      : mql.addListener(handler))
    const detach = (mql) => (mql.removeEventListener
      ? mql.removeEventListener('change', handler)
      : mql.removeListener(handler))

    attach(viewport); attach(motion)
    return () => { detach(viewport); detach(motion) }
  }, [])

  return cap
}
```

**Pitfalls:**
- **Pitfall 1 (test infra):** see top of doc — `getContext` global stub must be spied per-test.
- **Pitfall 2:** `navigator.connection` is `undefined` on Safari — use `?.` everywhere (RESEARCH §6 line 244).
- **Pitfall 3:** URL override is read once at init — no listener needed (RESEARCH §7).

---

#### `src/game/useRendererCapability.test.js` (NEW)

**Analog:** `src/game/useConstellation.test.js` (FULL 161-LINE FILE — Phase 16 hook test pattern).

**Imports + describe shape — copy verbatim from `useConstellation.test.js:1-5`:**
```js
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useRendererCapability from './useRendererCapability.js'

describe('useRendererCapability', () => {
  // ...
})
```

**Per-test getContext spy (Pitfall 1 mitigation) — RESEARCH §5 lines 198-214:**
```js
let getContextSpy
let originalConnection
beforeEach(() => {
  getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
  originalConnection = navigator.connection
})
afterEach(() => {
  getContextSpy.mockRestore()
  // restore navigator.connection if mocked
})
```

**matchMedia mock pattern — copy from `SvgConstellation.test.js` (Phase 16 16-PATTERNS.md lines 116-133):**
```js
function makeMockMatchMedia(matchesMap = {}) {
  return vi.fn().mockImplementation((q) => ({
    matches: !!matchesMap[q],
    media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  window.matchMedia = makeMockMatchMedia({
    '(min-width: 1024px)': true,                  // desktop viewport
    '(prefers-reduced-motion: reduce)': false,    // motion OK
  })
})
```

**Test plan (5 gates × on/off + URL override + reactivity = ~12 tests minimum):**
- Returns `'webgl'` when all 4 gates pass AND `getContext` returns truthy.
- Returns `'svg'` when viewport < 1024px.
- Returns `'svg'` when `prefers-reduced-motion: reduce` is true.
- Returns `'svg'` when `navigator.connection.saveData === true`.
- Returns `'svg'` when `navigator.connection.effectiveType === '2g'`.
- Returns `'svg'` when `getContext` returns null (no WebGL).
- `?renderer=svg` URL override forces `'svg'` even on capable desktop.
- `?renderer=webgl` URL override forces `'webgl'` (still capability-gated — actually no, per RESEARCH §7 it short-circuits; planner: confirm semantic).
- SSR guard: returns `'svg'` when `typeof window === 'undefined'`.
- matchMedia 'change' event triggers re-evaluation (use `mql.dispatchEvent` mock).
- Cleanup removes both `viewport` and `motion` listeners on unmount.
- Memoization: same result returned across re-renders when state unchanged (mirror `useConstellation.test.js:59-64`).

---

#### `src/game/RendererErrorBoundary.js` (NEW — extracted from GameMode.js)

**Analog — `ConstellationErrorBoundary` in `GameMode.js:46-67`** (EXACT verbatim lift, rename):
```js
// GameMode.js lines 46-67 — current implementation to LIFT into its own file
class ConstellationErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Constellation error:', error, info)
  }

  render() {
    const { hasError } = this.state
    const { fallback, children } = this.props
    if (hasError) return fallback
    return children
  }
}
```

**Phase 17 changes:**
- Rename class to `RendererErrorBoundary` (clearer intent).
- Change console prefix to `'[renderer-fallback]'` (UI-SPEC §Loading State Contract line 330 + §ErrorBoundary Fallback Visual Contract).
- Export as default.

**GameMode.js update (Slice 1 same commit):** delete the inline class (lines 46-67), `import RendererErrorBoundary from './RendererErrorBoundary'`, replace `<ConstellationErrorBoundary>` JSX usage (line 136) with `<RendererErrorBoundary>`.

**Pitfalls:**
- **Pitfall 4:** React 17 ErrorBoundary MUST be a class component — no hook equivalent. Verified codebase has no other ErrorBoundary (this is the first/only one).
- **Pitfall 5:** Boundary state is sticky once tripped — no auto-reset until prop change OR reload (UI-SPEC line 346 + RESEARCH §3 line 154).

---

#### `src/game/RendererErrorBoundary.test.js` (NEW)

**No in-repo analog** — this is the first ErrorBoundary test. Use React 17 class-component test pattern with a throwing child:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import RendererErrorBoundary from './RendererErrorBoundary.js'

function Thrower() {
  throw new Error('test error')
}

describe('RendererErrorBoundary', () => {
  let consoleErrorSpy
  beforeEach(() => {
    // ErrorBoundaries log to console.error during catch — silence in test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(
      <RendererErrorBoundary fallback={<div>FALLBACK</div>}>
        <div>CHILD</div>
      </RendererErrorBoundary>
    )
    expect(screen.getByText('CHILD')).toBeInTheDocument()
    expect(screen.queryByText('FALLBACK')).not.toBeInTheDocument()
  })

  it('renders fallback when child throws', () => {
    render(
      <RendererErrorBoundary fallback={<div>FALLBACK</div>}>
        <Thrower />
      </RendererErrorBoundary>
    )
    expect(screen.getByText('FALLBACK')).toBeInTheDocument()
  })

  it('logs caught error with [renderer-fallback] prefix', () => {
    render(
      <RendererErrorBoundary fallback={<div>FB</div>}>
        <Thrower />
      </RendererErrorBoundary>
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[renderer-fallback]'),
      expect.any(Error),
      expect.any(Object),
    )
  })

  it('stays in fallback state on subsequent renders (sticky)', () => {
    const { rerender } = render(
      <RendererErrorBoundary fallback={<div>FB</div>}>
        <Thrower />
      </RendererErrorBoundary>
    )
    expect(screen.getByText('FB')).toBeInTheDocument()
    rerender(
      <RendererErrorBoundary fallback={<div>FB</div>}>
        <div>CHILD</div>
      </RendererErrorBoundary>
    )
    // sticky: still shows fallback even though child no longer throws
    expect(screen.getByText('FB')).toBeInTheDocument()
  })
})
```

**Pitfalls:**
- **Pitfall 6:** React's ErrorBoundary intentionally prints an "uncaught error" message to console even when caught — `vi.spyOn(console, 'error').mockImplementation(() => {})` is REQUIRED to keep test output clean.

---

#### `src/game/renderers/WebGLConstellation.js` (NEW — Slice 1: 1-node smoke)

**Analog — `src/game/renderers/SvgConstellation.js` (FULL FILE, 393 lines).** Read as a CONTRACT DOCUMENT, not as code to copy. Phase 15 SvgConstellation defines:

**Props signature MUST match — copy from `SvgConstellation.js:97-110`:**
```js
export default function WebGLConstellation({
  nodes,                  // graph nodes from buildConstellationGraph()
  edges,                  // graph edges from buildConstellationGraph()
  layout,                 // LAYOUT map { [id]: { x, y } }
  highlightedSkillIds,    // Phase 16: skill IDs matching filters
  selectedSkillId,        // currently selected node (single)
  yearRange,              // Phase 16: [from, to] or null
  justFilteredId = null,  // Phase 16: chip-flash trigger
  theme,                  // 'dark' | 'light'
  lang,                   // 'en' | 'es'
  t,                      // translations
  onSelectSkill,
  onHoverSkill,
}) { /* ... */ }
```

**Pre-existing helpers to PORT — from `SvgConstellation.js`:**

| SvgConstellation helper | Lines | Phase 17 WebGL port strategy |
|---|---|---|
| `LIGHT_THEME_STROKES` constant | 7-16 | COPY VERBATIM as module-scope; upload as per-vertex `uNodeStrokeColor` attribute when `theme==='light'` |
| `SIZING` table + `computeRadius()` | 18-26 | COPY VERBATIM; result feeds `gl_PointSize = svgRadius × pixelRatio × cameraScale × 2` (UI-SPEC §Node Geometry) |
| `edgeStrokeWidth()` | 28-30 | COPY VERBATIM; feeds custom quad-strip geometry width (UI-SPEC §Edge Geometry note: `LineBasicMaterial.linewidth` broken in WebGL2 — needs quad-strip geometry) |
| `nodeMatchesYearRange()` | 73-78 | COPY VERBATIM as JS predicate; result feeds per-vertex `dim` attribute |
| `shouldDimNode()` | 84-95 | COPY VERBATIM; same composite predicate; result feeds per-vertex `dim` attribute (0.35 or 1.0) |
| `buildNodeLabel()` | 62-66 | NOT NEEDED in WebGL (canvas is `aria-hidden`; sr-only fallback owns SR) |

**Edge dim composite (lines 217-234):** port the `filtersActive`/`sourceDim`/`targetDim` multiplier into shader uniform — per UI-SPEC §Active-State Contract: `edge_opacity *= min(node1.dim, node2.dim) × 0.35 + (1 − min) × 1.0`.

**Halo filter (line 276):** SvgConstellation uses CSS `drop-shadow(0 0 8px halo) drop-shadow(0 0 16px rgba(255,255,255,0.08))`. WebGL implements via additive radial gradient in fragment shader (UI-SPEC §Halo + RESEARCH §2).

**Slice 1 minimal scope:** mount one Points geometry with one vertex at `layout[nodes[0].id]`; verify shader compiles; verify component mounts without throwing. No edges, no theme reactivity, no rAF loop yet.

**Three.js imports (D-17-TREESHAKE) — RESEARCH §1 lines 25-39:**
```js
import {
  Scene, OrthographicCamera, WebGLRenderer,
  BufferGeometry, BufferAttribute,
  ShaderMaterial, Points,
  LineSegments, LineBasicMaterial,
  Color, AdditiveBlending,
} from 'three'
```

**Canvas + aria-hidden contract — UI-SPEC §Bilingual / A11y Constraints:**
```jsx
<canvas ref={canvasRef} aria-hidden="true" tabIndex={-1} className="webgl-canvas" />
```

**Pitfalls:**
- **Pitfall 7:** `WebGLRenderer` constructor CANNOT run in jsdom without a stub. Tests MUST `vi.mock('three', ...)` with a fake constructor returning `{ setSize: vi.fn(), render: vi.fn(), domElement: document.createElement('canvas'), dispose: vi.fn() }`. RESEARCH §5 line 188.
- **Pitfall 8:** Always clean up `geometry.dispose()`, `material.dispose()`, `renderer.dispose()` in useEffect cleanup. Otherwise GPU memory leaks on renderer swap (UI-SPEC §Renderer-swap transition line 296).
- **Pitfall 9:** Light-theme stroke ring (1.5-equivalent-px in fragment shader) MUST pass WCAG AA 3:1 UI-component contrast against `#F0F0F5` after AA blending — port `LIGHT_THEME_STROKES` table exactly, do not approximate (UI-SPEC §WCAG AA Contrast verification).

---

#### `src/game/renderers/WebGLConstellation.test.js` (NEW)

**Analog:** `src/game/renderers/SvgConstellation.test.js` (existing — referenced from 16-PATTERNS.md; not re-read but uses `matchMedia` mock + `renderRenderer` helper).

**Three.js mock — RESEARCH §5 line 188:**
```js
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    WebGLRenderer: vi.fn(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas'),
      dispose: vi.fn(),
    })),
  }
})
```

**getContext spy (Pitfall 1):**
```js
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({})
})
```

**Slice 1 test scope (smoke + capability branch):**
- Component mounts without throwing.
- Renders an `aria-hidden` canvas element.
- Calls `WebGLRenderer` constructor on mount.
- Calls `renderer.dispose()` on unmount.
- Accepts the Phase 15 props contract (smoke `render(<WebGLConstellation {...minimalProps} />)`).

**Capability branch test (in GameMode.test.js extension, not here):**
- Mock `useRendererCapability` to return `'webgl'` → assert `<Suspense>` + lazy WebGL chunk path mounts.
- Mock `useRendererCapability` to return `'svg'` → assert direct `<SvgConstellation>` mounts.

---

#### `src/game/GameMode.js` (EXTEND — renderer slot conditional + lazy import)

**Analog 1 — self (current renderer slot lines 136-159):**
```js
// CURRENT — to be modified Slice 1
<ConstellationErrorBoundary fallback={errorFallback}>
  <div data-game-interactive className="w-full max-w-3xl relative" ...>
    <SvgConstellation
      nodes={GRAPH_NODES}
      edges={GRAPH_EDGES}
      layout={LAYOUT}
      highlightedSkillIds={cons.highlightedSkillIds}
      selectedSkillId={cons.selectedSkillId}
      yearRange={cons.yearRange}
      justFilteredId={cons.justFilteredId}
      theme={theme}
      lang={lang}
      t={t}
      onSelectSkill={cons.onSelectSkill}
      onHoverSkill={cons.onHoverSkill}
    />
  </div>
</ConstellationErrorBoundary>
```

**Analog 2 — `src/App.js:11,40-47` React.lazy + Suspense pattern (use VERBATIM):**
```js
// App.js line 11 — lazy import pattern
const GameMode = React.lazy(() => import('./game/GameMode'))

// App.js lines 40-47 — Suspense wrap pattern
if (viewMode === 'game') {
  return (
    <main id="main">
      <Suspense fallback={SectionFallback}>
        <GameMode />
      </Suspense>
    </main>
  )
}
```

**Phase 17 composition (UI-SPEC §Layout Contract lines 449-458):**
```js
// At top of GameMode.js — add to existing imports
import React, { useState, useMemo, Suspense } from 'react'  // ADD Suspense
import RendererErrorBoundary from './RendererErrorBoundary'  // NEW (Slice 1)
import useRendererCapability from './useRendererCapability'  // NEW (Slice 1)

// Lazy import — sits at module scope, NOT inside the component (per App.js convention)
const WebGLConstellation = React.lazy(() => import('./renderers/WebGLConstellation'))

// DELETE the inline ConstellationErrorBoundary class (lines 46-67) — extracted in Slice 1
// DELETE the inline detectCapabilities (lines 29-44) — replaced by useRendererCapability hook
// DELETE useState(() => detectCapabilities()) on line 74

// Inside GameMode component body — replace capability state
const capability = useRendererCapability()  // returns 'webgl' | 'svg'

// Renderer slot becomes conditional — replace lines 136-159
<RendererErrorBoundary fallback={<SvgConstellation {...rendererProps} />}>
  <div
    data-game-interactive
    className="w-full max-w-3xl relative"
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

**Shared props extraction (avoid 12-prop duplication):**
```js
const rendererProps = {
  nodes: GRAPH_NODES,
  edges: GRAPH_EDGES,
  layout: LAYOUT,
  highlightedSkillIds: cons.highlightedSkillIds,
  selectedSkillId: cons.selectedSkillId,
  yearRange: cons.yearRange,
  justFilteredId: cons.justFilteredId,
  theme,
  lang,
  t,
  onSelectSkill: cons.onSelectSkill,
  onHoverSkill: cons.onHoverSkill,
}
```

**Pitfalls:**
- **Pitfall 10:** `data-prefers-reduced-motion` attribute on the wrapper (currently line 142, derived from old `capabilities.prefersReducedMotion`) — REMOVE (no longer needed; `useRendererCapability` gates reduced-motion users to SVG path before WebGL ever loads).
- **Pitfall 11:** `<Suspense>` fallback MUST be `<SvgConstellation {...rendererProps} />` — NOT a spinner/skeleton (UI-SPEC §Loading State Contract: "SVG IS the loading state"). This means SvgConstellation will mount briefly before the WebGL chunk loads — that's the intended behavior.
- **Pitfall 12:** `RendererErrorBoundary` fallback prop ALSO `<SvgConstellation {...rendererProps} />` so chunk-load failure AND runtime errors both gracefully degrade.

---

### Slice 2 — Full Graph Parity (extends Slice 1 WebGL renderer)

#### `src/game/renderers/WebGLConstellation.js` (EXTEND)

**Analog — `SvgConstellation.js:189-378` node + edge render loop:**

**Node geometry — port from `SvgConstellation.js:189, 256-273`:**
```js
// Lines 189-190: maxCount + sort by count
const maxCount = Math.max(...nodes.map((n) => n.count))
const nodesByCount = [...nodes].sort((a, b) => b.count - a.count)

// Lines 260, 265-269: per-node radius + dim
const r = computeRadius(node.count, maxCount, breakpoint)  // COPY this formula
const fillOpacity = shouldDimNode(node, {
  selectedSkillId, highlightedSkillIds, yearRange,
}) ? 0.35 : 1                                              // COPY this predicate
```

WebGL implementation: build `Float32Array` per-vertex attributes:
- `position` — `(layout[id].x, layout[id].y, 0)`
- `size` — `computeRadius(...)` value
- `color` — `node.color` (from `SKILL_CATEGORY_COLORS`)
- `dim` — `shouldDimNode(...) ? 0.35 : 1.0`
- `halo` — `node.id === selectedSkillId ? 1.0 : 0.0`
- `strokeColor` — `theme === 'light' ? LIGHT_THEME_STROKES[node.category] : transparent`

**Edge geometry — port from `SvgConstellation.js:212-252`:**
```js
// Lines 219-234: weight ≥2 always visible; weight-1 incident-to-active reveal;
// edge dim multiplier 0.35 when either endpoint dimmed
const activeId = selectedSkillId || focusedNodeId || hoveredNodeId
const incidentToActive = activeId !== null && (e.source === activeId || e.target === activeId)
const isHeavy = e.weight >= 2
let edgeOpacity = 0
if (isHeavy) edgeOpacity = 1
else if (incidentToActive) edgeOpacity = 1
const filtersActive = (highlightedSkillIds && highlightedSkillIds.length > 0) || yearRange != null
if (filtersActive) {
  /* multiply by 0.35 if source OR target dimmed */
}
```

WebGL implementation: `LineSegments` mesh with custom quad-strip BufferGeometry (UI-SPEC §Edge Geometry — `LineBasicMaterial.linewidth` is broken in WebGL2; quad-strip ~20 LOC custom).

**Theme reactivity — RESEARCH §8 lines 309-318:**
```js
useEffect(() => {
  if (!materialRef.current) return
  const root = document.documentElement
  const cs = getComputedStyle(root)
  materialRef.current.uniforms.uEdgeColor.value      = parseCSSColor(cs.getPropertyValue('--color-constellation-edge'))
  materialRef.current.uniforms.uEdgeHeavyColor.value = parseCSSColor(cs.getPropertyValue('--color-constellation-edge-heavy'))
  materialRef.current.uniforms.uHaloColor.value      = parseCSSColor(cs.getPropertyValue('--color-constellation-halo'))
  // light-theme strokeColor attribute MUST be re-uploaded here (UI-SPEC §Theme Reactivity contract)
}, [theme])
```

**`parseCSSColor()` helper — RESEARCH §9 lines 331-343 (module-scope helper, unit test with hex + modern rgb syntax):**
```js
function parseCSSColor(str) {
  const s = str.trim()
  if (s.startsWith('#')) return new Color(s)
  const m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/)
  if (m) {
    const [, r, g, b] = m
    return new Color(Number(r) / 255, Number(g) / 255, Number(b) / 255)
  }
  return new Color(0xffffff)
}
```

**Pitfalls:**
- **Pitfall 13:** `new THREE.Color()` rejects modern `rgb(r g b / a)` syntax — MUST use the regex parser. Test BOTH `#hex` AND `rgb(56 56 70 / 0.18)` inputs.
- **Pitfall 14:** Alpha from CSS var goes to `uHaloAlpha` uniform, NOT into `THREE.Color` (which is RGB only).

---

### Slice 3 — Ambient Motion (extends Slice 2 WebGL renderer)

#### `src/game/renderers/WebGLConstellation.js` (EXTEND — rAF + visibilitychange + ambient uniforms)

**NO in-repo analog.** First rAF loop in the codebase. Canonical source: RESEARCH §10 lines 354-385.

```js
useEffect(() => {
  let rafId
  let lastT = performance.now()

  function tick(t) {
    const dt = (t - lastT) / 1000
    lastT = t
    // ambient drift (sin per node), glow pulse (selected), halo brighten (highlighted)
    materialRef.current.uniforms.uTime.value += dt
    rendererRef.current.render(sceneRef.current, cameraRef.current)
    rafId = requestAnimationFrame(tick)
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(rafId)
      rafId = null
    } else if (rafId === null) {
      lastT = performance.now()        // reset dt to avoid huge jump
      rafId = requestAnimationFrame(tick)
    }
  }

  rafId = requestAnimationFrame(tick)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    cancelAnimationFrame(rafId)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}, [])
```

**Ambient motion specs (UI-SPEC §Animation Contract):**
- Drift amplitude 0.2 SVG units, period 4-6s, per-node deterministic seed via `hash(node.id)`.
- Selected glow pulse 2000ms ease-in-out (matches Phase 15 `pulse2` rhythm — `tailwind.config.js`).
- Highlighted halo brighten 3000ms (slower than selected for distinction).

**Pitfalls:**
- **Pitfall 15:** `cancelAnimationFrame(rafId)` on tab-switch race — set `rafId = null` SENTINEL to prevent double-restart (RESEARCH §10 + Risks §4).
- **Pitfall 16:** `lastT = performance.now()` on resume — otherwise `dt` becomes the tab-hidden duration (could be minutes), creating massive position jump.
- **Pitfall 17:** Test the visibility pause via `Object.defineProperty(document, 'visibilityState', { value: 'hidden' })` + manual `dispatchEvent(new Event('visibilitychange'))` in jsdom. RAF mock via `vi.useFakeTimers()`.

---

### Slice 4 — Chip-Flash + Weight-1 Edge Reveal (extends Slice 3 WebGL renderer)

#### `src/game/renderers/WebGLConstellation.js` (EXTEND)

**Analog 1 — chip-flash class application** (`SvgConstellation.js:281-289`):
```js
// SvgConstellation.js lines 281-289 — Phase 16 D-16-CHIP-FLASH:
const flashClass = node.id === justFilteredId && !prefersReducedMotion
  ? 'motion-safe:animate-chip-flash'
  : ''
const baseAnim = prefersReducedMotion ? '' : 'motion-safe:animate-node-reveal'
const groupClassName = [baseAnim, flashClass].filter(Boolean).join(' ')
```

WebGL port (UI-SPEC §Chip-Flash on WebGL lines 269-279):
```js
// On justFilteredId prop change → set shader uniforms
useEffect(() => {
  if (!materialRef.current || justFilteredId === null) return
  materialRef.current.uniforms.uFlashNodeId.value    = nodeIdToIndex(justFilteredId)
  materialRef.current.uniforms.uFlashStartTime.value = performance.now() / 1000
  // No timeout cleanup needed — shader self-resets after 100ms via uFlashStartTime comparison
}, [justFilteredId])
```

Fragment shader computes `flashProgress = clamp((uTime - uFlashStartTime) / 0.1, 0, 1)` and applies `gl_PointSize *= mix(1.0, 0.94, smoothstep(0.0, 0.5, flashProgress))` + alpha modulation per UI-SPEC §Chip-Flash row.

**Analog 2 — weight-1 edge reveal** (`SvgConstellation.js:219-224`):
```js
// SvgConstellation.js lines 219-224 — Phase 15 D-15-VIS-EDGE:
const activeId = selectedSkillId || focusedNodeId || hoveredNodeId
const incidentToActive = activeId !== null && (e.source === activeId || e.target === activeId)
const isHeavy = e.weight >= 2
let edgeOpacity = 0
if (isHeavy) edgeOpacity = 1
else if (incidentToActive) edgeOpacity = 1
```

WebGL port: per-segment alpha computed in vertex shader from `uActiveNodeId` uniform. When `e.weight === 1 && (e.source === uActiveNodeId || e.target === uActiveNodeId)` → alpha 1; else alpha 0. Combine with filter-dim multiplier (Slice 2 logic).

**Pitfalls:**
- **Pitfall 18:** Chip-flash uniform needs `uFlashStartTime = -Infinity` initialized value (or 0 with cleanup logic) so shader doesn't flash on initial mount. RESEARCH §11 confirms shader self-resets after 100ms.
- **Pitfall 19:** WebGL has no `focusedNodeId` state (canvas is `aria-hidden`) — `activeId` reduces to `selectedSkillId || hoveredSkillId` in WebGL. If UI-SPEC §Focus indicator on WebGL `focusedNodeId` prop is promoted (planner decision), WebGL accepts it but it likely stays null in practice.

---

### Slice 5 — Bundle Gate + Lighthouse + Dev FPS

#### `scripts/check-bundle-gate.mjs` (NEW)

**No in-repo analog** — RESEARCH §11 lines 397-432 is the canonical sketch. Pattern mirrors Phase 16 D-16-BUNDLE-GATE HARD/WARN/PASS bands.

**Existing infrastructure to leverage:**
- `rollup-plugin-visualizer` (`vite.config.js:11-18`) already emits `dist/stats.html` with gzipSize. Phase 17 script reads the raw `dist/assets/*.js` files and computes gz via Node `zlib.gzipSync` (RESEARCH approach: no JSON parse of stats.html needed).

**Canonical sketch (RESEARCH §11):**
```js
import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const distAssets = path.resolve('dist/assets')
const files = fs.readdirSync(distAssets)

const mobileChunk = files.find((f) => /^GameMode-.*\.js$/.test(f))
const webglChunk  = files.find((f) => /^WebGLConstellation-.*\.js$/.test(f))

if (!mobileChunk) throw new Error('GameMode chunk not found')
if (!webglChunk) {
  console.warn('WARN: WebGLConstellation chunk not found — three.js may be in mobile bundle')
}

const mobileBuf = fs.readFileSync(path.join(distAssets, mobileChunk))
const mobileGz  = gzipSync(mobileBuf).length

// HARD CHECK: three.js MUST NOT appear in mobile chunk
if (/THREE\.|from"three"|from'three'/.test(mobileBuf.toString())) {
  throw new Error(`HARD FAIL: ${mobileChunk} contains three.js — Lighthouse mobile gate at risk`)
}

// Size bands (mirror D-16-BUNDLE-GATE: PASS / WARN / HARD)
const KB = mobileGz / 1024
if (KB > 38.82) {
  throw new Error(`HARD FAIL: ${mobileChunk} = ${KB.toFixed(2)} kB gz > 38.82 kB ceiling`)
} else if (KB > 14) {
  console.warn(`WARN: ${mobileChunk} = ${KB.toFixed(2)} kB gz (14–38.82 kB band)`)
} else {
  console.log(`PASS: ${mobileChunk} = ${KB.toFixed(2)} kB gz`)
}
```

**Pitfalls:**
- **Pitfall 20:** Vite chunk names include hash suffix (`GameMode-AbCd1234.js`). Use regex `/^GameMode-.*\.js$/` — never assume an exact filename.
- **Pitfall 21:** Detection regex `/THREE\.|from"three"|from'three'/` may false-positive on a minified import map. Verify post-Slice 5 first run by reading the actual mobile chunk content (RESEARCH §11 confirms approach works on Vite 6 rollup output).
- **Pitfall 22:** Script must exit non-zero on HARD FAIL for CI integration. Use `throw new Error(...)` (Node exits 1) or `process.exit(1)`.

---

#### `scripts/check-bundle-gate.test.mjs` (NEW)

**No in-repo analog** — standard Vitest fs mock pattern:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('check-bundle-gate', () => {
  let fsReadDirSpy, fsReadFileSpy

  beforeEach(() => {
    fsReadDirSpy = vi.spyOn(fs, 'readdirSync')
    fsReadFileSpy = vi.spyOn(fs, 'readFileSync')
  })
  afterEach(() => vi.restoreAllMocks())

  it('PASSES when mobile chunk is small + has no three.js', async () => {
    fsReadDirSpy.mockReturnValue(['GameMode-Abc.js', 'WebGLConstellation-Xyz.js'])
    fsReadFileSpy.mockReturnValue(Buffer.from('export const a = 1;'))
    // dynamic import to re-execute the script
    await expect(import('./check-bundle-gate.mjs?test=pass')).resolves.toBeTruthy()
  })

  it('HARD FAILS when three.js appears in mobile chunk', async () => {
    fsReadDirSpy.mockReturnValue(['GameMode-Abc.js'])
    fsReadFileSpy.mockReturnValue(Buffer.from('import { Scene } from"three"'))
    await expect(import('./check-bundle-gate.mjs?test=hard1')).rejects.toThrow(/three\.js/)
  })

  it('HARD FAILS when gz > 38.82 kB', async () => {
    // Generate a 50 kB buffer of repeating content (still compresses but large)
    fsReadDirSpy.mockReturnValue(['GameMode-Abc.js', 'WebGLConstellation-Xyz.js'])
    fsReadFileSpy.mockReturnValue(Buffer.alloc(500_000, 'x'))  // adjust size to trip ceiling post-gzip
    await expect(import('./check-bundle-gate.mjs?test=hard2')).rejects.toThrow(/HARD FAIL/)
  })

  it('WARNS when mobile chunk lacks WebGLConstellation companion', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    fsReadDirSpy.mockReturnValue(['GameMode-Abc.js'])
    fsReadFileSpy.mockReturnValue(Buffer.from('safe content'))
    await import('./check-bundle-gate.mjs?test=warn')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WebGLConstellation chunk not found'))
  })
})
```

**Pitfalls:**
- **Pitfall 23:** Script-side-effect testing requires either (a) refactoring script into a callable function with default export — RECOMMENDED — or (b) using dynamic import with cache-busting query params (fragile). Planner picks refactor approach.

---

#### `src/game/FpsCounter.js` (NEW — dev only, ~20 LOC)

**No in-repo analog** — RESEARCH §14 lines 463-468 sketches. Trivial useState + rAF rolling average:

```js
import React, { useState, useEffect } from 'react'

export default function FpsCounter() {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    let rafId, frames = 0, lastT = performance.now()
    function tick(t) {
      frames += 1
      if (t - lastT >= 1000) {
        setFps(Math.round((frames * 1000) / (t - lastT)))
        frames = 0; lastT = t
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])
  return (
    <div className="fixed bottom-4 left-4 z-[300] font-mono text-xs text-text-secondary bg-ink-900/80 px-2 py-1 rounded">
      {fps} fps
    </div>
  )
}
```

**Conditional mount in GameMode.js (Slice 5):**
```js
import FpsCounter from './FpsCounter'

// inside render:
{import.meta.env.DEV && capability === 'webgl' && <FpsCounter />}
```

**`import.meta.env.DEV` gate** — Vite-native; tree-shaken out of production bundles automatically (RESEARCH §14).

---

#### `package.json` (EXTEND — add `build:gate` script)

**Analog — existing scripts at `package.json:14-19`:**
```json
// Existing scripts to mirror style:
"build": "vite build",
"build:analyze": "vite build && open dist/stats.html || true",
"lighthouse:mobile": "...",
"lighthouse:check": "node -e \"...\"",
```

**Phase 17 addition (insert after `"build:analyze"` line 15):**
```json
"build:gate": "vite build && node scripts/check-bundle-gate.mjs"
```

**Pitfalls:**
- **Pitfall 24:** Use `.mjs` extension for the Node script (project lacks `"type": "module"` in package.json — `.mjs` is the cleanest signal for ES modules and `node:zlib`, `node:fs` imports).

---

## Shared Patterns

### Pattern A — `motion-safe:` prefix mandate
**Source:** `tailwind.config.js` lines 74-75 + 88-89 comments + `SvgConstellation.js:209, 246, 249, 286, 288`
**Apply to:** Any animation utility in any new file. WebGL bypass: NOT NEEDED in WebGL renderer because D-17-CAP-GATES routes reduced-motion users to SVG before WebGL mounts. But if WebGLConstellation ever emits Tailwind classes (e.g., on a focus ring overlay), `motion-safe:` prefix still applies.

### Pattern B — `data-game-interactive` allow-list
**Source:** Phase 16 D-16-CLICK-OUTSIDE; current `GameMode.js:138` on renderer wrapper
**Apply to:** WebGL canvas wrapper unchanged from `GameMode.js:138` — keep the attribute on the OUTER `<div>` that wraps the renderer slot (NOT the canvas itself).

### Pattern C — Token-driven colors (CSS-var via Tailwind utilities)
**Source:** `src/index.css` `--color-constellation-*` (Phase 15) + `src/data/skills.js` `SKILL_CATEGORY_COLORS` (documented data exception for the 8 category hexes)
**Apply to:** WebGL shader uniforms read these tokens via `getComputedStyle(documentElement)` at init + theme-change (RESEARCH §8, §9). Zero new tokens — UI-SPEC §Color confirms.

### Pattern D — No semicolons, no comma-dangle
**Source:** `.eslintrc.js` `semi: 0`, `comma-dangle: 0` + every existing `.js` file
**Apply to:** All new files. Verified across Slices 1-5.

### Pattern E — JSX in `.js` (NOT `.jsx`)
**Source:** `vite.config.js:20-23` esbuild config; every existing component
**Apply to:** `WebGLConstellation.js`, `RendererErrorBoundary.js`, `FpsCounter.js`. Scripts use `.mjs` (Node-native ESM, no JSX).

### Pattern F — TDD colocation
**Source:** Every Phase 14/15/16 file pair (`useConstellation.js` + `useConstellation.test.js` in same directory)
**Apply to:**
```
src/game/useRendererCapability.js   → src/game/useRendererCapability.test.js
src/game/RendererErrorBoundary.js   → src/game/RendererErrorBoundary.test.js
src/game/renderers/WebGLConstellation.js → src/game/renderers/WebGLConstellation.test.js
scripts/check-bundle-gate.mjs       → scripts/check-bundle-gate.test.mjs
```

### Pattern G — Lazy import at module scope
**Source:** `src/App.js:11-19` — every lazy import sits at top-level module scope, NOT inside the component body
**Apply to:** `GameMode.js` — `const WebGLConstellation = React.lazy(() => import('./renderers/WebGLConstellation'))` MUST be module-scope. If placed inside the component body, React would recreate the lazy boundary every render → infinite re-fetch.

### Pattern H — Suspense fallback is functional, NOT a spinner
**Source:** UI-SPEC §Loading State Contract line 308 + `src/App.js:21-23` `SectionFallback`
**Apply to:** `GameMode.js` Suspense fallback = `<SvgConstellation {...rendererProps} />` (the SVG renderer IS the loading state per UI-SPEC). This is intentional: WebGL chunk loads in the background while SVG already provides the full interactive experience.

### Pattern I — Console prefix for renderer fallback log
**Source:** Phase 17 NEW — UI-SPEC §ErrorBoundary Fallback Visual Contract + §Copywriting Contract line 432
**Apply to:** `RendererErrorBoundary.componentDidCatch` MUST log with `'[renderer-fallback]'` prefix (greppable in DevTools for QA debugging). Not bilingual, not translated.

### Pattern J — Pure-module convention (zero React/DOM imports)
**Source:** `src/game/spatialNav.js` + `src/game/filters.js` + `src/game/constellation.graph.js`
**Apply to:** `scripts/check-bundle-gate.mjs` — Node script with `import fs from 'node:fs'` + `import { gzipSync } from 'node:zlib'`. Zero React, zero browser globals.

---

## No Analog Found

| File / surface | Role | Reason | Canonical source |
|---|---|---|---|
| `src/game/renderers/WebGLConstellation.js` Slice 3 rAF + visibilitychange loop | streaming render loop | No rAF loop exists in repo (Phase 15 SvgConstellation is fully declarative, no imperative tick) | RESEARCH §10 lines 354-385 code sketch |
| `src/game/renderers/WebGLConstellation.js` Slice 3-4 shader uniforms (uTime, uDrift, uPulse, uFlashNodeId, uFlashStartTime) | shader-side animation | First GLSL shaders in the repo | RESEARCH §2 lines 50-101 vertex + fragment sketch + UI-SPEC §Animation Contract |
| `src/game/RendererErrorBoundary.test.js` | React 17 class ErrorBoundary test | First ErrorBoundary test in repo | React 17 docs + pattern in this PATTERNS.md §"RendererErrorBoundary.test.js" |
| `scripts/check-bundle-gate.mjs` | Node post-build CI script | No Node-side build scripts exist (lighthouse:check is inline in `package.json`) | RESEARCH §11 lines 397-432 code sketch |
| `scripts/check-bundle-gate.test.mjs` | Vitest with fs mock | No script tests exist | Standard Vitest fs mock pattern in this PATTERNS.md |
| `src/game/FpsCounter.js` | dev-only widget | No FPS/perf widget exists | RESEARCH §14 lines 463-468 trivial sketch |

---

## Metadata

**Analog search scope:** `src/game/` (full), `src/game/renderers/`, `src/test/setup.js`, `src/App.js`, `vite.config.js`, `package.json`, `.planning/phases/15-*/15-PATTERNS.md`, `.planning/phases/16-*/16-PATTERNS.md`.

**Files scanned directly (this pass):**
- `.planning/phases/17-*/17-CONTEXT.md` (full)
- `.planning/phases/17-*/17-RESEARCH.md` (full)
- `.planning/phases/17-*/17-UI-SPEC.md` (full)
- `.planning/phases/15-*/15-PATTERNS.md` (full — inheritance baseline)
- `.planning/phases/16-*/16-PATTERNS.md` (full — inheritance baseline)
- `src/game/GameMode.js` (full — source of `ConstellationErrorBoundary` + `detectCapabilities` to lift)
- `src/game/renderers/SvgConstellation.js` (full — props contract, sizing helpers, dim predicates, halo filter)
- `src/game/useConstellation.test.js` (full — hook test pattern for `useRendererCapability.test.js`)
- `src/test/setup.js` (full — Pitfall 1 source: global `getContext` stub)
- `src/App.js` (full — `React.lazy` + `Suspense` pattern for `GameMode.js` extension)
- `vite.config.js` (full — esbuild loader, rollup-plugin-visualizer config)
- `package.json` (full — script style for `build:gate` addition)

**Inheritance:** All Phase 15 + Phase 16 patterns from `15-PATTERNS.md` and `16-PATTERNS.md` carry forward unchanged (token-driven colors, `motion-safe:` prefix, `data-game-interactive` allow-list, focus-visible ring, bilingual `t.game.*` via props, no inline literals, colocated tests, `.js` not `.jsx`).

**Pattern extraction date:** 2026-06-03

**Critical alerts for planner:**
1. **Pitfall 1 (test setup)** — `getContext` global stub MUST be spied per-test for any WebGL-positive assertion. Affects: `useRendererCapability.test.js`, `WebGLConstellation.test.js`.
2. **Lift, don't create** — `ConstellationErrorBoundary` (`GameMode.js:46-67`) and `detectCapabilities` (`GameMode.js:29-44`) already exist. Slice 1 EXTRACTS them — does not write from scratch. Reduces Slice 1 scope.
3. **Suspense fallback = SVG renderer** — UI-SPEC explicit: not a spinner. SVG IS the loading state.
4. **Three.js mock required for jsdom tests** — `vi.mock('three', ...)` returning fake `WebGLRenderer` constructor (Pitfall 7).
5. **rAF visibility pause needs `rafId = null` sentinel** (Pitfall 15) to avoid double-restart race.
6. **Bundle gate regex** — `/^GameMode-.*\.js$/` for chunk discovery (Vite hash suffix; Pitfall 20). Three.js detection regex `/THREE\.|from"three"|from'three'/` (Pitfall 21 — verify on actual Vite output before locking).
