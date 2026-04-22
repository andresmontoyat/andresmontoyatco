# Technology Stack

**Project:** Carlos Montoya Portfolio — Bold Animated Redesign
**Researched:** 2026-04-21
**Confidence:** MEDIUM — based on training knowledge (cutoff Aug 2025); web sources unavailable.
**Domain:** Animated single-page developer portfolio (React + Tailwind, static output)

---

## Current State (What Exists)

The codebase is significantly outdated:

| Area | Current | Problem |
|------|---------|---------|
| React | 17.0.2 | Two major versions behind (React 19 released Dec 2024) |
| Tailwind | v2 via PostCSS 7 compat shim | v4 released Feb 2025; v2 is EOL |
| Build system | Create React App + CRACO | CRA is unmaintained since 2022 |
| Animations | CSS keyframes only (2 trivial) | No animation library at all |
| Font Awesome | v5 SVG icons | v6 released years ago |
| i18n | Custom LanguageContext + translations.js | Works fine, keep it |
| No bundler optimization | react-scripts | Slow builds, no tree-shaking control |

The redesign must modernize the build toolchain first, or animation libraries won't tree-shake correctly and Tailwind v4's CSS-first config won't work.

---

## Recommended Stack

### Build System — Migrate CRA → Vite

**Use: Vite 6.x** (not CRA/CRACO, not Next.js)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vite | ^6.0.0 | Build tool + dev server | CRA is abandoned. Vite provides 10-100x faster HMR, native ESM, first-class tree shaking. No ejecting needed. Static build output (`vite build`) is a drop-in for S3/Netlify/Vercel hosting. |
| @vitejs/plugin-react | ^4.x | React fast-refresh in Vite | Uses SWC transformer, not Babel — faster builds |

**Why not Next.js:** Out of scope per PROJECT.md ("static frontend site"). Next.js adds SSR complexity, edge runtime overhead, and file-based routing — none of which are needed. Static export (`next export`) is a second-class citizen in Next.js 13+ App Router.

**Why not Parcel / Webpack standalone:** Vite is the community-settled answer for React SPAs as of 2024-2025. Parcel lacks the ecosystem. Raw Webpack requires too much config.

**Confidence: HIGH** — Vite is the de facto replacement for CRA across the React ecosystem.

---

### Core Framework — React 18

