# Phase 15: Accessible Constellation & SEO Fallback — Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 11 new/modified files
**Analogs found:** 10 / 11 (1 net-new with no prior analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/game/GameMode.js` | orchestrator component | request-response (capability → renderer branch) | `src/App.js` `MainContent` + `src/context/ViewModeContext.js` | role-match |
| `src/game/renderers/SvgConstellation.js` | renderer component | event-driven (SVG interaction → state callbacks) | `src/components/Experience.js` (bilingual list + local state) | partial-match |
| `src/game/useConstellation.js` | hook | event-driven (selection/hover state) | `src/context/ViewModeContext.js` (context hook shape) | role-match |
| `src/game/ConstellationFallback.js` | fallback component | CRUD (read-only list render) | `src/components/Experience.js` (bilingual `job[lang]` list render) | exact |
| `src/game/GameMode.test.js` | test | — | `src/game/constellation.graph.test.js` | exact |
| `src/game/useConstellation.test.js` | test | — | `src/context/ViewModeContext.test.js` | role-match |
| `src/game/ConstellationFallback.test.js` | test | — | `src/game/constellation.graph.test.js` | role-match |
| `src/game/renderers/SvgConstellation.test.js` | test (RTL component) | — | `src/components/_shared/ViewModeToggle.test.js` | role-match |
| `src/i18n/translations.js` | config extension (additive) | — | itself — extend `game.*` namespace | exact |
| `tailwind.config.js` | config extension (keyframes) | — | itself — extend `keyframes` + `animation` + `colors` | exact |
| `src/index.css` | config extension (CSS vars) | — | itself — extend `:root` + `[data-theme="light"]` | exact |
| `src/App.js` | orchestrator modification | — | itself — replace `MainContent` game branch | exact |

---

## Pattern Assignments

### `src/game/GameMode.js` (orchestrator, request-response)

**Analogs:** `src/App.js` `MainContent` (branching on context state) + `src/context/ViewModeContext.js` (SSR guard + window API access pattern)

**Imports pattern** — copy from `src/App.js` lines 1–18 and `src/context/ViewModeContext.js` lines 1–5:
```js
import React, { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme } from '../i18n/ThemeContext'
import { useViewMode } from '../context/ViewModeContext'
import { buildConstellationGraph } from './constellation.graph'
import { computeLayout } from './constellation.layout'
import { EXPERIENCE } from '../data/experience'
import { SKILLS } from '../data/skills'
import useConstellation from './useConstellation'
import SvgConstellation from './renderers/SvgConstellation'
import ConstellationFallback from './ConstellationFallback'
```

**SSR / window guard pattern** — copy from `src/context/ViewModeContext.js` lines 7–18 (`readInitialMode`):
```js
// Pattern: typeof window guard before any window.* API access
// Used verbatim in ViewModeContext.js readInitialMode() and LanguageContext.js readInitialLang()
if (typeof window === 'undefined') return DEFAULT_MODE
try {
  // access window.localStorage / window.matchMedia etc.
} catch (e) {
  // blocked — fall through to default
}
```

**Capability detection** — net-new, no prior analog. Use the locked algorithm from RESEARCH.md Pattern 6:
```js
function detectCapabilities() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const saveData = navigator.connection?.saveData ?? false
  const isMobile = window.innerWidth < 768
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas')
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
    } catch { return false }
  })()
  return { prefersReducedMotion, saveData, isMobile, hasWebGL }
}
```

**Branch / conditional render pattern** — copy from `src/App.js` `MainContent` lines 40–53:
```js
// Pattern: read context hook, branch JSX on viewMode value
// Phase 15: same structure but branch on capabilities.renderer
function MainContent() {
  const { viewMode } = useViewMode()   // Phase 15: useConstellation + capabilities
  if (viewMode === 'game') {
    return (
      <main id="main">
        <section ...>
          {/* game branch — replace this block with <GameMode /> */}
        </section>
      </main>
    )
  }
  return ( /* dev branch unchanged */ )
}
```

**ErrorBoundary class component** — no prior analog in codebase (first ErrorBoundary). Use RESEARCH.md Pattern 7 exactly:
```js
// React error boundaries MUST be class components (React 18 confirmed)
class ConstellationErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { console.error('Constellation error:', error, info) }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
```

**Export shape** — copy from `src/App.js` line 82 (`export default function App()`):
```js
export default function GameMode() { ... }
```

---

### `src/game/renderers/SvgConstellation.js` (renderer component, event-driven)

**Analog:** `src/components/Experience.js` (bilingual data access + `lang` prop, local state, sub-components) and `src/components/_shared/ViewModeToggle.js` (focus ring + `aria-pressed` + `min-h-[44px]` touch target + `focus-visible:ring-2 focus-visible:ring-brand` pattern)

**Imports pattern** — copy from `src/components/Experience.js` lines 1–5, adapted:
```js
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { SKILL_CATEGORIES } from '../../data/skills'
// No useLanguage() here — lang + t passed as props per renderer contract
```

**Props contract** (locked in RESEARCH.md GAME-01) — pure component, all state lifted:
```js
// Renderer contract: { nodes, edges, layout, highlightedSkillIds, selectedSkillId,
//                      yearRange, theme, lang, t, onSelectSkill, onHoverSkill }
// layout = computeLayout(nodes) result — { [id]: { x, y } }
// No hook calls for context; everything via props so WebGL adapter uses same shape.
export default function SvgConstellation({
  nodes, edges, layout,
  highlightedSkillIds, selectedSkillId,
  yearRange, theme, lang, t,
  onSelectSkill, onHoverSkill,
}) { ... }
```

**Roving tabindex + ref map pattern** — no prior analog; use RESEARCH.md Pattern 2 exactly:
```js
const nodeRefs = useRef({})   // { [id]: SVGGElement | null }
const [rovingNodeId, setRovingNodeId] = useState(() =>
  nodes.reduce((max, n) => (!max || n.count > max.count ? n : max), null)?.id ?? nodes[0]?.id
)
function moveFocus(nextId) {
  setRovingNodeId(nextId)
  setTimeout(() => nodeRefs.current[nextId]?.focus(), 0)
}
// Per-node: ref={(el) => { nodeRefs.current[node.id] = el }}
```

**Focus ring pattern** — copy from `src/components/_shared/ThemeToggle.js` lines 29–36 (the className string), adapted for SVG:
```js
// ThemeToggle uses: focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
// On the role="application" wrapper (HTML div):
className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm min-h-[44px] min-w-[44px]"
// On SVG <g> nodes (CSS outline unreliable on SVG) — conditionally rendered <circle>:
{isFocused && (
  <circle cx={pos.x} cy={pos.y} r={nodeRadius + 4}
    fill="none" stroke="var(--color-brand)" strokeWidth="2"
    aria-hidden="true" className="pointer-events-none" />
)}
```

**44px touch target pattern** — copy from `src/components/_shared/ViewModeToggle.js` line 9 (`min-h-[44px] min-w-[44px]`) and `src/components/_shared/ThemeToggle.js` line 35:
```js
// HTML wrapper: min-h-[44px] min-w-[44px] (matches ViewModeToggle + ThemeToggle)
// SVG small nodes: transparent overlay circle (r=22 at 1000-unit viewBox scale)
<circle cx={pos.x} cy={pos.y} r={22} fill="transparent" className="pointer-events-auto" />
```

**`aria-pressed` pattern** — copy from `src/components/_shared/ViewModeToggle.js` lines 28–29:
```js
// ViewModeToggle: aria-pressed={viewMode === 'game'}
// SvgConstellation node: aria-pressed={node.id === selectedSkillId}
```

**`motion-safe:` animation class pattern** — copy from `tailwind.config.js` line 75 comment:
```js
// NOTE: pulse2 runs infinite — MUST be applied with motion-safe: prefix
// DO: className={isPulsingNode ? 'motion-safe:animate-pulse2' : ''}
// DON'T: className="animate-pulse2"
```

**`animationDelay` stagger + reduced-motion guard** — from RESEARCH.md Pitfall 3:
```js
// prefersReducedMotion from usePrefersReducedMotion() hook (in-file or imported)
style={{
  transformBox: 'fill-box',        // SVG scale from node center, not (0,0)
  transformOrigin: 'center',        // REQUIRED — see RESEARCH.md Pitfall 1
  animationDelay: prefersReducedMotion ? '0ms' : `${sortIndex * 30}ms`,
  animationName:  prefersReducedMotion ? 'none' : 'nodeReveal',
}}
```

**`aria-live` region** — no prior analog; DOM-present `sr-only` div (Tailwind class exists):
```js
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>
```

**Sub-component pattern** — copy from `src/components/Experience.js` lines 48–101 (local `function TimelineCard`):
```js
// Local private sub-components: PascalCase, defined after the default export
// e.g., function NodeCircle({ node, pos, ... }) { ... }
// e.g., function EdgeLine({ edge, sourcePos, targetPos, ... }) { ... }
```

**`buildNodeLabel` helper** — pure function, not a React hook, not a translation key. From RESEARCH.md Code Examples:
```js
// Not exported — internal to SvgConstellation.js
function buildNodeLabel(node, lang) {
  const categoryLabel = SKILL_CATEGORIES[node.category][lang]
  if (lang === 'en') {
    return `${node.label}, ${categoryLabel}, used in ${node.count} ${node.count === 1 ? 'job' : 'jobs'}.`
  }
  return `${node.label}, ${categoryLabel}, usado en ${node.count} ${node.count === 1 ? 'trabajo' : 'trabajos'}.`
}
```

---

### `src/game/useConstellation.js` (hook, event-driven)

**Analog:** `src/context/ViewModeContext.js` (useState + useCallback + useMemo value shape)

**Imports pattern** — copy from `src/context/ViewModeContext.js` line 1:
```js
import { useState, useCallback, useMemo } from 'react'
// No React import needed (React 17+ JSX transform; this file has no JSX)
```

**Hook shape** — copy the `useState` + `useCallback` + `useMemo` value pattern from `src/context/ViewModeContext.js` lines 28–53:
```js
export default function useConstellation(nodes) {
  const [selectedSkillId, setSelectedSkillId] = useState(null)
  const [hoveredSkillId, setHoveredSkillId]   = useState(null)
  // Filter state — Phase 16 fills these; Phase 15 initializes to defaults
  const [highlightedSkillIds] = useState([])
  const [yearRange]           = useState(null)

  const onSelectSkill = useCallback((id) => {
    setSelectedSkillId((prev) => (prev === id ? null : id))  // toggle on re-click
  }, [])

  const onHoverSkill = useCallback((id) => {
    setHoveredSkillId(id)
  }, [])

  return useMemo(() => ({
    selectedSkillId,
    hoveredSkillId,
    highlightedSkillIds,
    yearRange,
    onSelectSkill,
    onHoverSkill,
  }), [selectedSkillId, hoveredSkillId, highlightedSkillIds, yearRange, onSelectSkill, onHoverSkill])
}
```

**Export shape** — default export (hook), not named export (hooks in this codebase use default):
```js
// LanguageContext exports named useLanguage(), ViewModeContext exports named useViewMode()
// useConstellation is a standalone hook module — use default export to match
// constellation.graph.js / constellation.layout.js module style
export default function useConstellation(nodes) { ... }
```

---

### `src/game/ConstellationFallback.js` (fallback component, CRUD read-only)

**Analog:** `src/components/Experience.js` — bilingual `job[lang]` field access + `EXPERIENCE.map((job, i) => ...)` pattern + `key={...company-i}` pattern

**Imports pattern** — copy from `src/components/Experience.js` lines 1–5, stripped to minimal:
```js
import React from 'react'
// No hooks — pure presentational component; receives experiences + lang as props
// (easier to test; no context dependency)
```

**Bilingual field access pattern** — copy from `src/components/Experience.js` lines 60–66 (`job.date[lang]`, `job.title[lang]`, `job.location[lang]`):
```js
// Experience.js:
<span className="font-mono text-xs text-brand">{job.date[lang]}</span>
<h3 className="text-base font-extrabold text-text-primary mb-1">{job.title[lang]}</h3>
<div className="text-base text-text-secondary mb-3">{job.location[lang]}</div>

