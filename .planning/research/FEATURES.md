# Feature Research

**Domain:** Astro SSG migration — i18n routing + island hydration model (v5 milestone)
**Researched:** 2026-07-19
**Confidence:** HIGH (Context7 `/withastro/docs` verified for all Astro-specific claims; codebase read for existing patterns)

## Scope Note

This is a narrow, architecture-focused feature landscape for the three questions in scope: `astro:i18n` routing/redirect, island hydration directive selection, and the theme-flip-before-paint pattern. It is not a general portfolio feature survey — those features (Hero, About, Experience, etc.) are already built and validated; this file covers what the Astro migration itself needs to introduce or replace. Supersedes the prior `FEATURES.md` (v3.10 3D constellation research, June 2026) — no longer relevant, WebGL lineage was purged in v4.0.

## Feature Landscape

### Table Stakes (Migration Won't Ship Without These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `astro:i18n` config with `locales: ['en','es']`, `defaultLocale: 'en'` | Required for `/en/*` `/es/*` static trees, `Astro.currentLocale`, `getRelativeLocaleUrl()` | LOW | `astro.config.mjs` addition. Verified HIGH confidence — Context7 `/withastro/docs`. |
| `prefixDefaultLocale: true` | Design spec requires both `/en` and `/es` prefixed (no unprefixed default-locale route) — matches spec's `src/pages/en/index.astro` + `src/pages/es/index.astro` symmetry | LOW | Default Astro behavior is `prefixDefaultLocale: false` (unprefixed default). Must explicitly set `true` or `/en` won't exist as a route — it'll be `/` instead. |
| Root `/` → locale redirect via **Vercel Edge Middleware** (`middlewareMode: 'edge'`) | `Astro.preferredLocale`/`Accept-Language` detection and cookie reads only work on **on-demand rendered** pages per Astro docs ("browser language detection... for pages rendered on demand"). Plain `output:'static'` middleware does NOT run against prerendered static output when deployed — it only executes at build time / dev server, not on the deployed static files. | MEDIUM | **Critical dependency gap in the design spec.** Spec says "Root `/` resolves via Astro middleware" but doesn't call out that this requires the `@astrojs/vercel` adapter with `adapter: vercel({ middlewareMode: 'edge' })` — a NEW dependency not currently in `package.json`. Without it, `src/middleware.ts` is inert on the deployed Vercel static site. See Pitfalls research for full detail. |
| Locale-prefixed `<html lang>` per static tree | WCAG/SEO — each `/en/*` and `/es/*` document must declare correct `lang` attribute at the HTML level, build-time, no JS | LOW | Replaces current runtime `document.documentElement.lang = lang` set from React. Now trivial: `<html lang={Astro.currentLocale}>` in `BaseLayout.astro`. |
| Blocking inline `<script is:inline>` theme-flip in `<head>` | FOUC prevention — must run before first paint, before any hydration | LOW | Standard Astro pattern (official tutorial: "Add client-side interactivity" / islands tutorial ch. 6). Read `localStorage` → fall back `prefers-color-scheme` → set `data-theme` attribute synchronously. |
| Per-component hydration directive audit (no default-to-`client:load` everywhere) | This is the entire performance thesis of the migration — Astro ships zero JS by default; assigning `client:load` to everything defeats the purpose and reproduces the current CSR bundle problem | LOW–MEDIUM | Design spec's island table is already directionally correct (see below); this research confirms/tightens it against docs. |
| `ThemeContext`/`LanguageContext` removal for cross-island state | React Context does **not** span island boundaries — each `client:*` component is an independently-hydrated React root with its own module scope. Two separate islands (e.g., Nav island vs a hypothetical standalone ThemeToggle island) cannot share a `createContext()` provider unless one wraps the other in the *same* island tree. | MEDIUM | Direct dependency identified: **ThemeToggle must stay nested inside the Nav island** (as it already is in current `Nav.jsx`, rendered twice for desktop/mobile) rather than being hydrated as an independent sibling island — otherwise it has no way to read/write `data-theme` state in sync with Nav without a shared Context, which islands don't support. Design spec's island table lists ThemeToggle as its own row; this should collapse into "part of the Nav island" unless there's a second standalone use elsewhere. |
| `Astro.currentLocale` prop-drilled into islands (not Context) | Islands needing the current locale (e.g., Nav labels, language switcher target) read it as a plain prop passed from the `.astro` parent at render time | LOW | Confirmed by design spec and consistent with `Astro.currentLocale` working "for all pages" (including prerendered) per docs — no SSR needed for this specific API. |

