# Phase 16: Filters & Floating ExperienceCard — Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 14 new/modified files (5 source + 1 minor edit + 1 i18n + 1 tailwind + 1 css + 7 tests)
**Analogs found:** 13 / 14 (only `YearRangeSlider` dual-thumb has no in-repo analog — WAI-ARIA APG is the source-of-truth)

> CRITICAL EXTENSION NOTE (carried from Phase 14/15): the repo writes **JSX into `.js` files** (NOT `.jsx`). `vite.config.js` sets `esbuild.loader: 'jsx'` + `include: /src\/.*\.js$/`. Every Phase 16 file MUST use `.js` extension (no `.jsx`). No semicolons (`semi: 0`), no comma-dangle enforcement.

---

## File Classification

| New/Modified File | Wave | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| `src/game/__tests__/filters.test.js` (new — colocated test) | 0 | pure-logic test | — | `src/game/constellation.graph.test.js` | exact |
| `src/game/__tests__/useConstellation.test.js` (extend existing `src/game/useConstellation.test.js`) | 0 | hook test (extend) | — | itself (existing 10 tests) | exact (self-extend) |
| `src/game/__tests__/SkillFilters.test.js` (new) | 0 | RTL component test | — | `src/game/renderers/SvgConstellation.test.js` + `src/game/GameMode.test.js` | role-match |
| `src/game/__tests__/ExperienceCard.test.js` (new) | 0 | RTL dialog test | — | `src/game/renderers/SvgConstellation.test.js` (jsdom RTL + portal) | role-match |
| `src/game/renderers/__tests__/SvgConstellation.test.js` (extend existing) | 0 | RTL renderer extend | — | itself (existing 22 tests) | exact (self-extend) |
| `src/game/__tests__/GameMode.test.js` (extend existing) | 0 | RTL orchestrator extend | — | itself (existing 9 tests) | exact (self-extend) |
| `src/game/filters.js` (new) | 1 | pure-logic selectors | transform (read-only filter) | `src/game/spatialNav.js` (pure module, zero React) | exact |
| `src/game/useConstellation.js` (extend) | 2 | React hook (extend state) | event-driven | itself (Phase 15 placeholder fields) | exact (self-extend) |
| `src/game/renderers/SvgConstellation.js` (extend) | 2 | renderer (consume `highlightedSkillIds` + `yearRange`) | event-driven | itself (lines 72-74 placeholders + dim logic line 224) | exact (self-extend) |
| `src/game/SkillFilters.js` (new) | 3 | filter UI bar | event-driven (chip click → toggle) | `src/components/_shared/ViewModeToggle.js` (chip pill pattern) + `src/components/Nav.js` `LangPill` (segmented group) | exact (chips); partial (whole-bar layout) |
| `YearRangeSlider` (inline inside `SkillFilters.js`; extract to `src/game/YearRangeSlider.js` only if SkillFilters > 280 LOC) | 3 | custom slider widget | event-driven (keyboard) | **no in-repo analog** — WAI-ARIA APG slider-multithumb pattern | no analog (W3C source-of-truth) |
| `src/game/ExperienceCard.js` (new) | 4 | `role="dialog"` portal w/ focus trap | event-driven (Esc, click-outside, tab-trap) | `src/components/Nav.js` `MobileMenu` (createPortal + role=dialog + Esc + body overflow lock) + `src/components/Experience.js` `TimelineCard` (bilingual job entry markup) | exact (dialog scaffolding); exact (job body) |
| `src/game/GameMode.js` (extend) | 5 | orchestrator (mount filters + card) | request-response | itself (lines 89-123) | exact (self-extend) |
| `src/components/Nav.js` (one-line edit — add `data-game-interactive`) | 5 | minor edit | — | itself (line 26 `<header>`) | exact (self-extend) |
| `src/i18n/translations.js` (extend `t.game.*`) | 1 (before SkillFilters lands) | i18n config | — | itself (Phase 15 `game:` block lines 24-42 EN; symmetric ES block) | exact (self-extend) |
| `tailwind.config.js` (extend keyframes + colors) | 1 | tailwind config | — | itself (Phase 15 `keyframes` + `animation` + `colors.constellation`) | exact (self-extend) |
| `src/index.css` (extend CSS vars) | 1 | global CSS | — | itself (Phase 15 `:root` block lines 62-66 + `[data-theme="light"]` lines 129-133) | exact (self-extend) |

---

## Pattern Assignments — by Wave

### Wave 0 — Tests First (RED commits)

#### `src/game/__tests__/filters.test.js` (NEW pure-logic test)

**Analog:** `src/game/constellation.graph.test.js` lines 1-40 (pure data-module test pattern).

**Imports & helpers — copy verbatim from `constellation.graph.test.js` lines 1-18:**
```js
import { describe, it, expect } from 'vitest'
import {
  filterByYearRange, filterBySkillIntersection,
  filterByCategory, composeFilters, yearBounds, visibleSkillIds,
} from '../filters.js'
import EXPERIENCE from '../../data/experience.js'
import { SKILLS } from '../../data/skills.js'
```
(NOTE: if tests live colocated `src/game/filters.test.js` like Phase 14/15 convention, the imports are `from './filters.js'` / `from '../data/experience.js'` — match the colocation convention rather than the `__tests__/` directory if the planner chooses colocation.)

**`describe` naming — copy from `constellation.graph.test.js` line 20:** `describe('filterBySkillIntersection - AND semantics', () => {...})` — format `'ModuleName - concern'`.

**`yearBounds` honesty test (D-16-YEAR-BOUNDS, mirrors Phase 15 H1 derivation in `GameMode.test.js` lines 37-40):**
```js
describe('yearBounds (D-16-YEAR-BOUNDS honesty rule)', () => {
  it('derives [2007, 2026] from live EXPERIENCE data', () => {
    expect(yearBounds(EXPERIENCE)).toEqual([2007, 2026])
  })
})
```

**Test plan (from RESEARCH.md §1 — 12 tests minimum):** see RESEARCH.md lines 376-389. Cover: pass-through, single-skill membership, multi-skill AND, empty intersection, year disjoint, `period.end ?? CURRENT_YEAR`, category null + match, composeFilters chain, `yearBounds`, `visibleSkillIds` dedupe.

---

#### `src/game/useConstellation.test.js` (EXTEND existing — at `src/game/useConstellation.test.js`)

**Analog:** itself — existing 10 tests already cover Phase 15 state. ADD tests in the same `describe('useConstellation')` block; mirror the existing test shape exactly.

**Existing test shape to mirror — copy from `useConstellation.test.js` lines 26-37:**
```js
it('sets selectedSkillId on onSelectSkill call', () => {
  const { result } = renderHook(() => useConstellation([]))
  act(() => result.current.onSelectSkill('Java'))
  expect(result.current.selectedSkillId).toBe('Java')
})
it('toggles selectedSkillId off when called twice with same id', () => {
  const { result } = renderHook(() => useConstellation([]))
  act(() => result.current.onSelectSkill('Java'))
  act(() => result.current.onSelectSkill('Java'))
  expect(result.current.selectedSkillId).toBeNull()
})
```