// ConstellationFallback uses identical field access:
<h3>{exp.title[lang]} — {exp.company}</h3>
<p>{exp.date[lang]} · {exp.location[lang]}</p>
<ul>{exp.bullets[lang].map((b, j) => <li key={j}>{b}</li>)}</ul>
```

**`sr-only` class** — Tailwind utility already present in the codebase (confirmed in `src/index.css`). Apply to the `<section>` wrapper:
```js
<section aria-labelledby="constellation-fallback-heading" className="sr-only">
```

**Export shape** — copy from `src/components/Experience.js` line 7:
```js
export default function ConstellationFallback({ experiences, lang }) { ... }
```

---

### `src/game/GameMode.test.js` (pure logic test)

**Analog:** `src/game/constellation.graph.test.js` — pure data module test pattern

**Test file structure** — copy from `src/game/constellation.graph.test.js` lines 1–18:
```js
import { describe, it, expect } from 'vitest'
import { buildConstellationGraph } from './constellation.graph.js'
import EXPERIENCE from '../data/experience.js'
import { SKILLS } from '../data/skills.js'
import { CURRENT_YEAR } from './constellation.graph.js'

// Helper functions at top — named intent-revealing functions
function findNode(nodes, label) {
  return nodes.find((n) => n.label === label) || null
}
```

**H1 derivation test** — mandatory per D-15-LAND-COPY; structure mirrors existing graph tests:
```js
describe('GameMode - H1 derivation', () => {
  it('should derive yearsActive from live EXPERIENCE period data', () => {
    const maxYear = Math.max(...EXPERIENCE.map(e => e.period.end ?? CURRENT_YEAR))
    const minYear = Math.min(...EXPERIENCE.map(e => e.period.start))
    expect(maxYear - minYear).toBe(19)   // update when Coderio period.end changes
  })

  it('should derive skillCount from buildConstellationGraph node count', () => {
    const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
    expect(nodes.length).toBe(26)         // update when skill catalog changes
  })
})
```

**`describe` block naming** — copy from `constellation.graph.test.js` line 20: `describe('buildConstellationGraph - nodes', ...)` — format: `'ModuleName - concern'`

---

### `src/game/useConstellation.test.js` (hook test)

**Analog:** `src/context/ViewModeContext.test.js` (hook state test pattern via RTL `renderHook`)

**Test structure** — infer from Phase 14 summary (ViewModeContext.test.js has 13 tests covering: default state, toggle, persistence). Copy the import + renderHook pattern:
```js
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useConstellation from './useConstellation.js'

