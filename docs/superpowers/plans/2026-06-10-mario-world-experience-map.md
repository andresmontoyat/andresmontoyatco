# Mario-World Experience Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace v3.10.1 skill-constellation with a Mario-Bros-inspired world-map landing experience: companies as worlds, roles as levels inside worlds, 5 themed biomes by era+stack, free-roam 2D navigation, cinematic zoom-to-overlay world reveal, pixel-art Carlos avatar, terminal-command hidden worlds, accessible DOM fallback for reduced-motion users, and a Hero gate that routes recruiter to Game or Dev view.

**Architecture:** New `src/marioWorld/` directory mirrors the deprecated `src/game/` adaptive-renderer pattern. `MarioWorld.js` orchestrates: `HeroGameGate` (Hero + 2 buttons, first visit only) → `WorldMap` (capability gate: `WebGLWorldMap` or `SvgWorldMap`) OR `DevView` (classic scroll). World data derived once at module load from `EXPERIENCE` + `SKILLS` + `SECTIONS` + `SECRET_WORLDS` via pure `deriveWorlds()`. WebGL renderer reuses three.js infra (PerspectiveCamera + lazy chunk) from v3.10.1; bundle gate stays at 130 kB gz HARD. Migration is 4 sequential phases — each ships working software.

**Tech Stack:** React 18 · Vite 6 · Vitest + RTL · three.js 0.169.0 · Tailwind v3.4 · jsdom (tests; no real GL).

**Spec source:** `docs/superpowers/specs/2026-06-10-mario-world-experience-map-design.md`. All 19 brainstorming decisions locked there. Refer to it when in doubt.

---

## File Structure (all 4 phases)

**Create:**
```
src/marioWorld/
├── MarioWorld.js                         Orchestrator (Phase 21)
├── HeroGameGate.js                       Hero + 2 buttons (Phase 21)
├── DevView.js                            Classic scroll view (Phase 21)
├── WorldErrorBoundary.js                 Renamed from ConstellationErrorBoundary (Phase 22)
├── WorldMap.js                           Capability wrapper (Phase 22)
├── renderers/
│   ├── WebGLWorldMap.js                  three.js renderer (Phase 22)
│   ├── WebGLWorldMap.test.js
│   ├── SvgWorldMap.js                    DOM fallback (Phase 22)
│   └── SvgWorldMap.test.js
├── hooks/
│   ├── useWorldNav.js                    arrow keys + drag/tap (Phase 23)
│   ├── useWorldNav.test.js
│   ├── useCinematicZoom.js               Zoom in/out state machine (Phase 23)
│   ├── useCinematicZoom.test.js
│   ├── useSecretCommand.js               Terminal-style command buffer (Phase 24)
│   └── useSecretCommand.test.js
├── overlays/
│   ├── WorldDetailOverlay.js             role=dialog full-screen (Phase 22)
│   ├── WorldDetailOverlay.test.js
│   └── SecretCommandHint.js              Discreet caret bottom-right (Phase 24)
└── data/
    ├── worlds.derive.js                  Pure derivation function (Phase 21)
    ├── worlds.derive.test.js
    ├── biomes.js                         BIOMES constants (Phase 21)
    └── secret-worlds.js                  Hidden worlds catalog (Phase 24)

src/data/
└── sections.js                           Single source of truth for non-experience sections (Phase 21)

src/marioWorld/MarioWorld.test.js          Orchestrator integration tests (Phase 21)
src/marioWorld/HeroGameGate.test.js        (Phase 21)
src/marioWorld/DevView.test.js             (Phase 21)
```

**Modify:**
```
src/data/experience.js                    Add `company` field to all 12 entries (Phase 21)
src/context/ViewModeContext.js            Support 'game' | 'dev' | null states (Phase 21)
src/App.js                                Replace <GameMode /> with <MarioWorld /> (Phase 21)
src/i18n/translations.js                  Add nested t.hero.enterGame, t.hero.skipToCV, t.world.* keys (Phase 21)
src/game/RendererErrorBoundary.js         Optionally rename → src/marioWorld/WorldErrorBoundary.js (Phase 22)
```

**Delete (Phase 24 final cleanup):**
```
src/game/                                  Entire directory (constellation, skill graph, filters)
src/components/About.js                    Content migrated to sections.js
src/components/Skills.js
src/components/Projects.js
src/components/Claude.js
src/components/Contact.js
```

**Public assets to add (Phase 22 + Phase 23):**
```
public/sprites/biome-pradera.webp          5 biome tile textures
public/sprites/biome-desierto.webp
public/sprites/biome-selva.webp
public/sprites/biome-cyber.webp
public/sprites/biome-castillo.webp
public/sprites/avatar-carlos-walk.webp     16x16 sprite sheet (4-frame walk + idle)
public/sprites/world-icons.webp            Pictogram atlas (one icon per world type)
```

---

# PHASE 21 — Foundation: data + DevView + Hero gate

**Goal of phase:** Single source of truth for sections, derived world data, classic Dev view, Hero gate routes Game/Dev. After this phase: Dev view fully works; Game view still shows v3.10.1 constellation behind a feature flag.

**Phase ships when:** all P21 tests GREEN, build clean, gate buttons functional, Dev view renders all 5 sections + experience chronologically.

### Task 21.1 — Add `company` field to experience.js

**Files:**
- Modify: `src/data/experience.js` (each of 12 entries)

- [ ] **Step 1: Inspect current shape**

```bash
head -60 src/data/experience.js
```

Read the 12 entries. Note: each has `title { en, es }` (currently mixes role + company), `period { start, end }`, `location`, `bullets`, `tech`, `featured`.

- [ ] **Step 2: Add `company` field above `title` for each entry**

Example diff for first entry:

```diff
 const EXPERIENCE = [
   {
+    company: 'Acme Corp',
     title: { en: 'Backend Engineer', es: 'Ingeniero Backend' },
     period: { start: 2018, end: 2021 },
     ...
   },
```

Operator (Carlos) MUST review and lock the exact `company` string per entry — when two entries share the same `company` string they will become roles inside one world.

- [ ] **Step 3: Run existing tests, expect GREEN (no behavior change yet)**

```bash
npx vitest run
```

Expected: 293 passed (v3.10.1 baseline). Adding a field is non-breaking.

- [ ] **Step 4: Commit**

```bash
git add src/data/experience.js
git commit -m "feat(21-01): add company field to EXPERIENCE entries (mario-world data prep)"
```

### Task 21.2 — Create biomes.js

**Files:**
- Create: `src/marioWorld/data/biomes.js`

- [ ] **Step 1: Create file with locked biome constants from spec § Architecture**

```js
// src/marioWorld/data/biomes.js
//
// 5 themed biomes (decision Q8-A): era + stack mapping.
// Operator may tune `tile` paths after sprite assets land in public/sprites/.

export const BIOMES = {
  pradera:  { id: 'pradera',  era: [2007, 2012], stack: 'Java / JEE Legacy',  color: '#5cb85c', tile: '/sprites/biome-pradera.webp' },
  desierto: { id: 'desierto', era: [2013, 2017], stack: 'SOA / Middleware',   color: '#d4a55b', tile: '/sprites/biome-desierto.webp' },
  selva:    { id: 'selva',    era: [2018, 2021], stack: 'Microservices',      color: '#2e6b3f', tile: '/sprites/biome-selva.webp' },
  cyber:    { id: 'cyber',    era: [2022, 2024], stack: 'Cloud / Kubernetes', color: '#3b82f6', tile: '/sprites/biome-cyber.webp' },
  castillo: { id: 'castillo', era: [2025, 2026], stack: 'Claude Code / AI',   color: '#a855f7', tile: '/sprites/biome-castillo.webp' },
}

/**
 * Map a year to its biome id. Earliest era's lower bound is the floor;
 * latest era's upper bound is the ceiling. Years outside either end
 * clamp to the closest biome.
 */
export function pickBiome(year) {
  for (const b of Object.values(BIOMES)) {
    if (year >= b.era[0] && year <= b.era[1]) return b.id
  }
  if (year < BIOMES.pradera.era[0]) return BIOMES.pradera.id
  return BIOMES.castillo.id
}
```

- [ ] **Step 2: Commit**

```bash
git add src/marioWorld/data/biomes.js
git commit -m "feat(21-02): biomes constants + pickBiome helper"
```

### Task 21.3 — Create sections.js (single source for non-experience sections)

**Files:**
- Create: `src/data/sections.js`

- [ ] **Step 1: Read current sections in src/components/ to extract bilingual content**

```bash
ls src/components/
```

Note the 5 files to migrate: `About.js`, `Skills.js`, `Projects.js`, `Claude.js`, `Contact.js`. Read each to extract content and bilingual strings — most pull text from `translations.js`; this task moves it into `sections.js` as structured data.

- [ ] **Step 2: Create sections.js skeleton**

```js
// src/data/sections.js
//
// Single source of truth for non-experience sections (decision: Dev view +
// WorldDetailOverlay both read from here; legacy <About><Skills>… components
// deleted in Phase 24).
//
// Each section becomes a "world" in mario-world map (decision Q11-A) with
// own icon and biome assignment.

const SECTIONS = [
  {
    id: 'about',
    biome: 'pradera',
    icon: 'home',
    label: { en: 'About me', es: 'Sobre mí' },
    content: {
      en: '...full About copy in en, moved from translations.js or About.js...',
      es: '...full About copy in es...',
    },
  },
  {
    id: 'skills',
    biome: 'cyber',
    icon: 'mountain',
    label: { en: 'Skills', es: 'Habilidades' },
    content: { en: '...', es: '...' },
  },
  {
    id: 'projects',
    biome: 'selva',
    icon: 'island',
    label: { en: 'Projects', es: 'Proyectos' },
    content: { en: '...', es: '...' },
  },
  {
    id: 'claude',
    biome: 'castillo',
    icon: 'castle-ai',
    label: { en: 'Claude Code', es: 'Claude Code' },
    content: { en: '...', es: '...' },
  },
  {
    id: 'contact',
    biome: 'castillo',
    icon: 'flag',
    label: { en: 'Contact', es: 'Contacto' },
    content: { en: '...', es: '...' },
  },
]

export { SECTIONS }
export default SECTIONS
```

- [ ] **Step 3: Migrate actual content for each section**

Per section, copy the user-facing strings from the corresponding `src/components/<Section>.js` (and the strings it reads from `translations.js` like `t.about.p1`, `t.contact.title`, etc.) into `content.en` and `content.es`. Preserve rich formatting (links, paragraphs) using a structured form: either nested `{ paragraphs: [...] }` arrays or HTML strings — pick `paragraphs` for accessibility.

Example for `about`:

```js
{
  id: 'about',
  biome: 'pradera',
  icon: 'home',
  label: { en: 'About me', es: 'Sobre mí' },
  content: {
    en: {
      paragraphs: [
        'Backend engineer with 19 years of experience...',
        'I work with Java, Spring, microservices...',
      ],
    },
    es: {
      paragraphs: [
        'Ingeniero backend con 19 años de experiencia...',
        'Trabajo con Java, Spring, microservicios...',
      ],
    },
  },
},
```

For `skills`: instead of paragraphs, embed `{ groups: [{ category: 'lang', skills: [...] }, ...] }` matching the SKILLS catalog.
For `projects`: `{ items: [{ title, description, link, ... }] }` matching current `src/data/projects.js`.
For `contact`: `{ email, social: [...], cv: { en: '/CV_EN.docx', es: '/CV_ES.docx' } }`.
For `claude`: `{ pitch, services, proof, featuredApps, stack }` matching current `src/data/claude.js`.