**New Phase 16 tests to add (mirror the same `renderHook` + `act` shape):**
- `toggleSkill('Java')` adds Java to `selectedSkills`
- `toggleSkill('Java')` twice removes it
- `setYearRange([2018, 2026])` updates `yearRange`
- `setCategory('cloud')` updates `category`
- `resetFilters()` clears `selectedSkills`, `yearRange` (back to `null` or full bounds — pick one, see Open Question 4 below), and `category`
- `highlightedSkillIds` recomputes when filters change (derived value test)
- `isFilterActive` returns `false` at init, `true` after any filter set
- Memoization still holds when filter state unchanged (mirror line 59-64)

**Memoization test — copy line 59-64 verbatim:**
```js
it('memoizes returned value when state unchanged across renders', () => {
  const { result, rerender } = renderHook(() => useConstellation([]))
  const firstValue = result.current
  rerender()
  expect(result.current).toBe(firstValue)
})
```

---

#### `src/game/SkillFilters.test.js` (NEW RTL component test)

**Analog:** `src/game/renderers/SvgConstellation.test.js` (RTL render + fixtures + `t = translations.en` pattern) + `src/game/GameMode.test.js` (provider-wrapping pattern if SkillFilters reads context).

**`matchMedia` mock + `t` constant — copy from `SvgConstellation.test.js` lines 22, 41-58:**
```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SkillFilters from '../SkillFilters.js'
import translations from '../../i18n/translations.js'

const t = translations.en

function makeMockMatchMedia(prefersReducedMotion = false) {
  return vi.fn().mockImplementation((q) => ({
    matches: q === '(prefers-reduced-motion: no-preference)' ? !prefersReducedMotion : false,
    media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}
beforeEach(() => { window.matchMedia = makeMockMatchMedia(false) })
```

**Fixture-builder pattern — copy from `SvgConstellation.test.js` lines 24-39 (`renderRenderer` helper):**
```js
function renderFilters(overrides = {}) {
  const defaults = {
    nodes: FIXTURE_NODES,
    selectedSkills: [],
    yearRange: null,
    yearBounds: [2007, 2026],
    category: null,
    isFilterActive: false,
    onToggleSkill: vi.fn(),
    onYearRangeChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onReset: vi.fn(),
    lang: 'en',
    t,
  }
  return render(<SkillFilters {...defaults} {...overrides} />)
}
```

**Chip toggle assertion — mirror `aria-pressed` test from `SvgConstellation.test.js` line 167-176:**
```js
it('toggles aria-pressed when skill chip clicked', async () => {
  const user = userEvent.setup()
  const onToggleSkill = vi.fn()
  renderFilters({ onToggleSkill })
  const javaChip = screen.getByRole('button', { name: /Java/i })
  await user.click(javaChip)
  expect(onToggleSkill).toHaveBeenCalledWith('Java')
})
```

**Keyboard slider tests — copy patterns from `SvgConstellation.test.js` lines 189-237 (`fireEvent.keyDown` + assert):**
```js
it('ArrowRight increments start thumb by 1', async () => {
  const user = userEvent.setup()
  const onYearRangeChange = vi.fn()
  renderFilters({ yearRange: [2018, 2026], onYearRangeChange })
  const startThumb = screen.getByRole('slider', { name: /start year|año de inicio/i })
  startThumb.focus()
  await user.keyboard('{ArrowRight}')
  expect(onYearRangeChange).toHaveBeenCalledWith([2019, 2026])
})
it('Home jumps start thumb to its valuemin', async () => { /* … */ })
it('End jumps end thumb to YEAR_MAX', async () => { /* … */ })
it('respects dependent aria-valuemax (start cannot exceed end - 1)', async () => { /* … */ })
```

**Reset disabled state — `aria-disabled` + `disabled` mirror (mandated by UI-SPEC line 501):**
```js
it('reset button is disabled when no filter active', () => {
  renderFilters({ isFilterActive: false })
  const reset = screen.getByRole('button', { name: t.game.filterReset })
  expect(reset).toBeDisabled()
  expect(reset).toHaveAttribute('aria-disabled', 'true')
})
```

**Test plan (~10 tests, from RESEARCH.md §9 + ARIA contract):** chip toggle, slider ArrowRight, slider ArrowLeft floor, slider Home/End, dependent valuemax, reset enabled/disabled, reset click clears all 3 dimensions, category chip toggle, `aria-pressed` reflects state, role=group has `aria-label`.

---

#### `src/game/ExperienceCard.test.js` (NEW RTL dialog test)

**Analog:** `src/game/renderers/SvgConstellation.test.js` (RTL render, jsdom matchMedia mock).

**Portal query — use `screen` (not `container`), per RESEARCH.md §9 line 1021-1023:**
```js
// Component uses createPortal(…, document.body) — query via screen, not container.
const dialog = screen.getByRole('dialog')
```

**`role="dialog"` + `aria-modal` test — copy structure from `SvgConstellation.test.js` lines 160-165 (`getByRole('application')`):**
```js
it('renders with role=dialog and aria-modal=true', () => {
  render(<ExperienceCard {...defaults} />)
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  expect(dialog).toHaveAttribute('aria-labelledby', 'card-skill-heading')
})
```

**Initial focus test — mirror Phase 15 pattern of asserting `document.activeElement`:**
```js
it('focuses h2 heading on mount', () => {
  render(<ExperienceCard {...defaults} />)
  const heading = screen.getByRole('heading', { level: 2 })
  expect(document.activeElement).toBe(heading)
})
```

**Esc + Tab-cycle tests — mirror `SvgConstellation.test.js` Esc test lines 228-237:**
```js
it('Esc calls onClose', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<ExperienceCard {...defaults} onClose={onClose} />)
  await user.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalled()
})
```

**CV CTA href switches by lang — mirror Phase 15 bilingual rerender pattern from `SvgConstellation.test.js` lines 239-263:**
```js
it('CV CTA href switches by lang (EN ↔ ES)', () => {
  const { rerender } = render(<ExperienceCard {...defaults} lang="en" />)
  expect(screen.getByRole('link', { name: /download cv/i }))
    .toHaveAttribute('href', '/CV_Carlos_Montoya_EN.docx')
  rerender(<ExperienceCard {...defaults} lang="es" />)
  expect(screen.getByRole('link', { name: /descargar cv/i }))
    .toHaveAttribute('href', '/CV_Carlos_Montoya_ES.docx')
})
```

**Test plan (~12 tests, from RESEARCH.md §9 + UI-SPEC ARIA contract):** role+aria-modal, initial focus on heading, Esc → onClose, Tab cycle wraps, Shift+Tab wraps backward, click outside `[data-game-interactive]` → onClose, click-inside no-close, tech-chip click → onToggleSkill, locked-skill chip is `aria-disabled`, bilingual rendering (EN vs ES), CV CTA href per lang, empty-state job list renders `t.game.filterEmpty`, swap via `key` prop on `selectedSkillId` change.

---

#### `src/game/renderers/SvgConstellation.test.js` (EXTEND existing)

**Analog:** itself — existing 22 tests + `renderRenderer({ ... })` helper (lines 24-39).

**Existing dim test to extend — line 122-129 currently asserts "no dim when selectedSkillId null":**
```js
it('does not dim any node before selectedSkillId is set', () => {
  const { container } = renderRenderer({ selectedSkillId: null })
  const circles = container.querySelectorAll('g[data-node-id] circle:first-child')
  circles.forEach((c) => {
    const fillOpacity = c.getAttribute('fill-opacity') || c.style.fillOpacity
    expect(String(fillOpacity)).toBe('1')
  })
})
```

