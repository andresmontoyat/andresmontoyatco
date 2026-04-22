# Domain Pitfalls: Animated Portfolio Redesign

**Domain:** React + Tailwind single-page animated portfolio (bilingual, mobile-first)
**Researched:** 2026-04-21
**Confidence:** HIGH — findings drawn from direct codebase analysis plus established browser rendering, WCAG, and React ecosystem knowledge

---

## Critical Pitfalls

Mistakes that cause rewrites, Lighthouse regressions, or recruiter-facing breakage.

---

### Pitfall 1: Composited-Layer Explosion From Box-Shadow Animations

**What goes wrong:** The current codebase animates `box-shadow` via Tailwind utilities (`shadow-neon`, `shadow-neon-lg` on hover). Box-shadow is not GPU-composited — every frame the browser must repaint the element and its stacking context. On mid-range Android devices this causes dropped frames (jank) and tanks Lighthouse TBT (Total Blocking Time).

**Root cause:** Tailwind `hover:shadow-*` transitions trigger layout/paint, not just composite. The same trap applies to `background-color`, `border-color`, and `gradient` transitions — all of which appear in the existing component set.

**Consequences:** Smooth animations on MacBook Chrome, janky 15-30fps animations on Pixel 5 / iPhone SE. Lighthouse Performance score falls below 85 on mobile throttling.

**Warning signs:**
- Chrome DevTools Performance panel shows "Recalculate Style" and "Paint" frames during scroll/hover
- `transform` and `opacity` are not the primary animated properties
- CSS `transition` applied to `box-shadow`, `background`, `color`, or `border-color` on elements that animate frequently

**Prevention:** Animate only `transform` and `opacity` — these are the only two CSS properties that skip layout and paint and run entirely on the compositor thread. To fake a glowing shadow, layer a pseudo-element with `opacity` transition behind the real element. Replace `hover:shadow-neon-lg` patterns with `hover:scale-[1.02]` + a `::before` blur layer at opacity 0→1.

**Phase:** Animation implementation phase (before any scroll-trigger library is introduced).

---

### Pitfall 2: Scroll-Triggered Animations Causing Cumulative Layout Shift (CLS)

**What goes wrong:** Animating elements from `opacity: 0, translateY: 40px` to visible on scroll entry is a common pattern. If the initial hidden state is applied via JavaScript (IntersectionObserver callback) rather than CSS, the element renders fully visible on first paint, then snaps invisible before animating in. This creates a flash of styled content and registers as CLS.

**Root cause:** JS-applied initial styles arrive after first paint. The browser paints the element, JS hides it, then JS reveals it — three paints for what should be one.

**Consequences:** Lighthouse CLS score above 0.1, which alone can push Performance below 90. Recruiters on slow connections see content flash.

**Warning signs:**
- Animation initial state set in a `useEffect` or `onMount` callback rather than in CSS
- Elements without a CSS class that pre-establishes `opacity: 0` before hydration
- `will-change: transform` applied dynamically instead of declaratively

**Prevention:** Always set initial animation state via Tailwind class or inline CSS that is present in the first render. For Framer Motion: use `initial={{ opacity: 0 }}` prop (renders as inline style in SSR/static). For Intersection Observer patterns: add a CSS class like `.animate-ready { opacity: 0; transform: translateY(32px); }` in the stylesheet, apply it server-side, then toggle `.animate-in` on intersection. Never hide/show via JS alone.

**Phase:** Animation implementation phase. Verify with Lighthouse CI before considering animation work complete.

---

### Pitfall 3: `prefers-reduced-motion` Ignored — Accessibility and App Store Rejection Risk

**What goes wrong:** Rich scroll animations, parallax, and continuous pulse effects (the current codebase has `animate-pulse2` running forever) cause vestibular disorders and motion sickness in affected users. WCAG 2.1 SC 2.3.3 (AAA) recommends disabling non-essential animation when `prefers-reduced-motion: reduce` is set; WCAG 2.1 AA requires no animation that flashes more than 3 times per second.

**Root cause:** Animations are built without a motion-preference gate. The `animate-pulse2` class on the hero status indicator runs continuously regardless of user OS setting.

**Consequences:** Fails WCAG 2.1 AA for users with vestibular disorders. Recruiter using macOS with "Reduce Motion" enabled sees a site that ignores their system preference — signals poor engineering craft.

**Warning signs:**
- Any CSS `animation` with `infinite` or `loop` not wrapped in `@media (prefers-reduced-motion: no-preference)`
- Parallax scroll effects with no fallback
- Framer Motion `whileInView` animations without `useReducedMotion()` check

