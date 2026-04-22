# Architecture Patterns: Modern Animated React Portfolio

**Project:** Carlos Montoya Portfolio Redesign
**Researched:** 2026-04-21
**Confidence:** HIGH (based on codebase inspection + established React patterns)

---

## Current State Assessment

The existing codebase uses a flat component structure under `src/components/` with 7 files,
no animation orchestration, a custom i18n context (`LanguageContext` + `translations.js`),
and Tailwind CSS v2 (postcss7-compat via CRACO). React 17 with CRA tooling.

Key structural facts:
- i18n: Custom context, NOT react-i18next. Translation object at `src/i18n/translations.js`.
- Data: Experience entries in `src/data/experience.js` (12 jobs, bilingual fields inline).
- Animations: Only two CSS keyframes (`pulse2`, `fadein`). No JS animation library.
- No scroll detection. No intersection observer usage. No entrance animations.

---

## Recommended Architecture

### Top-Level Structure

```
src/
  components/
    layout/         <- Shell components (Nav, Footer, Layout wrapper)
    sections/       <- Page sections (Hero, About, Experience, Skills, Contact)
    ui/             <- Reusable atomic components (Button, Badge, SectionLabel, Card)
    animations/     <- Animation primitives (FadeIn, SlideIn, StaggerContainer)
  hooks/            <- Custom hooks (useScrollProgress, useInView, useReducedMotion)
  i18n/             <- LanguageContext (keep), translations.js (expand), types.js
  data/             <- experience.js (keep structure, extend if needed)
  styles/           <- index.css, tailwind custom utilities
  App.js
```

**Why this structure:**
- `ui/` prevents prop drilling and repetition across sections (SectionLabel already duplicated today).
- `animations/` centralizes motion logic — change the animation library once, fix everywhere.
- `hooks/` isolates browser API usage (IntersectionObserver, scroll events) from render logic.
- `layout/` separates chrome (nav, footer) from content, enabling independent animation scoping.

---

## Component Boundaries

### Layer 1: Shell (layout/)

| Component | Responsibility | Receives From | Communicates To |
|-----------|---------------|---------------|-----------------|
| `Layout` | Wraps entire app, provides scroll container ref | App.js | sections (via context/props) |
| `Nav` | Sticky header, language switcher, mobile menu | LanguageContext | — |
| `Footer` | Bottom chrome, social links, copyright | LanguageContext | — |

Nav is the only component that WRITES to LanguageContext (calls `setLang`).
All other components only READ from LanguageContext.

### Layer 2: Sections (sections/)

| Component | Responsibility | Data Source | Animation Type |
|-----------|---------------|-------------|----------------|
| `Hero` | First impression, headline, CTAs, stats grid | translations, lang | CSS + entrance on mount |
| `About` | Brief bio, personality, tech philosophy | translations | scroll-triggered entrance |
| `Skills` | Tech stack visualization | translations (or data file) | staggered entrance |
| `Experience` | Timeline of 12 jobs, expand/collapse | `data/experience.js` + translations | scroll-triggered, staggered items |
| `Contact` | Social links, email CTA, CV download | translations, lang | scroll-triggered entrance |

Each section: `id` anchor for nav links, self-contained scroll detection,
NO knowledge of sibling sections.

### Layer 3: UI Primitives (ui/)

| Component | Responsibility | Props |
|-----------|---------------|-------|
| `SectionLabel` | Mono-font label with decorative line | `children` |
| `Button` | Styled CTA, primary/outline variants | `variant`, `href`, `download`, `onClick` |
| `Badge` | Inline tag/pill | `children` |
| `StatCard` | Single metric display (num + label) | `num`, `label` |
| `TimelineEntry` | Single experience job entry | `job`, `lang`, `index` |
| `SkillPill` | Single technology badge | `name`, `level?` |

These have ZERO state, ZERO i18n context access, ZERO data fetching.
They receive everything via props. Pure render functions.