**Phase 16 new test 1 — `highlightedSkillIds` dim behavior:**
```js
it('dims nodes not in highlightedSkillIds (when set non-empty)', () => {
  const { container } = renderRenderer({
    selectedSkillId: null,
    highlightedSkillIds: ['Java'], // only Java is highlighted
  })
  // Find non-Java node circles — should be at 0.35 fill-opacity
  const dockerCircle = container.querySelector('g[data-node-id="Docker"] circle:first-child')
  expect(parseFloat(dockerCircle.getAttribute('fill-opacity'))).toBeCloseTo(0.35, 1)
  const javaCircle = container.querySelector('g[data-node-id="Java"] circle:first-child')
  expect(parseFloat(javaCircle.getAttribute('fill-opacity'))).toBeCloseTo(1, 1)
})
```

**Phase 16 new test 2 — `yearRange` dim behavior (D-16-YEAR-EFFECT):**
```js
it('dims nodes whose period does not intersect yearRange', () => {
  // FIXTURE_NODES need a `years` field for this test, or test via a higher-level helper.
  // Use a fixture node with explicit period to exercise the consumer logic.
  const { container } = renderRenderer({
    yearRange: [2020, 2026],
    nodes: [
      { id: 'Java', label: 'Java', category: 'lang', count: 4, years: [2007, 2026] },
      { id: 'Asterisk', label: 'Asterisk', category: 'hardware', count: 1, years: [2008, 2009] },
    ],
    layout: { Java: { x: 500, y: 500 }, Asterisk: { x: 200, y: 200 } },
  })
  const asteriskCircle = container.querySelector('g[data-node-id="Asterisk"] circle:first-child')
  expect(parseFloat(asteriskCircle.getAttribute('fill-opacity'))).toBeCloseTo(0.35, 1)
})
```

**Phase 16 new test 3 — edges dim when both endpoints dimmed:**
```js
it('dims edges incident to non-highlighted nodes', () => {
  /* render with highlightedSkillIds=['Java'], assert AWS-Docker edge opacity is reduced */
})
```

---

#### `src/game/GameMode.test.js` (EXTEND existing)

**Analog:** itself — existing 9 tests + `renderWithProviders` helper (lines 9-20).

**Phase 16 new tests (wiring):**
```js
it('renders <SkillFilters /> below H1', () => {
  renderWithProviders(<GameMode />, { lang: 'en' })
  // Filter bar has role="group" + aria-label = t.game.filterBarLabel
  expect(screen.getByRole('group', { name: /skill filters/i })).toBeInTheDocument()
})

it('does NOT render <ExperienceCard /> when selectedSkillId is null', () => {
  renderWithProviders(<GameMode />, { lang: 'en' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('renders <ExperienceCard /> after node click sets selectedSkillId', async () => {
  /* user-event click on a node <g> → assert dialog appears */
})
```

---

### Wave 1 — Pure Selectors + Config (GREEN)

#### `src/game/filters.js` (NEW — pure-logic selectors)

**Analog:** `src/game/spatialNav.js` (pure-function module, zero React/DOM imports).

**Module shape — copy from `spatialNav.js` lines 1-7:**
```js
// spatialNav.js convention:
// - Module-level `const` for shared constants (UPPER_SNAKE only when module-scope data; camelCase for module-scope objects is OK as shown here)
export const ARROW_VECTORS = {
  ArrowRight: { dx: 1, dy: 0 }, /* ... */
}
export function findNextNode(currentId, direction, nodes, layout) { /* ... */ }
```

**Mirror for `filters.js`:**
- Module-level `const CURRENT_YEAR = 2026` (matches `constellation.graph.js` convention — see RESEARCH.md §1 line 306; do NOT use `new Date()` for determinism).
- Zero React/DOM imports. Pure functions only.
- Named exports (NOT `export default`) — matches `spatialNav.js` lines 1, 8 + `skills.js` lines 21, 75.
- Each function = single concern. No memoization at module level.

**Function signatures — copy from RESEARCH.md §1 lines 302-372:**
```js
const CURRENT_YEAR = 2026

export function filterByYearRange(experiences, [from, to]) { /* ... */ }
export function filterBySkillIntersection(experiences, skillIds) { /* ... */ }
export function filterByCategory(experiences, category, skills) { /* ... */ }
export function composeFilters(experiences, { skillIds, yearRange, category }, skills) { /* ... */ }
export function visibleSkillIds(matchingExperiences) { /* ... */ }
export function yearBounds(experiences) { /* ... */ }
```

**`yearBounds` derivation — mirror `GameMode.js` lines 13-16:**
```js
// GameMode.js D-15-LAND-COPY: derive at module load from live data — never hardcode
export function yearBounds(experiences) {
  const min = Math.min(...experiences.map((e) => e.period.start))
  const max = Math.max(...experiences.map((e) => e.period.end ?? CURRENT_YEAR))
  return [min, max]
}
```

**Anti-patterns to avoid (from RESEARCH.md §1):**
- Do NOT memoize at call site (84 string ops/filter change is negligible).
- Do NOT mutate input arrays (`.filter` already returns new arrays).
- Do NOT accept `CURRENT_YEAR` as a parameter — module constant only.

---

#### `src/i18n/translations.js` (EXTEND `game:` namespace)

**Analog:** itself — Phase 15 `game:` block (EN lines 24-42, ES symmetric block ~lines 230+).

**Extension shape — mirror the existing `t.game.*` flat-key convention (camelCase keys, sibling EN/ES blocks):**
```js
// Existing Phase 15 keys to PRESERVE (lines 24-42 EN):
game: {
  loadingTitle: 'Game mode is loading',
  loadingBody: '...',
  empty: 'No skill data available.',
  error: "Couldn't load game mode. ...",
  constellationLabel: 'Interactive skill constellation. ...',
  constellationRoleDesc: 'skill constellation',
  subCopy: '...',
  hintPill: '...',
  skillSelected: '...',
  selectionCleared: 'Selection cleared.',
  nodeJobSingular: 'job',
  nodeJobPlural: 'jobs',
  nodeUsedIn: 'used in',
  fallbackHeading: 'Full career experience',
  h1Years: 'years',
  h1Skills: 'skills',
  h1Tagline: 'One constellation.',
  // ── Phase 16 additions (UI-SPEC §Copywriting Contract lines 788-809) ──
  filterBarLabel: 'Skill filters',
  filterSkillsLabel: 'Filter by skill',
  filterCategoryLabel: 'Filter by category',
  yearLabel: 'Years',
  yearStartLabel: 'Start year',
  yearEndLabel: 'End year',
  yearFrom: 'from',
  yearTo: 'to',
  filterReset: 'Reset',
  filterEmpty: 'No matches — try fewer filters',
  filterEmptyHint: 'Clear filters to see all skills.',
  cardClose: 'Close',
  cardHeading: '{skill}',
  cardJobsListLabel: 'Jobs using {skill}',
  cardJobsCount: '{n} jobs',
  cardJobsCountSingular: '1 job',
  cvCtaLabel: 'Download CV (English)',
  techChipsLabel: 'Technologies used',
  yearsChipLabel: 'Years',
  skillActiveAndLocked: '{skill} (currently selected — click another node to change)',
}
```
**Mirror exactly the same 20 keys in the `es:` block** with Spanish values (UI-SPEC table EN/ES columns).