**Use: React ^18.3.x** (not 17, not 19 yet)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react | ^18.3.1 | UI framework | React 18 Concurrent Mode unlocks `useTransition`, `startTransition`, and Suspense — necessary for non-blocking animation work. React 19 exists but its ecosystem (especially Framer Motion's compatibility) needs more stabilization time as of H1 2025. |
| react-dom | ^18.3.1 | DOM renderer | Matches React 18 |

**Why not React 19:** React 19 introduced breaking changes to ref handling and forwardRef that Framer Motion's internal component wrapping relies on. Confirmed compatibility issues existed through early 2025. Pin to 18 for this project.

**Confidence: MEDIUM** — React 18 is safe. React 19 compat with animation libraries needs validation before upgrading.

---

### Animation — Framer Motion (Primary)

**Use: Framer Motion ^11.x** (not GSAP, not React Spring as primary)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| framer-motion | ^11.0.0 | All scroll, entrance, layout, hover animations | Native React integration. Declarative API means animations live in JSX without refs. `useScroll` + `useTransform` handle scroll-linked parallax natively. `AnimatePresence` handles route/conditional unmounting. Layout animations with `layoutId` enable section-to-section transitions. Supports `prefers-reduced-motion` via `useReducedMotion`. Tree-shakeable — pay only for what you import. |

**Core Framer Motion capabilities for this project:**

```
useInView          → trigger entrance animations as sections scroll into view
useScroll          → scroll-linked parallax (hero background, sticky elements)
useTransform       → map scroll progress to visual properties (opacity, y, scale)
AnimatePresence    → animate language-switcher content transitions
variants           → orchestrated staggered entrance animations for lists
layoutId           → shared element transitions between sections
whileHover         → card lift/glow effects without CSS boilerplate
```

**Why not GSAP:** GSAP requires imperative refs (`useRef` + `gsap.to(ref.current, ...)`), fighting React's declarative model. GSAP's free tier excludes ScrollTrigger on commercial/revenue projects (license cost). For a portfolio SPA, Framer Motion's declarative model is significantly faster to build with and produces more maintainable code. GSAP is the right choice for complex timeline sequences and canvas-level effects — this project doesn't need that.

**Why not React Spring:** React Spring's physics model is excellent for gesture-driven micro-interactions but has a steeper learning curve and less intuitive scroll-linking than Framer Motion's `useScroll`. Framer Motion covers all required use cases more concisely.

**Why not CSS-only animations:** The current site proves the limitation. CSS has no scroll-linked parallax, no staggered entrance orchestration, and no layout transitions without JavaScript anyway.

**Confidence: HIGH** — Framer Motion is the dominant choice for React animation in 2024-2025. npm downloads consistently exceed competitors.

---

### Tailwind CSS — Upgrade to v3.4.x

**Use: Tailwind CSS ^3.4.x** (not v2, not v4 yet)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| tailwindcss | ^3.4.4 | Utility-first styling | v3 is the stable production version. v4 (released Feb 2025) rewrites the config system entirely to CSS-first (`@theme` directive replaces `tailwind.config.js`) and drops PostCSS 7 support. The v4 migration is non-trivial and the plugin ecosystem (headlessui, etc.) has lagged. v3.4 adds container queries, `@layer` improvements, and `text-balance` — enough modern Tailwind for this project. |
| postcss | ^8.x | CSS processing pipeline | v3 requires PostCSS 8 (current codebase uses PostCSS 7 compat shim — this is the root cause of the Tailwind v2 pin) |
| autoprefixer | ^10.x | Vendor prefix handling | Required by Tailwind's PostCSS plugin |

**Why not Tailwind v4:** As of H1 2025, Tailwind v4's Vite plugin (`@tailwindcss/vite`) is the recommended integration — but several third-party plugins (headlessui, tailwind-merge, clsx integrations) are still catching up. The CSS-first config requires rewriting `tailwind.config.js` entirely. For a redesign milestone, start on v3.4 and plan a v4 upgrade as a separate milestone once the plugin ecosystem settles (estimated Q3 2025+).

**Modern Tailwind v3 patterns to use in the redesign:**

```
@layer components { }   → component-scoped utility groups (replaces inline class lists)
container queries        → responsive components independent of viewport
text-balance            → recruiter-readable paragraph line breaks
@apply sparingly        → only for repeated animation states, not structural styles
group / peer            → parent-child hover states without JavaScript
```

**Why keep the existing custom color tokens:** The `ink`, `neon`, `slate2` tokens in `tailwind.config.js` are well-structured. The redesign will replace the neon-cyan palette with a fresher palette, but the token structure should be preserved.

**Confidence: HIGH** — Tailwind v3.4 is the stable target. v4 migration is a deliberate future decision.

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | ^2.1.x | Conditional class composition | Use everywhere instead of template literal class strings. Pairs with tailwind-merge to prevent Tailwind class conflicts. |
| tailwind-merge | ^2.x | Resolve conflicting Tailwind utilities | Required when passing className props into animated components where Framer Motion adds inline styles that conflict with utility classes. |
| react-intersection-observer | ^9.x | Scroll-based visibility detection | Use as lightweight fallback for simple entrance triggers where Framer Motion's `useInView` adds too much bundle overhead. Not strictly needed if Framer Motion is already imported. |
| react-i18next | ^14.x | i18n (if custom context is replaced) | Current custom `LanguageContext` works but lacks plural rules, date formatting, and namespace splitting. Upgrade to react-i18next if translations grow complex. If existing custom context stays simple, keep it. |
| @fontsource/inter | ^5.x | Self-hosted Inter font | Eliminates Google Fonts network request (performance + privacy). Inter is already the intended font per `tailwind.config.js`. Serve from Vite's static assets. |

---

## What to Remove

| Dependency | Reason |
|------------|--------|
| `react-router-dom` | PROJECT.md explicitly out of scope — single-page, no routing |
| `react-hook-form` | Out of scope — no contact form with server backend |
| `axios` | No API calls in a static portfolio |
| `react-scroll` | Replace with Framer Motion scroll utilities or native `scroll-behavior: smooth` + `scroll-margin-top` CSS |
| `@craco/craco` | Replaced by Vite — CRACO was a workaround for CRA's config inflexibility |
| `react-scripts` | Replaced by Vite |
| `@headlessui/react` | Replace with simpler custom components or upgrade to headlessui v2 only if a complex dropdown/modal is needed |
| `@fortawesome/...` (all) | Replace with Lucide React (v0.4xx) — smaller bundle, tree-shakeable SVGs, modern icon set better suited to a portfolio |
| `web-vitals` | Only needed for CRA's built-in reporting scaffold |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite 6 | Next.js 15 | Static SPA doesn't need SSR; file routing; heavier |
| Build tool | Vite 6 | Parcel 2 | Smaller ecosystem, less React-specific optimization |
| Animation | Framer Motion 11 | GSAP 3 | Imperative API fights React; ScrollTrigger requires paid license for commercial use |
| Animation | Framer Motion 11 | React Spring | Excellent physics model but worse scroll-linking DX; smaller community |
| Animation | Framer Motion 11 | Auto Animate | Too limited — one-line entrance only, no scroll-linked or complex orchestration |
| Tailwind | v3.4 | Tailwind v4 | Plugin ecosystem not fully migrated as of H1 2025; CSS-first config requires full rewrite |
| Icons | Lucide React | Font Awesome 6 | FA SVG-core adds ~50KB baseline; Lucide is fully tree-shakeable |
| Icons | Lucide React | Heroicons | Narrower icon set; Lucide has broader coverage |
| Fonts | @fontsource/inter | Google Fonts CDN | External request adds 100-200ms on first load; privacy concern |
| i18n | Keep custom context | react-i18next | Custom context is sufficient for two flat translation files; avoid overengineering |

---

## Installation (Net-New Setup)

```bash
# Create Vite project (if starting fresh) or migrate in place
npm create vite@latest . -- --template react

# Core
npm install react@^18.3.1 react-dom@^18.3.1
npm install framer-motion@^11.0.0
npm install clsx@^2.1.0 tailwind-merge@^2.0.0
npm install @fontsource/inter@^5.0.0
npm install lucide-react@^0.400.0

# Dev dependencies
npm install -D tailwindcss@^3.4.4 postcss@^8.4.0 autoprefixer@^10.4.0
npm install -D @vitejs/plugin-react@^4.0.0
npm install -D vite@^6.0.0

# Remove (not install)
npm uninstall react-router-dom react-hook-form axios react-scroll @headlessui/react
npm uninstall @fortawesome/fontawesome-svg-core @fortawesome/free-brands-svg-icons
npm uninstall @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome
npm uninstall web-vitals @craco/craco react-scripts
```

---

## Performance Targets

The PROJECT.md requires Lighthouse 90+ with rich animations. The following Vite + Framer Motion patterns are mandatory to hit that target:

| Optimization | How | Impact |
|--------------|-----|--------|
| Lazy-load off-screen sections | `React.lazy` + `Suspense` per section | Reduces initial JS parse |
| `prefers-reduced-motion` | `useReducedMotion()` from Framer Motion — disable all animations when true | Accessibility + perf on slow devices |
| `will-change: transform` sparingly | Only on actively animating elements — remove after animation completes | Prevents GPU layer explosion |
| Self-hosted fonts | `@fontsource/inter` instead of CDN | Eliminates render-blocking external request |
| Vite code splitting | Auto with `import()` in lazy routes/sections | Smaller initial bundle |
| Image optimization | WebP format, `loading="lazy"`, explicit `width`/`height` | LCP improvement |
| Framer Motion tree-shaking | Import from `framer-motion` not `framer-motion/dist/...` — Vite handles this | Eliminates unused animation APIs |
| Avoid scroll event listeners | Use `useScroll` from Framer Motion (uses IntersectionObserver + passive listeners internally) | No jank on mobile |

---

## Sources

- Training knowledge (cutoff Aug 2025): Framer Motion changelog, React release notes, Tailwind CSS roadmap, Vite documentation
- Codebase analysis: `package.json`, `tailwind.config.js`, `src/App.js`, `src/components/Hero.js`
- PROJECT.md constraints: static deployment, React + Tailwind keep, Lighthouse 90+ target, bilingual requirement
- Note: WebSearch and WebFetch were unavailable during research. Versions should be verified against npm before implementation. The direction (Framer Motion 11 + Vite 6 + Tailwind 3.4 + React 18) reflects strong consensus in the React ecosystem as of H1 2025 — LOW risk of material deviation from current state.