### Layer 4: Animation Primitives (animations/)

| Component | Responsibility | Implementation |
|-----------|---------------|----------------|
| `FadeIn` | Wraps children, fades in when in view | IntersectionObserver hook |
| `SlideUp` | Wraps children, slides up when in view | IntersectionObserver hook |
| `StaggerContainer` | Provides stagger delay context to children | CSS custom property `--stagger-index` |
| `ParallaxLayer` | Subtle parallax on scroll for decorative elements | scroll listener, `transform: translateY` |

**Animation strategy: CSS-first, JS-orchestrated.**

Use CSS transitions/animations for all visual effects. Use JS (IntersectionObserver)
only to toggle a class (`is-visible`) that triggers the CSS. This keeps animations
off the main thread as much as possible and plays well with `prefers-reduced-motion`.

```
// Pattern: FadeIn component
// 1. Attaches IntersectionObserver to wrapper ref
// 2. When intersecting: adds className "is-visible" to wrapper
// 3. CSS handles the actual animation via transition on opacity/transform
// 4. Observer disconnects after first trigger (animate-once)
```

Do NOT use a JS animation library (Framer Motion, GSAP) unless a specific effect
is impossible in CSS. Reasons: bundle size (Framer Motion ~140KB gzip), hydration
complexity, overkill for entrance animations, harder to test. Re-evaluate only if
the design requires physics-based spring animations or complex sequenced timelines.

---

## Data Flow

```
translations.js ──→ LanguageContext ──→ useLanguage() hook
                                              │
                    ┌─────────────────────────┼──────────────────────┐
                    ↓                         ↓                      ↓
                   Nav                   each Section           Footer
                (reads lang,           (reads t.sectionKey       (reads t)
                calls setLang)          for copy)

experience.js ──→ Experience section (direct import, no context)
                        ↓
                  TimelineEntry (via props, lang passed as prop)
```

Language switching: `setLang` in Nav → LanguageContext state update → all consumers
re-render with new `t` object. The `t` object is a plain JS object lookup —
no async loading, no suspense needed. Language state lives ONLY in LanguageContext.

Scroll/animation state: LOCAL to each animation wrapper component.
No global scroll state. IntersectionObserver instances live in `useInView` hook,
one per animated element. This avoids a central scroll store and keeps components
independently testable.

CV download: `lang` from LanguageContext determines which file URL to construct.
No state needed — it's a derived value. Computed at render time in Hero and Contact.

---

## Key Hooks

### `useInView(options)`
```
- Creates an IntersectionObserver with configurable threshold/rootMargin
- Returns [ref, isVisible] tuple
- Disconnects observer after first intersection (animate-once)
- Returns isVisible=true immediately if prefers-reduced-motion is set
```

### `useReducedMotion()`
```
- Reads window.matchMedia('(prefers-reduced-motion: reduce)')
- Returns boolean
- Used by animation components to skip transitions
```

### `useScrollProgress()`
```
- Tracks window.scrollY / document.body.scrollHeight as 0-1 value
- Throttled with requestAnimationFrame
- Used only for parallax and Nav active-section highlighting
- NOT used for entrance animations (IntersectionObserver handles those)
```

### `useLanguage()` (existing, keep)
```
- Returns { lang, setLang, t } from LanguageContext
- Already well-implemented — no changes needed to interface
```

---

## Responsive Layout Strategy

**Approach: Mobile-first Tailwind, single breakpoint for desktop enhancement.**

Default styles target mobile (320px+). `md:` prefix (768px) activates desktop layout.
Avoid complex breakpoint chains — two layouts (mobile, desktop) are easier to maintain
than four.

```
Mobile layout:
  Nav:        hamburger menu, full-screen overlay when open
  Hero:       single column, headline stacked, stats 2x2 grid
  Skills:     vertical list or 2-column pill grid
  Experience: full-width timeline, compressed dates

Desktop layout (md:):
  Nav:        horizontal links, no hamburger
  Hero:       large typographic headline, 4-column stats
  Skills:     multi-column grid, possible hover effects
  Experience: timeline with more whitespace
```