describe('useConstellation', () => {
  it('should initialize with null selectedSkillId', () => {
    const { result } = renderHook(() => useConstellation([]))
    expect(result.current.selectedSkillId).toBeNull()
  })

  it('should set selectedSkillId on onSelectSkill call', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.onSelectSkill('Java'))
    expect(result.current.selectedSkillId).toBe('Java')
  })

  it('should toggle off selectedSkillId on second call with same id', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.onSelectSkill('Java'))
    act(() => result.current.onSelectSkill('Java'))
    expect(result.current.selectedSkillId).toBeNull()
  })
})
```

---

### `src/game/ConstellationFallback.test.js` (component test)

**Analog:** `src/game/constellation.graph.test.js` (import pattern) + RTL component render shape from ViewModeToggle.test.js context

**Test structure:**
```js
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConstellationFallback from './ConstellationFallback.js'
import EXPERIENCE from '../data/experience.js'

describe('ConstellationFallback', () => {
  it('should render all experience entries in active language', () => {
    render(<ConstellationFallback experiences={EXPERIENCE} lang="en" />)
    // sr-only content is in the DOM even when visually hidden
    expect(screen.getByText(/Full career experience/i)).toBeInTheDocument()
  })

  it('should render experience titles in the correct language', () => {
    render(<ConstellationFallback experiences={EXPERIENCE} lang="es" />)
    expect(screen.getByText(/Experiencia profesional completa/i)).toBeInTheDocument()
  })
})
```

---

### `src/game/renderers/SvgConstellation.test.js` (RTL component test)

**Analog:** Phase 14 ViewModeToggle.test.js pattern (confirmed by summary: 8 tests covering render, aria-pressed, click/keyboard). File structure from `src/game/constellation.graph.test.js`.

**matchMedia mock** — required for `usePrefersReducedMotion`; copy from RESEARCH.md Testing section:
```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SvgConstellation from './SvgConstellation.js'

