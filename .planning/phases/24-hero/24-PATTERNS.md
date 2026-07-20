# Phase 24: Hero - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 7 (2 new components, 2 new scripts, 1 modified component, 1 modified test, 2 page mounts counted as 1 shared pattern)
**Analogs found:** 6 / 7 (1 file — the new `src/scripts/` directory — has no direct in-repo analog; closest reference is BaseLayout's inline theme-flip script, noted below as weak precedent)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|----------------|
| `src/components/astro/Hero.astro` | component (Astro, zero-JS section) | request-response (SSG, build-time translations resolution) | `src/components/astro/Footer.astro` | exact (same `translations[locale]` idiom, no JSON data file) |
| `src/components/astro/Hero.test.ts` | test (Container API) | request-response | `src/components/astro/Footer.test.ts` | exact |
| `src/scripts/count-up.js` | utility (vanilla enhancer, DOM-scoped) | event-driven (IntersectionObserver → rAF loop) | `src/layouts/BaseLayout.astro`'s inline theme-flip script (lines 117-134) | weak (only existing vanilla-JS-in-Astro precedent; different loading mechanism — `is:inline` vs `<script src>`) |
| `src/scripts/details-dismiss.js` | utility (vanilla enhancer, DOM-scoped) | event-driven (keydown/click listeners) | same as above | weak |
| `src/components/astro/About.astro` (modified) | component (Astro, zero-JS section) | request-response (SSG, build-time JSON resolution) | itself (Phase 23 baseline) — this phase only adds `data-count-up`/`data-target` attrs + a `<script src="../../scripts/count-up.js">` tag | exact (self-analog, additive edit only) |
| `src/components/astro/About.test.ts` (modified) | test (Container API) | request-response | itself (Phase 23 baseline) — add assertions for new `data-count-up` attributes | exact (self-analog, additive edit only) |
| `src/pages/en/index.astro` / `src/pages/es/index.astro` (modified) | route (Astro page) | request-response | themselves (current mount list: `About`, `Skill`, `Projects`, `Claude`, `Footer`) | exact (add one import + one mount line, matches existing pattern) |

## Pattern Assignments

### `src/components/astro/Hero.astro` (component, request-response)

**Analog:** `src/components/astro/Footer.astro` (translations.js idiom) + `src/components/Hero.jsx` (markup/Tailwind to port) + RESEARCH.md Patterns 1-3 (already-verified conversion code)

**Why Footer.astro, not About.astro/Skill.astro:** Hero's copy lives in `src/i18n/translations.js` under `t.hero`/`t.stats` — there is no `src/data/hero.json`. About.astro and Skill.astro are JSON-data-driven (wrong shape for this file). Footer.astro is the only existing Astro section that reads directly from `translations[locale]`, making it the structurally correct analog for the frontmatter shape.

**Imports + locale resolution pattern** (`src/components/astro/Footer.astro` lines 1-12):
```astro
---
// No dedicated JSON file — sources copy from translations[locale].footer
// (BaseLayout.astro's resolution idiom) ...
import translations from '../../i18n/translations.js'

const { locale } = Astro.props
const footerCopy = translations[locale]?.footer
```
Apply to Hero as:
```astro
---
import translations from '../../i18n/translations.js'

const { locale } = Astro.props
const t = translations[locale] ?? translations.en
```

**Source markup to port near-verbatim** (`src/components/Hero.jsx` full file, 257 lines) — key sections:
- Hero photo layer + overlay: lines 149-159 (drop the `#hero-static` duplicate-DOM workaround per D-08 — confirmed BaseLayout only carries a `<link rel="preload">`, nothing to clean up there)
- Status badge: lines 162-168
- H1 three-line block: lines 170-199 — replace the `useCharReveal`-driven middle `<span>` (lines 181-192, including the blinking cursor `{!isComplete && <span>|</span>}`) with the CSS `steps()` approach from RESEARCH.md Pattern 1 (`hero-reveal` class, `--reveal-chars` custom property, no cursor element, no JS)
- Lead paragraph: lines 201-206
- CTA row (contact link + CvDownload + LinkedIn/GitHub SVGs): lines 208-243 — replace `CvDownload`/`CvMenuItem` (lines 82-135) with the native `<details>` markup from RESEARCH.md Pattern 3
- Stats grid: lines 245-253 — replace `Stat`/`useCountUp` (lines 43-80) with static `data-count-up`/`data-count-up-template` spans per RESEARCH.md Pattern 2, plus one shared `<script src="../../scripts/count-up.js">` tag

**Char-reveal → CSS steps() replacement** (RESEARCH.md Pattern 1, verified against `.font-pixel` at `src/index.css:242-244`):
```astro
---
const midLine = t.hero.h1b
const charCount = midLine.length
---
<span class="hero-reveal inline-block overflow-hidden whitespace-nowrap align-bottom bg-brand-gradient bg-clip-text text-transparent" style={`--reveal-chars: ${charCount}`}>{midLine}</span>
```
Add to `src/index.css` alongside the existing `.font-pixel` utility and the global reduced-motion override (`src/index.css:314-323`):
```css
.hero-reveal { width: 0; vertical-align: bottom; }
@media (prefers-reduced-motion: no-preference) {
  .hero-reveal { animation: hero-typewriter 1.2s steps(var(--reveal-chars), end) 300ms forwards; }
}
@keyframes hero-typewriter { from { width: 0; } to { width: calc(var(--reveal-chars) * 1ch); } }
```

**Count-up markup + build-time regex** (RESEARCH.md Pattern 2, mirrors `Hero.jsx`'s own `Stat` component's `num.match(/\d+/)`/`num.replace(/\d+/, n)` logic — lines 65-69 of the source — just moved to build time):
```astro
---
function statParts(num) {
  const match = num.match(/\d+/)
  const target = match ? Number(match[0]) : 0
  const template = match ? num.replace(/\d+/, '{n}') : num
  return { target, template }
}
const yearsStat = statParts('18+')
---
<span data-count-up={yearsStat.target} data-count-up-template={yearsStat.template}>18+</span>
<script src="../../scripts/count-up.js"></script>
```

**CV dropdown → native `<details>`** (RESEARCH.md Pattern 3; drops `role="menu"`/`role="menuitem"` per Open Question 1's recommendation — flag this as a deliberate a11y decision in the plan, not silent):
```astro
<details class="details-dismiss relative group">
  <summary class="inline-flex items-center gap-2 min-h-[44px] px-4 py-3 rounded-full font-extrabold text-xs font-mono bg-transparent text-text-primary border border-ink-400 hover:border-brand hover:text-brand transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
    <span aria-hidden="true">⬇</span> {t.hero.cv}
    <span aria-hidden="true" class="transition-transform duration-200 group-open:rotate-180">▾</span>
  </summary>
  <div class="absolute left-0 mt-2 min-w-[160px] rounded-xl border border-ink-400 bg-ink-900/95 backdrop-blur-md p-1 z-50 shadow-brand-lg">
    <a href="/CarlosMontoya_CV_EN.pdf" download class="block px-4 py-2 rounded-lg text-xs font-mono text-text-secondary hover:bg-ink-500 hover:text-brand transition-colors">{t.hero.cvEn}</a>
    <a href="/CarlosMontoya_CV_ES.pdf" download class="block px-4 py-2 rounded-lg text-xs font-mono text-text-secondary hover:bg-ink-500 hover:text-brand transition-colors">{t.hero.cvEs}</a>
  </div>
</details>
<script src="../../scripts/details-dismiss.js"></script>
```
Required companion CSS (marker removal, cross-browser — add near `.hero-reveal`):
```css
summary { list-style: none; }
summary::-webkit-details-marker { display: none; }
```

**No error handling / no validation section** — this component has zero external input, zero try/catch (matches Footer.astro/About.astro/Skill.astro precedent — none of the Phase 23 Astro sections have error handling either, per RESEARCH.md's Security Domain section confirming zero attack surface).

---

### `src/components/astro/Hero.test.ts` (test, request-response)

**Analog:** `src/components/astro/Footer.test.ts` (translations-sourced Container API test — closer than `About.test.ts` which asserts against JSON, not `t`)

**Full structural pattern to copy** (`src/components/astro/Footer.test.ts` lines 1-16):
```ts
// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import Hero from './Hero.astro'

async function renderHero(locale = 'en') {
  const container = await AstroContainer.create()
  return container.renderToString(Hero, { props: { locale } })
}
```
Note the mandatory `// @vitest-environment node` header (esbuild/jsdom incompatibility, documented in `src/pages/_404.test.ts` lines 23-29) — every `.astro` Container API test file in this repo carries this exact comment/pragma; do not omit it.

**Assertions to port from `src/components/Hero.test.jsx`** (RTL baseline, full file read — adapt each `it` block to string-matching against `renderToString()` output instead of DOM queries/`fireEvent`):
- H1 `aria-label` EN/ES (lines 33-43) → `expect(result).toContain('aria-label="Solutions Architect &amp; Senior Backend Engineer."')` (HTML-entity-encode `&`)
- Lead paragraph text EN/ES (lines 45-53)
- Primary CTA `href="#contact"` (lines 57-61)
- CV dropdown: **cannot** port the `fireEvent.click`-then-assert-visible pattern (lines 63-81) as-is — `<details>` renders both closed and open panel content in static HTML (no client JS in Container API render); instead assert the `<details>` element exists, both PDF links are present in the rendered string (native `<details>` always includes the panel markup, visibility is CSS/attribute-driven not DOM-presence-driven), and neither `role="menu"` nor `role="menuitem"` appears (regression guard for D-05's dropped-roles decision)
- LinkedIn/GitHub `aria-label`/`rel`/`target` (lines 83-93)
- No `.docx` links (lines 95-98) — still valid, port verbatim
- Hero photo layer: `img[src="/me-800.webp"]` inside `#hero > div[aria-hidden="true"]` (lines 101-110) — string-match equivalent: `expect(result).toContain('src="/me-800.webp"')`
- **New assertions this phase must add** (not in the RTL baseline, since these are new mechanisms): `data-count-up`/`data-count-up-template` attributes present on all 4 stat spans; `<script src="../../scripts/count-up.js">` and `<script src="../../scripts/details-dismiss.js">` tags present exactly once each; no `role="menu"`/`role="menuitem"` strings present (D-05 regression guard, see `About.test.ts` line 61-64's "no raw markup" negative-assertion style for the pattern to copy)

---

### `src/scripts/count-up.js` (utility, event-driven)

**Analog:** No true in-repo analog (first file in a new `src/scripts/` directory). Closest structural precedent is `src/layouts/BaseLayout.astro`'s inline theme-flip script (lines 117-134) for *code style only* (IIFE-free here since this is a real module file, but matches the repo's vanilla-JS conventions: no semicolons, `try`/`catch` guards for environment safety, comment explaining *why* not *what*).

**Full implementation — already fully specified in RESEARCH.md Pattern 2 (lines 160-214), reproduce verbatim:**
```js
// src/scripts/count-up.js
const DURATION_MS = 1100
const SELECTOR = '[data-count-up]'

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function animate(el) {
  const target = Number(el.dataset.countUp)
  if (!Number.isFinite(target)) return
  const template = el.dataset.countUpTemplate || '{n}'
  const setDisplay = (n) => { el.textContent = template.replace('{n}', String(n)) }

  if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
    setDisplay(target)
    return
  }
  let startTs = null
  function tick(ts) {
    if (startTs === null) startTs = ts
    const p = Math.min(1, (ts - startTs) / DURATION_MS)
    setDisplay(Math.round(target * (1 - (1 - p) ** 3)))
    if (p < 1) requestAnimationFrame(tick)
  }
  setDisplay(0)
  requestAnimationFrame(tick)
}

function init() {
  const els = document.querySelectorAll(SELECTOR)
  if (els.length === 0) return
  if (typeof IntersectionObserver !== 'function') {
    els.forEach(animate)
    return
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target)
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.4 })
  els.forEach((el) => observer.observe(el))
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
```
**Cubic ease-out curve is ported verbatim from `Hero.jsx`'s `useCountUp`** (`1 - (1 - p) ** 3`, line 55) — same math, just moved from a React `useEffect`/`requestAnimationFrame` pair to a plain function.

**Error handling:** none needed — `Number.isFinite` guard on malformed `data-target`, `typeof` guards on `matchMedia`/`requestAnimationFrame`/`IntersectionObserver` for older-browser safety (mirrors `Hero.jsx`'s own `prefersReducedMotion()` typeof guards, lines 37-41, and `BaseLayout.astro`'s `try`/`catch` around `localStorage`, lines 126-131 — same "defensive browser API access" convention).

**D-04's tuning note:** if visual QA shows the count-up starting before Hero's 850ms stats-block fade-in completes (RESEARCH.md Open Question 2), add a fixed offset inside `animate()` before the first `requestAnimationFrame` call — implementation detail, not a structural change to this file.

---

### `src/scripts/details-dismiss.js` (utility, event-driven)

**Analog:** Same weak precedent as `count-up.js` (BaseLayout inline script, code-style only) + `Hero.jsx`'s own `CvDownload` `useEffect` (lines 100-110) for the *logic* being ported (this is a direct mechanical translation from React event listeners to vanilla ones).

**Full implementation — already fully specified in RESEARCH.md Pattern 3 (lines 264-280), reproduce verbatim:**
```js
// src/scripts/details-dismiss.js
// Progressive-enhancement layer for <details class="details-dismiss">:
// adds Escape-to-close and outside-click-to-close. Base open/close via
// clicking <summary> works with zero JS — this script is additive only.
document.querySelectorAll('details.details-dismiss').forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.open) {
      el.open = false
      el.querySelector('summary')?.focus()
    }
  })
  document.addEventListener('click', (e) => {
    if (el.open && !el.contains(e.target)) el.open = false
  })
})
```
**Direct mapping from the code being replaced** (`Hero.jsx` lines 100-110):
```js
useEffect(() => {
  if (!open) return undefined
  function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
  function onKey(e) { if (e.key === 'Escape') setOpen(false) }
  document.addEventListener('mousedown', onDoc)
  document.addEventListener('keydown', onKey)
  return () => { ... }
}, [open])
```
Note: `mousedown` → `click` in the vanilla version (RESEARCH.md's deliberate choice, matches the `chrisnajman/details-dropdown-menu` reference implementation cited in Sources) and `setOpen(false)` → `el.open = false` (native `<details>` property) plus an explicit `.focus()` return-to-summary step the React version never had (accessibility improvement, not parity requirement).

**Generic-by-design constraint (D-06):** selector is `details.details-dismiss`, not Hero-specific — Phase 26's Experience section may reuse this file unmodified. Do not hardcode any Hero-specific class/id inside this script.

---

### `src/components/astro/About.astro` (MODIFIED, follow-up edit per D-03)

**Analog:** itself — this is an additive edit to the Phase 23 file already read in full above (54 lines). **Do not rewrite** — only touch the quick-facts `<li>` block (lines 37-49).

**Current markup to edit** (lines 41-47):
```astro
<span class="flex items-center gap-2.5 text-muted transition-colors duration-200 group-hover:text-text">
  <span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/40 ..." />
  {pick(f.kLabel, locale)}
</span>
<span class="text-right font-extrabold text-text transition-colors duration-200 group-hover:text-accent">
  {pick(f.value, locale)}
</span>
```
**Add `data-count-up`/`data-count-up-template` to the value `<span>`** for any fact whose `value` contains a leading/embedded number (per `about.json`'s "Experience" fact, e.g. `"18+ years"` / `"+18 años"`) — use the same `statParts()`-style regex helper as Hero.astro (define locally in About.astro's frontmatter, or extract to a tiny shared util if the plan prefers — Claude's discretion per RESEARCH.md's "organizational detail" note). Facts without an embedded number (Location, Current role, Languages, Work mode) render unchanged — do not add the attribute to those.

**Add the shared script tag** once, after the closing `</aside>` or inside it — mirrors Hero.astro's own `<script src="../../scripts/count-up.js">` tag exactly (same relative path depth: both files live at `src/components/astro/`).

**Flag for the plan:** this is the ONLY file outside `Hero.astro`/`src/scripts/` this phase touches (per CONTEXT.md D-03) — keep the diff surgical (attribute + script tag additions only), do not restructure the existing `.map()` loop or `pick()` helper.

---

### `src/components/astro/About.test.ts` (MODIFIED)

**Analog:** itself (54 lines, already read in full above).

**Existing assertion to extend, not replace** — the "renders all 5 quick-fact rows" test (lines 34-48) currently asserts on the *static* settled string (`expect(result).toMatch(/\d+\+ years/)`, line 45, with an explicit comment: *"Static value renders verbatim (no count-up on mount per D-04)"*). This comment is now **stale** and must be updated/removed once D-03's follow-up lands — the value still renders as the static string in Container API output (no client JS runs during `renderToString()`), but the reasoning comment referencing D-04's deferral is outdated.

**New assertions to add** (mirror `Hero.test.ts`'s new count-up assertions above): `data-count-up`/`data-count-up-template` present on the Experience fact's value span; `<script src="../../scripts/count-up.js">` tag present exactly once.

---

### `src/pages/en/index.astro` / `src/pages/es/index.astro` (MODIFIED)

**Analog:** themselves — both files are near-identical (only `locale` fallback differs: `'en'` vs `'es'`, per lines 14 of each). Both currently import/mount `About`, `Skill`, `Projects`, `Claude`, `Footer` in that order (no Hero yet — confirmed live read, no `<h1>Carlos Montoya</h1>` placeholder currently exists in either file to remove, contrary to CONTEXT.md's description; the mount is a pure addition, not a replacement).

**Pattern to copy** (both files, full content read above):
```astro
import Hero from '../../components/astro/Hero.astro'
```
Add as the import immediately before `About`, and mount `<Hero locale={locale} />` as the first child inside `<main>`, immediately before `<About locale={locale} />` — matches every other section's `locale={locale}` prop-passing convention exactly (no deviation needed).

**Apply this identical edit to BOTH `en/index.astro` and `es/index.astro`** — they must stay structurally in sync (established convention, both files are otherwise byte-for-byte parallel except the `locale` fallback).

---

## Shared Patterns

### `translations[locale]` build-time resolution
**Source:** `src/components/astro/Footer.astro` lines 8-11, `src/layouts/BaseLayout.astro` lines 9/17
**Apply to:** `Hero.astro` (only Astro section in this phase reading `t.hero`/`t.stats` instead of a JSON data file)
```astro
import translations from '../../i18n/translations.js'
const { locale } = Astro.props
const t = translations[locale] ?? translations.en
```

### Astro Container API test skeleton
**Source:** `src/components/astro/Footer.test.ts` lines 1-16, `src/pages/_404.test.ts` lines 1-29 (esbuild/jsdom rationale)
**Apply to:** `Hero.test.ts` (new), `About.test.ts` (extended)
```ts
// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import Component from './Component.astro'

async function renderComponent(locale = 'en') {
  const container = await AstroContainer.create()
  return container.renderToString(Component, { props: { locale } })
}
```

### `prefers-reduced-motion` dual-layer guard
**Source:** global CSS override `src/index.css:314-323` (blanket `animation-duration: 0.01ms !important`) + `Hero.jsx`'s own JS-side `prefersReducedMotion()` (lines 37-41)
**Apply to:** `.hero-reveal` CSS animation relies on the global CSS override alone (no JS guard needed — confirmed by RESEARCH.md Pattern 1); `count-up.js` needs its own JS-side `matchMedia` check because `requestAnimationFrame` loops are not CSS-animation-driven and the global override cannot gate them.

### Defensive browser-API access (typeof guards, try/catch)
**Source:** `src/layouts/BaseLayout.astro` lines 121-131 (`try`/`catch` around `localStorage`), `Hero.jsx` lines 37-41 (`typeof window.matchMedia === 'function'`)
**Apply to:** both new `src/scripts/` files — guard `matchMedia`, `requestAnimationFrame`, `IntersectionObserver` before use (older-browser/non-browser-environment safety), matching the repo's existing convention rather than assuming universal support.

### Shared `<script src>` module (not `is:inline`, not duplicated per-component)
**Source:** RESEARCH.md Pattern 2's explicit rationale (ESM module-graph dedup vs Astro's same-component-only dedup guarantee); contrast with `BaseLayout.astro`'s `<script is:inline>` theme-flip script (lines 117-134), which is intentionally NOT the pattern to follow here (that script is page-blocking-by-design; count-up/details-dismiss must NOT be — Pitfall 4).
**Apply to:** `Hero.astro` and `About.astro` both reference the identical relative path `<script src="../../scripts/count-up.js"></script>` (both files live at the same directory depth: `src/components/astro/`).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/scripts/count-up.js` | utility | event-driven | First file in a new `src/scripts/` directory — no prior shared-vanilla-module precedent in this repo (only precedent is BaseLayout's `is:inline` blocking script, a different loading mechanism entirely). Full implementation already fully specified and verified in RESEARCH.md Pattern 2 — use that code directly rather than inventing a new structure. |
| `src/scripts/details-dismiss.js` | utility | event-driven | Same as above. Full implementation already fully specified in RESEARCH.md Pattern 3. |

## Metadata

**Analog search scope:** `src/components/`, `src/components/astro/`, `src/pages/`, `src/i18n/`, `src/layouts/`, `src/data/`
**Files scanned:** `Hero.jsx`, `Hero.test.jsx`, `About.astro`, `About.test.ts`, `Footer.astro`, `Footer.test.ts`, `Skill.astro`, `404.astro`, `_404.test.ts`, `en/index.astro`, `es/index.astro`, `translations.js`, `BaseLayout.astro` (script sections)
**Pattern extraction date:** 2026-07-19