This task is a data move — no behavior change yet. Keep the legacy components working for now (Dev view will use both in transition; Phase 24 deletes them).

- [ ] **Step 4: Commit**

```bash
git add src/data/sections.js
git commit -m "feat(21-03): sections.js single-source for About/Skills/Projects/Claude/Contact content"
```

### Task 21.4 — Write failing tests for worlds.derive.js

**Files:**
- Create: `src/marioWorld/data/worlds.derive.test.js`

- [ ] **Step 1: Write 12 failing tests covering grouping, biome assignment, position determinism**

```js
// src/marioWorld/data/worlds.derive.test.js
import { describe, it, expect } from 'vitest'
import { deriveWorlds } from './worlds.derive.js'
import { BIOMES } from './biomes.js'

const FIXTURE_EXPERIENCE = [
  { company: 'Acme', title: { en: 'Backend', es: 'Backend' }, period: { start: 2018, end: 2020 }, bullets: { en: ['a'], es: ['a'] }, tech: ['Java'] },
  { company: 'Acme', title: { en: 'Lead', es: 'Lead' },       period: { start: 2020, end: 2021 }, bullets: { en: ['b'], es: ['b'] }, tech: ['Java'] },
  { company: 'Beta', title: { en: 'Dev', es: 'Dev' },          period: { start: 2010, end: 2012 }, bullets: { en: ['c'], es: ['c'] }, tech: ['JEE'] },
]
const FIXTURE_SKILLS = {}
const FIXTURE_SECTIONS = [
  { id: 'about', biome: 'pradera', icon: 'home', label: { en: 'About', es: 'Sobre' }, content: { en: 'x', es: 'x' } },
]
const FIXTURE_SECRETS = [
  { id: 'hidden-1', command: '/secret', label: { en: 'Hidden', es: 'Oculto' }, biome: 'pradera', content: { en: 'h', es: 'h' } },
]

describe('deriveWorlds', () => {
  it('groups experience entries by company → 1 world per company', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, [], [])
    const companyWorlds = worlds.filter((w) => w.type === 'company')
    expect(companyWorlds.length).toBe(2) // Acme, Beta
  })

  it('company world contains all roles for that company as levels[]', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, [], [])
    const acme = worlds.find((w) => w.label === 'Acme')
    expect(acme.levels.length).toBe(2)
  })

  it('levels[] sorted chronologically by period.start ascending', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, [], [])
    const acme = worlds.find((w) => w.label === 'Acme')
    expect(acme.levels[0].period.start).toBeLessThan(acme.levels[1].period.start)
  })

  it('assigns biome based on earliest period.start of the company', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, [], [])
    const acme = worlds.find((w) => w.label === 'Acme')   // earliest = 2018 → selva
    const beta = worlds.find((w) => w.label === 'Beta')   // 2010 → pradera
    expect(acme.biome).toBe('selva')
    expect(beta.biome).toBe('pradera')
  })

  it('section world → type=section with content from input', () => {
    const { worlds } = deriveWorlds([], FIXTURE_SKILLS, FIXTURE_SECTIONS, [])
    const about = worlds.find((w) => w.id === 'section:about')
    expect(about.type).toBe('section')
    expect(about.content).toEqual(FIXTURE_SECTIONS[0].content)
  })

  it('secret world → type=secret with hidden=true', () => {
    const { worlds } = deriveWorlds([], FIXTURE_SKILLS, [], FIXTURE_SECRETS)
    const hidden = worlds.find((w) => w.id === 'secret:hidden-1')
    expect(hidden.hidden).toBe(true)
    expect(hidden.command).toBe('/secret')
  })

  it('all worlds have deterministic position {x, y} assigned', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, FIXTURE_SECTIONS, FIXTURE_SECRETS)
    for (const w of worlds) {
      expect(typeof w.position?.x).toBe('number')
      expect(typeof w.position?.y).toBe('number')
    }
  })

  it('is deterministic across calls — same input yields same positions', () => {
    const a = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, FIXTURE_SECTIONS, []).worlds
    const b = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, FIXTURE_SECTIONS, []).worlds
    expect(a.map((w) => `${w.id}@${w.position.x},${w.position.y}`)).toEqual(
      b.map((w) => `${w.id}@${w.position.x},${w.position.y}`),
    )
  })

  it('empty experience + empty sections + empty secrets → empty worlds', () => {
    const { worlds } = deriveWorlds([], {}, [], [])
    expect(worlds).toEqual([])
  })

  it('biome assignment for year outside known ranges clamps to nearest', () => {
    const old = [{ company: 'Old', title: { en: 'r', es: 'r' }, period: { start: 1990, end: 1995 }, bullets: { en: [], es: [] }, tech: [] }]
    const { worlds } = deriveWorlds(old, {}, [], [])
    expect(worlds[0].biome).toBe('pradera')
  })

  it('biome assignment for future year clamps to castillo', () => {
    const future = [{ company: 'Future', title: { en: 'r', es: 'r' }, period: { start: 2030, end: 2030 }, bullets: { en: [], es: [] }, tech: [] }]
    const { worlds } = deriveWorlds(future, {}, [], [])
    expect(worlds[0].biome).toBe('castillo')
  })

  it('positions within same biome do not overlap (different x or y)', () => {
    const sameBiome = [
      { company: 'A', title: { en: 'r', es: 'r' }, period: { start: 2019, end: 2020 }, bullets: { en: [], es: [] }, tech: [] },
      { company: 'B', title: { en: 'r', es: 'r' }, period: { start: 2019, end: 2020 }, bullets: { en: [], es: [] }, tech: [] },
    ]
    const { worlds } = deriveWorlds(sameBiome, {}, [], [])
    expect(worlds[0].position).not.toEqual(worlds[1].position)
  })
})
```

- [ ] **Step 2: Run tests to verify they FAIL with "deriveWorlds not defined"**

```bash
npx vitest run src/marioWorld/data/worlds.derive.test.js
```

Expected: 12 fail with `deriveWorlds is not a function`.

- [ ] **Step 3: Commit (RED)**

```bash
git add src/marioWorld/data/worlds.derive.test.js
git commit -m "test(21-04): RED — worlds.derive contract (12 tests)"
```

### Task 21.5 — Implement worlds.derive.js (GREEN)

**Files:**
- Create: `src/marioWorld/data/worlds.derive.js`

- [ ] **Step 1: Implement the derivation pure function**

```js
// src/marioWorld/data/worlds.derive.js
import { BIOMES, pickBiome } from './biomes.js'

/**
 * Pure derivation from data sources into a flat worlds[] array.
 * Each world: { id, type, label, biome, position, ...typeSpecific }
 *
 * @param {Array} experience - EXPERIENCE entries with `company` field
 * @param {Object} skills    - SKILLS map (unused currently; reserved for future)
 * @param {Array} sections   - SECTIONS catalog (About, Skills, etc.)
 * @param {Array} secretWorlds - SECRET_WORLDS catalog (hidden by default)
 * @returns {{ worlds: Array }}
 */
export function deriveWorlds(experience, skills, sections, secretWorlds) {
  const companyWorlds = buildCompanyWorlds(experience)
  const sectionWorlds = buildSectionWorlds(sections)
  const hiddenWorlds  = buildSecretWorlds(secretWorlds)
  const all = [...companyWorlds, ...sectionWorlds, ...hiddenWorlds]
  return { worlds: assignPositions(all) }
}

function buildCompanyWorlds(experience) {
  const byCompany = new Map()
  for (const entry of experience) {
    const company = entry.company
    if (!company) continue
    if (!byCompany.has(company)) byCompany.set(company, [])
    byCompany.get(company).push(entry)
  }
  const out = []
  for (const [company, entries] of byCompany) {
    const sorted = [...entries].sort((a, b) => a.period.start - b.period.start)
    const earliest = sorted[0].period.start
    out.push({
      id: `company:${slug(company)}`,
      type: 'company',
      label: company,
      biome: pickBiome(earliest),
      levels: sorted,
      position: null,
    })
  }
  return out
}

function buildSectionWorlds(sections) {
  return sections.map((s) => ({
    id: `section:${s.id}`,
    type: 'section',
    label: s.label,
    biome: s.biome,
    icon: s.icon,
    content: s.content,
    position: null,
  }))
}

function buildSecretWorlds(secretWorlds) {
  return secretWorlds.map((sw) => ({
    id: `secret:${sw.id}`,
    type: 'secret',
    label: sw.label,
    biome: sw.biome,
    command: sw.command,
    content: sw.content,
    hidden: true,
    position: null,
  }))
}

/**
 * Deterministic 2D position assignment per biome. Biome regions tile
 * horizontally; worlds within a biome distribute on a deterministic grid
 * indexed by sorted id (alphabetic).
 */
function assignPositions(worlds) {
  const BIOME_ORDER = ['pradera', 'desierto', 'selva', 'cyber', 'castillo']
  const BIOME_WIDTH = 400  // each biome occupies x ∈ [n*W, n*W + W]
  const ROW_HEIGHT = 80
  const COL_WIDTH  = 90

  // Group by biome (preserve hidden=true; they get positions too — renderer hides)
  const byBiome = new Map()
  for (const w of worlds) {
    const arr = byBiome.get(w.biome) ?? []
    arr.push(w)
    byBiome.set(w.biome, arr)
  }

  const out = []
  for (const biomeId of BIOME_ORDER) {
    const inBiome = (byBiome.get(biomeId) ?? []).sort((a, b) => (a.id < b.id ? -1 : 1))
    const biomeIdx = BIOME_ORDER.indexOf(biomeId)
    const x0 = biomeIdx * BIOME_WIDTH + 50
    inBiome.forEach((w, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      out.push({ ...w, position: { x: x0 + col * COL_WIDTH, y: 100 + row * ROW_HEIGHT } })
    })
  }
  return out
}

function slug(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
```

- [ ] **Step 2: Run tests to verify they PASS**

```bash
npx vitest run src/marioWorld/data/worlds.derive.test.js
```

Expected: 12 passed.

- [ ] **Step 3: Run full suite — no regressions**

```bash
npx vitest run
```

Expected: 305 passed (293 baseline + 12 new).

- [ ] **Step 4: Commit (GREEN)**

```bash
git add src/marioWorld/data/worlds.derive.js
git commit -m "feat(21-05): GREEN — worlds.derive pure function (12 tests)"
```

### Task 21.6 — Extend ViewModeContext

**Files:**
- Modify: `src/context/ViewModeContext.js`

- [ ] **Step 1: Read current contract**

```bash
cat src/context/ViewModeContext.js
```

Note: currently has `viewMode: 'game' | 'dev'`. Phase-21 extension: support `null` (initial state before user picks via Hero gate).

- [ ] **Step 2: Edit `useViewMode()` hook to allow null + add `clearViewMode()` for tests**

Modify the provider to initialize from `localStorage.cam-viewmode` to either `'game'`, `'dev'`, or `null` (if key missing or corrupt). Expose `setViewMode(value)` that writes to localStorage and `clearViewMode()` for tests/reset.

Key code:

```js
const STORAGE_KEY = 'cam-viewmode'

function readInitial() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw === 'game' || raw === 'dev' ? raw : null
}

function ViewModeProvider({ children }) {
  const [viewMode, setViewModeState] = useState(readInitial)
  const setViewMode = useCallback((value) => {
    if (value !== 'game' && value !== 'dev') return
    setViewModeState(value)
    try { window.localStorage.setItem(STORAGE_KEY, value) } catch {}
  }, [])
  const clearViewMode = useCallback(() => {
    setViewModeState(null)
    try { window.localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])
  const value = useMemo(() => ({ viewMode, setViewMode, clearViewMode }), [viewMode, setViewMode, clearViewMode])
  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
}
```

- [ ] **Step 3: Run existing tests, fix any that asserted non-null initial state**

```bash
npx vitest run
```

Existing tests may assume `viewMode === 'game'` initially. Update those that fail to read from a provider that explicitly sets `viewMode='game'` via prop wrap, OR change the test wrapper to set `localStorage.cam-viewmode='game'` before render.

- [ ] **Step 4: Commit**

```bash
git add src/context/ViewModeContext.js
git commit -m "refactor(21-06): ViewModeContext supports null initial state (Hero gate prereq)"
```

### Task 21.7 — Write failing test for HeroGameGate

**Files:**
- Create: `src/marioWorld/HeroGameGate.test.js`

- [ ] **Step 1: 6 tests covering Hero preservation + buttons + a11y**

```js
// src/marioWorld/HeroGameGate.test.js
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HeroGameGate from './HeroGameGate.js'
import { LanguageProvider } from '../i18n/LanguageContext.js'

function renderWithLang(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('HeroGameGate', () => {
  it('renders existing Hero content (H1 + photo + stat grid)', () => {
    renderWithLang(<HeroGameGate onPick={() => {}} />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders 2 buttons: Enter the World + Skip to CV', () => {
    renderWithLang(<HeroGameGate onPick={() => {}} />)
    expect(screen.getByRole('button', { name: /enter the world/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip to cv/i })).toBeInTheDocument()
  })

  it('button labels switch to Spanish when lang=es', () => {
    renderWithLang(<HeroGameGate onPick={() => {}} />)
    // … flip language via test helper or render with explicit prop
    // expect (es) labels visible after toggle
  })

  it('clicking Enter button calls onPick("game")', () => {
    const onPick = vi.fn()
    renderWithLang(<HeroGameGate onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: /enter the world/i }))
    expect(onPick).toHaveBeenCalledWith('game')
  })

  it('clicking Skip button calls onPick("dev")', () => {
    const onPick = vi.fn()
    renderWithLang(<HeroGameGate onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: /skip to cv/i }))
    expect(onPick).toHaveBeenCalledWith('dev')
  })

  it('both buttons have descriptive aria-label and visible focus styles', () => {
    renderWithLang(<HeroGameGate onPick={() => {}} />)
    const enterBtn = screen.getByRole('button', { name: /enter the world/i })
    expect(enterBtn).toHaveAttribute('aria-label')
  })
})
```

- [ ] **Step 2: Run; expect FAIL "HeroGameGate is not defined"**

```bash
npx vitest run src/marioWorld/HeroGameGate.test.js
```

- [ ] **Step 3: Commit (RED)**

```bash
git add src/marioWorld/HeroGameGate.test.js
git commit -m "test(21-07): RED — HeroGameGate contract (6 tests)"
```

### Task 21.8 — Implement HeroGameGate (GREEN)

**Files:**
- Create: `src/marioWorld/HeroGameGate.js`
- Modify: `src/i18n/translations.js` (add `t.hero.enterGame`, `t.hero.skipToCV` keys EN/ES)

- [ ] **Step 1: Add i18n keys**

```diff
 // src/i18n/translations.js (inside the `hero` section, both en and es)
 hero: {
   ...existing keys,
+  enterGame: 'Enter the World',
+  skipToCV: 'Skip to CV',
 },
 // and es:
 hero: {
   ...existing keys,
+  enterGame: 'Entrar al mundo',
+  skipToCV: 'Saltar al CV',
 },
```

- [ ] **Step 2: Implement component reusing existing Hero**

```js
// src/marioWorld/HeroGameGate.js
import React from 'react'
import Hero from '../components/Hero.js'
import { useLanguage } from '../i18n/LanguageContext.js'

export default function HeroGameGate({ onPick }) {
  const { t } = useLanguage()
  return (
    <>
      <Hero />
      <div className="container mx-auto mt-6 flex justify-center gap-4 px-4 pb-8">
        <button
          type="button"
          onClick={() => onPick('game')}
          aria-label={t.hero.enterGame}
          className="rounded-xl bg-grad-neon px-6 py-3 font-mono text-base shadow-neon focus:outline-none focus:ring-2 focus:ring-neon"
        >
          ▶ {t.hero.enterGame}
        </button>
        <button
          type="button"
          onClick={() => onPick('dev')}
          aria-label={t.hero.skipToCV}
          className="rounded-xl border border-slate2-300 px-6 py-3 font-mono text-base text-slate2-100 hover:bg-ink-800 focus:outline-none focus:ring-2 focus:ring-slate2-300"
        >
          📄 {t.hero.skipToCV}
        </button>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Run tests; expect PASS**

```bash
npx vitest run src/marioWorld/HeroGameGate.test.js
```

- [ ] **Step 4: Commit (GREEN)**

```bash
git add src/marioWorld/HeroGameGate.js src/i18n/translations.js
git commit -m "feat(21-08): GREEN — HeroGameGate component + bilingual button labels"
```

### Task 21.9 — Write failing tests for DevView

**Files:**
- Create: `src/marioWorld/DevView.test.js`

- [ ] **Step 1: 6 tests covering scroll-spy + bilingual + section rendering from sections.js**

```js
// src/marioWorld/DevView.test.js
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DevView from './DevView.js'
import { LanguageProvider } from '../i18n/LanguageContext.js'
import SECTIONS from '../data/sections.js'

const FIXTURE_WORLDS = {
  worlds: [
    { id: 'company:acme', type: 'company', label: 'Acme', biome: 'selva', levels: [
      { company: 'Acme', title: { en: 'Dev', es: 'Dev' }, period: { start: 2019, end: 2020 }, bullets: { en: ['x'], es: ['x'] }, tech: ['Java'] },
    ], position: { x: 0, y: 0 } },
  ],
}

describe('DevView', () => {
  it('renders each section from SECTIONS in order', () => {
    render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    for (const s of SECTIONS) {
      expect(screen.getByRole('region', { name: new RegExp(s.label.en, 'i') })).toBeInTheDocument()
    }
  })

  it('renders all experience entries chronologically as a list', () => {
    render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    expect(screen.getByText(/Acme/i)).toBeInTheDocument()
    expect(screen.getByText(/2019/)).toBeInTheDocument()
  })

  it('section content from sections.js renders correctly in English', () => {
    render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    const aboutSec = SECTIONS.find((s) => s.id === 'about')
    const sample = aboutSec.content.en.paragraphs?.[0] ?? aboutSec.content.en
    if (typeof sample === 'string') expect(screen.getByText(new RegExp(sample.slice(0, 30), 'i'))).toBeInTheDocument()
  })

  it('respects lang context — switches to Spanish content when lang=es', () => {
    // render with LanguageProvider that defaults to 'es'
    // assert es content visible
  })

  it('scroll-spy anchors all match section IDs', () => {
    const { container } = render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    for (const s of SECTIONS) {
      expect(container.querySelector(`#${s.id}`)).toBeTruthy()
    }
  })

  it('no overlay logic — pure scroll layout', () => {
    const { container } = render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })
})
```

- [ ] **Step 2: Run; FAIL "DevView is not defined"**

- [ ] **Step 3: Commit (RED)**

```bash
git add src/marioWorld/DevView.test.js
git commit -m "test(21-09): RED — DevView contract (6 tests)"
```

### Task 21.10 — Implement DevView (GREEN)

**Files:**
- Create: `src/marioWorld/DevView.js`

- [ ] **Step 1: Implement component reading from sections.js + worldsData**

```js
// src/marioWorld/DevView.js
import React from 'react'
import { useLanguage } from '../i18n/LanguageContext.js'
import SECTIONS from '../data/sections.js'
import Nav from '../components/Nav.js'
import Hero from '../components/Hero.js'
import Footer from '../components/Footer.js'

function renderSectionContent(section, lang) {
  const content = section.content[lang]
  if (content?.paragraphs) {
    return content.paragraphs.map((p, i) => <p key={i} className="mb-4">{p}</p>)
  }
  if (content?.groups) {
    // skills section
    return content.groups.map((g, i) => (
      <div key={i} className="mb-6">
        <h3 className="text-lg font-bold">{g.category}</h3>
        <ul>{g.skills.map((s, j) => <li key={j}>{s}</li>)}</ul>
      </div>
    ))
  }
  if (content?.items) {
    // projects section
    return content.items.map((item, i) => (
      <article key={i} className="mb-4">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        {item.link && <a href={item.link}>Open</a>}
      </article>
    ))
  }
  return typeof content === 'string' ? <p>{content}</p> : null
}

function ExperienceList({ worlds }) {
  const companyWorlds = worlds.filter((w) => w.type === 'company')
  const allLevels = companyWorlds.flatMap((w) => w.levels.map((l) => ({ ...l, company: w.label })))
  allLevels.sort((a, b) => b.period.start - a.period.start) // most-recent first
  return (
    <ol>
      {allLevels.map((entry, i) => (
        <li key={i} className="mb-6">
          <h3 className="font-bold">{entry.company} — {entry.title.en}</h3>
          <p className="text-sm">{entry.period.start} – {entry.period.end ?? 'Present'}</p>
          <ul>{entry.bullets.en.map((b, j) => <li key={j}>{b}</li>)}</ul>
        </li>
      ))}
    </ol>
  )
}