// Required for usePrefersReducedMotion hook
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,   // motion-safe path by default
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})
```

**SVG query strategy** — use `container.querySelector` for `aria-hidden` SVG internals (RESEARCH.md Testing section Option A):
```js
it('should render a node for each input node', () => {
  const { container } = render(<SvgConstellation nodes={FIXTURE_NODES} edges={[]} ... />)
  const nodeGroups = container.querySelectorAll('g[role="button"]')
  expect(nodeGroups).toHaveLength(FIXTURE_NODES.length)
})

it('should set aria-label on each node', () => {
  render(<SvgConstellation nodes={FIXTURE_NODES} edges={[]} lang="en" ... />)
  expect(screen.getByRole('button', { name: /Java, .*, used in/i })).toBeInTheDocument()
})
```

---

### `src/i18n/translations.js` (config extension, additive)

**Analog:** itself — extend the existing `game:` block at lines 24–29 (EN) and 206–211 (ES).

**Existing `game.*` keys** (lines 24–29):
```js
game: {
  loadingTitle: 'Game mode is loading',
  loadingBody:  'The interactive skill constellation arrives next...',
  empty:        'No skill data available.',
  error:        "Couldn't load game mode. Switch to Dev view to see the portfolio.",
}
```

**Extension pattern** — copy the key naming style (`camelCase`, no namespace separator, bilingual sibling blocks). Add ONLY these keys — do not remove `loadingTitle`/`loadingBody` (they may still be used during loading state):
```js
// EN additions (merge into lines 24–29 block):
game: {
  // ... existing keys preserved ...
  constellationLabel:    'Interactive skill constellation. Use arrow keys to navigate between skills. Press Enter or Space to select a skill.',
  constellationRoleDesc: 'skill constellation',
  subCopy:               'Click a star to explore where Carlos used it.',
  hintPill:              'Click a star · Toca una estrella',
  skillSelected:         '{name} selected — {n} experience{s}. Press Esc to clear.',
  selectionCleared:      'Selection cleared.',
  fallbackHeading:       'Full career experience',
  nodeJobSingular:       'job',
  nodeJobPlural:         'jobs',
  nodeUsedIn:            'used in',
  h1Years:               'years',
  h1Skills:              'skills',
  h1Tagline:             'One constellation.',
}
// ES additions (merge into lines 206–211 block):
game: {
  // ... existing keys preserved ...
  constellationLabel:    'Constelación interactiva de habilidades. Usa las teclas de flecha para navegar entre habilidades. Presiona Enter o Espacio para seleccionar.',
  constellationRoleDesc: 'constelación de habilidades',
  subCopy:               'Haz clic en una estrella para explorar dónde la usó Carlos.',
  hintPill:              'Toca una estrella · Click a star',
  skillSelected:         '{name} seleccionado — {n} experiencia{s}. Presiona Esc para limpiar.',
  selectionCleared:      'Selección limpiada.',
  fallbackHeading:       'Experiencia profesional completa',
  nodeJobSingular:       'trabajo',
  nodeJobPlural:         'trabajos',
  nodeUsedIn:            'usado en',
  h1Years:               'años',
  h1Skills:              'skills',
  h1Tagline:             'Una constelación.',
}
```

---

### `tailwind.config.js` (config extension, keyframes + colors)

**Analog:** itself — extend `theme.extend.keyframes`, `theme.extend.animation`, `theme.extend.colors`.

**Existing keyframes pattern** (lines 65–80) — copy the object literal style exactly:
```js
// Existing entries to copy structure from:
keyframes: {
  fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
  slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  pulse2:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
  // ADD:
  nodeReveal:   { '0%': { opacity: '0', transform: 'scale(0.3)' }, '70%': { opacity: '1', transform: 'scale(1.1)' }, '100%': { opacity: '1', transform: 'scale(1.0)' } },
  edgeReveal:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },  // opacity-only (GPU composited; stroke-dashoffset alternative in SvgConstellation)
  hintFadeOut:  { '0%': { opacity: '1' }, '80%': { opacity: '1' }, '100%': { opacity: '0', pointerEvents: 'none' } },
},
animation: {
  'fade-in':      'fadeIn 0.5s ease-out',          // existing
  'slide-up':     'slideUp 0.6s ease-out',          // existing
  pulse2:         'pulse2 2s ease-in-out infinite', // existing — MUST use motion-safe: prefix
  // ADD:
  'node-reveal':    'nodeReveal 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
  'edge-reveal':    'edgeReveal 300ms ease-out both',
  'hint-fade-out':  'hintFadeOut 600ms ease-in forwards',
},
```

**Color token pattern** (lines 7–39) — all existing colors map to CSS vars. New constellation tokens follow the same pattern:
```js
colors: {
  // ... existing ink, brand, accent, text tokens (all CSS-var backed) ...
  // ADD:
  constellation: {
    edge:      'var(--color-constellation-edge)',
    edgeHeavy: 'var(--color-constellation-edge-heavy)',
    halo:      'var(--color-constellation-halo)',
  },
  hintPill: {
    bg:   'var(--color-hint-pill-bg)',
    text: 'var(--color-hint-pill-text)',
  },
},
```

---

### `src/index.css` (config extension, CSS vars)

**Analog:** itself — extend `:root` block (lines 8–43) and `[data-theme="light"]` block (lines 64–98).

**Existing token pattern** (lines 28–31) — copy the comment + var style exactly:
```css
/* existing pattern to mirror: */
--color-brand:        #3B82F6;  /* blue-500 */
--color-brand-light:  #60A5FA;  /* blue-400 */