Mobile nav overlay: controlled by local state in Nav component.
Body scroll lock when menu is open: use `useEffect` to toggle `overflow-hidden` on `body`.
This is Nav's ONLY side effect outside its own DOM subtree.

---

## i18n Integration with Animated Content

**Problem:** When language switches, React re-renders with new text. If the section
is already visible and animated-in, the text change should NOT re-trigger entrance
animations. If the section is not yet visible, animation triggers normally on scroll.

**Solution:** The `is-visible` class is toggled by IntersectionObserver and is NEVER
removed after being set (animate-once). Language change only triggers a React re-render
of the text node — the wrapper element keeps `is-visible` and its final animation state.

```
// TimelineEntry: lang is a prop, not a context subscriber
// Re-render on lang change only updates the inner text
// The FadeIn/SlideUp wrapper does not re-mount — animation state preserved
```

Translation keys must be kept flat and predictable:
```js
t.nav.about          // navigation labels
t.hero.h1a           // hero copy (keep existing structure)
t.exp.label          // section labels
t.exp.more / t.exp.less  // interactive strings
```

Experience data bilingual fields stay in `data/experience.js` (not in `translations.js`)
because they are structured data, not UI copy. The `lang` prop is passed from the
Experience section to each TimelineEntry.

---

## Animation Orchestration Pattern

### Entrance Animations (80% of cases)
```
1. Section renders, FadeIn/SlideUp wrapper attaches IntersectionObserver
2. User scrolls: intersection fires
3. CSS class toggled → CSS transition runs (opacity 0→1, transform translateY(20px)→0)
4. Observer disconnects
```

### Staggered List Items (Skills, Experience bullets)
```
1. StaggerContainer renders children with --stagger-index CSS custom property
2. Each child's transition-delay reads var(--stagger-index) * 80ms
3. All children enter view simultaneously (section-level IntersectionObserver)
4. Stagger creates cascade effect with zero JS timing logic
```

### Hero Entrance (on page load, not scroll)
```
1. Component mounts → immediate CSS animation via @keyframes
2. No IntersectionObserver needed (always in viewport on load)
3. animation-delay staggers: badge → headline → lead text → CTAs → stats
4. Total entrance time: ~800ms, all CSS
```

### Parallax (decorative only, NOT content)
```
1. useScrollProgress() provides 0-1 scroll value via rAF
2. Applied only to background decorative elements (gradient blobs, geometric shapes)
3. Content elements NEVER parallax — accessibility and readability priority
4. Magnitude: 20-40px max travel, barely noticeable but adds depth
```

---

## Build Order (Phase Dependencies)

Components must be built in this order because each layer depends on the previous:

**Phase 1 — Foundation (no deps)**
1. `tailwind.config.js` — extend with new design tokens (colors, fonts, animations)
2. `src/index.css` — global resets, font imports, CSS custom properties
3. `src/i18n/translations.js` — expand translation keys for new sections
4. `src/hooks/useReducedMotion.js` — no deps, needed by everything
5. `src/hooks/useInView.js` — depends on useReducedMotion

**Phase 2 — UI Primitives (depend on Phase 1)**
6. `src/components/ui/SectionLabel.js`
7. `src/components/ui/Button.js`
8. `src/components/ui/Badge.js`
9. `src/components/animations/FadeIn.js` — depends on useInView
10. `src/components/animations/SlideUp.js` — depends on useInView
11. `src/components/animations/StaggerContainer.js`

**Phase 3 — Layout Shell (depends on Phase 1 + 2)**
12. `src/components/layout/Nav.js` — depends on LanguageContext, Button, useScrollProgress
13. `src/components/layout/Footer.js` — depends on LanguageContext
14. `src/App.js` — wires layout together