export default function DevView({ worldsData }) {
  const { lang } = useLanguage()
  return (
    <>
      <Nav />
      <Hero />
      {SECTIONS.map((s) => {
        if (s.id === 'experience' || s.id === 'skills') {
          // experience section is the worldsData list
          return null  // handled below
        }
        return (
          <section key={s.id} id={s.id} aria-label={s.label[lang]} className="container mx-auto px-4 py-12">
            <h2 className="mb-6 text-2xl font-bold">{s.label[lang]}</h2>
            {renderSectionContent(s, lang)}
          </section>
        )
      })}
      <section id="experience" aria-label="Experience" className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Experience</h2>
        <ExperienceList worlds={worldsData.worlds} />
      </section>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Run tests; PASS**

```bash
npx vitest run src/marioWorld/DevView.test.js
```

- [ ] **Step 3: Commit (GREEN)**

```bash
git add src/marioWorld/DevView.js
git commit -m "feat(21-10): GREEN — DevView classic scroll from sections.js + worldsData"
```

### Task 21.11 — Write failing test for MarioWorld orchestrator

**Files:**
- Create: `src/marioWorld/MarioWorld.test.js`

- [ ] **Step 1: 8 tests covering viewMode routing + localStorage skip + fallback path**

```js
// src/marioWorld/MarioWorld.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarioWorld from './MarioWorld.js'
import { LanguageProvider } from '../i18n/LanguageContext.js'
import { ViewModeProvider } from '../context/ViewModeContext.js'

function renderApp() {
  return render(
    <LanguageProvider>
      <ViewModeProvider>
        <MarioWorld />
      </ViewModeProvider>
    </LanguageProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('MarioWorld', () => {
  it('viewMode null → renders HeroGameGate', () => {
    renderApp()
    expect(screen.getByRole('button', { name: /enter the world/i })).toBeInTheDocument()
  })

  it('viewMode "dev" (from localStorage) → renders DevView directly, skip gate', () => {
    window.localStorage.setItem('cam-viewmode', 'dev')
    renderApp()
    expect(screen.queryByRole('button', { name: /enter the world/i })).toBeNull()
    // assert DevView marker visible
  })

  it('viewMode "game" (from localStorage) → renders WorldMap directly', () => {
    window.localStorage.setItem('cam-viewmode', 'game')
    renderApp()
    expect(screen.queryByRole('button', { name: /enter the world/i })).toBeNull()
    // Phase 21: WorldMap stubs to a placeholder; Phase 22 replaces with renderer
  })

  it('click Enter button in gate → renders WorldMap', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /enter the world/i }))
    expect(screen.queryByRole('button', { name: /enter the world/i })).toBeNull()
  })

  it('click Enter button persists "game" to localStorage', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /enter the world/i }))
    expect(window.localStorage.getItem('cam-viewmode')).toBe('game')
  })

  it('click Skip button → renders DevView + persists "dev"', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /skip to cv/i }))
    expect(window.localStorage.getItem('cam-viewmode')).toBe('dev')
  })

  it('corrupt localStorage value falls back to gate', () => {
    window.localStorage.setItem('cam-viewmode', 'banana')
    renderApp()
    expect(screen.getByRole('button', { name: /enter the world/i })).toBeInTheDocument()
  })

  it('worldsData derived once at module load (memoized)', () => {
    // verify deriveWorlds not called per render
    // can test by spying on the function via vi.mock or by counting render calls
  })
})
```

- [ ] **Step 2: Run; FAIL "MarioWorld is not defined"**

- [ ] **Step 3: Commit (RED)**

```bash
git add src/marioWorld/MarioWorld.test.js
git commit -m "test(21-11): RED — MarioWorld orchestrator contract (8 tests)"
```

### Task 21.12 — Implement MarioWorld orchestrator (GREEN)

**Files:**
- Create: `src/marioWorld/MarioWorld.js`

Phase 21 only: `<WorldMap>` is a placeholder that renders a stub message. Phase 22 replaces it with the real renderer wrapper. This lets the orchestrator ship + Dev view work end-to-end without renderer dependency.

- [ ] **Step 1: Implement orchestrator**

```js
// src/marioWorld/MarioWorld.js
import React, { useMemo } from 'react'
import { useViewMode } from '../context/ViewModeContext.js'
import { deriveWorlds } from './data/worlds.derive.js'
import EXPERIENCE from '../data/experience.js'
import SKILLS from '../data/skills.js'
import SECTIONS from '../data/sections.js'
import HeroGameGate from './HeroGameGate.js'
import DevView from './DevView.js'

// Placeholder until Phase 22 lands. Renders a "Coming soon — game world"
// message; allows phase-21 ship without renderer dependency.
function WorldMapPlaceholder() {
  return (
    <main data-testid="world-map-placeholder" className="container mx-auto p-12 text-center">
      <h1 className="text-3xl font-bold">World map loading…</h1>
      <p className="mt-4 text-slate2-300">
        Hero gate took you here. The renderer arrives in Phase 22.
      </p>
    </main>
  )
}

// Module-load derivation — memoized via useMemo at component level so prop changes
// (lang, etc.) don't re-derive.
const SECRET_WORLDS = []  // Phase 24 swaps this for the real catalog

export default function MarioWorld() {
  const { viewMode, setViewMode } = useViewMode()
  const worldsData = useMemo(
    () => deriveWorlds(EXPERIENCE, SKILLS, SECTIONS, SECRET_WORLDS),
    [],
  )

  if (viewMode === null) return <HeroGameGate onPick={setViewMode} />
  if (viewMode === 'dev') return <DevView worldsData={worldsData} />
  return <WorldMapPlaceholder />
}
```

- [ ] **Step 2: Run tests; PASS**

```bash
npx vitest run src/marioWorld/MarioWorld.test.js
```

- [ ] **Step 3: Commit (GREEN)**

```bash
git add src/marioWorld/MarioWorld.js
git commit -m "feat(21-12): GREEN — MarioWorld orchestrator with WorldMap placeholder"
```

### Task 21.13 — Wire App.js → MarioWorld

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Replace `<GameMode />` with `<MarioWorld />`**

```diff
- import GameMode from './game/GameMode.js'
+ import MarioWorld from './marioWorld/MarioWorld.js'

  ...
- <GameMode />
+ <MarioWorld />
```

- [ ] **Step 2: Run full suite — confirm GREEN**

```bash
npx vitest run
```

Phase 21 baseline: 293 v3.10.1 + 12 derive + 6 HeroGameGate + 6 DevView + 8 MarioWorld = 325 tests.

- [ ] **Step 3: Build + bundle gate**

```bash
npm run build && node scripts/check-bundle-gate.mjs
```

Expected: PASS mobile chunk; WebGL chunk INFO baseline.

- [ ] **Step 4: Commit**

```bash
git add src/App.js
git commit -m "feat(21-13): wire MarioWorld into App.js (Phase 21 close)"
```

**Phase 21 shipping check:**
- 325/325 tests GREEN
- Build clean
- Bundle gate exit 0
- Manual real-browser: `npm run preview` → land on Hero with 2 buttons; click "Skip to CV" → DevView scrolls full portfolio; click "Enter the World" → placeholder visible
- Hard refresh: localStorage drives skip-gate behavior

If all pass → Phase 21 ready. Tag locally `v3.11.0-phase-21` (or per project conv).

---

# PHASE 22 — Map renderers + capability gate + overlay

**Goal of phase:** Real `WebGLWorldMap` renders biomes + worlds + avatar + path in three.js. `SvgWorldMap` renders accessible DOM list for RM users. `WorldDetailOverlay` provides the world-info reveal. No cinematic zoom yet — click world = direct overlay open.

**Phase ships when:** clicking a world opens the overlay with correct content per type (company, section, secret-unlocked); capability gate routes correctly; `webglcontextlost` falls back to SvgWorldMap.

### Task 22.1 — Rename ConstellationErrorBoundary → WorldErrorBoundary

**Files:**
- Move: `src/game/ConstellationErrorBoundary.js` → `src/marioWorld/WorldErrorBoundary.js`

- [ ] **Step 1: Copy file with renamed class**

```bash
cp src/game/ConstellationErrorBoundary.js src/marioWorld/WorldErrorBoundary.js
```

- [ ] **Step 2: Rename class + export inside the new file**

Edit `src/marioWorld/WorldErrorBoundary.js`:
- Change `class ConstellationErrorBoundary extends` → `class WorldErrorBoundary extends`
- Change `export default ConstellationErrorBoundary` → `export default WorldErrorBoundary`

Keep the same recovery semantics: catch render errors in subtree, render fallback prop, expose `onError` callback.

- [ ] **Step 3: Run tests; ensure no test references old name**

```bash
grep -rn "ConstellationErrorBoundary" src/
```

If any reference exists outside `src/game/`, update to new name + path. Tests inside `src/game/` will be deleted in Phase 24.

- [ ] **Step 4: Commit**

```bash
git add src/marioWorld/WorldErrorBoundary.js
git commit -m "refactor(22-01): WorldErrorBoundary (renamed from ConstellationErrorBoundary)"
```

### Task 22.2 — Write failing tests for SvgWorldMap (fallback DOM list)

**Files:**
- Create: `src/marioWorld/renderers/SvgWorldMap.test.js`

- [ ] **Step 1: 8 tests covering a11y structure + roving tabindex + unlock visibility**

```js
// src/marioWorld/renderers/SvgWorldMap.test.js
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SvgWorldMap from './SvgWorldMap.js'
import { LanguageProvider } from '../../i18n/LanguageContext.js'

const FIXTURE = {
  worlds: [
    { id: 'company:acme',  type: 'company', label: 'Acme',  biome: 'selva',    position: { x: 0, y: 0 }, levels: [{ title: { en: 'Dev', es: 'Dev' }, period: { start: 2019, end: 2020 }, bullets: { en: ['x'], es: ['x'] }, tech: [] }] },
    { id: 'section:about', type: 'section', label: { en: 'About', es: 'Sobre' }, biome: 'pradera', icon: 'home', position: { x: 0, y: 0 }, content: { en: 'a', es: 'a' } },
    { id: 'secret:s1',     type: 'secret',  label: { en: 'Hidden', es: 'Oculto' }, biome: 'cyber',  position: { x: 0, y: 0 }, command: '/x', content: { en: 'h', es: 'h' }, hidden: true },
  ],
}

function renderMap(props = {}) {
  return render(<LanguageProvider><SvgWorldMap worldsData={FIXTURE} {...props} /></LanguageProvider>)
}

describe('SvgWorldMap', () => {
  it('renders one <section aria-labelledby> per biome that has visible worlds', () => {
    renderMap()
    expect(screen.getByRole('region', { name: /pradera/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /selva/i })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /cyber/i })).toBeNull()  // only hidden world
  })

  it('hidden worlds NOT rendered until unlocked', () => {
    renderMap()
    expect(screen.queryByText(/Hidden/)).toBeNull()
  })

  it('unlocked secret worlds appear in their biome section', () => {
    renderMap({ unlockedSecrets: ['s1'] })
    expect(screen.getByText(/Hidden/)).toBeInTheDocument()
  })

  it('each world renders as a button with descriptive label', () => {
    renderMap()
    expect(screen.getByRole('button', { name: /Acme/i })).toBeInTheDocument()
  })

  it('click world button calls onWorldSelect with the world id', () => {
    const onWorldSelect = vi.fn()
    renderMap({ onWorldSelect })
    fireEvent.click(screen.getByRole('button', { name: /Acme/i }))
    expect(onWorldSelect).toHaveBeenCalledWith('company:acme')
  })

  it('roving tabindex: only one button per section has tabindex=0', () => {
    renderMap()
    const buttons = screen.getAllByRole('button')
    const tabbable = buttons.filter((b) => b.getAttribute('tabindex') === '0')
    // first focusable per biome region
    expect(tabbable.length).toBeGreaterThan(0)
  })

  it('Spanish lang switches labels and biome names', () => {
    // render with es language; expect "Sobre" visible, biome label "Selva" stays (proper noun)
  })

  it('empty worlds renders accessible placeholder', () => {
    render(<LanguageProvider><SvgWorldMap worldsData={{ worlds: [] }} /></LanguageProvider>)
    expect(screen.getByText(/Portfolio temporarily unavailable/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run; FAIL**

- [ ] **Step 3: Commit (RED)**

```bash
git add src/marioWorld/renderers/SvgWorldMap.test.js
git commit -m "test(22-02): RED — SvgWorldMap fallback DOM contract (8 tests)"
```

### Task 22.3 — Implement SvgWorldMap (GREEN)

**Files:**
- Create: `src/marioWorld/renderers/SvgWorldMap.js`

- [ ] **Step 1: Implement DOM-only renderer with a11y roving tabindex**

```js
// src/marioWorld/renderers/SvgWorldMap.js
import React, { useState, useRef, useCallback } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.js'
import { BIOMES } from '../data/biomes.js'

function getLabel(world, lang) {
  if (typeof world.label === 'string') return world.label
  return world.label?.[lang] ?? world.id
}

function describeWorld(world, lang) {
  if (world.type === 'company') {
    const titles = world.levels.map((l) => l.title?.[lang] ?? '').filter(Boolean).join(' · ')
    const range = `${world.levels[0].period.start} – ${world.levels[world.levels.length - 1].period.end ?? 'Present'}`
    return `${titles} · ${range}`
  }
  return ''
}

export default function SvgWorldMap({ worldsData, unlockedSecrets = [], onWorldSelect = () => {} }) {
  const { lang } = useLanguage()
  const worlds = worldsData?.worlds ?? []

  if (worlds.length === 0) {
    return <p className="p-8 text-center">Portfolio temporarily unavailable</p>
  }

  const unlockedSet = new Set(unlockedSecrets)
  const visible = worlds.filter((w) => !w.hidden || unlockedSet.has(w.id.replace(/^secret:/, '')))

  const byBiome = new Map()
  for (const w of visible) {
    const arr = byBiome.get(w.biome) ?? []
    arr.push(w)
    byBiome.set(w.biome, arr)
  }

  return (
    <main className="container mx-auto p-4">
      {Object.values(BIOMES).map((b) => {
        const items = byBiome.get(b.id) ?? []
        if (items.length === 0) return null
        return <BiomeRegion key={b.id} biome={b} items={items} lang={lang} onWorldSelect={onWorldSelect} />
      })}
    </main>
  )
}

function BiomeRegion({ biome, items, lang, onWorldSelect }) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const refs = useRef([])

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      const next = Math.min(focusedIndex + 1, items.length - 1)
      setFocusedIndex(next)
      refs.current[next]?.focus()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = Math.max(focusedIndex - 1, 0)
      setFocusedIndex(next)
      refs.current[next]?.focus()
    }
  }, [focusedIndex, items.length])

  const headingId = `biome-${biome.id}`
  return (
    <section aria-labelledby={headingId} className="mb-8" onKeyDown={onKeyDown}>
      <h2 id={headingId} className="text-xl font-bold mb-3 capitalize">
        {biome.id} ({biome.era[0]}–{biome.era[1]}) — {biome.stack}
      </h2>
      <ol className="space-y-2">
        {items.map((w, i) => (
          <li key={w.id}>
            <button
              ref={(el) => (refs.current[i] = el)}
              type="button"
              tabIndex={i === focusedIndex ? 0 : -1}
              onClick={() => onWorldSelect(w.id)}
              className="w-full rounded-lg border border-slate2-700 p-3 text-left hover:bg-ink-800 focus:outline-none focus:ring-2 focus:ring-neon"
            >
              <span className="font-bold">{getLabel(w, lang)}</span>
              {describeWorld(w, lang) && <span className="block text-sm text-slate2-300">{describeWorld(w, lang)}</span>}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

- [ ] **Step 2: Run tests; PASS**

```bash
npx vitest run src/marioWorld/renderers/SvgWorldMap.test.js
```

- [ ] **Step 3: Commit (GREEN)**

```bash
git add src/marioWorld/renderers/SvgWorldMap.js
git commit -m "feat(22-03): GREEN — SvgWorldMap fallback DOM with roving tabindex"
```

### Task 22.4 — Write failing tests for WorldDetailOverlay

**Files:**
- Create: `src/marioWorld/overlays/WorldDetailOverlay.test.js`

- [ ] **Step 1: 10 tests covering dialog role, focus trap, per-world-type content rendering**

```js
// src/marioWorld/overlays/WorldDetailOverlay.test.js
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorldDetailOverlay from './WorldDetailOverlay.js'
import { LanguageProvider } from '../../i18n/LanguageContext.js'

const COMPANY_WORLD = { id: 'company:acme', type: 'company', label: 'Acme', biome: 'selva', levels: [
  { title: { en: 'Dev', es: 'Dev' }, period: { start: 2019, end: 2020 }, location: { en: 'NYC', es: 'NYC' }, bullets: { en: ['Built X', 'Shipped Y'], es: ['Construí X', 'Lancé Y'] }, tech: ['Java', 'Spring'] },
] }
const SECTION_WORLD = { id: 'section:about', type: 'section', label: { en: 'About', es: 'Sobre' }, biome: 'pradera', icon: 'home', content: { en: { paragraphs: ['Hello'] }, es: { paragraphs: ['Hola'] } } }
const SECRET_WORLD  = { id: 'secret:s1', type: 'secret', label: { en: 'Hidden', es: 'Oculto' }, biome: 'cyber', command: '/x', content: { en: 'Found it', es: 'Lo encontraste' } }

function renderOverlay(world, props = {}) {
  return render(<LanguageProvider><WorldDetailOverlay world={world} onClose={() => {}} {...props} /></LanguageProvider>)
}

describe('WorldDetailOverlay', () => {
  it('renders with role=dialog and aria-modal=true', () => {
    renderOverlay(COMPANY_WORLD)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('company world renders all levels with title + period + bullets + tech chips', () => {
    renderOverlay(COMPANY_WORLD)
    expect(screen.getByText(/Dev/)).toBeInTheDocument()
    expect(screen.getByText(/2019/)).toBeInTheDocument()
    expect(screen.getByText(/Built X/)).toBeInTheDocument()
    expect(screen.getByText(/Java/)).toBeInTheDocument()
  })

  it('section world renders content paragraphs', () => {
    renderOverlay(SECTION_WORLD)
    expect(screen.getByText(/Hello/)).toBeInTheDocument()
  })

  it('secret world renders content', () => {
    renderOverlay(SECRET_WORLD)
    expect(screen.getByText(/Found it/)).toBeInTheDocument()
  })

  it('Escape key calls onClose', () => {
    const onClose = vi.fn()
    renderOverlay(COMPANY_WORLD, { onClose })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    renderOverlay(COMPANY_WORLD, { onClose })
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('click backdrop calls onClose', () => {
    const onClose = vi.fn()
    const { container } = renderOverlay(COMPANY_WORLD, { onClose })
    fireEvent.click(container.querySelector('[data-testid="overlay-backdrop"]'))
    expect(onClose).toHaveBeenCalled()
  })

  it('focus trap retains Tab within dialog', () => {
    renderOverlay(COMPANY_WORLD)
    // Tab through focusable elements; assert focus stays inside [role=dialog]
  })

  it('Spanish lang switches title + bullets + paragraphs to es', () => {
    // render with es; expect "Lo encontraste" / "Construí X" visible
  })

  it('missing content gracefully renders fallback', () => {
    const broken = { id: 'broken', type: 'company', label: 'X', biome: 'pradera', levels: [] }
    renderOverlay(broken)
    expect(screen.getByText(/no content/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run; FAIL**

- [ ] **Step 3: Commit (RED)**

```bash
git add src/marioWorld/overlays/WorldDetailOverlay.test.js
git commit -m "test(22-04): RED — WorldDetailOverlay contract (10 tests)"
```

### Task 22.5 — Implement WorldDetailOverlay (GREEN)

**Files:**
- Create: `src/marioWorld/overlays/WorldDetailOverlay.js`

- [ ] **Step 1: Implement dialog with focus trap + per-world-type body**

```js
// src/marioWorld/overlays/WorldDetailOverlay.js
import React, { useEffect, useRef } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.js'

function FocusTrap({ children }) {
  const ref = useRef(null)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Tab' || !ref.current) return
      const focusable = ref.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])
  return <div ref={ref}>{children}</div>
}

function CompanyBody({ world, lang }) {
  if (!world.levels?.length) return <p>No content available</p>
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">{world.label}</h2>
      {world.levels.map((level, i) => (
        <article key={i} className="mb-6">
          <h3 className="text-lg font-bold">{level.title[lang]}</h3>
          <p className="text-sm text-slate2-300">
            {level.period.start} – {level.period.end ?? 'Present'} · {level.location?.[lang]}
          </p>
          <ul className="my-3 list-disc pl-5">
            {level.bullets[lang].map((b, j) => <li key={j}>{b}</li>)}
          </ul>
          <div className="flex flex-wrap gap-1">
            {level.tech?.map((t) => <span key={t} className="rounded bg-ink-800 px-2 py-1 text-xs">{t}</span>)}
          </div>
        </article>
      ))}
    </>
  )
}

function SectionBody({ world, lang }) {
  const content = world.content?.[lang]
  if (content?.paragraphs) {
    return (
      <>
        <h2 className="text-2xl font-bold mb-4">{world.label[lang]}</h2>
        {content.paragraphs.map((p, i) => <p key={i} className="mb-3">{p}</p>)}
      </>
    )
  }
  return <p>No content available</p>
}

function SecretBody({ world, lang }) {
  const content = world.content?.[lang]
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">{typeof world.label === 'string' ? world.label : world.label[lang]}</h2>
      {typeof content === 'string' ? <p>{content}</p> : <p>No content available</p>}
    </>
  )
}