/* ADD to :root (after existing vars, before closing brace): */
/* ── Constellation-specific tokens (Phase 15) ── */
--color-constellation-edge:       rgba(160, 160, 192, 0.25);
--color-constellation-edge-heavy: rgba(160, 160, 192, 0.55);
--color-constellation-halo:       rgba(255, 255, 255, 0.18);
--color-hint-pill-bg:             rgba(20, 20, 50, 0.95);
--color-hint-pill-text:           #A0A0C0;

/* ADD to [data-theme="light"] (after existing light overrides): */
--color-constellation-edge:       rgba(80, 80, 120, 0.20);
--color-constellation-edge-heavy: rgba(80, 80, 120, 0.45);
--color-constellation-halo:       rgba(0, 0, 40, 0.12);
--color-hint-pill-bg:             rgba(200, 200, 214, 0.85);
--color-hint-pill-text:           #525269;
```

**Reduced-motion block** — existing rule at lines 208–217 already covers all `animation-duration`. Phase 15 adds NO new CSS rules here — the stagger suppression is handled in JS via `prefersReducedMotion` guard (RESEARCH.md Pitfall 3). The global CSS rule is sufficient for keyframe suppression. Do NOT add a constellation-specific reduced-motion block.

---

### `src/App.js` (modification — game branch replacement)

**Analog:** itself — replace lines 41–52 (the `viewMode === 'game'` branch in `MainContent`).

**Current placeholder** (lines 40–53):
```js
if (viewMode === 'game') {
  return (
    <main id="main">
      <section className="flex flex-col items-center justify-center min-h-screen px-6 py-20 text-center">
        <h1 className="text-3xl font-extrabold text-text-primary mb-4">
          {t.game.loadingTitle}
        </h1>
        <p className="text-text-secondary max-w-lg">
          {t.game.loadingBody}
        </p>
      </section>
    </main>
  )
}
```

**Replacement pattern** — add `React.lazy` import for `GameMode` following the existing lazy-load convention at lines 11–18, then replace the game branch:
```js
// Add alongside other lazy imports (lines 11–18):
const GameMode = React.lazy(() => import('./game/GameMode'))