### Differentiators (Worth Doing Well, Not Blocking)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Locale switch preserves current section hash (`#projects` etc.) | Recruiter mid-scroll on `/en#experience` clicking ES shouldn't land back at the top of `/es` | LOW–MEDIUM | Since `/en` and `/es` are separate static documents (not client-routed), switching locale is a full navigation. `getRelativeLocaleUrl(targetLocale, '')` gives the base path; the Nav island must append `window.location.hash` client-side when building the switcher `href` (can't be done at Astro build time — hash is runtime-only browser state). Small, isolated bit of JS inside the already-hydrated Nav island — no extra cost. |
| Cookie-based redirect (not just Accept-Language) at `/` | Once a user picks a language via the switcher, `/` should respect that choice on return visits, not just browser locale | LOW | Design spec already specifies cookie-first, header-fallback — this is the right order. Requires the Nav language switcher (or a tiny inline script) to `Set-Cookie: cam-lang=es` client-side or via a redirect response, mirroring the current `localStorage` key `cam-lang` semantics but as a cookie so edge middleware can read it server-side. |
| Astro View Transitions (`<ClientRouter />`) for locale switch | Could make `/en` ↔ `/es` feel like an SPA transition instead of a hard reload, preserving scroll position automatically | MEDIUM–HIGH | Not in design spec scope. Two fully separate static documents (different `lang`, different content) via View Transitions is a heavier lift and mostly benefits perceived polish, not the Lighthouse gate. Flag as optional post-gate polish, not v5 core. |
| `client:media` for viewport-conditional hydration (e.g., mobile-only hamburger logic vs desktop nav) | Nav already branches desktop/mobile with two `<ThemeToggle />` renders; `client:media="(max-width: 767px)"` could skip hydrating unused variants | LOW | Available directive per Astro docs (`client:load`, `client:idle`, `client:visible`, `client:media={QUERY}`, `client:only`) — not called out in design spec's island table. Minor bundle trim; only worth it if Nav island size becomes a Lighthouse concern post-migration. |

### Anti-Features (Do Not Build)

| Feature | Why it Seems Appealing | Why Problematic | Alternative |
|---------|------------------------|------------------|-------------|
| Custom i18n routing/redirect system (manual `getStaticPaths` + hand-rolled locale resolver) | Full control, matches existing bespoke `LanguageContext` mental model | `astro:i18n` (`routing`, `fallback`, `redirectToFallback`, `getRelativeLocaleUrl`) already covers prefix generation, fallback locales, and redirect helpers natively — reinventing it duplicates well-tested framework code and loses the `Astro.currentLocale`/`Astro.preferredLocale` integration | Use built-in `i18n` config block; only write custom logic for the one truly custom piece (cookie+header redirect at `/`), via `defineMiddleware` + `redirectToFallback` helper where applicable |
| `routing: 'manual'` mode | Feels like "more control" | Disables Astro's default i18n middleware entirely, forcing the team to reimplement prefix matching, 404 handling, and locale fallback by hand — over-engineering for a 2-locale site | Default (`prefix`) routing mode with `prefixDefaultLocale: true` covers the 2-locale `/en` `/es` symmetry the spec wants |
| React Context (`LanguageContext`/`ThemeContext`) ported as-is into Astro islands | Minimal diff from current codebase, "just works" mentally | Context providers can't cross island boundaries; wrapping multiple independent islands in a single shared `<Provider>` forces them back into one monolithic hydrated tree — exactly what islands architecture exists to avoid, and defeats the Lighthouse JS-payload goal | Prop-drilling from `.astro` parent (locale) + local component state per island reading `data-theme`/`localStorage`/cookie directly (theme) — no shared runtime Context needed |
| Defaulting every interactive component to `client:load` "to be safe" | Avoids thinking about each component's actual need; interactivity "just works" immediately | Reproduces the current CSR problem — everything ships JS on first load regardless of position/priority, directly undermining the migration's Lighthouse performance thesis | Directive-per-component based on actual need: `client:load` only for above-the-fold, always-visible, small components (Nav, ThemeToggle); `client:visible` for anything below the fold or gated behind user scroll (Experience accordion, SectionPager) |
| `client:only` as a default/fallback when unsure | Sidesteps SSR mismatch errors quickly | Skips server-side HTML rendering entirely — the component renders nothing until JS loads, which is bad for perceived load (blank flash) and bad for SEO/crawlers on interactive-but-content-bearing components | Reserve `client:only` for components that genuinely cannot SSR (browser-API-dependent on first render, e.g. something reading `window` synchronously before mount) — none of Nav/Experience/ThemeToggle/SectionPager should need it since they all have valid static HTML fallbacks |
| Full SSR (`output: 'server'`) just to solve the `/` redirect | Simplest mental model — "just use `Astro.preferredLocale` everywhere, no edge middleware needed" | Throws away the static-output Lighthouse win for the entire site to solve one route's redirect; adds a server runtime dependency and cold-start/TTFB risk site-wide instead of on one function | Keep `output: 'static'`; use Vercel Edge Middleware (`middlewareMode: 'edge'`) which runs the redirect logic for every request including static assets, without converting any page to on-demand rendering |

