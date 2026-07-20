# Phase 23: Static content sections - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 12 (5 `.astro` components, 5 Container API test files, 2 modified page files)
**Analogs found:** 12 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog(s) | Match Quality |
|---|---|---|---|---|
| `src/components/astro/About.astro` | component | transform (build-time render) | `src/components/About.jsx` (content/logic) + `src/pages/404.astro` (Astro syntax) | role-match (source is JSX, not Astro) |
| `src/components/astro/Skill.astro` | component | transform | `src/components/Skill.jsx` + `src/pages/404.astro` | role-match |
| `src/components/astro/Footer.astro` | component | transform | `src/components/Footer.jsx` + `src/layouts/BaseLayout.astro` (`translations[locale]` idiom) | role-match |
| `src/components/astro/Projects.astro` | component | transform | `src/components/Projects.jsx` + `src/pages/404.astro` | role-match |
| `src/components/astro/Claude.astro` | component | transform | `src/components/Claude.jsx` + `src/pages/404.astro` | role-match |
| `src/components/astro/About.test.ts` | test | request-response (Container API render) | `src/pages/_404.test.ts` (harness) + `src/components/About.test.jsx` (assertion coverage) | exact (harness) / role-match (assertions) |
| `src/components/astro/Skill.test.ts` | test | request-response | `src/pages/_404.test.ts` + `src/components/Skill.test.jsx` | exact / role-match |
| `src/components/astro/Footer.test.ts` | test | request-response | `src/pages/_404.test.ts` only — **no `Footer.test.jsx` exists** | exact (harness) / **no analog for assertions** |
| `src/components/astro/Projects.test.ts` | test | request-response | `src/pages/_404.test.ts` + `src/components/Projects.test.jsx` | exact / role-match |
| `src/components/astro/Claude.test.ts` | test | request-response | `src/pages/_404.test.ts` + `src/components/Claude.test.jsx` | exact / role-match |
| `src/pages/en/index.astro` (modified) | route | request-response | itself (current 20-line version, Phase 21/22) | exact — incremental edit, not a rewrite |
| `src/pages/es/index.astro` (modified) | route | request-response | itself (current 20-line version, Phase 21/22) | exact — incremental edit, not a rewrite |

**Target directory confirmed from `.planning/research/ARCHITECTURE.md`** (lines 58, 73, 99, 120, 263, 275): new files land in `src/components/astro/*.astro`, mirroring the existing `src/components/react/*.jsx` island folder (currently holds `Nav.jsx`, `ThemeToggle.jsx`). This folder does not exist yet — plans must create it.

---

## Pattern Assignments

### `src/components/astro/About.astro`

**Content/logic analog:** `src/components/About.jsx` (full file, 96 lines)
**Syntax analog:** `src/pages/404.astro`

**Data resolution pattern to port verbatim** (`About.jsx` lines 1-8):
```jsx
import data from '../data/about.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}
```
In `.astro` frontmatter this becomes plain JS (no `React` import, no `useLanguage()` — locale comes from a prop or `Astro.currentLocale`, resolved once at build time):
```astro
---
import data from '../../data/about.json'
const { locale } = Astro.props
function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}
const { facts } = data
---
```

**DROP per D-04** — `About.jsx` lines 10-43 (`reduceMotion`, `useCountUp`, `AnimatedValue`) are NOT ported. `About.astro` renders `pick(f.value, lang)` directly (the raw string, e.g. `"18+ years"`), with no `useCountUp`/animation wrapper. Phase 24 owns re-adding count-up as a shared vanilla `<script>` for both Hero and About — do not preempt it.

**Markup pattern to port as-is** (`About.jsx` lines 45-95, `Row`/section JSX) — same Tailwind classes, same structure, `<Row>` becomes a local Astro helper function or an inline `.map()` in the template (Claude's discretion per D-05's sibling decision in CONTEXT.md):
```jsx
<section id="about" className="py-20">
  <div className="max-w-6xl mx-auto px-6">
    <div className="font-pixel text-[10px] uppercase tracking-[1px] text-accent flex items-center gap-3 mb-4">
      <span className="block w-10 h-0.5 bg-accent" /> {pick(data.label, lang)}
    </div>
    ...
```
Astro JSX→template conversion notes: `className` → `class`, `key={i}` props are dropped (no VDOM reconciliation needed), `{facts.map((f, i) => <Row ... />)}` becomes `{facts.map((f, i) => <li>...</li>)}` inline or a `<Fragment>`-returning helper — Astro components cannot be called as plain JS functions the way `<Row>` was, so either inline the markup or extract `Row` as its own `.astro` partial.

