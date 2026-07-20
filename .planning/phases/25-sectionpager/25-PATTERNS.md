# Phase 25: SectionPager - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 4 (1 new component, 1 new test, 2 modified pages)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/components/react/SectionPager.jsx` | component (React island) | event-driven (scroll listener + IntersectionObserver) | `src/components/react/Nav.jsx` (Phase 22 island shape) + `src/components/SectionPager.jsx` (source logic) | exact (structural pattern) + exact (logic source) |
| `src/components/react/SectionPager.test.jsx` | test | request-response (render + interaction) | `src/components/react/Nav.test.jsx` (Phase 22 island test) + `src/components/SectionPager.test.jsx` (existing behavioral assertions) | exact |
| `src/pages/en/index.astro` | page (Astro) | request-response (SSR mount) | itself, current live state — modify in place | exact (same file, prior Nav mount as template) |
| `src/pages/es/index.astro` | page (Astro) | request-response (SSR mount) | itself, current live state — modify in place | exact (same file, prior Nav mount as template) |

## Pattern Assignments

### `src/components/react/SectionPager.jsx` (component, event-driven)

**Two analogs combine for this file:**
- **Logic/body source (port verbatim):** `src/components/SectionPager.jsx` (139 lines, full file) — `ICONS`, `SECTION_IDS`, `SECTION_COLORS`, `prefersReducedMotion`, `scrollToY`, `scrollToId`, `PagerButton`, `ProgressDial`, the `requestAnimationFrame`-throttled scroll listener, and the JSX render tree. Per CONTEXT.md D-03, all of this ports with **zero logic changes**.
- **Context-removal + props shape (structural precedent):** `src/components/react/Nav.jsx` — shows exactly how Phase 22 replaced `useLanguage()` with a `locale` prop + direct `translations` import.

**Old import block to remove** (`src/components/SectionPager.jsx` lines 1-3):
```javascript
import React, { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import useActiveSection from '../hooks/useActiveSection'
```

