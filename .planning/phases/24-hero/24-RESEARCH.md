# Phase 24: Hero - Research

**Researched:** 2026-07-19
**Domain:** Zero-JS/minimal-JS conversion of a React island (char-reveal typewriter, count-up stats, CV dropdown) to Astro static HTML/CSS + a small shared vanilla-script enhancer
**Confidence:** MEDIUM-HIGH

## Summary

Hero is the last LCP-critical section and the last place in the migration where interactive-looking behavior must survive without becoming a React island. All three pieces of client behavior in the current `src/components/Hero.jsx` have zero-JS or near-zero-JS Astro equivalents, and none of them justify a `client:*` React island:

1. **Char-reveal typewriter** (`useCharReveal`) converts cleanly to a pure CSS `steps()` width-reveal animation. The H1's `.font-pixel` class resolves to `'Press Start 2P', ui-monospace, 'JetBrains Mono', monospace` — a genuinely monospace stack — which is exactly the precondition the CSS `steps(N)` + `ch`-unit technique requires to align each animation step to one character. `prefers-reduced-motion` is already handled globally in `src/index.css` (a blanket `animation-duration: 0.01ms !important` override under `@media (prefers-reduced-motion: reduce)`), so no component-level JS guard is needed — CSS media queries alone are sufficient. No JS required at all.

2. **Count-up stats** (`useCountUp`) cannot be zero-JS (the animation itself is script-driven by definition) but does not need React. Astro's own `client:visible` directive is documented as using `IntersectionObserver` internally — the same primitive a hand-rolled vanilla enhancer should use, since Hero's stats are above the fold (near-instant trigger) but the phase's second consumer, About's quick-facts, is below the fold and needs the same "animate when scrolled into view" behavior the original per-component `useEffect`-on-mount implementation never actually had (a net accessibility/performance improvement, not a regression). Astro deduplicates identical `<script>` tags **within one reused component**, but the safer, unambiguous mechanism for sharing one enhancer across two *different* `.astro` components is a single JS module file (`src/scripts/count-up.js`) referenced by `<script src="...">` from both — standard ESM module-graph dedup guarantees single execution regardless of Astro-specific dedup semantics.

3. **CV dropdown** (`CvDownload`) converts to native `<details>`/`<summary>`. Research strongly indicates — but could not find a single authoritative 2026 cross-browser compatibility table confirming — that **no current browser closes a plain `<details>` element on Escape, and none close it on outside click**; both behaviors are a common enough gap that dedicated GitHub projects and blog posts exist solely to patch them with a small vanilla-JS enhancer (`keydown`/Escape + `document click` + `element.contains()` pattern). This claim is `[ASSUMED]` at MEDIUM confidence — official MDN/WHATWG docs do not explicitly state Escape-key behavior for `<details>` either way, only that Esc is a general "close request" mechanism for other elements (`<dialog>`, popover). **The planner must treat ROADMAP's "Escape-key close cross-browser verified" success criterion as requiring real manual QA in at least Chrome, Firefox, and Safari** — do not close this out on code-review alone.

**Primary recommendation:** Ship Hero as a fully static `.astro` component (no `client:*` directive anywhere) with two small enhancements: (a) CSS-only typewriter via `steps()`, and (b) two shared, small (`<script src>`-referenced) vanilla modules — one for count-up (`src/scripts/count-up.js`, used by both Hero and About), one for the `<details>` Escape/outside-click enhancer (`src/scripts/details-dismiss.js`, reusable by Phase 26's Experience `<details>` too, though Phase 26 is out of this phase's scope).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hero markup + entrance animations (fade/slide) | Browser / Client (CSS only, build-time HTML) | — | Already CSS keyframes (`animate-fade-in`/`animate-slide-up`), zero JS today, zero JS after migration — no tier change |
| Char-reveal typewriter on H1 middle line | Browser / Client (CSS only) | — | Pure `@keyframes`/`steps()` — no script, no hydration; build-time frontmatter only computes the character count for the CSS custom property |
| Count-up stat animation (Hero + About) | Browser / Client (vanilla script) | — | Requires `requestAnimationFrame`, cannot be zero-JS; must NOT be a React island — a single shared `<script src>` module is the correct tier, loaded once, no framework runtime |
| CV dropdown open/close (native `<details>`) | Browser / Client (HTML native) | Browser / Client (vanilla script, progressive enhancement) | Primary open/close is native browser behavior (`<summary>` click, zero JS); Escape/outside-click are enhancement-only, additive, non-blocking if the script fails to load |
| Hero photo (LCP candidate) | CDN / Static | Browser / Client | Already a static `<img>` with `srcset`/`sizes` + `<link rel=preload>` in `BaseLayout.astro`; this phase must not regress LCP timing established in v4.1 (2.1s baseline) |
| Bilingual copy resolution (`t.hero.*`) | Frontend Server (SSR/SSG, build-time) | — | Astro frontmatter resolves `translations[locale]` once at build time — same pattern as `About.astro`, `Footer.astro` from Phase 23 |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STATIC-02 (Hero half) | Hero's CV dropdown uses native `<details>`/`<summary>`, zero JS for the core open/close mechanic | Confirmed native `<details>` toggle requires no JS at all; Escape/outside-click are additive, non-blocking enhancements — see Pattern 3 and Pitfall 2 below |