**Substitution semantics — mirror Phase 15 pattern at `SvgConstellation.js` line 115-118:**
```js
const text = t.game.skillSelected
  .replace('{name}', node.label)
  .replace('{n}', String(node.count))
  .replace('{s}', node.count === 1 ? '' : 's')
```
Apply same `.replace('{skill}', node.label)` for `cardHeading` and `skillActiveAndLocked`; `.replace('{n}', String(jobCount))` for `cardJobsCount` / `cardJobsListLabel`.

---

#### `tailwind.config.js` (EXTEND keyframes, animation, colors)

**Analog:** itself — Phase 15 extensions at lines 70-110.

**Color token pattern — mirror `colors.constellation` and `colors.hintPill` shape from lines 40-49:**
```js
// Add to theme.extend.colors (after existing hintPill entry):
chip: {
  activeBg:      'var(--color-chip-active-bg)',
  activeText:    'var(--color-chip-active-text)',
  outlineBorder: 'var(--color-chip-outline-border)',
  outlineText:   'var(--color-chip-outline-text)',
},
slider: {
  track:       'var(--color-slider-track)',
  range:       'var(--color-slider-range)',
  thumb:       'var(--color-slider-thumb)',
  thumbBorder: 'var(--color-slider-thumb-border)',
},
card: {
  bg:      'var(--color-card-bg)',
  border:  'var(--color-card-border)',
  overlay: 'var(--color-card-overlay-bg)',
},
cvCta: {
  bg:      'var(--color-cv-cta-bg)',
  text:    'var(--color-cv-cta-text)',
  hoverBg: 'var(--color-cv-cta-hover-bg)',
},
```

**Keyframes pattern — mirror existing `nodeReveal`, `edgeReveal`, `hintFadeOut` shape (lines 94-110):**
```js
// Add to theme.extend.keyframes:
cardFadeIn: {
  '0%':   { opacity: '0', transform: 'scale(0.96)' },
  '100%': { opacity: '1', transform: 'scale(1.0)' },
},
cardSlideUp: {
  '0%':   { opacity: '0', transform: 'translateY(100%)' },
  '100%': { opacity: '1', transform: 'translateY(0%)' },
},
cardSwapOut: { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
cardSwapIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
chipFlash: {
  '0%':   { opacity: '1' },
  '50%':  { opacity: '0.5', transform: 'scale(0.94)' },
  '100%': { opacity: '1', transform: 'scale(1.0)' },
},
```

**Animation utility pattern — mirror existing animation block lines 70-78 (`'fade-in': 'fadeIn ...'`):**
```js
// Add to theme.extend.animation (note camelCase keyframe → kebab class):
'card-fade-in':  'cardFadeIn 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
'card-slide-up': 'cardSlideUp 250ms cubic-bezier(0.22, 1, 0.36, 1) both',
'card-swap-out': 'cardSwapOut 75ms ease-in both',
'card-swap-in':  'cardSwapIn 75ms ease-out both',
'chip-flash':    'chipFlash 100ms ease-out both',
```

**`motion-safe:` prefix mandate — copy the comment style from line 88 ("MUST be applied with motion-safe: prefix"):**
```js
// NOTE: All Phase 16 card + chip animations MUST be applied with motion-safe: prefix
// Example: 'motion-safe:animate-card-fade-in' never 'animate-card-fade-in'
```

---

#### `src/index.css` (EXTEND `:root` + `[data-theme="light"]`)

**Analog:** itself — Phase 15 added tokens at lines 62-66 (dark) + 129-133 (light).

**Extension comment header pattern — mirror line 62 (`/* ── Constellation-specific tokens (Phase 15) ── */`):**
```css
/* ── Filter chips + slider + card surfaces (Phase 16) ── */
--color-chip-active-bg:       var(--color-brand);
--color-chip-active-text:     #FFFFFF;
--color-chip-outline-border:  var(--color-ink-400);
--color-chip-outline-text:    var(--color-text-secondary);
--color-slider-track:         var(--color-ink-600);
--color-slider-range:         var(--color-brand);
--color-slider-thumb:         var(--color-brand);
--color-slider-thumb-border:  var(--color-ink-950);
--color-card-bg:              var(--color-ink-800);
--color-card-border:          var(--color-ink-600);
--color-card-shadow:          0 8px 32px rgba(13, 13, 26, 0.72), 0 2px 8px rgba(13, 13, 26, 0.48);
--color-card-overlay-bg:      rgba(13, 13, 26, 0.60);
--color-cv-cta-bg:            var(--color-brand);
--color-cv-cta-text:          #FFFFFF;
--color-cv-cta-hover-bg:      var(--color-brand-dark);
```

**Light-theme override block — mirror Phase 15 lines 129-133, place inside `[data-theme="light"]` after existing overrides:**
```css
/* ── Filter + card light-theme overrides (Phase 16) ── */
--color-chip-outline-border:  var(--color-ink-400);
--color-chip-outline-text:    var(--color-text-secondary);
--color-slider-track:         var(--color-ink-600);
/* slider-range/thumb resolve to theme-aware brand automatically — no override needed */
--color-card-bg:              var(--color-ink-800);
--color-card-border:          var(--color-ink-600);
--color-card-shadow:          0 8px 32px rgba(13, 13, 26, 0.16), 0 2px 8px rgba(13, 13, 26, 0.10);
--color-card-overlay-bg:      rgba(13, 13, 26, 0.30);
```

**Reduced-motion — DO NOT add a new block.** Existing global rule (Phase 15) already suppresses all `animation-duration`. Phase 16 only needs the keyframe additions in `tailwind.config.js`; reduction is handled by the prior CSS rule.

**`.scrollbar-hide` utility (mobile chip-row, UI-SPEC line 778) — add to global CSS:**
```css
/* Phase 16: mobile filter toolbar horizontal scroll without visible scrollbar */
.scrollbar-hide {
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

---

### Wave 2 — Hook + Renderer Extensions (GREEN)

#### `src/game/useConstellation.js` (EXTEND — fill in filter state)

**Analog:** itself (lines 1-27 — Phase 15 placeholders at lines 8-9). Mirror the exact useState/useCallback/useMemo shape.

**Current Phase 15 hook to extend — copy lines 1-27 as scaffold:**
```js
// Current placeholders to REPLACE (line 8-9):
const [highlightedSkillIds] = useState([])
const [yearRange] = useState(null)
```

**Extension pattern — mirror existing `selectedSkillId` setter shape (lines 5, 11-13):**
```js
import { useState, useCallback, useMemo } from 'react'
import EXPERIENCE from '../data/experience.js'
import { SKILLS } from '../data/skills.js'
import { composeFilters, visibleSkillIds, yearBounds } from './filters.js'

// Module-level derived constant — same pattern as GameMode.js lines 14-16
const YEAR_BOUNDS = yearBounds(EXPERIENCE)