---

### `src/components/astro/Skill.astro`

**Analog:** `src/components/Skill.jsx` (full file, 69 lines) — zero hooks, direct port.

**Data resolution** (`Skill.jsx` lines 5-12, port verbatim into frontmatter):
```jsx
function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function maxYears() {
  return Math.max(...data.categories.flatMap((c) => c.chips).map((ch) => ch.years))
}
```
No client interactivity anywhere in this component (no `useState`, no event handlers) — this is the simplest of the 5, safe reference implementation to build first if the planner wants a low-risk Container API dry run before `About`.

**Import:** `import data from '../../data/skills.json'` — confirm at implementation time whether `src/data/skills.json` (not `skills.js`, which also exists in `src/data/`) is the file actually imported by `Skill.jsx` line 3 (`import data from '../data/skills.json'` — confirmed, `.json` not `.js`).

---

### `src/components/astro/Footer.astro`

**Analog:** `src/components/Footer.jsx` (full file, 46 lines) + `src/layouts/BaseLayout.astro` (`translations[locale]` idiom, lines 8-17).

**D-02/D-03 — the two Footer-specific deltas from every other component in this phase:**
1. No `src/data/footer.json` exists. Copy comes from `translations.js`'s `t.footer` subtree (confirmed content, `src/i18n/translations.js` lines 50-53 EN / 103-106 ES):
```js
footer: {
  rights: 'All rights reserved',
  tagline: "I write code. Let's build something amazing together.",
},
```
Port `BaseLayout.astro`'s exact resolution idiom (`BaseLayout.astro` lines 8-17):
```astro
---
import translations from '../i18n/translations.js'
const locale = Astro.currentLocale ?? 'en'
const meta = translations[locale]?.meta
---
```
→ for Footer: `const footerCopy = translations[locale]?.footer` (or receive `locale` as a prop like the other 4, per Pattern 1 in ARCHITECTURE.md — stay consistent with sibling components rather than mixing `Astro.currentLocale` and prop-passing across the 5 new files).

2. The `social` array (`Footer.jsx` lines 4-7) is a hardcoded module-level const, NOT sourced from JSON or translations — copy verbatim into `Footer.astro` frontmatter:
```jsx
const social = [
  { name: 'GitHub', href: 'https://github.com/andresmontoyat', label: 'gh' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033/', label: 'in' },
]
```

3. **D-03:** `Footer.jsx` line 11's `const year = new Date().getFullYear()` (currently a per-render runtime read in a mounted React component) becomes a build-time frontmatter read in `Footer.astro` — same line of code, different execution timing, no logic change needed.

**No `Footer.test.jsx` exists in the current codebase** (verified: `src/components/` contains `About.test.jsx`, `Claude.test.jsx`, `Contact.test.jsx`, `Experience.test.jsx`, `Hero.test.jsx`, `Projects.test.jsx`, `SectionPager.test.jsx`, `Skill.test.jsx` — no `Footer.test.jsx`). `Footer.test.ts`'s Container API test has **no RTL baseline to mirror for coverage parity** (D-06/D-07's "no regression in assertion count" has nothing to diff against for this one file) — the planner must author assertions from `Footer.jsx`'s own logic/markup directly: `<footer>` landmark present, both `social` links render with `aria-label`, both EN/ES tagline+rights strings render, current year appears in the copyright line.

---

### `src/components/astro/Projects.astro`

**Analog:** `src/components/Projects.jsx` (full file, 138 lines) — largest of the 5, two card variants (`FeaturedProjectCard`/`ProjectCard`) plus a `TechTags` sub-component.

**Data resolution + filter pattern** (`Projects.jsx` lines 105-111, port verbatim):
```jsx
const ctaLive = pick(data.ctaLive, lang)
const ctaGithub = pick(data.ctaGithub, lang)
const featuredLabel = pick(data.featuredLabel, lang)
const featured = data.projects.filter((p) => p.featured)
const rest = data.projects.filter((p) => !p.featured)
```
No hooks/state anywhere — `FeaturedProjectCard`/`ProjectCard`/`TechTags` are pure presentational sub-functions, same conversion approach as `About.astro`'s `Row` (inline markup or `.astro` partials). Conditional CTA rendering (`{(project.liveUrl || project.githubUrl) && (...)}`, lines 76-99) ports directly — Astro templates support the same `{condition && <jsx>}` short-circuit syntax.

---

### `src/components/astro/Claude.astro`

**Analog:** `src/components/Claude.jsx` (full file, 73 lines) — three sub-components (`PitchHero`, `ValueCard`, `OfferingCard`), no hooks, straightforward port.