Note: STATIC-02's other half (Experience expand/collapse) is Phase 26's responsibility per REQUIREMENTS.md traceability — not in scope here, though the `details-dismiss.js` enhancer this phase authors should be written generically enough for Phase 26 to reuse without modification.
</phase_requirements>

## Standard Stack

### Core

No new packages. This phase uses only what Phase 21 already installed (`astro@^7.1.1`, `@astrojs/react@^6.0.1` — confirmed installed via `npm ls`) plus plain CSS and vanilla JS. `react`/`react-dom` remain installed for other islands (Nav) but Hero itself imports neither.

**Version verification performed:**
```
$ npm ls astro @astrojs/react
├── @astrojs/react@6.0.1
└── astro@7.1.1
```
`[VERIFIED: npm registry]` — versions confirmed installed in this repo's `node_modules`, matching `package.json` `^7.1.1`/`^6.0.1` ranges established in Phase 21.

### Supporting

| Item | Purpose | When to Use |
|------|---------|-------------|
| CSS `steps()` timing function + `ch` unit | Typewriter reveal without JS | H1 middle line only — the one place a monospace-adjacent font (`.font-pixel`) is already in use |
| `IntersectionObserver` (native browser API, no library) | Trigger count-up animation on scroll-into-view | Shared `count-up.js` module, used by both Hero (near-instant trigger, above fold) and About (deferred trigger, below fold) |
| Native `<details>`/`<summary>` + `open` attribute | CV dropdown state | Replaces `useState`-driven `CvDownload` entirely |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS `steps()` typewriter | Small vanilla `<script>` char-by-char `setTimeout` chain (JS port of `useCharReveal`) | JS port is more literally "identical" to current timing (300ms start offset + 40ms/char) but reintroduces a script for a purely decorative effect the CSS approach achieves with zero runtime cost; CSS is the correct default per ARCHITECTURE.md's "native HTML/CSS before a React island" pattern (Phase 23/24 convention) |
| Shared `<script src>` module for count-up | Duplicate the count-up script inline in both `Hero.astro` and `About.astro` | Duplication was explicitly rejected by Phase 23's D-04 decision and this phase's own success criterion #3 ("consolidated... not left duplicated per component") |
| Vanilla `keydown`/`click` enhancer for `<details>` | CSS-only close-on-outside-click via `:focus-within`/`:has()` trick | `:has()`-based click-outside tricks exist but are fragile (require a full-viewport sibling overlay element, complicate z-index/click-through for the rest of the page) and cannot address Escape-key close at all (CSS has no keyboard-event equivalent) — JS is the correct, minimal-footprint choice here, consistent with "progressive enhancement," not a regression from zero-JS since the base open/close mechanic stays fully native |

**Installation:** none — no new dependencies for this phase.

## Package Legitimacy Audit

Not applicable — this phase installs zero new packages. Skipping the Package Legitimacy Gate per its own scope condition ("whenever this phase installs external packages").

## Architecture Patterns

### System Architecture Diagram