// Replace game branch (lines 41–52) with:
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

**Note:** `SectionFallback` is already defined at line 20 — reuse it, do not create a new one.

---

## Shared Patterns

### Context hook consumption
**Source:** `src/i18n/LanguageContext.js` lines 62–64 + `src/context/ViewModeContext.js` lines 55–57
**Apply to:** `GameMode.js` (reads `useLanguage`, `useTheme`, `useViewMode`)
```js
// Pattern: named export hook wrapping useContext — same in both context files
export function useLanguage() { return useContext(LanguageContext) }
export function useViewMode()  { return useContext(ViewModeContext) }
// Consumer: const { lang, t } = useLanguage()
//           const { theme }   = useTheme()
//           const { setViewMode } = useViewMode()  // for error boundary fallback button
```

### Focus-visible ring (44px touch target)
**Source:** `src/components/_shared/ThemeToggle.js` lines 34–35 + `src/components/_shared/ViewModeToggle.js` line 9
**Apply to:** `GameMode.js` (role="application" wrapper), `SvgConstellation.js` (application div)
```js
// EXACT className string — copy verbatim, do not invent a new variant:
"inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full
 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
 motion-safe:transition-colors duration-200"
```

### `motion-safe:` prefix mandate
**Source:** `tailwind.config.js` lines 74–75 comment
**Apply to:** `SvgConstellation.js` (pulse, node-reveal), `GameMode.js` (any animation class)
```js
// Comment in tailwind.config.js: "MUST be applied with motion-safe: prefix"
// Applies to ALL infinite animation classes. Also applies to one-shot animations
// that involve motion (node-reveal, edge-reveal) — use motion-safe: to be safe.
// motion-safe:animate-pulse2          ← correct
// motion-safe:animate-node-reveal     ← correct
// animate-pulse2                      ← WRONG — will run on reduced-motion users
```