**New import block — pattern to copy from `src/components/react/Nav.jsx` lines 1-4** (adjust the `useActiveSection` and translations relative paths one level deeper, since `react/` nests under `components/`):
```javascript
import React, { useEffect, useRef, useState } from 'react'
import translations from '../../i18n/translations'
import useActiveSection from '../../hooks/useActiveSection'
```
(No `ThemeToggle`-equivalent needed — SectionPager has no sub-island dependency, so this import list is shorter than Nav's.)

**Context→props removal pattern** (`src/components/react/Nav.jsx` lines 19-23):
```javascript
export default function Nav({ locale, hrefEn, hrefEs }) {
  const lang = locale
  const t = translations[locale]
  const [menuOpen, setMenuOpen] = useState(false)
  const activeSection = useActiveSection(SECTION_IDS)
```
Apply the same shape to SectionPager's old signature (`src/components/SectionPager.jsx` lines 89-93):
```javascript
export default function SectionPager() {
  const { t } = useLanguage()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const active = useActiveSection(SECTION_IDS)
  const tickingRef = useRef(false)
```
→ becomes:
```javascript
export default function SectionPager({ locale }) {
  const t = translations[locale]
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const active = useActiveSection(SECTION_IDS)
  const tickingRef = useRef(false)
```
Everything else in the function body (the `useEffect` scroll handler, `idx`/`atStart`/`atEnd`/`activeColor` derivation, and the returned `<nav>` JSX at lines 96-138) is untouched — `t.nav.pagerGroup`, `t.nav.pagerTop`, `t.nav.pagerPrev`, `t.nav.pagerNext`, `t.nav.pagerEnd` all resolve identically off the new `t` object since `translations[locale].nav` has the same shape as the old context's `t.nav`.

**Translation keys already present** (`src/i18n/translations.js` lines 23-27 EN, 76-80 ES) — no new i18n work required:
```javascript
pagerGroup: 'Section navigation',
pagerTop: 'Back to top',
pagerPrev: 'Previous section',
pagerNext: 'Next section',
pagerEnd: 'Go to end',
```

**Component internals to port verbatim** (no changes) from `src/components/SectionPager.jsx`:
- `SECTION_IDS` (line 5), `SECTION_COLORS` (lines 7-15)
- `prefersReducedMotion`, `scrollToY`, `scrollToId` (lines 17-30)
- `ICONS` (lines 32-37)
- `PagerButton` (lines 39-58), `ProgressDial` (lines 60-87)
- scroll/resize `useEffect` with `requestAnimationFrame` throttle (lines 96-117)
- derived `idx`/`atStart`/`atEnd`/`activeColor` + JSX return (lines 119-138)

---

### `src/components/react/SectionPager.test.jsx` (test, request-response)

**Structural analog:** `src/components/react/Nav.test.jsx` — shows the island test pattern: no `LanguageProvider` wrapper, render with explicit `locale` prop, mock `useActiveSection` at the new nested path.

**Mock path pattern** (`src/components/react/Nav.test.jsx` lines 8-12):
```javascript
// Deterministic active-section highlight: real scroll-spy relies on a live
// IntersectionObserver + DOM layout that jsdom cannot provide meaningfully,
// so the hook is mocked to a fixed id (see 22-PATTERNS.md open question —
// resolved via stub + hook mock, not a real polyfill).
vi.mock('../../hooks/useActiveSection', () => ({ default: () => 'about' }))
```
For SectionPager, mock to whichever section id is convenient per test (existing behavioral tests assume `hero`/index 0 as the default active state — see below).

**Render helper pattern** (`src/components/react/Nav.test.jsx` lines 14-16):
```javascript
function renderNav(locale = 'en') {
  return render(<Nav locale={locale} hrefEn="/en/" hrefEs="/es/" />)
}
```
→ adapt to:
```javascript
function renderPager(locale = 'en') {
  return render(<SectionPager locale={locale} />)
}
```
No `hrefEn`/`hrefEs` needed — SectionPager has only the `locale` prop.

**Behavioral assertions to carry over unchanged** from `src/components/SectionPager.test.jsx` (full file, 65 lines) — only the render wrapper changes (drop `LanguageProvider`, use `renderPager(lang)` instead of `renderWithLang(lang)`):
- ARIA-labeled button roles: `/back to top/i`, `/previous section/i`, `/next section/i`, `/go to end/i` (lines 25-30)
- Section counter dial `1` / `/7` text (lines 32-36)
- Disabled-state assertions at first section (lines 38-44)
- `window.scrollTo` called on "Go to end" click, with `beforeEach` stub `window.scrollTo = vi.fn()` (lines 21-23, 46-50)
- Progress dial stroke color assertion via `[data-role="dial-progress"]` (lines 52-58)
- Spanish translation assertions: `/volver al inicio/i`, `/ir al final/i` (lines 60-64)

**Import block to copy/adapt** (old, `src/components/SectionPager.test.jsx` lines 1-5):
```javascript
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import SectionPager from './SectionPager'
```
→ new (drop `LanguageProvider` import, add `vi.mock` for `useActiveSection` per Nav's pattern):
```javascript
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SectionPager from './SectionPager'

vi.mock('../../hooks/useActiveSection', () => ({ default: () => 'hero' }))
```
Note: unlike Nav's test (which only needs one mocked active id across all tests since it just toggles a link's CSS class), SectionPager's dial-color test (line 52-58) asserts the *first* section's color (`#00E5A8`/hero), so mocking to `'hero'` keeps that assertion's original semantics — confirm against the ported component's `SECTION_IDS[0]` when writing the test.

---

### `src/pages/en/index.astro` and `src/pages/es/index.astro` (page, request-response)

**Analog:** each file's own current live state (read above) — the same file that received the Nav island mount in Phase 22 is the direct template for adding SectionPager.

**Current live content of both files** (identical except `locale` fallback and file path root `en`/`es`):
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import Nav from '../../components/react/Nav.jsx'
import Hero from '../../components/astro/Hero.astro'
import About from '../../components/astro/About.astro'
import Skill from '../../components/astro/Skill.astro'
import Projects from '../../components/astro/Projects.astro'
import Claude from '../../components/astro/Claude.astro'
import Footer from '../../components/astro/Footer.astro'
import { getRelativeLocaleUrl } from 'astro:i18n'

const locale = Astro.currentLocale ?? 'en'  // 'es' in es/index.astro
const path = Astro.url.pathname.replace(/^\/(en|es)/, '') || '/'
const hrefEn = getRelativeLocaleUrl('en', path)
const hrefEs = getRelativeLocaleUrl('es', path)
---
<BaseLayout>
  <Nav client:load locale={locale} hrefEn={hrefEn} hrefEs={hrefEs} />
  <main>
    <Hero locale={locale} />
    <About locale={locale} />
    <Skill locale={locale} />
    <Projects locale={locale} />
    <Claude locale={locale} />
    <Footer locale={locale} />
  </main>
</BaseLayout>
```

**Change required in both files:**
1. Add import: `import SectionPager from '../../components/react/SectionPager.jsx'`
2. Add `<SectionPager client:visible locale={locale} />` — per CONTEXT.md D-01 use `client:visible` (not `client:load`, unlike Nav), and per D-02 only a `locale` prop is needed (no `hrefEn`/`hrefEs` — SectionPager doesn't render language links). Per CONTEXT.md D-04, placement alongside `<Nav>` (both are `position: fixed` chrome, order doesn't affect visual result — Claude's discretion, but co-locating next to `<Nav client:load .../>` keeps page-level island mounts grouped):
```astro
<BaseLayout>
  <Nav client:load locale={locale} hrefEn={hrefEn} hrefEs={hrefEs} />
  <SectionPager client:visible locale={locale} />
  <main>
    ...
  </main>
</BaseLayout>
```

**Caution:** read each page file live again immediately before editing in the plan — this PATTERNS.md snapshot is from 2026-07-19; if another phase touches these files first, re-verify the current import list and locale fallback line before patching.

---

## Shared Patterns

### Context-removal + props (Phase 22 established pattern)
**Source:** `src/components/react/Nav.jsx` lines 1-4, 19-23
**Apply to:** `src/components/react/SectionPager.jsx`
```javascript
import translations from '../../i18n/translations'
// ...
export default function ComponentName({ locale, ...otherProps }) {
  const t = translations[locale]
  // rest of component body unchanged from old useLanguage() version
}
```

### Island test pattern (no LanguageProvider wrapper, explicit locale prop, useActiveSection mocked)
**Source:** `src/components/react/Nav.test.jsx` lines 8-16
**Apply to:** `src/components/react/SectionPager.test.jsx`
```javascript
vi.mock('../../hooks/useActiveSection', () => ({ default: () => '<fixed-id>' }))

function renderComponent(locale = 'en') {
  return render(<Component locale={locale} {...requiredProps} />)
}
```

### Island mount in Astro page (client:* directive + prop drilling)
**Source:** `src/pages/en/index.astro` line 21, `src/pages/es/index.astro` line 21
**Apply to:** both page files, new SectionPager line
```astro
<Nav client:load locale={locale} hrefEn={hrefEn} hrefEs={hrefEs} />
<SectionPager client:visible locale={locale} />
```
Directive choice is intentional per-component: `client:load` for above-the-fold chrome (Nav), `client:visible` for scroll-gated chrome (SectionPager) — do not copy `client:load` onto SectionPager.

### requestAnimationFrame-throttled scroll listener (shared low-level pattern already used by both Nav's ProgressBar and SectionPager)
**Source:** `src/components/react/Nav.jsx` lines 152-177 (`ProgressBar`) — structurally identical to SectionPager's own scroll handler at `src/components/SectionPager.jsx` lines 96-117. No action needed since SectionPager already has its own working copy of this pattern; noted here only to confirm the idiom is codebase-consistent and should not be altered during the port.

## No Analog Found

None — all 4 files have strong, direct analogs (either a prior-phase island of the same shape, or the file's own pre-migration source/current state).

## Metadata

**Analog search scope:** `src/components/`, `src/components/react/`, `src/hooks/`, `src/pages/en/`, `src/pages/es/`, `src/i18n/`
**Files scanned:** `src/components/SectionPager.jsx`, `src/components/SectionPager.test.jsx`, `src/components/react/Nav.jsx`, `src/components/react/Nav.test.jsx`, `src/hooks/useActiveSection.js`, `src/pages/en/index.astro`, `src/pages/es/index.astro`, `src/i18n/translations.js` (pager* keys only)
**Pattern extraction date:** 2026-07-19