```
Build time (Astro SSG, per locale: /en, /es)
─────────────────────────────────────────────
Hero.astro frontmatter
  ├─ translations[locale].hero.*  ──► resolved copy strings (h1a/h1b/h1c/lead/cta1/cv/cvEn/cvEs/status)
  ├─ char count of h1b            ──► CSS custom property --reveal-chars
  └─ stat target/template parsing ──► data-count-up="18" data-count-up-template="{n}+" (per stat)
        │
        ▼
Static HTML output (zero client JS shipped for markup/typography/entrance anims)
  ├─ <h1> with CSS steps() reveal span (self-contained, plays on paint)
  ├─ 4x stat <span data-count-up=...> nodes (static final value as SSR fallback text)
  └─ <details class="cv-download"> ... <summary>...</summary> <div role="menu">...</div> </details>
        │
        ▼
Runtime (browser, progressive enhancement layer)
  ├─ src/scripts/count-up.js  (imported once per page via <script src>, ESM-deduped)
  │     └─ IntersectionObserver → animate() on first intersect → unobserve
  ├─ src/scripts/details-dismiss.js (imported once per page)
  │     └─ keydown(Escape) + document click listener → el.open = false
  └─ No React, no hydration boundary, no client:* directive anywhere in Hero
```

### Recommended Project Structure

```
src/
├── components/astro/
│   └── Hero.astro              # NEW — replaces src/components/Hero.jsx entirely (zero client JS)
├── scripts/                     # NEW directory — first shared vanilla-JS enhancers in the migration
│   ├── count-up.js             # NEW — shared by Hero.astro AND About.astro (retrofit)
│   └── details-dismiss.js      # NEW — shared by Hero.astro's CV dropdown; reusable by Phase 26 Experience
└── components/astro/About.astro # MODIFIED — Phase 23 dropped count-up (D-04); this phase re-adds it
```

### Pattern 1: CSS-only typewriter reveal (replaces `useCharReveal`)

**What:** Animate `width` from `0` to `Nch` with a `steps(N, end)` timing function on an `overflow: hidden; white-space: nowrap` wrapper around the monospace-rendered middle H1 line.
**When to use:** Any decorative sequential-reveal text effect where the font is monospace (or a monospace-adjacent pixel font) and the text is known at build time (no runtime string changes).
**Why it works here specifically:** `.font-pixel` (`src/index.css:242-244`) resolves to `'Press Start 2P', ui-monospace, 'JetBrains Mono', monospace` — every fallback in that stack is monospace, so `1ch` reliably equals one glyph's advance width, making each of the `N` steps land exactly on a character boundary.