### No semicolons, no comma-dangle
**Source:** All existing `.js` files in `src/` — confirmed by `.eslintrc.js` (`semi: 0`, `comma-dangle: 0`)
**Apply to:** All new files. Every statement ends without `;`. No trailing commas in function params or import lists.

### Bilingual copy via `t.namespace.key` — never inline literals
**Source:** `src/components/Experience.js` lines 24, 60, 65 (`t.exp.label`, `job.title[lang]`)
**Apply to:** `GameMode.js`, `SvgConstellation.js` — pass `t` and `lang` from `useLanguage()` in `GameMode`, forward as props to `SvgConstellation` and `ConstellationFallback`
```js
// Pattern: read once at orchestrator level, pass down as props
const { lang, t } = useLanguage()
// Then: <SvgConstellation lang={lang} t={t} ... />
//       <ConstellationFallback lang={lang} ... />
```

### Token-driven colors — no raw hex in styling
**Source:** `src/components/Experience.js` lines 58–67 (all `bg-ink-*`, `text-brand`, `border-ink-*` tokens — confirmed by Phase 14 verification `rg -n "#[0-9a-fA-F]"` → no matches in ViewModeToggle)
**Apply to:** `GameMode.js`, `SvgConstellation.js`, `ConstellationFallback.js`
```js
// Exception: SKILL_CATEGORY_COLORS hex values in circle fill="..." are data values, not styling tokens.
// These are documented exceptions per Phase 14 decision and UI-SPEC.
// Everything else: use Tailwind utilities or CSS vars.
```

### JSX in `.js` files — no `.jsx` extension
**Source:** All existing component files — `Nav.js`, `Hero.js`, `App.js` etc. Confirmed: `fd vitest.config` → no results; `vite.config.js` has `esbuild.loader: 'jsx'` for `.js` files.
**Apply to:** All new files. Use `.js` extension even for JSX-containing modules.

### TDD file co-location
**Source:** Phase 14 pattern — `constellation.graph.js` + `constellation.graph.test.js` in same directory
**Apply to:** All new files. Test file lives next to its source:
```
src/game/GameMode.js              → src/game/GameMode.test.js
src/game/useConstellation.js      → src/game/useConstellation.test.js
src/game/ConstellationFallback.js → src/game/ConstellationFallback.test.js
src/game/renderers/SvgConstellation.js → src/game/renderers/SvgConstellation.test.js
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `usePrefersReducedMotion` (inline in `GameMode.js` or extracted to `src/hooks/`) | hook | capability detect | No media-query hooks in the codebase. Use the Josh Comeau 20-line pattern from RESEARCH.md Pattern 5 verbatim. |

---

## Metadata

**Analog search scope:** `src/game/`, `src/context/`, `src/components/`, `src/components/_shared/`, `src/i18n/`, `src/test/`, `tailwind.config.js`, `src/index.css`, `src/App.js`
**Files scanned:** 14 source files read directly + 2 grep passes
**Pattern extraction date:** 2026-06-01