**Phase 4 — Sections (depends on all previous)**
15. `src/components/sections/Hero.js` — most impactful, build first to validate design direction
16. `src/components/sections/About.js`
17. `src/components/sections/Skills.js` + `src/components/ui/SkillPill.js`
18. `src/components/sections/Experience.js` + `src/components/ui/TimelineEntry.js`
19. `src/components/sections/Contact.js`

**Phase 5 — Integration + Performance**
20. Google Analytics wiring (`public/index.html` + `reportWebVitals.js`)
21. SEO / Open Graph meta tags (`public/index.html`)
22. Lighthouse audit pass — image optimization, animation `will-change` removal, bundle check

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global Scroll State Store
**What:** Single scroll position stored in context/Redux, all components subscribe
**Why bad:** Every scroll event causes all components to re-render. Kills performance.
**Instead:** Each component owns its IntersectionObserver or rAF scroll listener. Disconnect after use.

### Anti-Pattern 2: Framer Motion `AnimatePresence` for language transitions
**What:** Animating the entire section out/in when language switches
**Why bad:** Content flash, reflow cost, jarring UX — language switch should be instant text swap
**Instead:** CSS transition on text opacity (50ms fade), handled at the translation wrapper level

### Anti-Pattern 3: Inline styles for animation state
**What:** `style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'none' : 'translateY(20px)' }}`
**Why bad:** Triggers style recalculation on every render, bypasses CSS optimization
**Instead:** CSS class toggling: `.animate-target { opacity: 0; } .animate-target.is-visible { opacity: 1; }`

### Anti-Pattern 4: Animating layout properties
**What:** Animating `width`, `height`, `margin`, `padding`, `top`, `left`
**Why bad:** Forces browser reflow on every frame. Kills 60fps on mobile.
**Instead:** Animate ONLY `transform` and `opacity`. These run on the compositor thread.

### Anti-Pattern 5: JS animation library as default
**What:** Installing Framer Motion / GSAP for "better animations" then using it for everything
**Why bad:** ~140KB added to bundle. SSG/static build complications. Overkill for CSS-achievable effects.
**Instead:** CSS-first. Add a JS library ONLY if a specific effect is CSS-impossible (physics springs, SVG path drawing).

### Anti-Pattern 6: i18n copy in experience.js
**What:** Moving bilingual job descriptions out of data file into translations.js
**Why bad:** 12 jobs × 2 languages × 3-5 bullets = 120+ translation keys creating a maintenance nightmare
**Instead:** Keep bilingual data in `experience.js` with `{ en: ..., es: ... }` shape. Pass `lang` as prop.

---

## Scalability Notes

| Concern | Current Scale (static) | If Extended |
|---------|------------------------|-------------|
| Content updates | Edit `experience.js` / `translations.js` directly | Add a simple data layer (JSON files, headless CMS) |
| New section | Add file to `sections/`, import in App.js | No architectural change needed |
| New language | Add key to `translations.js`, test experience.js data | LanguageContext supports N languages today |
| Animation complexity | CSS + IntersectionObserver covers all current needs | Framer Motion upgrade is isolated to `animations/` folder only |

---

## Sources

- Codebase inspection: `src/App.js`, `src/components/`, `src/i18n/`, `src/data/`, `tailwind.config.js`, `package.json` (HIGH confidence — direct read)
- React IntersectionObserver pattern: established community pattern, MDN + React docs (HIGH confidence)
- CSS compositor thread animation (transform/opacity only): browser rendering pipeline, well-documented in Chrome DevTools docs (HIGH confidence)
- Framer Motion bundle size (~140KB gzip): training data, not verified against current release (MEDIUM confidence — verify before deciding to exclude)
- Tailwind v2 vs v3 feature differences: training data (MEDIUM confidence — upgrade to v3 is recommended but verify CRACO compatibility)