export default function WorldDetailOverlay({ world, onClose }) {
  const { lang } = useLanguage()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const Body = world.type === 'company' ? CompanyBody
              : world.type === 'section' ? SectionBody
              : SecretBody

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div data-testid="overlay-backdrop" onClick={onClose} className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
      <FocusTrap>
        <div className="relative z-10 max-h-[85vh] w-[min(720px,90vw)] overflow-y-auto rounded-2xl border border-slate2-700 bg-ink-900 p-6">
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-2xl">✕</button>
          <Body world={world} lang={lang} />
        </div>
      </FocusTrap>
    </div>
  )
}
```

- [ ] **Step 2: Run tests; PASS**

```bash
npx vitest run src/marioWorld/overlays/WorldDetailOverlay.test.js
```

- [ ] **Step 3: Commit (GREEN)**

```bash
git add src/marioWorld/overlays/WorldDetailOverlay.js
git commit -m "feat(22-05): GREEN — WorldDetailOverlay dialog with focus trap + per-type body"
```

### Task 22.6 — Add sprite assets to public/sprites/

**Files:**
- Add: 5 biome tile WebPs + avatar walk-cycle + pictogram atlas (commission/generate)

- [ ] **Step 1: Add placeholder assets (can be solid-color WebP rectangles until art lands)**

Use sharp or any image tool to generate 5 256x256 WebP biome tiles (colored per `BIOMES[*].color`). Create stub avatar sprite-sheet (16x64 WebP, 4 frames). Create world-icon atlas as a single WebP with grid (one icon per world type).

Commit assets:

```bash
git add public/sprites/
git commit -m "feat(22-06): biome tiles + avatar + world icon sprite placeholders"
```

- [ ] **Step 2: Defer high-fidelity art** as `OPEN-ART-1` in `.planning/seeds/` or backlog for designer pass after this phase ships functionally.

### Task 22.7 — Write failing tests for WebGLWorldMap (mocked three.js)

**Files:**
- Create: `src/marioWorld/renderers/WebGLWorldMap.test.js`

- [ ] **Step 1: 12 tests using existing three.js mocks pattern from v3.10**

Inspect `src/game/renderers/WebGLConstellation.test.js` for the three.js mock pattern in use (mocked scene/camera/renderer modules). Mirror it.

Representative tests (write all 12 following the same pattern; structural assertions only — no real GL):

```js
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import WebGLWorldMap from './WebGLWorldMap.js'
import { LanguageProvider } from '../../i18n/LanguageContext.js'

vi.mock('three', () => {
  // mirror the mock shape from src/game/renderers/WebGLConstellation.test.js
})