**Prevention:**
1. In Tailwind config, wrap all custom animation keyframes in `@media (prefers-reduced-motion: no-preference)` or use the `motion-safe:` variant prefix on every animation utility class.
2. For Framer Motion: call `const shouldReduceMotion = useReducedMotion()` and pass `animate={shouldReduceMotion ? {} : { ... }}`.
3. Global CSS rule as baseline: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

**Phase:** Must be established in the design system / Tailwind config phase, before any animation component is built. Retrofit is expensive.

---

### Pitfall 4: Hydration Flash From i18n Lang Detection

**What goes wrong:** `LanguageContext.js` reads `localStorage` inside a `useEffect`, meaning the component mounts with `lang: 'en'` (the default), renders in English, then switches to Spanish after the effect fires. This causes a visible flash of English content for Spanish-preferred users and registers as layout shift.

**Root cause:** `useEffect` runs after paint. The correct language is not known until after the first render. This is the classic "flash of wrong content" (FOWC) problem for client-side i18n.

**Consequences:** Spanish-speaking recruiters see a flash of English on every hard load. Text length differences between EN and ES can cause layout reflow after the switch, worsening CLS further.

**Warning signs:**
- `localStorage` read inside `useEffect` (not in `useState` initializer)
- Default language hardcoded as `'en'` in `useState('en')` rather than computed
- No `lang` attribute set on `<html>` before React mounts

**Prevention:** Move the localStorage/navigator detection into the `useState` lazy initializer — the function form `useState(() => detectLang())` runs synchronously during the first render, not after. Add a `<script>` tag in `public/index.html` before React loads that writes the correct `lang` attribute to `<html>` and optionally a `data-lang` attribute on `#root`, so React can read it synchronously.

```html
<!-- public/index.html, before </head> -->
<script>
  (function() {
    var lang = localStorage.getItem('cam-lang');
    if (!lang) lang = navigator.language.startsWith('es') ? 'es' : 'en';
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
  })();
</script>
```

**Phase:** i18n / foundation phase — fix before any new animation work to avoid compounding the CLS problem.

---

### Pitfall 5: SPA + Create React App = Zero SEO Without Workarounds

**What goes wrong:** The site is a client-rendered React SPA (CRA/CRACO). Googlebot and social preview crawlers receive an empty `<div id="root"></div>` unless JavaScript executes successfully. Open Graph tags for link sharing are static (same for all routes/languages), meaning LinkedIn and WhatsApp previews show no localized description.

**Root cause:** CRA does not produce server-side rendering or static pre-rendering. The `<meta name="description">` in `public/index.html` is one static string, not language-aware.

**Consequences:** Google may index the page eventually (modern Googlebot does execute JS), but it is slower, less reliable, and gives no structured data. Social previews on WhatsApp/Telegram/iMessage do not execute JS at all — they read the HTML only. The current GA tag in `index.html` uses the wrong measurement ID (G-1GDDRC3G12 in HTML vs G-4TZJGR3MXR in PROJECT.md).

**Warning signs:**
- `curl -s https://site.com | grep "og:description"` returns the same static string regardless of `?lang=es`
- No `<script type="application/ld+json">` structured data in the HTML
- GA measurement ID in code does not match the validated requirement

**Prevention:**
1. Add complete Open Graph tags to `public/index.html` with the best single-language description (English, since that is the wider recruiter audience).
2. Add JSON-LD Person schema in `public/index.html` for structured data — this is parsed from static HTML, no JS needed.
3. Fix the GA measurement ID to match the validated requirement (G-4TZJGR3MXR).
4. If Lighthouse SEO score matters, consider migrating from CRA to Vite + a lightweight static pre-renderer (e.g., `vite-plugin-prerender`) — this is a larger scope decision but the most reliable fix.
5. At minimum: add `<link rel="canonical">`, correct `<html lang>`, and a descriptive `<title>` that is not the default CRA placeholder.

**Phase:** Foundation/cleanup phase. The GA ID fix is a one-line change that must not be missed.

---

## Moderate Pitfalls

---

### Pitfall 6: Tailwind `purge` on Tailwind v2 — Dynamically Constructed Class Names Are Stripped

**What goes wrong:** The codebase uses Tailwind v2 (`@tailwindcss/postcss7-compat`). The `purge` option scans source files for class name strings. If any component constructs class names dynamically (string concatenation, template literals, conditional fragments), those classes are purged from the production CSS and the styles silently disappear.

