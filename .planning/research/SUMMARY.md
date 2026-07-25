# Project Research Summary

**Project:** Carlos Montoya Portfolio — Redesign
**Domain:** Static site generator migration (React CSR/Vite → Astro SSG with React islands)
**Researched:** 2026-07-19
**Confidence:** HIGH

## Executive Summary

This is a brownfield migration, not a greenfield build: an existing bilingual (EN/ES) React 18 CSR portfolio (Vite, Tailwind, Vercel-hosted) needs to become an Astro static site with React "islands" for interactivity, in order to clear a pre-existing Lighthouse mobile hard gate (Performance ≥0.95, Accessibility/Best Practices/SEO = 1.0) that CSR-everything has been unable to hit since v4.2 Phase 11. Experts build this class of migration by drawing a hard line between zero-JS static content (`.astro` components) and precisely-scoped interactive islands (`client:load`/`client:visible`), resolving all bilingual/localized content at build time instead of via runtime React Context, and treating the framework's islands-architecture constraints (no cross-island state sharing) as a first-class design input rather than an implementation detail.

The recommended approach: `astro@^7.1.1` + `@astrojs/react@^6.0.1` on the existing Node/React/Tailwind versions (no React version bump, keep `tailwindcss@3.4.19` unchanged, drop `@astrojs/tailwind` — it's incompatible with Astro 7), `astro:i18n` with `prefixDefaultLocale: true` for symmetric `/en` + `/es` static trees, and a tight island boundary (Nav with nested ThemeToggle on `client:load`; SectionPager, Experience filter, and select Hero pieces on `client:visible`; About/Skill/Footer/Projects/Claude fully static). The existing `data/*.json` bilingual data contract needs zero changes — only its consumption site moves from React render to Astro frontmatter.

The single highest-severity risk, found independently by three of the four research passes, is that the approved design spec's plan for the root `/` → `/en`|`/es` redirect ("Astro middleware... 302-redirect," `output: 'static'`, "no adapter/server runtime needed") is internally contradictory: Astro's own `src/middleware.ts` does not execute per-request against static output — it only runs at build/dev time. This must be resolved explicitly, before any other work starts, by choosing one of three concrete mechanisms (Vercel-native Edge Middleware — recommended; hybrid output + Vercel adapter on one route; or a client-side JS fallback). A cluster of secondary risks (missing hreflang/canonical on the new two-locale-tree site, React Context not crossing island boundaries, drift toward `client:load`-everywhere undermining the whole Lighthouse thesis, Astro Container API being unable to test interactive islands, and stale `vercel.json` SPA-fallback/cache-header assumptions) are all well-understood with concrete prevention steps documented in PITFALLS.md.

## Key Findings

### Recommended Stack

Core migration is two packages on top of the existing toolchain: `astro@^7.1.1` (SSG build pipeline, replaces Vite+React-CSR as the top-level tool) and `@astrojs/react@^6.0.1` (React island integration, peer-compatible with the project's existing React 18.3.1 — no React bump needed). Node floor moves to `>=22.12.0` (Astro 7 hard requirement; project has no `engines`/`.nvmrc` today and must add both, plus bump Vercel's configured Node version). No hosting adapter (`@astrojs/vercel`) is needed for the bulk of the site — it stays `output: 'static'`; the one place an adapter/edge mechanism is needed is the root-redirect problem described above.

**Core technologies:**
- `astro@^7.1.1` — SSG build pipeline — zero-JS-by-default output is the entire mechanism that clears the Lighthouse gate the CSR build can't
- `@astrojs/react@^6.0.1` — React island hydration — official integration, no React version conflict, bundles its own compatible Vite/plugin-react internally
- `tailwindcss@^3.4.19` (unchanged) — styling — Vite (which Astro wraps) auto-loads the existing `postcss.config.js`; do NOT install `@astrojs/tailwind` (incompatible peer range, tops out at Astro 5) and do NOT upgrade to Tailwind v4 (breaking rewrite, out of scope — milestone is explicitly no visual changes)
- Vercel Routing Middleware (platform feature, not an npm package) — request-time `/` locale redirect — the correct mechanism given `output: 'static'`, see Critical Pitfalls

### Expected Features

This migration doesn't add new user-facing features — it re-platforms existing ones. FEATURES.md scope is entirely about what the Astro migration itself must introduce/replace correctly.

**Must have (table stakes):**
- `astro:i18n` config (`locales: ['en','es']`, `defaultLocale: 'en'`, `prefixDefaultLocale: true`) generating symmetric `/en/*` and `/es/*` static trees
- A working root `/` → locale redirect that actually executes per-request in production (not just in `astro dev`)
- Blocking inline `<script is:inline>` theme-flip in `<head>`, decoupled from React hydration timing
- Locale-prefixed `<html lang>` set at build time, replacing runtime `document.documentElement.lang = lang`
- Per-component hydration directive chosen deliberately (no default-to-`client:load`)
- Full removal of `LanguageContext`/`ThemeContext` — islands read locale as a prop, theme as local DOM-synced state

**Should have (competitive/polish):**
- Locale switch preserves current section hash (`/en#experience` → `/es#experience`, not back to top)
- Cookie-based redirect persistence at `/` (not just `Accept-Language`) so a user's language choice sticks on return visits

**Defer (v2+):**
- Astro View Transitions (`<ClientRouter />`) for SPA-like locale switching — polish, not gate-critical
- `client:media` viewport-conditional hydration split for desktop/mobile Nav variants — only if bundle numbers post-migration justify it

### Architecture Approach

The target architecture splits every component into exactly two categories at author time: `components/astro/*` (About, Skill, Footer, Projects, Claude — zero client JS, receive already-resolved locale strings as props) and `components/react/*` (Nav with nested ThemeToggle, SectionPager, Experience's tech-filter, select Hero pieces — precisely-scoped hydration islands). Bilingual content resolution happens once, at build time, in each `.astro` page's frontmatter (`Astro.currentLocale` → `translations[locale]` / `pick(field, locale)` on `data/*.json`) and only the resolved plain strings are passed across the Astro→React island serialization boundary — never functions, Context objects, or resolver helpers. React Context has no equivalent across separate islands, so any current Context-provider pattern (`LanguageProvider`/`ThemeProvider` wrapping the app) must not be ported as-is.

**Major components:**
1. `BaseLayout.astro` — `<head>`, blocking theme script, meta/OG/JSON-LD, per-locale `<html lang>`, hreflang/canonical tags
2. `translations.ts` + `data/*.json` — build-time-only content sources, unchanged data shape, new consumption site (Astro frontmatter instead of React render)
3. `components/astro/*` — zero-JS static sections, the majority of the page by content volume
4. `components/react/*` — narrowly-scoped islands (Nav+ThemeToggle `client:load`; SectionPager, Experience filter `client:visible`)
5. Native HTML/CSS replacing former React state where possible (`<details>`/`<summary>` for Experience expand/collapse and Hero's CV dropdown — removes two islands the original design spec assumed were needed)
6. Root `/` redirect mechanism — Vercel Edge Middleware (platform-level, not Astro's own middleware) — see Critical Pitfalls

### Critical Pitfalls

1. **Astro's own `src/middleware.ts` does not run per-request under `output: 'static'`** — the design spec's plan for the `/` redirect is internally contradictory (static output + middleware-based redirect). Fix: use Vercel-native Edge Middleware (`middleware.ts` at repo root, framework-agnostic), decided explicitly in the foundation/routing phase before any other work builds on the wrong assumption.
2. **Missing hreflang/canonical tags is a net-new SEO risk this migration introduces** (single SPA URL → two separate static trees). Canonical absence is Lighthouse-SEO-scored (hits the SEO=1.0 gate directly); hreflang correctness is not scored but matters for real search visibility — both must be authored in `BaseLayout.astro` from the first locale-tree build, not bolted on later.
3. **React Context cannot cross island boundaries** — every place today's code relies on `LanguageProvider`/`ThemeProvider` wrapping multiple components that will become separate islands needs a redesign (props from the `.astro` parent for read-only build-time values like locale; local DOM-synced state for theme; ThemeToggle must stay nested inside the Nav island, not promoted to its own top-level island).
4. **Over-hydrating with `client:load` "to be safe" defeats the entire migration thesis** — reproduces the eager-JS problem in smaller pieces instead of one big bundle, and can still fail the same Performance budget. The Island Boundary table must be treated as a literal contract, re-verified per component at PR time, not "optimized later."
5. **Astro Container API cannot test client-side interaction** (clicks, state changes) — it's a static-HTML-assertion tool only, still experimental. Test-tool selection must exactly mirror the static/island split: Container API for zero-JS components, RTL unchanged for every island. Migrating every test file to Container API "because it's new" silently loses interactive-behavior coverage.

## Implications for Roadmap

Based on combined research, the suggested phase structure below follows ARCHITECTURE.md's "Suggested Migration/Build Order" (independently cross-validated by STACK.md, FEATURES.md, and PITFALLS.md all converging on the same sequencing-critical dependency: the routing/redirect decision must be made first).

### Phase 1: Foundation — Astro scaffold, routing, and layout shell
**Rationale:** Every subsequent phase depends on a working two-locale route tree, a base layout, and a resolved root-redirect strategy. The redirect mechanism decision (Vercel Edge Middleware vs. hybrid+adapter vs. client fallback) determines whether `astro.config.mjs` carries an adapter at all — a decision that ripples into every later phase's acceptance criteria if deferred.
**Delivers:** `astro.config.mjs` (`output: 'static'`, `astro:i18n` with `prefixDefaultLocale: true`, `redirectToDefaultLocale: false`), `BaseLayout.astro` (head script, meta/OG/JSON-LD, hreflang/canonical), working root-redirect mechanism deployed and verified against `astro preview`/real Vercel deploy (not just `astro dev`), Astro Container API test harness stood up, `vercel.json` SPA-rewrite removed + `404.astro` authored, `three` dependency removed, `engines.node >=22.12.0` pinned.
**Addresses:** `astro:i18n` config, root redirect (FEATURES.md table stakes), hreflang/canonical
**Avoids:** Pitfall 1 (middleware/static-output mismatch), Pitfall 2 (missing hreflang/canonical), Pitfall 3 (redirect-loop from prefix config), Pitfall 8 (SPA-rewrite cleanup gaps), Pitfall 9 (auditing the wrong URL — decide the 3-URL Lighthouse target list here)

### Phase 2: Nav island (shell navigability)
**Rationale:** Landing the Nav island early gives every subsequent content phase a working, navigable, testable shell for incremental UAT, and proves the prop-serialization pattern (Pitfall 4) and the theme-flip/ThemeToggle pairing (Pitfall 6) before more components depend on the same patterns.
**Delivers:** `Nav.jsx` as `client:load` with nested `ThemeToggle` (not a separate island), scroll-spy carried over unchanged, locale switcher wired to real `/en`/`/es` links preserving the current section hash.
**Uses:** `@astrojs/react` island hydration, `astro:i18n` `getRelativeLocaleUrl()`
**Implements:** Pattern 2 (no cross-island Context) and Pattern 1 (build-time locale resolution) from ARCHITECTURE.md

### Phase 3: Static content sections
**Rationale:** No cross-dependencies among these; lowest risk; validates the Astro Container API testing pattern (and its coverage gaps vs. RTL) before tackling the remaining stateful islands.
**Delivers:** About, Skill, Footer, Projects, Claude migrated to `components/astro/*`, each consuming existing `data/*.json` directly (zero data-shape change) — including Claude, which the source design spec's island table omits entirely (Gap 1 in ARCHITECTURE.md).
**Addresses:** All static-content table-stakes features
**Avoids:** Pitfall 7 (Container API misapplied to interactive components — these are exactly the components where it *is* the right tool)

### Phase 4: Hero
**Rationale:** LCP-critical, so it's isolated from the bulk static-content phase; requires deciding CSS `steps()` vs. small island for char-reveal, converting `CvDownload` to native `<details>`, and consolidating the duplicated count-up animation (Hero + About) into one shared vanilla script.
**Delivers:** Hero static HTML/CSS shell (already framework-agnostic), any remaining interactive slice scoped tightly, `scripts/count-up.ts` shared enhancer.
**Implements:** Pattern 3 (native HTML/CSS before a React island) from ARCHITECTURE.md

### Phase 5: SectionPager
**Rationale:** Depends on `useActiveSection` logic already proven working in Phase 2 (Nav); low risk, isolated component.
**Delivers:** `SectionPager.jsx` as `client:visible`, unchanged logic.
**Avoids:** Pitfall 5 (over-hydration — confirm `client:visible`, not `client:load`, since this is below-the-fold)

### Phase 6: Experience
**Rationale:** The design spec under-scopes this component as having one stateful concern (expand/collapse); it actually has two (expand/collapse AND a tech-chip filter that dims non-matching cards). Native `<details>` resolves the first with zero JS; the filter needs its own narrow island or vanilla script.
**Delivers:** Native `<details>`/`<summary>` expand/collapse (zero JS), scoped `ExperienceFilter` (vanilla script or narrow `client:visible` island) for tech-chip dimming only.
**Avoids:** Pitfall 5 (Anti-Pattern 3 in ARCHITECTURE.md — treating expand/collapse as the only stateful piece)

### Phase 7: Lighthouse gate + cleanup
**Rationale:** Final verification phase; must audit all three meaningfully different URLs, not just the two locale pages, since the redirect hop itself has a measurable performance cost that's invisible if only `/en`/`/es` are gated.
**Delivers:** `npm run lighthouse:mobile` passing against `/`, `/en`, AND `/es` (Perf ≥0.95, A11y/BP/SEO = 1.0), remaining CRA/Vite-CSR leftovers removed, merge to `main` only once green.
**Avoids:** Pitfall 9 (auditing only the post-redirect URL and missing the real entry point's cost)

### Phase Ordering Rationale

- **Routing/redirect decision is a hard blocker for everything else** — three independent research passes (STACK, FEATURES, PITFALLS) converged on this as the single most consequential open item; it must be resolved in Phase 1, not discovered mid-migration when other phases have already built on the wrong assumption (`output: 'static'` + inert Astro middleware).
- **Nav before content sections** — every content phase needs a navigable, testable shell; Nav also establishes the prop-serialization and theme-sync patterns other islands will reuse.
- **Static sections before stateful islands** — validates the (weaker, more limited) Container API test tooling on the lower-risk half of the codebase first, so any coverage gaps are discovered before the migration is mostly done.
- **Experience and Hero isolated as their own phases** — both have hidden complexity the source design spec under-scoped (Experience's second stateful concern; Hero's duplicated count-up logic and CV dropdown), so they warrant dedicated attention rather than being bundled into "remaining islands."
- **Lighthouse gate is the true exit criterion**, not a nice-to-have — the entire milestone is defined by this gate, so it must be the last phase and must audit the redirect-bearing root URL, not just the two locale landing pages.

### Research Flags

Needs research during planning:
- **Phase 1 (Foundation/routing):** Vercel Edge Middleware implementation details (cookie parsing, `Accept-Language` parsing/validation against the allowlist, redirect response shape) — STACK.md and PITFALLS.md both flag this as the least-certain, highest-consequence piece; validate with a build spike before committing the whole plan to it. Also validate Tailwind v3 + Astro's native PostCSS pickup early (STACK.md flags this MEDIUM confidence, not explicitly confirmed in Astro's own docs for this exact combination).
- **Phase 3 (Static content) / test infrastructure:** Astro Container API's actual assertion coverage vs. the current 7-spec-per-section RTL pattern — spot-check one migrated component before treating the pattern as validated for the rest (experimental API, breaking-change risk in any release).
- **Phase 6 (Experience):** Native `<details>`/`<summary>` cross-browser Escape-key/close behavior for the CV dropdown use case, and the vanilla-script-vs-narrow-island tradeoff for the tech filter.

Phases with standard, well-documented patterns (skip `--research-phase`):
- **Phase 2 (Nav island):** `client:load` + prop-drilling is a directly-documented, verified Astro pattern (Context7 `/withastro/docs` HIGH confidence).
- **Phase 4 (Hero) / Phase 5 (SectionPager):** Standard `client:visible` island patterns, no novel integration risk.
- **Phase 7 (Lighthouse gate):** Existing gate script/thresholds are unchanged from prior milestones — only the target URL list is new (add `/` alongside `/en`/`/es`).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core versions verified via live npm registry `dist-tags.latest` queries and official Astro/Vercel docs; one item (Tailwind v3 + Astro native PostCSS auto-pickup) flagged MEDIUM — general Vite behavior confirmed but no Astro-doc paragraph explicitly confirms this exact combination |
| Features | HIGH | Verified via Context7 `/withastro/docs` for all Astro-specific claims (i18n config, hydration directives, theme-flip pattern) plus direct codebase reads confirming current component behavior |
| Architecture | HIGH for islands/content mechanics; MEDIUM for routing/middleware specifics | Verified against official docs + a GitHub issue cross-check; one material correction to the source design spec found (root-redirect mechanism) — this is the same finding independently corroborated by PITFALLS.md, raising overall confidence in the correction itself despite the individual-file MEDIUM rating |
| Pitfalls | MEDIUM-HIGH | Astro/Vercel platform mechanics verified against official docs and multiple GitHub issues; project-specific consequences are reasoned from the approved design spec rather than independently tested against a live deployment |

**Overall confidence:** HIGH

### Gaps to Address

- **Root redirect mechanism is a design decision, not yet an implementation** — all four research files agree Vercel Edge Middleware is the best-fit option, but the actual cookie/header-parsing code, allowlist validation, and redirect response must be built and tested against a real Vercel preview deployment (not just `astro dev`) in Phase 1 before any later phase assumes it works.
- **Tailwind v3 + Astro's Vite-native PostCSS pickup** — MEDIUM confidence combination per STACK.md; validate with a small build spike at the very start of Phase 1, before committing later phases' styling work to the assumption.
- **Astro Container API coverage parity with existing RTL suite** — unresolved until at least one component is migrated and its test assertions are compared side-by-side with the original RTL spec; budget explicit time for this in Phase 3, don't assume "tests are green" means "coverage is equivalent."
- **`@vercel/analytics` behavior against per-route static HTML** (vs. today's single SPA `index.html`) — flagged low-risk but unverified in ARCHITECTURE.md; worth a quick check at Phase 7 close.

## Sources

### Primary (HIGH confidence)
- npm registry live queries — `astro`, `@astrojs/react`, `@astrojs/vercel`, `@astrojs/tailwind` `dist-tags.latest` and `peerDependencies`
- Context7 `/withastro/docs` — i18n routing/config, island hydration directives, theme-flip tutorial pattern, Container API reference
- https://docs.astro.build/en/guides/internationalization/, /en/guides/middleware/, /en/guides/on-demand-rendering/, /en/concepts/islands/, /en/reference/container-reference/, /en/guides/deploy/vercel/, /en/guides/testing/
- https://vercel.com/docs/routing-middleware, https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Direct codebase reads: `package.json`, `vite.config.js`, `vercel.json`, `src/App.jsx`, `src/i18n/LanguageContext.jsx`, `src/i18n/ThemeContext.jsx`, `src/i18n/translations.js`, `src/hooks/useActiveSection.js`, `src/components/Nav.jsx`, `src/components/Hero.jsx`, `src/components/Experience.jsx`, `src/components/SectionPager.jsx`, `src/components/_shared/ThemeToggle.jsx`, `src/components/About.jsx`, `src/data/*.json`
- `docs/superpowers/specs/2026-07-19-astro-migration-design.md` (commit `6a3bf4a`) — source design spec, extended/corrected by this research

### Secondary (MEDIUM confidence)
- [withastro/astro issue #13875, #9300, #6446, #10536, #13900] — GitHub issues corroborating static-output middleware limitations and Vercel rewrite/adapter edge cases
- Community articles: FOUC-killer patterns, Astro i18n 2026 guide, Astro SEO guide — cross-checked against official docs, not sole source for any claim

### Tertiary (LOW confidence)
- None — all findings traced to at least one primary/official source or direct codebase read

---
*Research completed: 2026-07-19*
*Ready for roadmap: yes*