**Structure to preserve:** two separate `.map()` loops over `data.values` and `data.offerings` (`Claude.jsx` lines 56-68) — same `key={v.id}`/`key={o.id}` pattern drops in Astro (no key needed), same grid classes carry over unchanged.

---

## Test Pattern Assignments

### Harness pattern — all 5 `.test.ts` files

**Analog:** `src/pages/_404.test.ts` (full file, 47 lines) — the only Container API test in the repo, established Phase 21.

**Required per-file environment override** (`_404.test.ts` line 1 — MUST be the literal first line, before imports):
```ts
// @vitest-environment node
```
Rationale documented in `_404.test.ts` lines 1-29: Astro's compiler invokes esbuild synchronously, and esbuild's startup check fails under jsdom's shimmed `TextEncoder`. `renderToString()` output is plain HTML text — no DOM APIs needed.

**Import + render pattern** (`_404.test.ts` lines 30-46):
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import NotFoundPage from './404.astro'

describe('404 page (Container API proof-of-life — TEST-01 harness)', () => {
  it('renders without throwing', async () => {
    const container = await AstroContainer.create()
    await expect(container.renderToString(NotFoundPage)).resolves.toBeTruthy()
  })

  it('renders a home link and the 404 numeral', async () => {
    const container = await AstroContainer.create()
    const result = await container.renderToString(NotFoundPage)
    expect(result).toMatch(/href="\/(en|es)?"/)
    expect(result).toContain('404')
  })
})
```
For Phase 23's components, `renderToString` takes a `props` argument (needed here since 404.astro takes none, but About/Skill/Footer/Projects/Claude will need `{ props: { locale: 'en' } }` or similar — confirm exact Container API `renderToString(Component, options)` signature against `node_modules/astro/dist/container/index.d.ts` at implementation time, since `_404.test.ts` never exercises the props path).

**Assertion style — string matching on rendered HTML**, not DOM queries (no `screen.getByText`, no `@testing-library/react` — that's the RTL pattern being replaced). Convert each source `.test.jsx`'s `screen.getByText('X')` assertions into `expect(result).toContain('X')` or `expect(result).toMatch(/regex/)`.

**Regression-coverage source per component** (for D-06/D-07's "no assertion-count regression" requirement):
- `About.test.ts` ← `src/components/About.test.jsx` (95 lines, 7 `it` blocks) — **this is D-07's designated spot-check component**: paragraphs + quick-facts assertions, `about.json` schema sanity block (lines 72-88) ports as a plain data-shape test independent of rendering, and the "no `<strong>` markup" regression guard (lines 66-70) still applies since About.astro also has no `dangerouslySetInnerHTML` equivalent. **Drop** the count-up-specific assertion at line 50 (`toMatch(/\d+\+ years/)` — still valid since the static string unchanged) but note test intent shifts from "count-up settled" to "static value present."
- `Skill.test.ts` ← `src/components/Skill.test.jsx` (106 lines, 8 `it` blocks) — chip count (30), core-tile count (6, via `data-core="true"` attribute — Astro preserves `data-*` attributes identically), bilingual category titles.
- `Footer.test.ts` ← **no `.jsx` source** — author fresh per the gotcha noted above.
- `Projects.test.ts` ← `src/components/Projects.test.jsx` (97 lines, 8 `it` blocks) — featured-vs-rest split (`data-featured="true"`/`"false"` attributes preserve), `projects.json` schema sanity block ports as data-only test.
- `Claude.test.ts` ← `src/components/Claude.test.jsx` (87 lines, 6 `it` blocks) — 4 value cards + 6 offerings, bilingual pitch strings.

---

## `src/pages/en/index.astro` / `src/pages/es/index.astro` (modified)

**Analog:** current file content itself (both are identical 20-line files except `const locale = Astro.currentLocale ?? 'en'` vs `'es'`).

**Current state** (`src/pages/en/index.astro`, full file):
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import Nav from '../../components/react/Nav.jsx'
import { getRelativeLocaleUrl } from 'astro:i18n'

const locale = Astro.currentLocale ?? 'en'
const path = Astro.url.pathname.replace(/^\/(en|es)/, '') || '/'
const hrefEn = getRelativeLocaleUrl('en', path)
const hrefEs = getRelativeLocaleUrl('es', path)
---
<BaseLayout>
  <Nav client:load locale={locale} hrefEn={hrefEn} hrefEs={hrefEs} />
  <main>
    <h1>Carlos Montoya</h1>
  </main>
</BaseLayout>
```