**Root cause:** Tailwind's purger is a regex scanner, not a JS evaluator. It cannot detect `"text-" + color` or `` `bg-${variant}-500` ``.

**Warning signs:**
- `${variable}` inside Tailwind class strings
- Array lookups like `colors[index]` used as color names in class names
- Styles present in dev build, missing in production build

**Prevention:** Always write complete Tailwind class names as static strings. Use conditional full-class-name objects: `isActive ? 'bg-neon' : 'bg-ink-500'`, never `bg-${isActive ? 'neon' : 'ink-500'}`. For truly dynamic scenarios, use CSS custom properties or inline styles instead of dynamic Tailwind classes. Consider migrating to Tailwind v3+ (JIT mode) which handles this more reliably, but be aware that the current CRACO + PostCSS 7 compat shim exists specifically because CRA 5 uses PostCSS 8 — upgrading Tailwind requires also updating the build config.

**Phase:** Animation/component build phase — establish the class-name convention at the start.

---

### Pitfall 7: Google Fonts Blocking Render + FOUT

**What goes wrong:** `public/index.html` loads Inter and JetBrains Mono via a Google Fonts `<link rel="stylesheet">`. This is a render-blocking request. On slow connections or when fonts.googleapis.com is slow, the browser delays first paint. After fonts load, text re-renders causing layout shift (FOUT — Flash of Unstyled Text).

**Warning signs:**
- Lighthouse "Eliminate render-blocking resources" flags the Google Fonts stylesheet
- Lighthouse "Avoid large layout shifts" shows a CLS event timed with font load
- No `font-display` property set

**Prevention:**
1. Add `&display=swap` to the Google Fonts URL (forces `font-display: swap`, already present in the URL — verify it stays after any URL changes).
2. Add `<link rel="preload" as="style">` for the Google Fonts CSS URL.
3. Self-host fonts using `fontsource` packages (`@fontsource/inter`, `@fontsource/jetbrains-mono`) — eliminates the third-party DNS lookup entirely and is the most reliable fix. Fonts are tree-shaken to only the weights imported.

**Phase:** Foundation phase — font strategy must be decided before visual redesign starts, as it affects CLS budget.

---

### Pitfall 8: `will-change: transform` Applied Globally or Excessively

**What goes wrong:** When adding scroll animations, developers often apply `will-change: transform` or `will-change: opacity` to many elements as a "performance hint." Browsers respond by promoting each element to its own compositor layer, consuming GPU memory. On mobile devices with 2-4GB RAM shared between OS and browser, this causes janky scrolling across the entire page as the GPU runs out of layer budget.

**Warning signs:**
- `will-change` applied in a global CSS class used on many elements
- More than 4-5 elements with `will-change: transform` visible simultaneously
- Chrome DevTools Layers panel shows dozens of promoted layers
- Memory usage spikes above 150MB during scroll on mobile emulation

**Prevention:** Apply `will-change` only to elements that are actively about to animate — add it just before the animation starts (via JS) and remove it immediately after. For Framer Motion and GSAP, the libraries manage this internally; do not add it manually on top.

**Phase:** Animation implementation phase.

---

### Pitfall 9: `dangerouslySetInnerHTML` With Translation Strings — XSS Vector

**What goes wrong:** The About component translations use `<strong>` HTML tags inside translation strings (e.g., `p1` and `p2` in `translations.js`). Rendering these requires `dangerouslySetInnerHTML`. The current ESLint config disables `react/no-danger`. If translation strings ever come from an editable source (CMS, URL parameter, user input), this is an XSS injection point.

**Root cause:** HTML embedded in i18n strings is an anti-pattern. The correct approach is to use React components as translation interpolation targets.

**Warning signs:**
- `dangerouslySetInnerHTML` in any component that renders translation content
- `react/no-danger` disabled in `.eslintrc.js` (it is, currently)
- Translation strings containing `<` characters

**Prevention:** Replace HTML-in-strings with React component interpolation. Keep translation strings as plain text with named placeholders. The `LanguageContext` approach (plain object, not react-i18next) makes this slightly more manual — consider a helper like `t('about.p1', { strong: (chunks) => <strong>{chunks}</strong> })` pattern. For the redesign, audit every translation string and remove embedded HTML.

**Phase:** i18n / foundation phase.

---

### Pitfall 10: Mobile Navigation State Not Reset on Section Change

**What goes wrong:** Mobile hamburger menus built with `useState(isOpen)` frequently remain open after a nav link is clicked (since clicking a same-page anchor does not trigger a route change). The overlay covers the content the user just navigated to.