## Feature Dependencies

```
astro:i18n config (locales + prefixDefaultLocale)
    └──requires──> src/pages/en/index.astro + src/pages/es/index.astro (route trees exist)
                       └──requires──> LanguageContext removal (static content no longer needs runtime lang state)
                                          └──enables──> BaseLayout.astro <html lang={Astro.currentLocale}> (build-time, zero JS)

Root "/" cookie+Accept-Language redirect
    └──requires──> @astrojs/vercel adapter, middlewareMode: 'edge'  [NEW DEPENDENCY — not in current package.json]
                       └──requires──> src/middleware.ts (defineMiddleware)
                       └──enhances──> cam-lang cookie set by Nav language switcher (replaces localStorage-only persistence)

Theme-flip-before-paint inline script
    └──requires──> data-theme attribute + CSS var system (already exists, unchanged from current src/index.css)
    └──conflicts-with──> ThemeContext's current useEffect-based flip (must be fully removed, not layered on top — two competing writers to data-theme causes flicker/race)
    └──enables──> ThemeToggle island (reads data-theme on mount, writes on click + localStorage/cookie, no Context needed)

ThemeToggle island
    └──requires──> stays nested inside Nav island (client:load) — cannot be an independent sibling island without a shared Context, which islands don't support
                       └──conflicts-with──> design spec's island table listing ThemeToggle as its own separate row

Experience expand/collapse island (client:visible)
    └──requires──> Experience.astro static shell renders full content server-side first (accordion collapsed state is a progressive enhancement, not a content-gating mechanism — SEO/no-JS users must still get full text)

SectionPager (client:visible) + Nav scroll-spy (client:load)
    └──both read──> useActiveSection-equivalent logic; if they need to share "current active section" state, that's a second cross-island coordination case similar to ThemeToggle — either co-locate in one island or communicate via a DOM event / URL hash, not React Context
```

### Dependency Notes

- **Root redirect requires the Vercel adapter, which is a scope addition the design spec doesn't name.** This is the single most consequential finding: without `@astrojs/vercel` + `middlewareMode: 'edge'`, the spec's "Root `/` resolves via Astro middleware" line is not achievable against a deployed `output:'static'` site — middleware only runs at build/dev time for prerendered output, not per-request in production, unless a runtime (edge function) is attached. Flag for roadmap: this is a phase-0/infra-setup task, not incidental.
- **ThemeToggle and LanguageContext both hit the same underlying constraint** — React Context cannot bridge island boundaries. Every place the current codebase relies on a Context Provider wrapping multiple components that will become *separate* islands needs a redesign: either (a) co-locate the components in one island, (b) drop to props from the `.astro` parent (works for read-only, build-time-known values like locale), or (c) use a non-React mechanism (DOM `CustomEvent`, `data-*` attribute + `MutationObserver`, or plain module-level closure if both islands are literally the same hydration boundary).
- **Experience accordion must remain server-rendered in full** — `client:visible` for the *toggle control* only (per design spec), but the underlying content (all bullets/tech chips) must be present in the static HTML output regardless of JS/hydration state, both for the "12 entries visible from first load" existing requirement and for SEO/no-JS accessibility. This isn't a new feature, but it constrains how the island boundary is drawn: the expand/collapse control is the island; the content is not gated by it, only visually toggled.

## MVP Definition

### Launch With (v5 exit criteria)