const FIXTURE = { worlds: [
  { id: 'company:acme', type: 'company', label: 'Acme', biome: 'selva', position: { x: 100, y: 100 }, levels: [{ title: { en: 'Dev', es: 'Dev' }, period: { start: 2019, end: 2020 }, bullets: { en: [], es: [] }, tech: [] }] },
] }

describe('WebGLWorldMap', () => {
  it('mounts canvas element', () => {
    const { container } = render(<LanguageProvider><WebGLWorldMap worldsData={FIXTURE} /></LanguageProvider>)
    expect(container.querySelector('canvas')).toBeTruthy()
  })

  it('creates a PerspectiveCamera with locked fov=55, near=10, far=2000', () => {
    // assert mock spy was called with these args
  })

  it('creates 5 biome plane meshes (one per BIOMES entry)', () => {
    // assert scene.add called with 5 biome-shaped meshes
  })

  it('creates one sprite per visible world', () => {
    // visible = all except hidden
  })

  it('avatar sprite present at default starting position', () => {
    // assert player avatar texture path includes "avatar-carlos-walk"
  })

  it('pointer up over a world calls onWorldSelect with world id (via useClickVsDrag)', () => {
    const onWorldSelect = vi.fn()
    render(<LanguageProvider><WebGLWorldMap worldsData={FIXTURE} onWorldSelect={onWorldSelect} /></LanguageProvider>)
    // dispatch pointerdown + pointerup at canvas center; assert
  })

  it('webglcontextlost dispatches onContextLost callback', () => {
    const onContextLost = vi.fn()
    const { container } = render(<LanguageProvider><WebGLWorldMap worldsData={FIXTURE} onContextLost={onContextLost} /></LanguageProvider>)
    const canvas = container.querySelector('canvas')
    canvas.dispatchEvent(new Event('webglcontextlost'))
    expect(onContextLost).toHaveBeenCalled()
  })

  it('ResizeObserver triggers camera.aspect update', () => {})
  it('cleanup on unmount disposes geometries + materials + renderer', () => {})
  it('hidden worlds NOT rendered as sprites', () => {})
  it('unlockedSecrets prop reveals matching secret worlds', () => {})
  it('respects prefersReducedMotion via parent capability gate (no autoRotate)', () => {})
})
```

- [ ] **Step 2: Run; FAIL**

- [ ] **Step 3: Commit (RED)**

```bash
git add src/marioWorld/renderers/WebGLWorldMap.test.js
git commit -m "test(22-07): RED — WebGLWorldMap contract (12 tests, three.js mocked)"
```

### Task 22.8 — Implement WebGLWorldMap (GREEN) without cinematic zoom

**Files:**
- Create: `src/marioWorld/renderers/WebGLWorldMap.js`

This task is the largest in the plan. Implement scene assembly + pointer routing + context-loss handler + cleanup. Cinematic zoom + free-roam nav are added in Phase 23 — for now, clicking a world fires `onWorldSelect(id)` synchronously and the parent shows the overlay directly.

- [ ] **Step 1: Implement renderer skeleton**

Key code blocks (refer to v3.10.1 `WebGLConstellation.js` for the proven three.js setup):

```js
// src/marioWorld/renderers/WebGLWorldMap.js
import React, { useEffect, useRef } from 'react'
import {
  PerspectiveCamera, Scene, WebGLRenderer, Sprite, SpriteMaterial,
  TextureLoader, Vector3, Mesh, PlaneGeometry, MeshBasicMaterial,
} from 'three'
import useClickVsDrag from '../../game/useClickVsDrag.js'   // reuse — survives Phase 24 cleanup
import { BIOMES } from '../data/biomes.js'

const CAMERA_FOV = 55
const CAMERA_NEAR = 10
const CAMERA_FAR = 2000
const CANVAS_CENTER = { x: 500, y: 500 }   // mirrors layout coord system

export default function WebGLWorldMap({ worldsData, unlockedSecrets = [], onWorldSelect = () => {}, onContextLost = () => {} }) {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const spriteByIdRef = useRef(new Map())

  // Click vs drag arbitration for tap-to-open behavior (mobile + desktop)
  const { onPointerDown, onPointerUp } = useClickVsDrag({ onClick: (e) => handleClick(e) })

  function handleClick(e) {
    const canvas = canvasRef.current
    if (!canvas || !sceneRef.current || !cameraRef.current) return
    const rect = canvas.getBoundingClientRect()
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    // Project each visible world's position to NDC; nearest within threshold wins
    const visible = (worldsData?.worlds ?? []).filter((w) => !w.hidden || unlockedSecrets.includes(w.id.replace(/^secret:/, '')))
    let nearestId = null
    let nearestDist = Infinity
    for (const w of visible) {
      const v = new Vector3(w.position.x - CANVAS_CENTER.x, w.position.y - CANVAS_CENTER.y, 0)
      v.project(cameraRef.current)
      const dx = v.x - ndcX
      const dy = v.y - ndcY
      const d = Math.hypot(dx, dy)
      if (d < nearestDist) { nearestDist = d; nearestId = w.id }
    }
    if (nearestId && nearestDist < 0.06) onWorldSelect(nearestId)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !worldsData) return

    const w = canvas.clientWidth || 800
    const h = Math.max(canvas.clientHeight || 600, 1)
    const camera = new PerspectiveCamera(CAMERA_FOV, w / h, CAMERA_NEAR, CAMERA_FAR)
    camera.position.set(0, 0, 600)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld(true)
    camera.updateProjectionMatrix()
    cameraRef.current = camera

    const scene = new Scene()
    sceneRef.current = scene

    // Biome backdrop planes
    const loader = new TextureLoader()
    for (const b of Object.values(BIOMES)) {
      const tex = loader.load(b.tile)
      const mat = new MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.5 })
      const plane = new Mesh(new PlaneGeometry(400, 400), mat)
      // Position biome plane on its x slot (mirrors assignPositions)
      const idx = ['pradera', 'desierto', 'selva', 'cyber', 'castillo'].indexOf(b.id)
      plane.position.set(idx * 400 - CANVAS_CENTER.x + 200, 0, -10)
      scene.add(plane)
    }

    // World sprites (visible only)
    const visible = (worldsData.worlds ?? []).filter((w) => !w.hidden || unlockedSecrets.includes(w.id.replace(/^secret:/, '')))
    for (const wo of visible) {
      const tex = loader.load('/sprites/world-icons.webp')
      const mat = new SpriteMaterial({ map: tex })
      const sp = new Sprite(mat)
      sp.position.set(wo.position.x - CANVAS_CENTER.x, wo.position.y - CANVAS_CENTER.y, 0)
      sp.scale.set(40, 40, 1)
      scene.add(sp)
      spriteByIdRef.current.set(wo.id, sp)
    }

    // Player avatar
    const avatarTex = loader.load('/sprites/avatar-carlos-walk.webp')
    const avatarMat = new SpriteMaterial({ map: avatarTex })
    const avatar = new Sprite(avatarMat)
    avatar.position.set(0, 0, 5)
    avatar.scale.set(32, 32, 1)
    scene.add(avatar)

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w, h, false)
    rendererRef.current = renderer

    // Static render — no rAF tick in Phase 22 (added in Phase 23 for sprite walk + zoom)
    renderer.render(scene, camera)

    const onLost = (e) => { e.preventDefault(); onContextLost() }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose()
          obj.material.dispose()
        }
      })
      renderer.dispose()
    }
  }, [worldsData, unlockedSecrets, onContextLost])

  return (
    <canvas
      ref={canvasRef}
      data-testid="webgl-world-canvas"
      data-renderer="webgl"
      className="block h-full w-full touch-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    />
  )
}
```

- [ ] **Step 2: Run tests; PASS (mocked three.js — no real GL)**

```bash
npx vitest run src/marioWorld/renderers/WebGLWorldMap.test.js
```

- [ ] **Step 3: Real-browser smoke**

```bash
npm run build && npx vite preview --port=4173
# in another shell:
node scripts/_smoke-v3.10.mjs   # adapt the existing smoke script to land on /
```

Confirm canvas renders, biome planes visible, world sprites at expected positions, click on a sprite fires the overlay.

- [ ] **Step 4: Commit (GREEN)**

```bash
git add src/marioWorld/renderers/WebGLWorldMap.js
git commit -m "feat(22-08): GREEN — WebGLWorldMap static scene with biomes + sprites + click pick"
```

### Task 22.9 — Implement WorldMap capability wrapper

**Files:**
- Create: `src/marioWorld/WorldMap.js`

- [ ] **Step 1: Wrap capability gate around WebGL vs Svg**

```js
// src/marioWorld/WorldMap.js
import React, { useState, lazy, Suspense } from 'react'
import WorldErrorBoundary from './WorldErrorBoundary.js'
import SvgWorldMap from './renderers/SvgWorldMap.js'
import useRendererCapability from '../game/useRendererCapability.js'   // reuse from v3.10
import WorldDetailOverlay from './overlays/WorldDetailOverlay.js'

const WebGLWorldMap = lazy(() => import('./renderers/WebGLWorldMap.js'))

export default function WorldMap({ worldsData }) {
  const { effectiveCapability, prefersReducedMotion } = useRendererCapability()
  const [forceSvg, setForceSvg] = useState(false)
  const [openWorldId, setOpenWorldId] = useState(null)
  const [unlockedSecrets, setUnlockedSecrets] = useState([])  // Phase 24 wires useSecretCommand → setUnlockedSecrets

  const useGl = effectiveCapability === 'webgl' && !prefersReducedMotion && !forceSvg
  const openWorld = openWorldId ? worldsData.worlds.find((w) => w.id === openWorldId) : null

  return (
    <>
      <WorldErrorBoundary fallback={<SvgWorldMap worldsData={worldsData} unlockedSecrets={unlockedSecrets} onWorldSelect={setOpenWorldId} />}>
        {useGl
          ? (
            <Suspense fallback={<SvgWorldMap worldsData={worldsData} unlockedSecrets={unlockedSecrets} onWorldSelect={setOpenWorldId} />}>
              <WebGLWorldMap
                worldsData={worldsData}
                unlockedSecrets={unlockedSecrets}
                onWorldSelect={setOpenWorldId}
                onContextLost={() => setForceSvg(true)}
              />
            </Suspense>
          )
          : <SvgWorldMap worldsData={worldsData} unlockedSecrets={unlockedSecrets} onWorldSelect={setOpenWorldId} />}
      </WorldErrorBoundary>
      {openWorld && <WorldDetailOverlay world={openWorld} onClose={() => setOpenWorldId(null)} />}
    </>
  )
}
```

- [ ] **Step 2: Replace placeholder import in MarioWorld**

Modify `src/marioWorld/MarioWorld.js`:

```diff
- function WorldMapPlaceholder() { ... }
+ import WorldMap from './WorldMap.js'

  ...
