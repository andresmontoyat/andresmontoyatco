# Phase 22: Nav island — shell navigability - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 5
**Analogs found:** 5 / 5 (all have a direct in-repo analog — this phase ports existing components rather than inventing new ones; only the `client:load` island-mount syntax itself has no prior in-repo precedent)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/react/Nav.jsx` (new island; ports `src/components/Nav.jsx`) | component (island) | request-response (client-hydrated) | `src/components/Nav.jsx` | exact (same file, ported — Context reads swapped for props) |
| `src/components/react/ThemeToggle.jsx` or nested inline (ports `src/components/_shared/ThemeToggle.jsx`) | component (nested in island) | event-driven (click → local state + DOM write) | `src/components/_shared/ThemeToggle.jsx` + `src/i18n/ThemeContext.jsx` | exact (visual/behavioral contract unchanged; state source swapped Context → local `useState`) |
| `src/pages/en/index.astro` (modify) | route | request-response (build-time render + island mount) | `src/pages/en/index.astro` (itself, Phase 21 placeholder) | exact (same file, modified in place) |
| `src/pages/es/index.astro` (modify) | route | request-response (build-time render + island mount) | `src/pages/es/index.astro` (itself, Phase 21 placeholder) | exact (same file, modified in place) |
| `src/components/react/Nav.test.jsx` (new) | test | request-response | `src/components/Skill.test.jsx`, `src/components/About.test.jsx` | role-match (RTL render-and-assert pattern; wrapper differs — props not Context) |
| `src/hooks/useActiveSection.js` | hook | event-driven (IntersectionObserver) | itself — **not modified**, import as-is per D-06 | exact (zero changes) |

## Pattern Assignments

### `src/components/react/Nav.jsx` (component/island, request-response)

**Analog:** `src/components/Nav.jsx` (full 226-line file, already read in full — port near-verbatim per D-01/D-06/D-07)

**Current imports + Context read to REPLACE** (`src/components/Nav.jsx:1-5, 19-22`):
```javascript
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'
import useActiveSection from '../hooks/useActiveSection'
import ThemeToggle from './_shared/ThemeToggle'