- [ ] `astro:i18n` config: `locales:['en','es']`, `defaultLocale:'en'`, `routing.prefixDefaultLocale:true` — table stakes, blocks everything else
- [ ] `@astrojs/vercel` adapter with `middlewareMode:'edge'` + `src/middleware.ts` cookie/Accept-Language redirect at `/` — table stakes, spec's explicit exit criteria depends on it working in production, not just locally
- [ ] Blocking `<script is:inline>` theme-flip in `BaseLayout.astro <head>` — table stakes, directly targets the Lighthouse gate (removes React-hydration-dependent FOUC)
- [ ] Island directive assignment per design spec's table, corrected per this research: Nav (`client:load`, includes nested ThemeToggle — not a separate island), Experience expand/collapse control (`client:visible`), SectionPager (`client:visible`), Hero interactive slice (spec-defined), About/Skill/Footer/Projects static (no directive)
- [ ] `LanguageContext`/`ThemeContext` fully removed — no dual-writer race with the new inline script / prop-drilling approach

### Add After Validation (post-Lighthouse-gate)

- [ ] Locale switch preserves current section hash — small Nav island addition, do once base routing is proven green
- [ ] `client:media` viewport-conditional hydration for desktop/mobile Nav variants — only if bundle-gate numbers post-migration show it's worth the marginal savings

### Future Consideration (not v5)

- [ ] Astro View Transitions (`<ClientRouter />`) for SPA-like locale switching — real UX polish but orthogonal to the Lighthouse gate that defines v5's exit criteria; revisit as its own micro-milestone once v5 ships

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `astro:i18n` locale-prefixed routing | HIGH | LOW | P1 |
| Vercel edge middleware root redirect | HIGH | MEDIUM | P1 |
| Blocking theme-flip inline script | HIGH | LOW | P1 |
| Correct hydration directive per island | HIGH | LOW–MEDIUM | P1 |
| Context removal / prop-drilling refactor | HIGH (unblocks above) | MEDIUM | P1 |
| Hash-preserving locale switch | MEDIUM | LOW | P2 |
| `client:media` viewport hydration split | LOW | LOW | P3 |
| View Transitions locale switch | LOW (polish only) | HIGH | P3 |

**Priority key:**
- P1: Required for v5 exit criteria (Lighthouse gate green, feature parity)
- P2: Should have, low-risk addition once P1 is stable
- P3: Nice to have, separate future milestone

## Sources

- Context7 `/withastro/docs` (official Astro documentation, HIGH confidence, verified 2026-07-19):
  - `reference/configuration-reference.mdx` — i18n `routing` object, `prefixDefaultLocale`, `redirectToDefaultLocale`, `fallbackType`
  - `guides/internationalization.mdx` — fallback locales, manual routing mode, browser language detection (`Astro.preferredLocale` limited to on-demand rendered pages)
  - `reference/modules/astro-i18n.mdx` — `redirectToFallback`, `getRelativeLocaleUrl()` signature and examples
  - `guides/integrations-guide/vercel.mdx` — `middlewareMode: 'edge'`, Astro middleware running as Vercel Edge Function on all requests including static assets
  - `guides/upgrade-to/v3.mdx` — historical `edgeMiddleware` config shape (superseded by `middlewareMode`)
  - `reference/routing-reference.mdx`, `guides/on-demand-rendering.mdx` — `export const prerender = false` per-route opt-out semantics under `output:'static'`
  - `guides/framework-components.mdx`, `reference/directives-reference.mdx` — `client:load`, `client:idle`, `client:visible`, `client:media`, `client:only` semantics and priority
  - `tutorial/6-islands/2.mdx` — official theme-toggle tutorial pattern (`<script is:inline>`, localStorage + `prefers-color-scheme` fallback, `data-theme`/class toggling before hydration)
  - `recipes/i18n.mdx` — root index redirect patterns (`<meta http-equiv="refresh">` for static, `Astro.redirect()` for SSR)
- Codebase inspection (HIGH confidence — read directly):
  - `src/i18n/ThemeContext.jsx` — current React-Context-based theme flip (useEffect-driven, confirms the dual-writer race risk if layered under a new inline script)
  - `src/components/_shared/ThemeToggle.jsx`, `src/components/Nav.jsx` — confirms ThemeToggle is currently nested inside Nav (rendered twice, desktop+mobile), supporting the "must stay co-located, not a separate island" finding
  - `index.html` — confirms no existing pre-paint theme script; current FOUC (if any) is masked because default theme (dark) matches default CSS, only a returning light-theme user would see a flash
  - `docs/superpowers/specs/2026-07-19-astro-migration-design.md` — approved design spec, source of the island boundary table and root-redirect strategy assessed against docs above
  - `.planning/PROJECT.md` — milestone context, existing Lighthouse gate thresholds

---
*Feature research for: Astro `astro:i18n` routing + islands hydration model (v5 migration)*
*Researched: 2026-07-19*