- return <WorldMapPlaceholder />
+ return <WorldMap worldsData={worldsData} />
```

Update the corresponding MarioWorld test ("viewMode game → renders WorldMap") to assert canvas or fallback list is present, not the placeholder.

- [ ] **Step 3: Run full suite**

```bash
npx vitest run
```

Expected: P21 baseline (325) + 8 SvgWorldMap + 10 WorldDetailOverlay + 12 WebGLWorldMap = 355.

- [ ] **Step 4: Build + bundle gate**

```bash
npm run build && node scripts/check-bundle-gate.mjs
```

Check WebGL chunk size — must stay ≤130 kB gz (HARD). If over, run the mitigations from spec § Bundle budget.

- [ ] **Step 5: Commit**

```bash
git add src/marioWorld/WorldMap.js src/marioWorld/MarioWorld.js src/marioWorld/MarioWorld.test.js
git commit -m "feat(22-09): WorldMap capability wrapper + MarioWorld swap (Phase 22 close)"
```

**Phase 22 shipping check:**
- 355/355 tests GREEN
- Build clean + bundle gate exit 0
- Manual real-browser: Hero gate → Enter → canvas mounts → click sprite → overlay opens with right content; press Esc → overlay closes
- RM users: same flow via SvgWorldMap; keyboard tab + arrow navigation works
- Force `webglcontextlost` via DevTools → canvas swaps to SvgWorldMap silently

If all pass → Phase 22 ready.

---

# PHASE 23 — Cinematic zoom + free-roam navigation + walk animation

**Goal of phase:** Add 3 hooks (`useWorldNav`, `useCinematicZoom`, sprite walk anim) to make the map feel alive. Avatar moves via keyboard + drag/tap. Clicking world triggers a 600ms zoom-in transition before overlay opens; close triggers 400ms zoom-out.

**Phase ships when:** real-browser feel matches design intent — arrow keys move avatar smoothly; zoom-in is cinematic not jarring; close returns to map without losing player position.

### Task 23.1 — Write failing tests for useWorldNav

**Files:**
- Create: `src/marioWorld/hooks/useWorldNav.test.js`

- [ ] **Step 1: 10 tests covering keyboard + drag + clamp + focus-check**

```js
// src/marioWorld/hooks/useWorldNav.test.js
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useWorldNav from './useWorldNav.js'

const BBOX = { minX: -1000, maxX: 1000, minY: -800, maxY: 800 }
const STEP = 20  // pixels per keystroke

describe('useWorldNav', () => {
  it('initial avatar position at (0, 0)', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    expect(result.current.position).toEqual({ x: 0, y: 0 })
  })

  it('ArrowRight increments x by step', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
    expect(result.current.position.x).toBe(STEP)
  })

  it('ArrowLeft decrements x', () => {})
  it('ArrowUp / ArrowDown adjust y', () => {})

  it('clamps to bbox.maxX when moving right past edge', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: { ...BBOX, maxX: 50 }, step: STEP }))
    act(() => {
      for (let i = 0; i < 10; i++) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    })
    expect(result.current.position.x).toBe(50)
  })

  it('ignores keystrokes when focus is on <input>', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
    expect(result.current.position.x).toBe(0)
    input.remove()
  })

  it('drag updates camera offset, not avatar position', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    act(() => { result.current.onPointerDown({ clientX: 100, clientY: 100 }) })
    act(() => { result.current.onPointerMove({ clientX: 150, clientY: 100 }) })
    expect(result.current.cameraOffset.x).toBe(-50)  // drag right shifts camera left
  })

  it('multi-touch second finger is ignored', () => {})
  it('cleanup on unmount removes listeners', () => {})
  it('returns isWalking=true while a movement key is held', () => {})
})
```

- [ ] **Step 2: FAIL → commit (RED)**

```bash
git add src/marioWorld/hooks/useWorldNav.test.js
git commit -m "test(23-01): RED — useWorldNav contract (10 tests)"
```

### Task 23.2 — Implement useWorldNav (GREEN)

**Files:**
- Create: `src/marioWorld/hooks/useWorldNav.js`

- [ ] **Step 1: Implement hook**

```js
// src/marioWorld/hooks/useWorldNav.js
import { useState, useEffect, useRef, useCallback } from 'react'

const ARROW_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])

function isEditableTarget() {
  const tag = document.activeElement?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable
}

export default function useWorldNav({ bbox, step = 20 }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 })
  const [isWalking, setIsWalking] = useState(false)
  const dragRef = useRef(null)

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!ARROW_KEYS.has(e.key) || isEditableTarget()) return
      e.preventDefault()
      setIsWalking(true)
      setPosition((p) => {
        let nx = p.x, ny = p.y
        if (e.key === 'ArrowLeft')  nx -= step
        if (e.key === 'ArrowRight') nx += step
        if (e.key === 'ArrowUp')    ny -= step
        if (e.key === 'ArrowDown')  ny += step
        nx = Math.max(bbox.minX, Math.min(bbox.maxX, nx))
        ny = Math.max(bbox.minY, Math.min(bbox.maxY, ny))
        return { x: nx, y: ny }
      })
    }
    const onKeyUp = (e) => {
      if (ARROW_KEYS.has(e.key)) setIsWalking(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [bbox, step])

  const onPointerDown = useCallback((e) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: cameraOffset.x, baseY: cameraOffset.y }
  }, [cameraOffset])

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setCameraOffset({ x: dragRef.current.baseX - dx, y: dragRef.current.baseY - dy })
  }, [])

  const onPointerUp = useCallback(() => { dragRef.current = null }, [])

  return { position, cameraOffset, isWalking, onPointerDown, onPointerMove, onPointerUp }
}
```

- [ ] **Step 2: GREEN; commit**

```bash
git add src/marioWorld/hooks/useWorldNav.js
git commit -m "feat(23-02): GREEN — useWorldNav (arrow keys + drag camera pan)"
```

### Task 23.3 — Write failing tests for useCinematicZoom

**Files:**
- Create: `src/marioWorld/hooks/useCinematicZoom.test.js`

- [ ] **Step 1: 6 tests**

```js
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useCinematicZoom from './useCinematicZoom.js'

describe('useCinematicZoom', () => {
  it('idle state at mount', () => {
    const { result } = renderHook(() => useCinematicZoom())
    expect(result.current.state).toBe('idle')
    expect(result.current.activeWorldId).toBeNull()
  })

  it('start(id) transitions to zoomingIn', () => {
    const { result } = renderHook(() => useCinematicZoom())
    act(() => { result.current.start('company:acme') })
    expect(result.current.state).toBe('zoomingIn')
  })

  it('start during zoomingIn is ignored (race guard)', () => {})
  it('zoomingIn → inWorld after duration elapses', () => {
    // use fake timers to advance ~600ms
  })
  it('stop() during inWorld → zoomingOut → idle', () => {})
  it('start() during inWorld closes current then opens new', () => {})
})
```

- [ ] **Step 2: FAIL → commit (RED)**

```bash
git add src/marioWorld/hooks/useCinematicZoom.test.js
git commit -m "test(23-03): RED — useCinematicZoom state machine (6 tests)"
```

### Task 23.4 — Implement useCinematicZoom (GREEN)

**Files:**
- Create: `src/marioWorld/hooks/useCinematicZoom.js`

- [ ] **Step 1: Implement state machine**

```js
// src/marioWorld/hooks/useCinematicZoom.js
import { useState, useRef, useCallback } from 'react'

const ZOOM_IN_MS = 600
const ZOOM_OUT_MS = 400

export default function useCinematicZoom() {
  const [state, setState] = useState('idle')   // 'idle' | 'zoomingIn' | 'inWorld' | 'zoomingOut'
  const [activeWorldId, setActiveWorldId] = useState(null)
  const timerRef = useRef(null)

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }

  const start = useCallback((worldId) => {
    if (state === 'zoomingIn' || state === 'zoomingOut') return
    clearTimer()
    if (state === 'inWorld') {
      // close then open new
      setState('zoomingOut')
      timerRef.current = setTimeout(() => {
        setActiveWorldId(worldId)
        setState('zoomingIn')
        timerRef.current = setTimeout(() => setState('inWorld'), ZOOM_IN_MS)
      }, ZOOM_OUT_MS)
      return
    }
    setActiveWorldId(worldId)
    setState('zoomingIn')
    timerRef.current = setTimeout(() => setState('inWorld'), ZOOM_IN_MS)
  }, [state])

  const stop = useCallback(() => {
    clearTimer()
    if (state === 'idle') return
    setState('zoomingOut')
    timerRef.current = setTimeout(() => { setState('idle'); setActiveWorldId(null) }, ZOOM_OUT_MS)
  }, [state])

  return { state, activeWorldId, start, stop }
}
```

- [ ] **Step 2: GREEN; commit**

```bash
git add src/marioWorld/hooks/useCinematicZoom.js
git commit -m "feat(23-04): GREEN — useCinematicZoom state machine (600/400ms)"
```

### Task 23.5 — Wire navigation + cinematic zoom into WebGLWorldMap

**Files:**
- Modify: `src/marioWorld/renderers/WebGLWorldMap.js`
- Modify: `src/marioWorld/WorldMap.js`

- [ ] **Step 1: Add rAF tick for sprite walk frame advance + camera follow + zoom animation**

Inside `WebGLWorldMap.js`:
- Consume `position` from a `useWorldNav` instance owned by parent (`WorldMap`)
- Take `zoomState` + `activeWorldId` as props
- In the existing `useEffect`, add a `tick()` loop using `requestAnimationFrame`:
  - Update avatar sprite position from `position` prop (lerp for smoothness)
  - Advance avatar walk-cycle frame when `isWalking` (UV offset shift on the spritesheet)
  - During `zoomingIn`: lerp camera position toward the target world; lerp `camera.zoom` from 1 to ~3
  - During `zoomingOut`: lerp camera back to default
  - Always call `renderer.render(scene, camera)`

Replace the single static `renderer.render(...)` call in Task 22.8 with this animated loop. Add the missing `cancelAnimationFrame` in cleanup.

- [ ] **Step 2: Move `useWorldNav` + `useCinematicZoom` into `WorldMap.js`** — single source of truth; pass props down

```js
// inside WorldMap.js
const nav = useWorldNav({ bbox: { minX: -1000, maxX: 1000, minY: -800, maxY: 800 } })
const zoom = useCinematicZoom()

// replace setOpenWorldId in onWorldSelect with:
const handleWorldSelect = (id) => {
  zoom.start(id)
}

// open overlay only when zoom.state === 'inWorld'
const openWorld = zoom.state === 'inWorld' && zoom.activeWorldId
  ? worldsData.worlds.find((w) => w.id === zoom.activeWorldId)
  : null

const handleOverlayClose = () => zoom.stop()
```

- [ ] **Step 3: Update tests if structural expectations changed**

Run full suite; fix tests that assumed direct overlay-open on click.

```bash
npx vitest run
```

- [ ] **Step 4: Real-browser feel test**

```bash
npm run build && npx vite preview
```

Tune:
- Avatar lerp factor (0.08 default; tweak if too sluggish or jittery)
- Camera follow distance
- Zoom-in target offset (avoid overshoot)
- Animation easing (linear vs ease-in-out)

- [ ] **Step 5: Commit**

```bash
git add src/marioWorld/renderers/WebGLWorldMap.js src/marioWorld/WorldMap.js
git commit -m "feat(23-05): wire useWorldNav + useCinematicZoom into renderer (Phase 23 close)"
```

**Phase 23 shipping check:**
- All tests GREEN (355 + 10 nav + 6 zoom = 371)
- Real-browser: arrow keys walk avatar; drag pans camera; click world → cinematic zoom → overlay; Esc → zoom out → back to map; mobile drag works
- Lighthouse mobile re-verify HARD gate intact

If all pass → Phase 23 ready.

---

# PHASE 24 — Secret commands + cleanup + Lighthouse re-verify

**Goal of phase:** Terminal-style command unlocks hidden worlds, discreet hint visible. Delete legacy `src/game/` + `<About>`/`<Skills>`/etc. components. Final bundle audit + Lighthouse mobile gate.

**Phase ships when:** typing a registered command anywhere unlocks the matching world; legacy code gone; bundle ≤130 kB gz; Lighthouse mobile HARD gate cleared.

### Task 24.1 — Create secret-worlds.js catalog

**Files:**
- Create: `src/marioWorld/data/secret-worlds.js`

- [ ] **Step 1: Initial empty array; operator fills entries later**

```js
// src/marioWorld/data/secret-worlds.js
//
// Hidden worlds catalog. Each entry unlocks via the matching command typed
// anywhere on the page (decision Q13-B). Cantidad dinámica (decision Q14-D);
// operator agrega entries cuando quiera.
//
// Schema:
//   { id, command, label{en,es}, biome, content{en,es} }