export default function useConstellation(nodes) {
  const [selectedSkillId, setSelectedSkillId] = useState(null)
  const [hoveredSkillId, setHoveredSkillId] = useState(null)
  // Phase 16 filter state — fills in Phase 15 placeholders
  const [selectedSkills, setSelectedSkills] = useState([])
  const [yearRange, setYearRangeState] = useState(null) // null = no range filter
  const [category, setCategoryState] = useState(null)

  const onSelectSkill = useCallback((id) => {
    setSelectedSkillId((prev) => (prev === id ? null : id))
  }, [])

  const onHoverSkill = useCallback((id) => {
    setHoveredSkillId(id)
  }, [])

  // Phase 16 setters — same useCallback shape as Phase 15
  const toggleSkill = useCallback((id) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }, [])

  const setYearRange = useCallback((range) => { setYearRangeState(range) }, [])
  const setCategory  = useCallback((cat)   => { setCategoryState(cat) },   [])

  const resetFilters = useCallback(() => {
    setSelectedSkills([])
    setYearRangeState(null)
    setCategoryState(null)
  }, [])

  // Derived: highlightedSkillIds = skills that appear in at least one matching experience
  const highlightedSkillIds = useMemo(() => {
    if (selectedSkills.length === 0 && !yearRange && !category) return []
    const matching = composeFilters(EXPERIENCE, { skillIds: selectedSkills, yearRange, category }, SKILLS)
    return visibleSkillIds(matching)
  }, [selectedSkills, yearRange, category])

  const isFilterActive = selectedSkills.length > 0 || yearRange !== null || category !== null

  return useMemo(() => ({
    selectedSkillId,
    hoveredSkillId,
    selectedSkills,
    yearRange,
    category,
    yearBounds: YEAR_BOUNDS,
    highlightedSkillIds,
    isFilterActive,
    onSelectSkill,
    onHoverSkill,
    toggleSkill,
    setYearRange,
    setCategory,
    resetFilters,
  }), [
    selectedSkillId, hoveredSkillId, selectedSkills, yearRange, category,
    highlightedSkillIds, isFilterActive,
    onSelectSkill, onHoverSkill, toggleSkill, setYearRange, setCategory, resetFilters,
  ])
}
```

**Anti-pattern (Pitfall 7 from RESEARCH.md):** include ALL filter dimensions in the `useMemo` deps array. Stale `highlightedSkillIds` is the failure mode.

---

#### `src/game/renderers/SvgConstellation.js` (EXTEND — consume `highlightedSkillIds` + `yearRange`)

**Analog:** itself — lines 72-74 already accept the props (currently `eslint-disable-line no-unused-vars`); line 224 currently computes `fillOpacity` for `selectedSkillId` only.

**Current dim logic to extend — line 224:**
```js
// Current Phase 15:
const fillOpacity = selectedSkillId !== null && !isSelected ? 0.35 : 1
```

**Extension pattern — overlay `highlightedSkillIds` + `yearRange` consumer:**
```js
// Phase 16 extended dim logic:
function nodeMatchesYearRange(node, yearRange) {
  if (!yearRange || !node.years) return true
  const [from, to] = yearRange
  const [start, end] = node.years
  return start <= to && end >= from
}

function shouldDimNode(node, { selectedSkillId, highlightedSkillIds, yearRange }) {
  // If any filter is active, dim non-matching nodes
  const filtersActive = (highlightedSkillIds && highlightedSkillIds.length > 0) || yearRange !== null
  if (filtersActive) {
    const inHighlight = highlightedSkillIds && highlightedSkillIds.length > 0
      ? highlightedSkillIds.includes(node.id)
      : true
    const inYear = nodeMatchesYearRange(node, yearRange)
    if (!(inHighlight && inYear)) return true
  }
  // Phase 15 fallback: dim non-selected when a single skill is selected
  if (selectedSkillId !== null && node.id !== selectedSkillId) return true
  return false
}

// In render loop (replaces line 224):
const fillOpacity = shouldDimNode(node, { selectedSkillId, highlightedSkillIds, yearRange }) ? 0.35 : 1
```

**Edge dim extension — mirror existing Phase 15 edge logic lines 188-195:**
```js
// Phase 15 currently: weight-1 edges only show when incident to activeId.
// Phase 16 ADDITION: when filters active, dim edges incident to dimmed nodes
// regardless of weight (D-16-YEAR-EFFECT line 43 of CONTEXT.md).
const sourceDimmed = shouldDimNode(/* source node */)
const targetDimmed = shouldDimNode(/* target node */)
const filterDimsEdge = filtersActive && (sourceDimmed || targetDimmed)
// Then multiply final opacity by 0.35 when filterDimsEdge
```

**Reduced-motion guard — reuse the `prefersReducedMotion` value already in scope (line 81). Phase 16 keeps the same `style.transition` pattern as Phase 15 line 206:**
```js
style={{
  fillOpacity,
  transition: prefersReducedMotion ? 'none' : 'fill-opacity 200ms ease-out',
}}
```

**Chip-flash hook-in — receive new prop `justFilteredId` from `useConstellation` (Pattern from RESEARCH.md §7):**
```js
className={node.id === justFilteredId && !prefersReducedMotion ? 'motion-safe:animate-chip-flash' : ''}
```

---

### Wave 3 — Filter Bar UI (GREEN)

#### `src/game/SkillFilters.js` (NEW)

**Analog:** `src/components/_shared/ViewModeToggle.js` (chip pill scaffolding) + `src/components/Nav.js` `LangPill` (segmented role=group pattern). Whole-bar layout = new.

**Imports pattern — minimal, no hooks calls (props-driven, mirrors Phase 15 renderer contract):**
```js
import React from 'react'
import { SKILL_CATEGORIES } from '../data/skills.js'
// All state + setters arrive via props. No useLanguage/useTheme/useViewMode here.
// (Mirrors SvgConstellation's prop-driven design lines 68-80 — easier to test, no provider wrapping needed.)
```

**Root wrapper pattern — copy `role="group"` + `data-game-interactive` from UI-SPEC §ARIA Contract lines 413-417 and `ViewModeToggle.js` lines 18-21:**
```jsx
<div
  role="group"
  aria-label={t.game.filterBarLabel}
  data-game-interactive
  className="w-full max-w-3xl bg-ink-900/80 backdrop-blur-sm border-t border-ink-600 px-4 py-4 flex flex-wrap items-center gap-4 rounded-b-xl"
>
```
(NB: `bg-ink-900/80 backdrop-blur-sm` mirrors `Nav.js` header line 26 `bg-ink-900/70 backdrop-blur-md` — same visual language.)

**Skill chip group — mirror `LangPill` lines 92-123:**
```jsx
// Existing LangPill base+active+inactive class triple (line 93-95) to mirror exactly:
const base = 'px-3 py-1.5 rounded-full font-mono text-xs min-h-[44px] min-w-[44px] inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-safe:transition-colors duration-200'
const activeSkill   = 'bg-chip-activeBg text-chip-activeText font-extrabold'
const inactiveSkill = 'text-chip-outlineText bg-chip-outlineBg border border-chip-outlineBorder'