**Warning signs:**
- Mobile nav stays open after clicking a section link
- No `onClick` handler on nav links that closes the menu
- No `useEffect` watching scroll position to close the menu

**Prevention:** Every `<a href="#section">` inside the mobile nav must call the close handler in its `onClick`. Additionally, listen to scroll events with a debounced handler that closes the nav if the user scrolls while it is open (catches edge cases like back-button navigation).

**Phase:** Navigation / mobile phase.

---

## Minor Pitfalls

---

### Pitfall 11: FontAwesome v5 Bundle Size

**What goes wrong:** The project uses `@fortawesome/free-solid-svg-icons` v5 and `@fortawesome/free-brands-svg-icons` v5. If imported as `import { library } from '@fortawesome/fontawesome-svg-core'; library.add(fas)` (adding the entire icon set), the bundle includes every icon (~400KB uncompressed). The current components are not visible in this audit, but the pattern is a common trap.

**Prevention:** Always import icons individually: `import { faGithub } from '@fortawesome/free-brands-svg-icons'`. Never use `library.add(fas)` or `library.add(fab)`. During the redesign, audit all icon imports. Consider migrating to Lucide React or Heroicons which are designed for tree-shaking from the ground up.

**Phase:** Dependency cleanup phase (early).

---

### Pitfall 12: `react-router-dom` and `react-hook-form` Dead Weight

**What goes wrong:** Both are listed as production dependencies but the project is a single-page site with no routing and the contact section does not use a form library. They add ~45KB to the bundle for zero benefit.

**Prevention:** Remove both from `package.json` before the redesign starts. If a contact form is added later, evaluate whether `react-hook-form` is justified or a simple `useState` approach suffices.

**Phase:** Dependency cleanup phase (first task).

---

### Pitfall 13: Hardcoded Index Keys on Mapped Lists

**What goes wrong:** Experience, skills, and bullet points all use `key={i}` (array index). When items are reordered or filtered (as the experience list is, via `expanded` state), React cannot reconcile correctly and may produce incorrect diffs, lost focus, or animation glitches when items animate in.

**Prevention:** Add a stable `id` field to `experience.js` data entries. Use `key={job.id}` instead of `key={i}`. The ESLint rule `react/no-array-index-key` is currently disabled — re-enable it for the redesign.

**Phase:** Data layer / experience component phase.

---

## Phase-Specific Warning Matrix

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Dependency cleanup | Dead `react-router-dom`, `react-hook-form`; wrong GA ID | Remove unused deps first; fix GA ID in `index.html` |
| i18n / Foundation | Language flash (FOWC) on load; `dangerouslySetInnerHTML` in About | Fix `useState` initializer; refactor HTML-in-strings |
| Tailwind / Design system | Dynamic class name purging; no `motion-safe:` convention | Establish static-class-name and `motion-safe:` rules before first component |
| Font strategy | Render-blocking Google Fonts; FOUT causing CLS | Decide self-host vs CDN + `preload` in foundation phase |
| Animation build | Box-shadow/gradient transitions; CLS from JS-applied initial state; `will-change` overuse | Animate only `transform`/`opacity`; CSS-first initial states |
| Motion accessibility | `prefers-reduced-motion` ignored on infinite animations | Global `@media` rule + `motion-safe:` Tailwind prefix on every animation |
| Mobile navigation | Menu stays open after anchor click | Close handler on every nav link `onClick` |
| SEO / OG tags | Static English-only meta; missing structured data | JSON-LD Person schema + complete OG block in `index.html` |
| Experience component | Index keys causing animation glitches on expand/collapse | Stable `id` field in data, `key={job.id}` |
| Lighthouse audit | CLS from multiple sources accumulating above 0.1 | Audit CLS with DevTools after each animation phase, not only at the end |

---

## Sources

- Direct codebase analysis: `LanguageContext.js`, `tailwind.config.js`, `Hero.js`, `Experience.js`, `package.json`, `index.html`, `.eslintrc.js`
- Browser rendering pipeline (compositor-only properties): established Chromium architecture — `transform` and `opacity` are the only two properties that skip layout and paint
- WCAG 2.1 SC 2.3.3 (Animation from Interactions) and SC 1.4.3 (Contrast) — W3C specification
- Tailwind CSS v2 PurgeCSS documentation — static class name requirement
- React reconciliation documentation — `key` prop stability requirement for list animations
- Google Fonts performance guidance — `font-display: swap` and preload strategy