export default function Nav() {
  const { lang, setLang, t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const activeSection = useActiveSection(SECTION_IDS)
```

**New shape (per D-02):** drop `useLanguage()` entirely. `Nav` receives `locale` as a prop, imports `translations` directly, and derives `t` and `lang` locally:
```javascript
import translations from '../../i18n/translations'
// ...
export default function Nav({ locale }) {
  const lang = locale
  const t = translations[locale]
  const [menuOpen, setMenuOpen] = useState(false)
  const activeSection = useActiveSection(SECTION_IDS)
```
This mirrors the exact lookup shape `LanguageContext.jsx:24` already uses at runtime (`translations[lang] && translations[lang].meta`) — same object-indexing pattern, just sourced from a prop instead of `useState`/`localStorage`.

**Core pattern — NAV_ITEMS/SECTION_IDS single source of truth, unchanged (D-07)** (`src/components/Nav.jsx:7-17`):
```javascript
// Single source of truth for primary navigation (Phase 9 review WR-07).
// SECTION_IDS (scroll-spy), DesktopNav and MobileMenu all derive from this list.
const NAV_ITEMS = [
  { id: 'about',       labelKey: 'about' },
  { id: 'skills',      labelKey: 'skills' },
  { id: 'experience',  labelKey: 'experience' },
  { id: 'projects',    labelKey: 'projects' },
  { id: 'claude-code', labelKey: 'claudeCode' },
  { id: 'contact',     labelKey: 'contact' },
]
const SECTION_IDS = NAV_ITEMS.map((item) => item.id)
```
Copy this block verbatim into the island file, module-level, outside the component (D-07 — stays exactly where it is today).

**Header/DesktopNav/ProgressBar/MobileMenu structure — port verbatim** (`src/components/Nav.jsx:24-88, 124-226`): the JSX for `<header>`, `<ProgressBar/>`, `<DesktopNav/>`, the mobile hamburger `<button>`, and `<MobileMenu>` (including its `createPortal(overlay, document.body)` at line 225) all carry over with zero logic changes per D-06. Only prop-threading changes: `t`/`lang`/`activeSection` are now derived from the `locale` prop instead of destructured from `useLanguage()`.

**LangPill — the ONE section requiring real logic changes (D-04, D-05):**

Current implementation to replace (`src/components/Nav.jsx:90-122`):
```javascript
function LangPill({ lang, setLang, t }) {
  const base = 'px-3 py-1.5 rounded-full transition-colors duration-150 font-mono text-xs'
  const active = 'bg-brand-gradient text-ink-900 font-extrabold'
  const inactive = 'text-text-secondary font-normal'
  return (
    <div role="group" aria-label={t.nav.langGroup} className="flex gap-0.5 bg-ink-500 border border-ink-400 rounded-full p-0.5">
      <button type="button" onClick={() => setLang('en')} className={`${base} ${lang === 'en' ? active : inactive}`}
        aria-label={t.nav.langSwitchEn} aria-pressed={lang === 'en'}>
        EN
      </button>
      <button type="button" onClick={() => setLang('es')} className={`${base} ${lang === 'es' ? active : inactive}`}
        aria-label={t.nav.langSwitchEs} aria-pressed={lang === 'es'}>
        ES
      </button>
    </div>
  )
}
```
**What to keep:** the exact `role="group"` + `aria-label`/`aria-pressed` a11y shape (WR-09 comment at line 94-95), the `active`/`inactive` Tailwind class split, the `base` class string.
**What to change:** `<button onClick={() => setLang('en')}>` → `<a href={hrefFor('en')}>` (per D-04, using `getRelativeLocaleUrl` — see BaseLayout analog below), keeping `aria-pressed`/`aria-label` on the `<a>` for the currently-active locale. `aria-pressed` stays computed from the `locale` prop (`lang === 'en'`), not from any local state — this is a link, not a toggle.

### `src/components/react/ThemeToggle.jsx` (nested component, event-driven)

**Analog 1 — visual contract, port verbatim** (`src/components/_shared/ThemeToggle.jsx:1-40`, full file):
```javascript
import React from 'react'
import { useTheme } from '../../i18n/ThemeContext'
import { useLanguage } from '../../i18n/LanguageContext'

function SunIcon() { /* ... */ }
function MoonIcon() { /* ... */ }

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'
  const label = isDark ? t.nav.themeLight : t.nav.themeDark
  return (
    <button type="button" onClick={toggleTheme} aria-label={label} title={label}
      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-text-secondary hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-safe:transition-colors duration-200">
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
```
`SunIcon`/`MoonIcon` SVG markup (lines 5-20) and the button's className/`min-h-[44px] min-w-[44px]` tap-target sizing carry over unchanged. `t` now comes as a prop from `Nav` (already-resolved `translations[locale]`), not `useLanguage()`.

**Analog 2 — Context state logic to inline as local `useState` (D-03):** `src/i18n/ThemeContext.jsx` (full 56-line file, already read):
```javascript
const STORAGE_KEY = 'cam-theme'
const DEFAULT_THEME = 'dark'
const VALID_THEMES = ['dark', 'light']

function readInitialTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && VALID_THEMES.includes(stored)) return stored
  } catch (e) {
    // localStorage blocked (private mode, etc) — fall through
  }
  return DEFAULT_THEME
}
// ...
useEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch (e) {
    // localStorage blocked — ignore
  }
}, [theme])

const toggleTheme = useCallback(() => {
  setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
}, [])
```
**Per D-03, replace the read source only:** instead of `readInitialTheme()` reading `localStorage` first (line 10), the island's local `useState` initializer must read `document.documentElement.dataset.theme` — already set correctly pre-paint by Phase 21's `BaseLayout.astro` blocking script (see below) — falling back to `'dark'` only if that attribute is somehow absent (SSR/no-JS edge case). The `STORAGE_KEY = 'cam-theme'` constant, the `VALID_THEMES` allowlist, and both `try/catch` guards around `localStorage` (private-mode safety) carry over unchanged. `toggleTheme`'s flip logic (`prev === 'dark' ? 'light' : 'dark'`) also carries over unchanged.

**The pre-paint script `ThemeToggle` must stay in sync with** (`src/layouts/BaseLayout.astro:117-134`, already deployed in Phase 21):
```javascript
<script is:inline>
  // ISLAND-04: blocking, runs before paint — flips theme pre-paint (kills FOUC).
  // Mirrors src/i18n/ThemeContext.jsx's readInitialTheme() exactly:
  // storage key 'cam-theme', default 'dark', try/catch for private-mode safety.
  (function () {
    var STORAGE_KEY = 'cam-theme'
    var DEFAULT_THEME = 'dark'
    var VALID_THEMES = ['dark', 'light']
    var theme = DEFAULT_THEME
    try {
      var stored = localStorage.getItem(STORAGE_KEY)
      if (stored && VALID_THEMES.indexOf(stored) !== -1) theme = stored
    } catch (e) {
      // localStorage blocked (private mode, etc) — fall through to default
    }
    document.documentElement.dataset.theme = theme
  })()