<div role="group" aria-label={t.game.filterSkillsLabel} className="flex flex-wrap gap-2">
  {nodes.map((node) => {
    const isActive = selectedSkills.includes(node.id)
    return (
      <button
        key={node.id}
        type="button"
        onClick={() => onToggleSkill(node.id)}
        aria-pressed={isActive}
        aria-label={node.label}
        className={`${base} ${isActive ? activeSkill : inactiveSkill}`}
      >
        {node.label}
      </button>
    )
  })}
</div>
```
**`aria-pressed` contract — exact copy from `ViewModeToggle.js` line 28 (`aria-pressed={viewMode === 'game'}`).**

**Category chip group — same chip pattern, with inline `style={{ backgroundColor: cat.color }}` for active state:**
```jsx
{Object.entries(SKILL_CATEGORIES).map(([key, cat]) => {
  const isActive = category === key
  return (
    <button
      key={key}
      type="button"
      onClick={() => onCategoryChange(isActive ? null : key)}
      aria-pressed={isActive}
      aria-label={cat[lang]}
      style={isActive ? { backgroundColor: cat.color, color: '#FFFFFF' } : undefined}
      className={`${base} ${isActive ? 'font-extrabold' : inactiveSkill}`}
    >
      {cat[lang]}
    </button>
  )
})}
```
(NOTE: `SKILL_CATEGORIES` already exports `{ en, es, color }` per category — see `skills.js` line 21-30. Use `.color` directly; no new token needed.)

**Reset button — `aria-disabled` + native `disabled` from UI-SPEC line 501:**
```jsx
<button
  type="button"
  onClick={onReset}
  disabled={!isFilterActive}
  aria-disabled={!isFilterActive}
  aria-label={t.game.filterReset}
  className={`${base} ${isFilterActive ? 'text-brand border border-brand' : 'text-text-muted border border-ink-400'} motion-safe:transition-opacity duration-150`}
>
  {t.game.filterReset}
</button>
```

#### `YearRangeSlider` (inline inside `SkillFilters.js`)

**Analog: NO in-repo analog.** WAI-ARIA APG slider-multithumb is the source-of-truth (RESEARCH.md §2 lines 396-525).

**Implementation contract — copy verbatim from RESEARCH.md §2 lines 437-509.** Key invariants:
- Two `<button role="slider">` elements with dependent `aria-valuemin`/`aria-valuemax`.
- Each thumb's `aria-valuemin = otherThumb ± 1` (strict `<`).
- Keyboard handlers call `e.preventDefault()` before delegating to `onChange`.
- 44×44px touch target via `before:absolute before:inset-[-14px] before:content-['']` (UI-SPEC §Sizing line 274).
- Pointer drag: **DEFER to v2.** Ship keyboard-only first (RESEARCH.md §2 lines 511-519).

**Pitfall 4 guard (RESEARCH.md):** if `start == end` is allowed, set `aria-valuemax` of start = `end` (not `end - 1`). Recommend strict `<` enforcement.

---

### Wave 4 — ExperienceCard Dialog (GREEN)

#### `src/game/ExperienceCard.js` (NEW)

**Analog:** `src/components/Nav.js` `MobileMenu` (lines 167-229) — `createPortal` + `role="dialog"` + Esc + body overflow lock. Job-body markup mirrors `src/components/Experience.js` `TimelineCard` (lines 48-101).

**Portal + dialog scaffolding — copy from `Nav.js MobileMenu` lines 167-228:**
```js
// Existing MobileMenu pattern to mirror:
import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function ExperienceCard({
  selectedNode, jobs, lang, t,
  selectedSkills, onClose, onToggleSkill, rovingEntryRef,
}) {
  const cardRef = useRef(null)
  const headingRef = useRef(null)

  // Body overflow lock — exact copy of MobileMenu lines 168-179
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  // ...
}
```

**Initial focus + Esc handler — mirror MobileMenu lines 168-179 but EXTEND with Tab-cycle (RESEARCH.md §3):**
```js
// MobileMenu currently:
useEffect(() => {
  function onKey(e) {
    if (e.key === 'Escape') onClose()
  }
  if (open) document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}, [open, onClose])

// ExperienceCard extension — add Tab focus-trap branch (RESEARCH.md §3 lines 573-598):
useEffect(() => {
  headingRef.current?.focus()  // Initial focus = heading (UI-SPEC line 579)

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'Tab' && cardRef.current) {
      const focusable = cardRef.current.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
  }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}, [onClose])
```

**Click-outside listener — RESEARCH.md §3 lines 600-606 + Pitfall 2 deferred attach:**
```js
// Pitfall 2: defer one frame so the click that OPENED the card doesn't immediately close it
useEffect(() => {
  let registered = false
  function onMouseDown(e) {
    if (!e.target.closest('[data-game-interactive]')) onClose()
  }
  const id = requestAnimationFrame(() => {
    document.addEventListener('mousedown', onMouseDown)
    registered = true
  })
  return () => {
    cancelAnimationFrame(id)
    if (registered) document.removeEventListener('mousedown', onMouseDown)
  }
}, [onClose])
```

**Dialog markup — mirror MobileMenu role/aria-modal lines 184-188 + `data-game-interactive`:**
```jsx
return createPortal(
  <>
    <div
      className="fixed inset-0 z-[199] bg-card-overlay motion-safe:transition-opacity duration-200"
      onClick={onClose}
      aria-hidden="true"
    />
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-skill-heading"
      data-game-interactive
      className="fixed bottom-0 left-0 right-0 z-[200] bg-card-bg rounded-t-2xl max-h-[75vh]
                 md:bottom-auto md:left-auto md:right-auto md:max-w-[360px] md:rounded-xl
                 flex flex-col motion-safe:animate-card-slide-up md:motion-safe:animate-card-fade-in"
    >
      {/* drag-handle bar (mobile only, visual affordance) */}
      <div className="md:hidden h-1 w-8 bg-chip-outlineBorder rounded-full mx-auto mt-3 mb-2" aria-hidden="true" />
      {/* keyed wrapper for swap animation (RESEARCH.md §6) */}
      <div key={selectedNode.id} className="flex flex-col flex-1 overflow-hidden">
        <header>{/* heading + close */}</header>
        <ol className="overflow-y-auto" aria-label={t.game.cardJobsListLabel.replace('{skill}', selectedNode.label)}>
          {/* job entries — mirror Experience.js TimelineCard */}
        </ol>
        <footer>{/* CV CTA */}</footer>
      </div>
    </div>
  </>,
  document.body
)
```

**Heading + close button — copy MobileMenu close-button pattern lines 191-201:**
```jsx
<header className="flex items-center justify-between p-4 border-b border-card-border">
  <h2
    id="card-skill-heading"
    ref={headingRef}
    tabIndex={-1}
    className="text-xl font-bold text-text-primary focus:outline-none"
  >
    {selectedNode.label}
    <span className="ml-2 text-xs font-mono text-text-secondary">
      {jobs.length === 1
        ? t.game.cardJobsCountSingular
        : t.game.cardJobsCount.replace('{n}', String(jobs.length))}
    </span>
  </h2>
  <button
    type="button"
    onClick={onClose}
    aria-label={t.game.cardClose}
    className="inline-flex items-center justify-center w-11 h-11 text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-safe:transition-colors duration-200"
  >
    {/* X icon — exact copy from Nav.js lines 197-200 */}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  </button>