**Target mounting pattern** (per D-05, order About → Skill → Projects → Claude → Footer, replacing the `<h1>` placeholder), following `ARCHITECTURE.md`'s Pattern 1 import convention (lines 114-128):
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import Nav from '../../components/react/Nav.jsx'
import About from '../../components/astro/About.astro'
import Skill from '../../components/astro/Skill.astro'
import Projects from '../../components/astro/Projects.astro'
import Claude from '../../components/astro/Claude.astro'
import Footer from '../../components/astro/Footer.astro'
import { getRelativeLocaleUrl } from 'astro:i18n'

const locale = Astro.currentLocale ?? 'en'
const path = Astro.url.pathname.replace(/^\/(en|es)/, '') || '/'
const hrefEn = getRelativeLocaleUrl('en', path)
const hrefEs = getRelativeLocaleUrl('es', path)
---
<BaseLayout>
  <Nav client:load locale={locale} hrefEn={hrefEn} hrefEs={hrefEs} />
  <main>
    <About locale={locale} />
    <Skill locale={locale} />
    <Projects locale={locale} />
    <Claude locale={locale} />
    <Footer locale={locale} />
  </main>
</BaseLayout>
```
Note: `es/index.astro`'s only diff from `en/index.astro` is the `?? 'es'` fallback on line 6 — mirror both edits identically otherwise.

---

## Shared Patterns

### `pick(field, lang)` bilingual field resolver
**Source:** duplicated verbatim across `About.jsx` (lines 5-8), `Skill.jsx` (lines 5-8), `Projects.jsx` (lines 5-8), `Claude.jsx` (lines 5-8).
**Apply to:** All 4 JSON-backed `.astro` components (not `Footer.astro`, which resolves from `translations[locale]` instead, no `pick()` needed since `t.footer.rights`/`t.footer.tagline` are already flat strings per locale).
```js
function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}
```
Each `.astro` component defines its own copy in frontmatter (matches existing per-file duplication in the `.jsx` originals — no shared util module exists today, and this phase's CONTEXT.md does not call for extracting one).

### `translations[locale]` build-time resolution idiom
**Source:** `src/layouts/BaseLayout.astro` lines 8-17.
**Apply to:** `Footer.astro` only, among this phase's 5 files.
```astro
const locale = Astro.currentLocale ?? 'en'
const meta = translations[locale]?.meta
```

### Astro Container API test harness
**Source:** `src/pages/_404.test.ts` (full file).
**Apply to:** All 5 new `.test.ts` files. Mandatory `// @vitest-environment node` as literal line 1. `AstroContainer.create()` → `container.renderToString(Component, { props })` → assert on the returned HTML string.

### Section label + heading markup block
**Source:** duplicated identically across `About.jsx`, `Skill.jsx`, `Projects.jsx`, `Claude.jsx` (each component's own `pick(data.label, lang)` + `pick(data.h2, lang)` block near the top of its JSX return).
**Apply to:** All 4 JSON-backed components — port the exact Tailwind class strings unchanged (`font-pixel text-[10px] uppercase tracking-[1px] text-accent flex items-center gap-3 mb-4`, etc.) — no visual changes in scope for this phase.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/components/astro/Footer.test.ts` (assertion content only — harness has an analog) | test | request-response | No `Footer.test.jsx` exists in the current codebase to mirror for coverage parity; author assertions from `Footer.jsx` source logic directly (see Footer section above for the recommended assertion list) |

---

## Metadata

**Analog search scope:** `src/components/`, `src/pages/`, `src/layouts/`, `src/i18n/`, `src/data/`, `.planning/research/ARCHITECTURE.md`, `.planning/phases/21-foundation-astro-scaffold-i18n-routing-layout-shell/`
**Files read in full:** `About.jsx`, `About.test.jsx`, `Skill.jsx`, `Skill.test.jsx`, `Footer.jsx`, `Projects.jsx`, `Projects.test.jsx`, `Claude.jsx`, `Claude.test.jsx`, `404.astro`, `_404.test.ts`, `BaseLayout.astro`, `en/index.astro`, `es/index.astro`, `vitest.config.ts`, `src/test/setup.jsx`
**Files read in part (targeted offsets):** `src/i18n/translations.js` (footer subtree, lines 45-59, 98-108), `.planning/research/ARCHITECTURE.md` (lines 95-134)
**Confirmed absent:** `src/components/Footer.test.jsx` does not exist (verified via directory listing — 8 `.test.jsx` files present, Footer not among them)
**Pattern extraction date:** 2026-07-19