</script>
```
**Load-bearing constraint (Pitfall 6, `.planning/research/PITFALLS.md`):** `ThemeToggle`'s initial React state MUST be derived by reading `document.documentElement.dataset.theme` on mount (already correct, set by the script above before React hydrates) — never a hardcoded default re-computed post-mount, or a visible icon flicker reintroduces the FOUC the migration is meant to eliminate.

### `src/pages/en/index.astro`, `src/pages/es/index.astro` (route, modify in place)

**Analog:** the files themselves, Phase 21 placeholders (both already read, full 11-line files, identical structure):
```astro
---
// src/pages/en/index.astro — thin locale entry, proves the /en route tree
// resolves through BaseLayout (ROUTE-01). Content-section components
// (Hero/About/etc.) migrate in Phase 22+ per the phase boundary.
import BaseLayout from '../../layouts/BaseLayout.astro'
---
<BaseLayout>
  <main>
    <h1>Carlos Montoya</h1>
  </main>
</BaseLayout>
```
**What changes this phase:** import `Nav` from `../../components/react/Nav.jsx` (or wherever Claude's-discretion places it) and mount it with `client:load` + a locale literal — the `/en` file hardcodes `locale="en"`, the `/es` file hardcodes `locale="es"` (Astro's per-route static generation means each locale tree is its own file, so `Astro.currentLocale` could also be used for symmetry with `BaseLayout.astro`'s own `const locale = Astro.currentLocale ?? 'en'` pattern, lines 16-17):
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import Nav from '../../components/react/Nav.jsx'
const locale = Astro.currentLocale ?? 'en'
---
<BaseLayout>
  <Nav client:load locale={locale} />
  <main>
    <h1>Carlos Montoya</h1>
  </main>
</BaseLayout>
```
**`getRelativeLocaleUrl` usage precedent for LangPill hrefs** (`src/layouts/BaseLayout.astro:8, 37-38`, D-04's required helper):
```javascript
import { getRelativeLocaleUrl } from 'astro:i18n'
// ...
const hreflangEn = new URL(getRelativeLocaleUrl('en', path), siteUrl).toString()
const hreflangEs = new URL(getRelativeLocaleUrl('es', path), siteUrl).toString()
```
This is the *only* place `getRelativeLocaleUrl` is used in the repo today — it's imported and called with `(locale, path)` and returns a locale-prefixed relative path (e.g. `/es/`). `Nav`'s `LangPill`, however, runs **client-side inside a hydrated island**, not in `.astro` frontmatter — `astro:i18n` server-only helpers are not importable inside island component code. **No in-repo analog exists for calling `getRelativeLocaleUrl` from client-side JS**; flag for planner: either (a) compute both `/en`+`/es` hrefs in the `.astro` page frontmatter and pass them as props into `<Nav client:load hrefEn={...} hrefEs={...} locale={locale} />`, or (b) hardcode the two-locale prefix swap client-side (`window.location.pathname.replace(/^\/(en|es)/, `/${target}`)`) since there are only two locales and `prefixDefaultLocale: true` guarantees both are always prefixed. Option (a) keeps `astro:i18n` as the single source of truth per D-04's spirit; RESEARCH.md/ARCHITECTURE.md do not resolve this explicitly — planner must decide.

**`Astro.url.pathname` locale-stripping precedent** (`src/layouts/BaseLayout.astro:21`):
```javascript
// Un-prefixed path, shared by canonical + all hreflang alternates
const path = Astro.url.pathname.replace(/^\/(en|es)/, '') || '/'
```
Same regex shape is the natural building block for D-04's "preserve current section hash" + locale-swap logic, whichever side (frontmatter vs client) ends up owning it.

### `src/components/react/Nav.test.jsx` (test, request-response)

**Analog 1 — RTL render-and-assert scaffold:** `src/components/Skill.test.jsx` (full 105-line file, already read) and `src/components/About.test.jsx` (full 95-line file, already read) — both follow the same shape:
```javascript
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import Skill from './Skill'

function renderWithLang(lang = 'en') {
  setLangBeforeRender(lang)
  return render(
    <LanguageProvider>
      <Skill />
    </LanguageProvider>,
  )
}

describe('Skill (v4.0 Slice 4)', () => {
  it('renders the section with id="skills"', () => { /* ... */ })
  it('renders label + heading + intro (EN)', () => { /* ... */ })
  it('translates h2/intro/category-titles when lang=es', () => { /* ... */ })
})
```
**What carries over:** the `describe()`-per-component / `it()`-per-behavior structure, the "render EN, assert EN strings; render ES, assert ES strings" bilingual-coverage habit (present in every existing component test), and `@testing-library/react`'s `render`/`screen` imports.

**What must change (per PITFALLS.md's explicit test-tool guidance — Nav is a `client:*` island, so RTL stays the right tool, only the wrapper changes):** drop the `<LanguageProvider>` wrapper entirely — `Nav` now takes `locale` as a direct prop, so the render helper becomes:
```javascript
import Nav from './Nav'

function renderNav(locale = 'en') {
  return render(<Nav locale={locale} />)
}

describe('Nav island (Phase 22)', () => {
  it('renders the sticky header with primary nav links (EN)', () => {
    renderNav('en')
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })
  it('translates nav links when locale=es', () => {
    renderNav('es')
    expect(screen.getByText('Sobre mí')).toBeInTheDocument()
    expect(screen.getByText('Contacto')).toBeInTheDocument()
  })
  // scroll-spy: useActiveSection needs target elements with matching ids in the DOM;
  // mirror useActiveSection.js's own IntersectionObserver contract — jsdom does not
  // implement IntersectionObserver natively, check src/test/setup.jsx for an existing
  // stub before assuming scroll-spy is testable as-is (none found there today — flag
  // for planner as a possible new setup.jsx addition, same pattern as the existing
  // HTMLCanvasElement.getContext stub at src/test/setup.jsx:9-11).
})
```
**No stub for `IntersectionObserver` exists yet in `src/test/setup.jsx`** (already read in full, 49 lines) — only `HTMLCanvasElement.getContext` and the Node-22 `localStorage`/`sessionStorage` jsdom bridge are stubbed there. `useActiveSection.js` (`src/hooks/useActiveSection.js:15`) calls `new IntersectionObserver(...)` unconditionally when `document`/`IntersectionObserver` are defined — planner should decide whether the Nav test needs a jsdom `IntersectionObserver` polyfill/mock or can assert scroll-spy behavior is *absent* by design in jsdom (falls back gracefully since `typeof IntersectionObserver === 'undefined'` guard exists at line 7).

**Bilingual translation source these tests assert against** (`src/i18n/translations.js:3-28` EN, `:56-81` ES — full `nav` subtree, already read):
```javascript
nav: {
  about: 'About', skills: 'Skills', experience: 'Experience', projects: 'Projects',
  claudeCode: 'Claude Code', contact: 'Contact', menuOpen: 'Open menu', menuClose: 'Close',
  themeLight: 'Switch to light mode', themeDark: 'Switch to dark mode',
  langGroup: 'Language', langSwitchEn: 'Switch to English', langSwitchEs: 'Switch to Spanish',
  // ... (pagerGroup/pagerTop/etc. belong to SectionPager, Phase 25 — out of scope here)
}
```
No `nav` key changes are needed this phase — the shape already supports everything D-01 through D-07 require.

## Shared Patterns

### `translations[locale]` direct-import + prop-indexing (replaces `useLanguage()`)
**Source:** `src/i18n/LanguageContext.jsx:24` (`translations[lang] && translations[lang].meta`) and `src/layouts/BaseLayout.astro:9, 17` (`import translations from '../i18n/translations.js'` / `const meta = translations[locale]?.meta`)
**Apply to:** `Nav.jsx` and `ThemeToggle.jsx` — both drop `useLanguage()`/Context entirely and index the same `translations` module by a `locale`/`lang` value received as a prop, matching the exact object-indexing idiom already established in `BaseLayout.astro` this same migration.

### `cam-theme` / `cam-lang` storage-key naming (locked, Phase 21 correction)
**Source:** `src/i18n/ThemeContext.jsx:3` (`const STORAGE_KEY = 'cam-theme'`), `src/i18n/LanguageContext.jsx:12,45` (`'cam-lang'` inlined), `.planning/phases/21-.../21-PATTERNS.md` (explicit correction: research examples used generic `'theme'`, repo's real key is `'cam-theme'`)
**Apply to:** `ThemeToggle.jsx`'s local `toggleTheme` write (`localStorage.setItem('cam-theme', next)`, D-03) and `LangPill`'s cookie write (`document.cookie = 'cam-lang=' + targetLocale + ...`, D-05) — both keys are locked, do not rename or reintroduce the `'theme'` typo Phase 21 already caught.

### `try/catch` guard around all `localStorage`/cookie writes
**Source:** `src/i18n/ThemeContext.jsx:9-14, 30-34` (private-mode safety, already the established repo convention, reconfirmed by Phase 21's PATTERNS.md as the correction to apply everywhere `localStorage` is touched)
**Apply to:** `ThemeToggle.jsx`'s local state read/write (D-03 explicitly calls this out) and `LangPill`'s `document.cookie` write (D-05) — wrap both in `try/catch` even though `document.cookie` assignment rarely throws, for consistency with the repo's blanket "storage access can fail in private mode" habit.

### `typeof window/document === 'undefined'` SSR-safety guards
**Source:** `src/hooks/useActiveSection.js:7` (`if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return undefined`), `src/components/Nav.jsx:167, 179` (`MobileMenu`'s `typeof document === 'undefined'` checks before `createPortal`)
**Apply to:** any new client-only logic in the ported `Nav.jsx`/`ThemeToggle.jsx` that reads `window.location.hash` (D-04) or `document.documentElement.dataset.theme` (D-03) on first render — island components still execute their function body during Astro's server-side initial render pass in some hydration strategies, so guard any browser-only global access the same way the existing hooks already do.

## No Analog Found

| File / Pattern | Role | Data Flow | Reason |
|---|---|---|---|
| `client:load` directive syntax on `<Nav client:load locale={locale} />` | route (island mount) | request-response | First interactive island mount anywhere in this repo — Phase 21 only proved `.astro`-to-`.astro` composition (`BaseLayout` + thin page bodies), never an Astro-to-React island boundary. Use `.planning/research/STACK.md:84-85` and `SUMMARY.md:126` (Context7-verified pattern) as the primary source, not a codebase analog. |
| Client-side `getRelativeLocaleUrl` equivalent for `LangPill` hrefs | component (island) | event-driven | `getRelativeLocaleUrl` (`astro:i18n`) is only ever called from `.astro` frontmatter in this repo (`BaseLayout.astro:37-38`) — no precedent for computing locale-swap URLs inside a hydrated React island. Planner must choose prop-passthrough-from-frontmatter vs. client-side regex per the flag above. |
| jsdom `IntersectionObserver` polyfill for testing scroll-spy | test (setup) | — | `src/test/setup.jsx` has no such stub today; `useActiveSection.js` already degrades gracefully when it's undefined, so this may not block Phase 22's tests, but flag for planner if scroll-spy assertions are required. |

## Metadata

**Analog search scope:** `src/components/Nav.jsx`, `src/components/_shared/ThemeToggle.jsx`, `src/hooks/useActiveSection.js`, `src/i18n/{LanguageContext,ThemeContext,translations}.js`, `src/layouts/BaseLayout.astro`, `src/pages/{en,es}/index.astro`, `src/components/{Skill,About}.test.jsx`, `src/test/setup.jsx`, `vitest.config.ts`, `.planning/research/{STACK,SUMMARY,FEATURES,PITFALLS}.md`, `.planning/phases/21-.../21-PATTERNS.md`
**Files scanned:** 13 (all small enough for single-pass full reads; no file in this repo exceeded the 2,000-line large-file threshold)
**Pattern extraction date:** 2026-07-19

---
*Phase-level pattern map for: 22-nav-island-shell-navigability*
*Consumes: 22-CONTEXT.md*