</header>
```

**Job entry list — mirror `Experience.js TimelineCard` lines 48-101 (bilingual field access lines 60-66):**
```jsx
<ol className="overflow-y-auto px-4 pb-4 space-y-4" aria-label={/* see above */}>
  {jobs.map((job, i) => (
    <li key={`${job.company}-${i}`}>
      <article>
        {/* Header row — mirror Experience.js lines 59-64 */}
        <div className="flex justify-between items-baseline gap-4 flex-wrap mb-1">
          <span className="font-mono text-xs text-brand">{job.date[lang]}</span>
          <span className="font-mono text-xs text-text-muted bg-ink-700 border border-ink-400 rounded-full px-2 py-1">
            {job.company}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          {job.title[lang]}
        </h3>
        <div className="text-xs font-mono text-text-secondary mb-3">
          {job.location[lang]}
        </div>
        {/* Bullets — mirror Experience.js lines 91-97 */}
        <ul className="text-sm text-text-secondary leading-relaxed space-y-1 mb-3">
          {job.bullets[lang].map((b, j) => (
            <li key={j} className="relative pl-6">
              <span className="absolute left-0 text-brand">&#9656;</span>{b}
            </li>
          ))}
        </ul>
        {/* Tech chips — REPLACE Experience.js static <span> (lines 69-76) with clickable buttons */}
        <div role="group" aria-label={t.game.techChipsLabel} className="flex flex-wrap gap-2">
          {job.tech.map((tech) => {
            const isActive = selectedSkills.includes(tech)
            const isLocked = tech === selectedNode.id
            return (
              <button
                key={tech}
                type="button"
                onClick={isLocked ? undefined : () => onToggleSkill(tech)}
                aria-pressed={isActive}
                aria-disabled={isLocked}
                aria-describedby={isLocked ? 'card-locked-help' : undefined}
                className={`px-3 py-1 rounded-full font-mono text-xs min-h-[44px] inline-flex items-center
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
                            ${isActive ? 'bg-chip-activeBg text-chip-activeText' : 'bg-ink-700 border border-ink-400 text-text-secondary'}
                            ${isLocked ? 'opacity-75 cursor-default' : 'motion-safe:transition-colors duration-150 hover:border-brand'}`}
              >
                {tech}
              </button>
            )
          })}
        </div>
      </article>
    </li>
  ))}
</ol>
```

**CV CTA footer — copy from RESEARCH.md §Code Examples Example 3 lines 1228-1240:**
```jsx
<footer className="px-4 py-3 border-t border-card-border">
  <a
    href={`/CV_Carlos_Montoya_${lang === 'en' ? 'EN' : 'ES'}.docx`}
    download
    aria-label={t.game.cvCtaLabel}
    className="w-full h-11 rounded-lg bg-cvCta-bg text-cvCta-text text-sm font-semibold
               flex items-center justify-center hover:bg-cvCta-hoverBg
               motion-safe:transition-colors duration-200
               focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
  >
    {t.game.cvCtaLabel}
  </a>