```astro
---
// src/components/astro/Hero.astro (excerpt)
const midLine = t.hero.h1b
const charCount = midLine.length
---
<span
  class="hero-reveal inline-block overflow-hidden whitespace-nowrap align-bottom bg-brand-gradient bg-clip-text text-transparent"
  style={`--reveal-chars: ${charCount}`}
>{midLine}</span>
```
```css
/* src/index.css — new rule, alongside existing .font-pixel utility */
.hero-reveal {
  width: 0;
  vertical-align: bottom;
}
@media (prefers-reduced-motion: no-preference) {
  .hero-reveal {
    animation: hero-typewriter 1.2s steps(var(--reveal-chars), end) 300ms forwards;
  }
}
@keyframes hero-typewriter {
  from { width: 0; }
  to   { width: calc(var(--reveal-chars) * 1ch); }
}
/* prefers-reduced-motion: reduce already forces animation-duration: 0.01ms globally
   (src/index.css:314-323) — width still animates to full but effectively instantly;
   no separate override needed, matches existing repo-wide RM pattern. */
```
Source pattern: [CSS-Tricks — Typewriter Effect](https://css-tricks.com/snippets/css/typewriter-effect/), cross-checked against [30 Seconds of Code — Typewriter Effect](https://www.30secondsofcode.org/css/s/typewriter-effect/) and [Stefan Judis — A CSS-only typewriter effect](https://www.stefanjudis.com/snippets/a-css-only-typewriter-effect/) — `[CITED, MEDIUM confidence]` (community pattern, not an official spec-level guarantee, but converged on independently by 3+ sources).

**Verification needed:** `steps()`'s integer argument accepting a CSS custom property (`var(--reveal-chars)`) rather than a literal integer is standard modern CSS custom-property substitution (widely supported), but visually confirm in a real browser during Phase 24 execution that Press Start 2P's rendered glyph width matches `1ch` closely enough that no visible "half-character" jump occurs at the final step — flag as a UI checkpoint, not a hard blocker.

### Pattern 2: Shared count-up enhancer (replaces `useCountUp`, consolidates Hero + About)

**What:** One JS module, referenced via `<script src="...">` from both `Hero.astro` and `About.astro`, using `IntersectionObserver` to trigger a `requestAnimationFrame` count-up on first viewport intersection.
**When to use:** Any numeric stat that should animate from 0 to a target value, whether above or below the fold.

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

Markup side (both Hero and About stats), computed once at build time in frontmatter — mirrors the original `Stat` component's own `num.match(/\d+/)` / `num.replace(/\d+/, n)` regex logic, just evaluated at build time instead of per-render:
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
<!-- Static "18+" is the zero-JS/no-JS fallback text (SSR-correct final value);
     the script resets to "0+" on mount then animates back up to "18+" — matches
     original useCountUp's setN(0) → animate-to-target behavior. -->
<script src="../../scripts/count-up.js"></script>
```

**Why one shared file, not Astro's own script-dedup:** Astro's documented dedup guarantee — *"If a component that contains a `<script>` is used multiple times on a page, the script will only be included once"* [CITED: docs.astro.build/en/guides/client-side-scripts/] — is scoped to **one component reused multiple times**, not **two different components with matching inline script content**. Using a real file with a stable relative `src` path sidesteps this ambiguity entirely: standard ESM module-graph semantics guarantee the browser fetches/executes `count-up.js` once per page regardless of how many `.astro` files reference it. `[VERIFIED via official docs]` for the dedup claim itself; `[ASSUMED, reasoned from standard ESM semantics]` for why the file-based approach is the safer of the two options — not independently tested against Astro 7's exact bundling output in this session.

### Pattern 3: Native `<details>` CV dropdown + Escape/outside-click enhancer

**What:** `<details>`/`<summary>` for the base open/close mechanic (fully native, zero JS required); a small shared script adds Escape-key close and outside-click close as **progressive-enhancement-only** behaviors — if the script fails to load, the dropdown still opens and closes via clicking `<summary>` again, just without the two convenience closes.

```astro
<details class="details-dismiss relative">
  <summary
    class="inline-flex items-center gap-2 min-h-[44px] px-4 py-3 rounded-full font-extrabold text-xs font-mono bg-transparent text-text-primary border border-ink-400 hover:border-brand hover:text-brand transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden"
  >
    <span aria-hidden="true">⬇</span> {t.hero.cv}
    <span aria-hidden="true" class="transition-transform duration-200 group-open:rotate-180">▾</span>
  </summary>
  <div role="menu" class="absolute left-0 mt-2 min-w-[160px] rounded-xl border border-ink-400 bg-ink-900/95 backdrop-blur-md p-1 z-50 shadow-brand-lg">
    <a role="menuitem" href="/CarlosMontoya_CV_EN.pdf" download class="block px-4 py-2 rounded-lg text-xs font-mono text-text-secondary hover:bg-ink-500 hover:text-brand transition-colors">{t.hero.cvEn}</a>
    <a role="menuitem" href="/CarlosMontoya_CV_ES.pdf" download class="block px-4 py-2 rounded-lg text-xs font-mono text-text-secondary hover:bg-ink-500 hover:text-brand transition-colors">{t.hero.cvEs}</a>
  </div>
</details>
<script src="../../scripts/details-dismiss.js"></script>
```
Note: `<details>` needs Tailwind's `group` class for `group-open:` to work (`<details class="details-dismiss relative group">`) — the rotate-180 chevron behavior only fires while `[open]` is present, which Tailwind's `group-open:` variant targets directly (no plugin required — confirmed against the `[open]`-attribute-based variant family Tailwind ships natively since 3.4.x, matching this repo's pinned `tailwindcss@3.4.19`). `[CITED, MEDIUM confidence — confirmed via community Stack Overflow example using this exact `group`/`group-open:` pairing on `<details>`/`<summary>`, not an official Tailwind docs page found in this session]`.

Cross-browser marker removal (WebKit's `::-webkit-details-marker` is a separate, non-standard pseudo-element from the `::marker`/`list-style` mechanism standard browsers use) — both rules are required together:
```css
summary { list-style: none; }
summary::-webkit-details-marker { display: none; }
```
`[CITED: multiple sources converge — MDN's own `<summary>` reference plus community CSS-Tricks/LogRocket articles]`, HIGH confidence — this is a long-standing, well-documented cross-browser gap, not a novel finding.

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

### Anti-Patterns to Avoid

- **Don't wrap Hero (or any piece of it) in a `client:load`/`client:visible` React island "just to be safe."** This is the exact anti-pattern PITFALLS.md (Phase 21 research) calls out as undermining the entire migration thesis. Every piece of Hero's current interactivity has a native/CSS/vanilla-JS equivalent — there is no remaining justification for React here.
- **Don't duplicate the count-up script inline in both `Hero.astro` and `About.astro`.** This phase's own ROADMAP success criterion #3 explicitly forbids it; use the shared-file pattern above.
- **Don't assume `<details>` closes on Escape or outside click without the enhancer script.** Neither behavior is guaranteed native — see Pitfall 2 below.
- **Don't use `dangerouslySetInnerHTML`-equivalent patterns or inline `role="menu"`/`role="menuitem"` semantics without verifying they still make sense on a native `<details>`.** `role="menu"` implies full ARIA menu keyboard semantics (arrow-key navigation between items) that a plain `<details>` panel does not provide — consider whether `role="menu"`/`role="menuitem"` should be dropped in favor of no explicit role (a `<details>` panel with plain links is arguably more correct ARIA than a `role="menu"` that isn't backed by full menu keyboard behavior). Flagged as an Open Question below — Claude's discretion, needs a decision either at plan time or in a UI-SPEC pass.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Detecting scroll-into-view | A manual scroll-position/`getBoundingClientRect()` polling loop | `IntersectionObserver` (native browser API) | Already the mechanism Astro's own `client:visible` uses internally — no reason to reimplement less efficiently |
| Reduced-motion detection | A JS `prefersReducedMotion()` check duplicated in every new script | The repo's existing global CSS override (`src/index.css:314-323`) for anything CSS-animation-driven; keep a single small JS-side `matchMedia` check only where JS itself decides whether to run an animation loop (count-up) since CSS can't gate a `requestAnimationFrame` call | Consistent with the DSGN-03 pattern already documented in this codebase (global CSS suppression layer + component-level guards where JS is actually driving animation) |

**Key insight:** Every piece of "interactivity" in Hero is either (a) fully expressible as CSS (typewriter, entrance animations — already true today) or (b) a small, focused, framework-free enhancement (count-up, details-dismiss) that doesn't need a UI framework's state management, virtual DOM, or hydration lifecycle. Reaching for React here would be solving a problem that doesn't exist in this component anymore.

## Common Pitfalls

### Pitfall 1: `steps()` count mismatch with actual glyph width
**What goes wrong:** If Press Start 2P's rendered advance width doesn't exactly equal `1ch` in every browser/OS font-rendering engine, the final step of the typewriter animation either clips the last character or leaves a visible gap.
**Why it happens:** `ch` is defined as the width of the "0" (zero) glyph in the current font, which is authoritative for genuinely monospace fonts but can drift slightly for display/pixel fonts with unusual metrics tables.
**How to avoid:** Visually verify in at least one real browser during Phase 24 execution (not just `astro dev` — check the actual rendered font). If drift is visible, widen the target `width` slightly (e.g. `calc(var(--reveal-chars) * 1ch + 2px)`) rather than abandoning the CSS approach.
**Warning signs:** Last character of the H1 middle line appears cut off or has extra trailing whitespace after the animation completes.

### Pitfall 2: Assuming `<details>` closes on Escape or outside click natively
**What goes wrong:** Shipping the bare `<details>`/`<summary>` markup without the `details-dismiss.js` enhancer and asserting STATIC-02's "keyboard-operable (Escape-key close cross-browser verified)" success criterion is met by native behavior alone.
**Why it happens:** `<select>` dropdowns and native OS popups close on Escape by browser/OS convention, which can lead to an incorrect assumption that `<details>` — visually similar — behaves the same way. It does not: `<details>` is a plain content-disclosure element, not a native popup/menu widget, and neither MDN nor the WHATWG spec document Escape-key closing behavior for it.
**How to avoid:** Always pair the `<details>` conversion with the `details-dismiss.js` enhancer; explicitly test Escape-key close in Chrome, Firefox, and Safari (or at minimum Chrome + Firefox, flagging Safari as a gap if a real device/simulator isn't available) before marking this phase's success criterion #2 complete.
**Warning signs:** UAT checklist item "Escape closes CV dropdown" is checked off based on code review alone, without an actual keypress test in a real browser.

### Pitfall 3: `<details>` panel content participates in tab order even when closed
**What goes wrong:** If the CV dropdown's `<a>` links inside the closed `<details>` panel remain focusable via Tab (they should not be, and by spec they are not, since browsers correctly exclude closed `<details>` content from the accessibility tree/tab order) — but this is worth an explicit check since some CSS `display`/`visibility` overrides applied for animation purposes can accidentally re-expose hidden content to assistive tech or keyboard focus.
**Why it happens:** Adding custom open/close CSS transitions (e.g. animating the panel's height or opacity) sometimes requires overriding `<details>`'s native `display: none` on the closed panel, which can inadvertently make the content focusable again if not done carefully (e.g. using `visibility: hidden` + `height: 0` incorrectly, or `content-visibility`).
**How to avoid:** Keep the panel's show/hide fully native (`<details>`'s own `open` attribute controlling `display`) — do not add a CSS transition to the panel itself for this phase (the current React version had no such transition either, only the chevron rotates). If a future phase wants an open/close transition, it must specifically preserve focus-trapping/tab-order correctness.
**Warning signs:** Tabbing through the closed Hero section reaches "English"/"Spanish" download links before reaching the LinkedIn/GitHub icon links that visually come after the (closed) dropdown.

### Pitfall 4: LCP regression from adding `<script>` tags to the Hero component
**What goes wrong:** Even though `count-up.js` and `details-dismiss.js` are small, adding any render-blocking or eagerly-fetched script to the page that contains the LCP image (Hero's photo) risks nudging LCP timing backward from the v4.1 2.1s baseline this phase must not regress.
**Why it happens:** Astro's default script processing outputs `type="module"` scripts, which are deferred by default (non-blocking, execute after HTML parsing) — this is the correct, low-risk default and should not be overridden with `is:inline` unless there's a specific reason (there isn't one here).
**How to avoid:** Do not add `is:inline` to either script (that would skip Astro's bundling/optimization and could change loading characteristics unpredictably). Verify via a Lighthouse run or at minimum the browser Network panel that these two scripts load as small, deferred, non-render-blocking chunks, not as blocking `<head>` scripts.
**Warning signs:** LCP timing measured above 2.1s on a Hero-only smoke test; Network panel shows either script marked as render-blocking.

## Code Examples

Verified/cited patterns already shown in full under Architecture Patterns 1-3 above (CSS typewriter, shared count-up script, `<details>` + dismiss enhancer). No further duplication here.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| React `useState`-driven dropdown menu (`CvDownload`) with manual `mousedown`/`keydown` document listeners | Native `<details>`/`<summary>` + small progressive-enhancement script | This phase (v5 migration) | Removes an entire React component + its hook logic; base functionality (open/close) now survives even if JS fails to load |
| `setTimeout`-chain character reveal (`useCharReveal`) | CSS `steps()` + `ch`-unit width animation | This phase | Zero runtime cost, zero JS shipped for this effect specifically |
| Per-component `useCountUp` hook (duplicated conceptually between Hero and, pre-Phase-23, About) | One shared vanilla module triggered by `IntersectionObserver` | This phase (About's half was deferred here by Phase 23's D-04) | Single source of truth for count-up behavior; now also correctly deferred until scroll-into-view for below-the-fold instances (About), which the original mount-triggered `useEffect` never did |

**Deprecated/outdated:**
- `src/components/Hero.jsx`, `src/components/Hero.test.jsx` — fully replaced, to be deleted once `src/components/astro/Hero.astro` + its Container API test are in place and mounted in both `src/pages/en/index.astro` and `src/pages/es/index.astro` (same mount pattern as Phase 23's five sections).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | No current browser (Chrome, Firefox, Safari) closes a plain `<details>` element on Escape key press by default | Summary, Pattern 3, Pitfall 2 | If any of these browsers actually DO close on Escape natively, the `details-dismiss.js` enhancer's Escape handler becomes a harmless no-op duplicate — low risk either way, but the planner should still budget a real cross-browser QA pass rather than trusting this claim outright |
| A2 | No current browser closes `<details>` on outside click by default | Pattern 3 | Same as A1 — low risk if wrong (redundant handler), moderate risk if the assumption is inverted in some other direction not anticipated here |
| A3 | Astro's script-tag dedup ("used multiple times on a page") does NOT extend to two different components each authoring the identical inline `<script>` block — only to one component reused multiple times | Pattern 2 | If Astro actually does content-hash-dedupe cross-component identical inline scripts too, the file-based `<script src>` approach recommended here is still correct and safe, just possibly more cautious than strictly necessary — no downside to following it |
| A4 | Tailwind CSS 3.4.19's `group-open:` variant works against `<details>`'s native `[open]` attribute without any plugin or config change | Pattern 3 | If this doesn't work as expected, the chevron-rotation-on-open visual detail silently fails (chevron stays static) — cosmetic only, does not block the dropdown's core open/close/download functionality; verify visually during implementation |

**If this table is empty:** N/A — see above, 4 assumptions requiring lightweight browser-based confirmation during Phase 24 execution, none of them blocking the phase's ability to be planned.

## Open Questions

1. **Should the CV dropdown panel keep `role="menu"`/`role="menuitem"` on the converted native `<details>` version, or drop to no explicit role?**
   - What we know: The current React version uses `role="menu"`/`role="menuitem"` with `aria-haspopup="menu"`/`aria-expanded` on the trigger button — full ARIA menu semantics, which implies (per ARIA authoring practices) arrow-key navigation between menu items, which neither the current React version nor a native `<details>` conversion actually implements.
   - What's unclear: Whether carrying `role="menu"` forward is "more accessible" (signals intent) or "less accessible" (promises keyboard behavior that isn't delivered, which is arguably worse than no role at all, since assistive tech users may expect arrow-key nav that doesn't work).
   - Recommendation: Default to dropping `role="menu"`/`role="menuitem"` in the Astro version (a `<details>` panel with two plain `<a>` links needs no extra ARIA — its accessible semantics are already correct via native disclosure-widget behavior) unless a UI-SPEC pass or user decision says otherwise. This is a minor a11y-correctness improvement, not a regression, but should be called out explicitly to the user/planner as a deliberate choice, not an oversight.

2. **Does the `count-up.js` `IntersectionObserver` `threshold: 0.4` need tuning for Hero's above-the-fold stats block, given it's already in the initial viewport on page load?**
   - What we know: `IntersectionObserver` fires its callback on initial `observe()` call if the element is already intersecting at the configured threshold — so Hero's stats should trigger almost immediately (no visible delay) since they're already in view.
   - What's unclear: Whether "already in view at page load" plus a 300-850ms CSS entrance-animation delay chain (the stats block itself has `animationDelay: 850ms` in the current component) could cause the count-up to start counting before the block has finished fading in, looking visually odd.
   - Recommendation: No code change needed preemptively — flag for visual QA during Phase 24 execution; if the count-up visibly starts before the fade-in completes, add a short fixed `setTimeout` offset (e.g. 200-300ms) inside `count-up.js`'s `animate()` before starting the RAF loop, mirroring the CSS entrance delay.

## Environment Availability

Skipped — this phase has no external tool/service/runtime dependencies beyond what Phase 21 already installed and verified (`astro`, `@astrojs/react`, Node ≥22.12.0). No new CLIs, databases, or services are introduced.

## Security Domain

`security_enforcement` is absent from `.planning/config.json` (treated as enabled per default), but this phase has effectively no attack surface: it adds zero forms, zero user input, zero external network calls, and zero new dependencies. The two new scripts (`count-up.js`, `details-dismiss.js`) operate only on build-time-computed `data-*` attributes (integers and short static strings, never user-supplied) and DOM event listeners — no `innerHTML`/`eval`/dynamic script injection anywhere.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | N/A — static site, no auth |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | No | No user input anywhere in this component; `data-count-up`/`data-count-up-template` values are build-time constants, not runtime-derived from any external source |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| DOM-based XSS via `.textContent` assignment in `count-up.js` | Tampering | Already mitigated by design — `setDisplay()` uses `el.textContent = template.replace(...)`, never `innerHTML`, and `template`/`target` originate only from build-time frontmatter strings, never from `location.hash`, `URLSearchParams`, or any other runtime-attacker-controllable source |
| Malicious CDN/CV asset substitution | Tampering/Spoofing | Out of scope for this phase — the two CV PDF links (`/CarlosMontoya_CV_EN.pdf`, `/CarlosMontoya_CV_ES.pdf`) are static same-origin assets already served from `public/`, unchanged by this migration |

## Sources

### Primary (HIGH confidence)
- https://docs.astro.build/en/reference/directives-reference/ — `client:visible` uses `IntersectionObserver` internally, `rootMargin` option, comparison with `client:load`/`client:idle`/`client:media`
- https://docs.astro.build/en/guides/client-side-scripts/ — default `<script>` processing (TypeScript, `type="module"`, bundling), same-component script dedup guarantee, `querySelectorAll` + `data-*` attribute pattern for scripts that need to affect multiple elements, `is:inline` semantics for skipping processing
- Direct codebase reads: `src/components/Hero.jsx` (full file), `src/components/Hero.test.jsx` (full file), `src/i18n/translations.js` (hero/stats/footer subtrees), `src/index.css` (font-pixel utility, reduced-motion global override, existing keyframe/utility conventions), `tailwind.config.js` (existing `animation`/`keyframes` conventions), `src/layouts/BaseLayout.astro` (existing `<script is:inline>` pattern, `translations[locale]` build-time resolution idiom), `src/components/astro/About.astro` (D-04 count-up-drop note, confirms this phase's explicit ownership), `src/pages/en/index.astro` (current mount pattern for Phase 23 sections), `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/research/SUMMARY.md`, `.planning/phases/21-.../21-PATTERNS.md`, `.planning/phases/23-static-content-sections/23-PATTERNS.md`
- `npm ls astro @astrojs/react` — confirmed `astro@7.1.1`, `@astrojs/react@6.0.1` installed, matching `package.json` ranges

### Secondary (MEDIUM confidence)
- https://css-tricks.com/snippets/css/typewriter-effect/, https://www.30secondsofcode.org/css/s/typewriter-effect/, https://www.stefanjudis.com/snippets/a-css-only-typewriter-effect/ — CSS `steps()` + `ch`-unit typewriter technique, cross-verified across 3 independent community sources
- Stack Overflow (translated) — `group-open:` Tailwind variant usage against `<details>`/`<summary>`, community-confirmed pattern for Tailwind 3.3.2+
- https://www.matuzo.at/blog/2023/details-summary, CSS-Tricks "Using & Styling the Details Element", LogRocket "Styling HTML details and summary with modern CSS" — cross-browser marker-hiding requiring both `list-style: none` AND `summary::-webkit-details-marker { display: none }`
- https://github.com/chrisnajman/details-dropdown-menu — reference implementation confirming Escape-key close and outside-click close for `<details>` dropdowns are JS-authored enhancements, not native browser behavior (the existence of dedicated tooling for this is itself evidence the native behavior doesn't cover it)

### Tertiary (LOW confidence)
- None distinctly tertiary — all findings above are either official-docs-verified or corroborated by 2+ independent secondary sources; the two genuinely uncertain claims (native Escape/outside-click behavior for `<details>`) are captured explicitly in the Assumptions Log (A1, A2) rather than stated as fact.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, existing installed versions directly verified via `npm ls`
- Architecture (CSS typewriter, shared script pattern, native `<details>` base mechanic): HIGH — CSS `steps()` technique and Astro script-processing/dedup semantics are both well-documented (community + official docs respectively)
- Pitfalls (Escape-key/outside-click native behavior specifically): MEDIUM — no single authoritative 2026 cross-browser compatibility table found; recommendation is to build the enhancer regardless (safe either way) and require real manual QA before closing out the phase's Escape-key success criterion

**Research date:** 2026-07-19
**Valid until:** ~30 days (stable web-platform APIs and an already-pinned Astro/Tailwind version; the one item that could shift faster is browser `<details>` native behavior, which is worth re-checking if this phase's execution slips more than a month past this research date)