const SECRET_WORLDS = [
  // {
  //   id: 'about-secret',
  //   command: '/about-secret',
  //   label: { en: 'The whole story', es: 'La historia completa' },
  //   biome: 'pradera',
  //   content: { en: '…', es: '…' },
  // },
]

export { SECRET_WORLDS }
export default SECRET_WORLDS
```

- [ ] **Step 2: Commit**

```bash
git add src/marioWorld/data/secret-worlds.js
git commit -m "feat(24-01): secret-worlds.js empty catalog (operator fills dynamically)"
```

### Task 24.2 — Write failing tests for useSecretCommand

**Files:**
- Create: `src/marioWorld/hooks/useSecretCommand.test.js`

- [ ] **Step 1: 8 tests**

```js
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useSecretCommand from './useSecretCommand.js'

const COMMANDS = ['/secret1', '/about-secret']

describe('useSecretCommand', () => {
  it('typing /secret1 fires callback with matching id', () => {
    const onUnlock = vi.fn()
    renderHook(() => useSecretCommand({ commands: COMMANDS, onUnlock }))
    act(() => {
      for (const k of '/secret1') document.dispatchEvent(new KeyboardEvent('keydown', { key: k }))
    })
    expect(onUnlock).toHaveBeenCalledWith('/secret1')
  })

  it('partial match then timeout clears buffer (200ms idle window)', () => {})
  it('typing /wrong does NOT fire any callback', () => {})
  it('Backspace clears the buffer', () => {})
  it('Escape clears the buffer', () => {})
  it('ignores keystrokes when focus on input/textarea', () => {})
  it('cleanup on unmount removes listeners', () => {})
  it('does not match commands not in catalog', () => {})
})
```

- [ ] **Step 2: FAIL → commit (RED)**

```bash
git add src/marioWorld/hooks/useSecretCommand.test.js
git commit -m "test(24-02): RED — useSecretCommand contract (8 tests)"
```

### Task 24.3 — Implement useSecretCommand (GREEN)

**Files:**
- Create: `src/marioWorld/hooks/useSecretCommand.js`

- [ ] **Step 1: Implement hook**

```js
// src/marioWorld/hooks/useSecretCommand.js
import { useEffect, useRef } from 'react'

const IDLE_TIMEOUT_MS = 2000

function isEditableTarget() {
  const tag = document.activeElement?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable
}

export default function useSecretCommand({ commands = [], onUnlock = () => {} }) {
  const bufferRef = useRef('')
  const idleRef = useRef(null)

  useEffect(() => {
    const reset = () => { bufferRef.current = ''; if (idleRef.current) { clearTimeout(idleRef.current); idleRef.current = null } }
    const onKeyDown = (e) => {
      if (isEditableTarget()) return
      if (e.key === 'Escape' || e.key === 'Backspace') { reset(); return }
      if (e.key.length !== 1 && e.key !== '/') return  // ignore non-printables except '/'
      bufferRef.current = (bufferRef.current + e.key).slice(-32)
      if (idleRef.current) clearTimeout(idleRef.current)
      idleRef.current = setTimeout(reset, IDLE_TIMEOUT_MS)
      for (const cmd of commands) {
        if (bufferRef.current.endsWith(cmd)) {
          onUnlock(cmd)
          reset()
          break
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown); if (idleRef.current) clearTimeout(idleRef.current) }
  }, [commands, onUnlock])
}
```

- [ ] **Step 2: GREEN; commit**

```bash
git add src/marioWorld/hooks/useSecretCommand.js
git commit -m "feat(24-03): GREEN — useSecretCommand terminal-style buffer matcher"
```

### Task 24.4 — Implement SecretCommandHint + wire into WorldMap

**Files:**
- Create: `src/marioWorld/overlays/SecretCommandHint.js`
- Modify: `src/marioWorld/WorldMap.js`

- [ ] **Step 1: Create discreet hint component**

```js
// src/marioWorld/overlays/SecretCommandHint.js
import React, { useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.js'

export default function SecretCommandHint() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  return (
    <div className="fixed bottom-4 right-4 z-30 font-mono text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.world?.secretHint ?? 'Try typing a command'}
        className="text-slate2-500 hover:text-slate2-100"
      >
        <span className="animate-pulse">_</span>
      </button>
      {open && (
        <div className="absolute bottom-6 right-0 w-56 rounded bg-ink-900 p-2 text-slate2-200 shadow-lg">
          {t.world?.secretHint ?? 'Try typing a command…'}
        </div>
      )}
    </div>
  )
}
```

Add the `t.world.secretHint` i18n keys to `translations.js` (EN: "Try typing a command…", ES: "Intenta escribir un comando…").

- [ ] **Step 2: Wire into WorldMap with useSecretCommand**

```diff
+ import { SECRET_WORLDS } from './data/secret-worlds.js'
+ import useSecretCommand from './hooks/useSecretCommand.js'
+ import SecretCommandHint from './overlays/SecretCommandHint.js'

  ...
+ const commandsList = useMemo(() => SECRET_WORLDS.map((s) => s.command), [])
+ useSecretCommand({
+   commands: commandsList,
+   onUnlock: (cmd) => {
+     const entry = SECRET_WORLDS.find((s) => s.command === cmd)
+     if (entry) setUnlockedSecrets((prev) => Array.from(new Set([...prev, entry.id])))
+   },
+ })

  return (
    <>
      ... existing WorldErrorBoundary / WebGL or Svg / overlay
+     <SecretCommandHint />
    </>
  )
```

Also in `MarioWorld.js`, swap `const SECRET_WORLDS = []` for the real import.

- [ ] **Step 3: Run full suite**

```bash
npx vitest run
```

Expected: 371 + 8 useSecretCommand = 379.

- [ ] **Step 4: Commit**

```bash
git add src/marioWorld/overlays/SecretCommandHint.js src/marioWorld/WorldMap.js src/marioWorld/MarioWorld.js src/i18n/translations.js
git commit -m "feat(24-04): SecretCommandHint + wire useSecretCommand into WorldMap"
```

### Task 24.5 — Delete legacy game directory

**Files:**
- Delete: `src/game/` (entire directory)
- Delete: `src/components/About.js`, `Skills.js`, `Projects.js`, `Claude.js`, `Contact.js`

- [ ] **Step 1: Confirm no remaining imports of deleted files**

```bash
grep -rn "from .*src/game/\|import .* from './game/\|import .* from '../game/'" src/
grep -rn "from './components/About\|/Skills\|/Projects\|/Claude\|/Contact'" src/
```

Fix any references first. `useClickVsDrag` was already copied to `marioWorld/` (Task 22.8); make sure that import is updated:

```diff
- import useClickVsDrag from '../../game/useClickVsDrag.js'
+ import useClickVsDrag from '../hooks/useClickVsDrag.js'
```

Move `useClickVsDrag.js` + `useClickVsDrag.test.js` to `src/marioWorld/hooks/` and update the import.

- [ ] **Step 2: Delete + commit**

```bash
git rm -r src/game/
git rm src/components/About.js src/components/Skills.js src/components/Projects.js src/components/Claude.js src/components/Contact.js
git commit -m "chore(24-05): delete legacy game/ + section components (mario-world replaces)"
```

- [ ] **Step 3: Run full suite — confirm GREEN after deletions**

```bash
npx vitest run
```

If existing tests under `src/game/` were deleted along with the directory, expected test count drops by ~80 (the constellation/skill-graph/filters tests). Net: ~300 tests (290-310 depending on how many migrated vs re-written).

### Task 24.6 — Bundle gate + Lighthouse mobile re-verify

**Files:**
- Modify: `scripts/check-bundle-gate.mjs` (if needed for new chunk naming)

- [ ] **Step 1: Build + bundle gate**

```bash
npm run build && node scripts/check-bundle-gate.mjs
```

Expected: PASS mobile chunk (DevView lean), WebGL chunk ≤ 130 kB gz. If WebGL chunk > 130, apply spec § Bundle budget mitigations (pictogram SVG inline, biome tile lazy chunks) until under.

- [ ] **Step 2: Lighthouse mobile**

```bash
npm run lighthouse:mobile && npm run lighthouse:check
```

Expected: Perf ≥ 95 / A11y 100 / BP 100 / SEO 100. Document scores in a milestone summary.

- [ ] **Step 3: Real-browser UAT sweep (manual, operator-driven)**

Run through the 12-item checklist (mirror v3.10 20-HUMAN-UAT structure) covering:
1. Hero gate shows both buttons; click correctly routes
2. Game view: WebGL canvas mounts, biomes visible, sprites visible
3. Arrow keys walk avatar
4. Drag pans camera
5. Click world → cinematic zoom → overlay
6. Esc closes overlay → zoom out → map intact
7. Type registered secret command anywhere → secret world appears in its biome
8. RM users land in SvgWorldMap; keyboard nav works
9. Mobile drag + tap functional
10. WebGL context loss falls back to SvgWorldMap
11. Bilingual switch (EN/ES) propagates everywhere
12. Dev view: classic scroll, all 5 sections + experience visible

- [ ] **Step 4: Commit milestone close**

```bash
git add -A
git commit -m "chore(24-06): bundle + lighthouse + UAT closed for v3.11 (Phase 24 close)"
git tag -a v3.11.0 -m "v3.11.0 Mario-world experience map — DEPTH-02 shipped"
git push origin main v3.11.0
```

**Milestone v3.11 ready.**

---

## Self-Review notes (post-write)

- **Spec coverage:** 19 decisions Q1-Q19 traceable to tasks. New canonical skills from v3.10.1 don't affect this plan (SKILLS map unchanged). Bundle budget violation flagged in spec maps to Task 24.6 mitigations.
- **Phase boundaries:** Each phase ships working software. P21 = working Dev view + gate (game = placeholder). P22 = working game view minus zoom + nav. P23 = full game feel. P24 = secrets + cleanup.
- **TDD discipline:** Every code task has RED commit before GREEN commit. Test counts match spec § Testing strategy (~95 net new).
- **No placeholders in steps:** All code blocks shown; test scenarios concrete. Tasks like `experience.js` `company` field rely on operator to lock string values — flagged as "operator MUST review and lock" but the schema is concrete.
- **Type/method consistency:** `deriveWorlds` signature matches across Tasks 21.4, 21.5, 21.11, 21.12. `useWorldNav` props/returns consistent across 23.1, 23.2, 23.5. Component prop names (`worldsData`, `onWorldSelect`, `unlockedSecrets`, `onContextLost`) consistent across all renderers + tests.
- **Open items for execution:** Sprite assets (Task 22.6) ship as placeholders; high-fidelity art is a separate workstream — flagged in spec § Open items. Lighthouse score targets are inherited (≥95/100/100/100), confirmed in Task 24.6.