</footer>
```

**Empty-state fallback (D-16-EMPTY) — replace `<ol>` content per UI-SPEC §Empty-State Contract:**
```jsx
{jobs.length === 0 ? (
  <p className="text-text-secondary text-sm px-4 py-8 text-center" role="status">
    {t.game.filterEmpty}
  </p>
) : (
  <ol>{/* … */}</ol>
)}
```

---

### Wave 5 — Wiring (GREEN)

#### `src/game/GameMode.js` (EXTEND — mount filters + card)

**Analog:** itself — lines 66-124. Already wires `useConstellation` → `SvgConstellation` props. Phase 16 adds two siblings.

**Current Phase 15 hook destructure (line 72) — extend to pull new state:**
```js
const cons = useConstellation(GRAPH_NODES)
// Phase 16 adds: cons.selectedSkills, cons.yearRange, cons.category, cons.toggleSkill,
//                cons.setYearRange, cons.setCategory, cons.resetFilters, cons.isFilterActive,
//                cons.yearBounds
```

**Render shape — insert two children inside `<section>` (line 90) WITHOUT touching the existing renderer-slot:**
```jsx
return (
  <section id="game-mode" className="min-h-screen flex flex-col items-center px-6 pt-12 pb-8">
    {/* H1 block — Phase 15, unchanged */}
    <div className="text-center mb-8 md:mb-12 max-w-2xl">{/* lines 91-96 unchanged */}</div>

    {/* Phase 16: mobile filter toolbar (DOM-first on mobile, before constellation) */}
    {/* On desktop, this same component renders at the bottom via flex order — see UI-SPEC §Layout Contract */}
    <SkillFilters
      nodes={GRAPH_NODES}
      selectedSkills={cons.selectedSkills}
      yearRange={cons.yearRange}
      yearBounds={cons.yearBounds}
      category={cons.category}
      isFilterActive={cons.isFilterActive}
      onToggleSkill={cons.toggleSkill}
      onYearRangeChange={cons.setYearRange}
      onCategoryChange={cons.setCategory}
      onReset={cons.resetFilters}
      lang={lang}
      t={t}
    />

    {/* Phase 15 ErrorBoundary + renderer-slot — UNCHANGED, just pass new props */}
    <ConstellationErrorBoundary fallback={errorFallback}>
      <div className="w-full max-w-3xl relative" data-testid="renderer-slot" ...>
        <SvgConstellation
          nodes={GRAPH_NODES}
          edges={GRAPH_EDGES}
          layout={LAYOUT}
          highlightedSkillIds={cons.highlightedSkillIds}    {/* Phase 15 prop, now populated */}
          selectedSkillId={cons.selectedSkillId}
          yearRange={cons.yearRange}                         {/* Phase 15 prop, now populated */}
          theme={theme}
          lang={lang}
          t={t}
          onSelectSkill={cons.onSelectSkill}
          onHoverSkill={cons.onHoverSkill}
        />
      </div>
    </ConstellationErrorBoundary>

    {/* Phase 16: floating dialog */}
    {cons.selectedSkillId !== null && (
      <ExperienceCard
        selectedNode={GRAPH_NODES.find((n) => n.id === cons.selectedSkillId)}
        jobs={composeFilters(EXPERIENCE, {
          skillIds: [cons.selectedSkillId, ...cons.selectedSkills.filter((s) => s !== cons.selectedSkillId)],
          yearRange: cons.yearRange,
          category: cons.category,
        }, SKILLS)}
        selectedSkills={[cons.selectedSkillId, ...cons.selectedSkills]}
        lang={lang}
        t={t}
        onClose={() => cons.onSelectSkill(cons.selectedSkillId)}  {/* toggle-off via Phase 15 hook */}
        onToggleSkill={cons.toggleSkill}
      />
    )}

    {/* Phase 15: sr-only fallback — UNCHANGED */}
    <ConstellationFallback experiences={EXPERIENCE} lang={lang} t={t} />
  </section>
)
```

**Card-close → return focus — leverage Phase 15's `rovingEntryRef` indirection (RESEARCH.md §3 line 650):** the dialog's `onClose` calls `cons.onSelectSkill(cons.selectedSkillId)`, which toggles `selectedSkillId` to `null`. The renderer's existing Esc-handler path (`SvgConstellation.js` line 149) already focuses `rovingEntryRef`. Phase 16 does NOT need to manage return focus separately.

---

#### `src/components/Nav.js` (ONE-LINE EDIT — add `data-game-interactive` to `<header>`)

**Analog:** itself line 26. Add the attribute per Pitfall 6 (RESEARCH.md):
```jsx
// BEFORE (line 26):
<header className="sticky top-0 z-50 backdrop-blur-md bg-ink-900/70 border-b border-ink-600">
// AFTER:
<header data-game-interactive className="sticky top-0 z-50 backdrop-blur-md bg-ink-900/70 border-b border-ink-600">
```
This ensures ThemeToggle/LangPill clicks inside Nav do not close the card.

---

## Shared Patterns

### Bilingual copy via `t.game.*` — never inline literals
**Source:** `src/i18n/translations.js` lines 24-42 + `SvgConstellation.js` line 115 (`.replace('{name}', node.label)`)
**Apply to:** `SkillFilters.js`, `ExperienceCard.js`, `useConstellation.js` (if any user-visible string)
```js
// Always: const { lang, t } = useLanguage() at GameMode level, forward as props
//         Templates use t.game.someKey.replace('{var}', value)
```

### Focus-visible ring + 44px touch target (chip / button)
**Source:** `ViewModeToggle.js` line 9 (the full className string) + `ThemeToggle.js` line 35
**Apply to:** every clickable in SkillFilters + ExperienceCard
```
"... min-h-[44px] min-w-[44px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-safe:transition-colors duration-200"
```

### `aria-pressed` for toggle state
**Source:** `ViewModeToggle.js` line 28 (`aria-pressed={viewMode === 'game'}`) + `LangPill` lines 109, 118
**Apply to:** all skill chips, category chips, tech chips inside card
```jsx
<button type="button" aria-pressed={isActive} onClick={...} />
```

### `role="group"` for chip clusters (purpose, not action)
**Source:** `ViewModeToggle.js` lines 13-22 (the CR-02 comment is authoritative) + `LangPill` lines 96-103
**Apply to:** skill chip cluster, category chip cluster, tech chip cluster, year-slider thumb pair
```jsx
<div role="group" aria-label={t.game.filterSkillsLabel}>{/* buttons */}</div>
```

### `motion-safe:` prefix mandate
**Source:** `tailwind.config.js` lines 88-89 (the "MUST be applied with motion-safe: prefix" comment) + `SvgConstellation.js` lines 209, 253
**Apply to:** every animation utility in Phase 16 — `motion-safe:animate-card-fade-in`, `motion-safe:animate-card-slide-up`, `motion-safe:animate-chip-flash`, `motion-safe:transition-colors`

### `data-game-interactive` allow-list (click-outside contract)
**Source:** Phase 16 NEW — Pitfall 6 documents it
**Apply to:** filter bar root, ExperienceCard dialog root, Nav `<header>` (one-line edit). The card's mousedown listener calls `e.target.closest('[data-game-interactive]')`.

### Portal + dialog + Esc + body overflow lock
**Source:** `Nav.js MobileMenu` lines 167-228 (full pattern). Verified working.
**Apply to:** `ExperienceCard.js` — mirror exact structure, extend with Tab focus-trap from RESEARCH.md §3.

### Pure-module convention (no React, no DOM imports)
**Source:** `src/game/spatialNav.js` lines 1-38 + `src/data/skills.js` lines 21-79
**Apply to:** `src/game/filters.js` — named exports, module-level constants in camelCase or UPPER_SNAKE, deterministic output, no side effects.

### TDD file colocation
**Source:** Phase 14/15 convention — `useConstellation.js` + `useConstellation.test.js` in same directory
**Apply to:** all new Phase 16 source files. Test file lives in the SAME directory (NOT `__tests__/` subdirectory — verified: `src/game/useConstellation.test.js` is colocated, not in `src/game/__tests__/`). Override the prompt's `__tests__/` suggestion to match repo convention.
```
src/game/filters.js              → src/game/filters.test.js
src/game/SkillFilters.js         → src/game/SkillFilters.test.js
src/game/ExperienceCard.js       → src/game/ExperienceCard.test.js
```

### No semicolons, no comma-dangle
**Source:** `.eslintrc.js` + every existing `.js` file in `src/`
**Apply to:** all new files. No `;`. No trailing commas in function params or import lists. (Trailing commas in array/object literals are fine — `airbnb` allows them.)

### JSX in `.js` files (not `.jsx`)
**Source:** `vite.config.js` esbuild config + every existing component
**Apply to:** all Phase 16 component files. Even `ExperienceCard.js` despite returning JSX.

### Token-driven colors — no raw hex in styling
**Source:** Phase 14/15 verified convention. `SKILL_CATEGORY_COLORS` hex values are the documented data exception.
**Apply to:** `SkillFilters.js` (category chips use `cat.color` from data — that's the exception), all other styling via `bg-chip-*`, `bg-card-*`, `bg-cvCta-*` tokens.

### `prefers-reduced-motion` reuse (do NOT re-implement)
**Source:** `SvgConstellation.js` lines 32-59 (the inline Josh Comeau hook — only consumer until Phase 16)
**Apply to:** `ExperienceCard.js` (for chip-flash conditional class). RESEARCH.md §"Don't Hand-Roll" line 1077 says: "Extract to a shared file if 2nd consumer needs it." Recommendation: extract to `src/game/usePrefersReducedMotion.js` (one file, one named export) before importing in ExperienceCard — or accept it as a prop from `GameMode` if extraction adds friction.

---

## No Analog Found

| File / surface | Role | Reason |
|---|---|---|
| `YearRangeSlider` dual-thumb widget (inside `SkillFilters.js`) | custom WAI-ARIA slider | No multi-thumb slider exists in the codebase. WAI-ARIA APG slider-multithumb pattern is the source-of-truth — RESEARCH.md §2 lines 396-525 provides a copy-pasteable ~120-LOC implementation. Two `<button role="slider">` with dependent `aria-valuemin`/`aria-valuemax` and arrow/Home/End keyboard. No library; no precedent in repo. |

---

## Metadata

**Analog search scope:** `src/game/` (full), `src/components/` (Nav, Experience, _shared/), `src/i18n/`, `src/context/`, `src/data/`, `src/test/setup.js`, repo-root configs (`tailwind.config.js`, `src/index.css`, `package.json`, `vite.config.js`, `jsconfig.json`).
**Files scanned:** 13 source files read in full (Phase 14/15 deliverables + Nav.js + Experience.js + ViewModeToggle.js + ThemeToggle.js + translations.js head + tailwind.config.js + skills.js head + setup.js + ConstellationFallback.js + GameMode.js + useConstellation.js + SvgConstellation.js + useConstellation.test.js + SvgConstellation.test.js + GameMode.test.js + spatialNav.js + constellation.graph.test.js head) + 1 grep pass for CSS variable inventory.
**Phase 14 PATTERNS.md** and **Phase 15 PATTERNS.md** consumed for context inheritance.
**Pattern extraction date:** 2026-06-02
**Critical conventions reinforced:** `.js` (not `.jsx`); no semicolons; colocated tests (NOT `__tests__/` subdir); `motion-safe:` prefix on every animation; `data-game-interactive` allow-list applied to ALL three Phase 16 surfaces (filter bar root, dialog root, Nav `<header>`).
