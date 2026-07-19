# Architecture Research

**Domain:** Astro SSG + React islands migration for an existing bilingual (EN/ES) React 18 CSR portfolio
**Researched:** 2026-07-19
**Confidence:** HIGH for Astro islands/content mechanics (Context7 unavailable in this environment, verified via official docs + WebSearch cross-checks); MEDIUM for routing/middleware specifics (verified against official docs, one material correction to the source design spec found — see Anti-Patterns); HIGH for current-codebase mapping (read directly from source)

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                     Build time (Astro SSG, output: 'static')           │
├───────────────────────────────────────────────────────────────────────┤
│  translations.ts / *.json  →  .astro frontmatter  →  pick(field,locale)│
│         (data layer)             (build-time read)      (plain HTML)   │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ /en/index  │  │ /es/index  │  │ BaseLayout │  │ middleware │       │
│  │  .astro    │  │  .astro    │  │  .astro    │  │  (limited) │       │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────────────┘       │
│        │                │                │                             │
│  ┌─────┴────────────────┴────────────────┴──────────────────────┐    │
│  │  components/astro/*.astro (About, Skill, Footer, Projects,     │    │
│  │  Claude) — zero client JS, pure server-rendered HTML            │    │
│  └───────────────────────────────────────────────────────────────┘    │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  components/react/*.jsx — serialized props only, islands below │    │
│  └───────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────┘
                                    │  ships to client
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          Runtime (browser, per island)                  │
├───────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  Nav     │  │ SectionPager │  │ Hero (small)│  │ Experience      │  │
│  │ island   │  │   island     │  │   island(s) │  │ filter (vanilla │  │
│  │ (Theme-  │  │ client:visible│  │ client:visible│ │ script, no     │  │
│  │  Toggle  │  │              │  │             │  │ React runtime) │  │
│  │  nested) │  │              │  │             │  │                 │  │
│  │ client:load│ │              │  │             │  │ expand/collapse │  │
│  │          │  │              │  │             │  │ = native        │  │
│  │          │  │              │  │             │  │ <details>       │  │
│  └──────────┘  └──────────────┘  └─────────────┘  └────────────────┘  │
│  Each island hydrates independently — no shared React tree, no cross-  │
│  island Context. Inline blocking <head> script owns theme DOM state.   │
└───────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|-----------------|-------------------------|
| `BaseLayout.astro` | `<head>`, blocking theme script, JSON-LD, OG/meta tags, per-locale `<html lang>` | Astro layout, receives `locale`/`t.meta` as props from each page |
| `translations.ts` | Nav labels, meta, hero copy, stats labels, footer copy (post-v4.0, only these subtrees remain) | Flat `{en:{...}, es:{...}}` object, imported at build time in `.astro` frontmatter — **no runtime Context** |
| `src/data/*.json` (about, skills, contact, experience, projects, claude) | Per-section bilingual content, already `{en, es}` field shape | Imported directly (native JSON import), resolved via `pick(field, locale)` inside `.astro` frontmatter |
| `components/astro/*` | Zero-JS static sections | `.astro` components, receive resolved locale string as prop, no client directive |
| `components/react/*` | Interactive islands only | `.jsx`, receive **serializable** props (strings/numbers/plain objects — no functions, no Context) |
| Vanilla `<script>` enhancers | Animation-only DOM mutation (count-up numbers, char-reveal) | Framework-free `<script type="module">`, `data-*` attribute driven, IntersectionObserver + rAF — no island needed |
| Inline `<head>` script (`BaseLayout.astro`) | Sets `data-theme` before first paint | Same mechanism as today, now decoupled from React hydration timing entirely |

## Recommended Project Structure

```
src/
├── layouts/
│   └── BaseLayout.astro          # <head>, theme inline-script, JSON-LD, OG tags, <html lang={locale}>
├── pages/
│   ├── index.astro                # thin static fallback (see Anti-Patterns — real redirect logic lives outside Astro)
│   ├── en/index.astro              # imports translations + all *.json at build time
│   └── es/index.astro
├── components/
│   ├── astro/                     # zero client JS
│   │   ├── About.astro
│   │   ├── Skill.astro
│   │   ├── Footer.astro
│   │   ├── Projects.astro
│   │   ├── Claude.astro           # NOT in original spec table — must be added, see Gaps
│   │   └── SectionLabel.astro     # optional: reintroduce as shared static partial (v4.0 explicitly dropped this — now safe again, zero JS cost)
│   ├── react/                     # islands — one file per hydration boundary
│   │   ├── Nav.jsx                # client:load, ThemeToggle nested as child (NOT a separate island)
│   │   ├── SectionPager.jsx       # client:visible
│   │   ├── HeroCountUp.jsx        # client:visible, OR replaced by vanilla script (recommended)
│   │   └── ExperienceFilter.jsx   # client:visible, OR replaced by vanilla script (recommended) — scoped to filter chips only, NOT expand/collapse
│   └── _shared/                   # cross-cutting helpers, not components
├── scripts/                        # NEW — vanilla, framework-free progressive enhancement
│   ├── count-up.ts                # shared by Hero stats + About quick-facts (currently duplicated as two separate React hooks)
│   └── char-reveal.ts             # optional, only if CSS steps() typewriter is rejected
├── data/                           # UNCHANGED — about.json, skills.json, contact.json, experience.json, projects.json, claude.json
├── i18n/
│   └── translations.ts            # renamed from .js; same shape, consumed at build time only
├── styles/                         # index.css equivalent, Tailwind config unchanged
└── middleware.ts                   # ONLY if hybrid output adopted for the "/" redirect — see Anti-Patterns
```

### Structure Rationale

- **`components/astro/` vs `components/react/` split** mirrors the design spec exactly and gives a hard, greppable signal of hydration cost — anyone adding a component must choose a folder, which forces the "static first" decision at author time rather than defaulting to React out of habit.
- **`src/scripts/`** is new versus the design spec's original tree. It exists because two components (Hero, About) currently duplicate an identical `useCountUp` React hook purely for on-scroll number animation with zero user interaction — that is not "interactivity," it is DOM text mutation, and does not need a React island or its runtime. Consolidating into one framework-free script cuts island count and JS payload simultaneously.
- **`data/` unchanged** — this is the biggest low-risk win in the whole migration. Every section's JSON already uses the `{en, es}` field shape with a per-component `pick(field, lang)` helper (per decision `D-v4.0-JSON-PER-SECTION`). Astro's native JSON import (`import data from '../data/about.json'`) makes these files directly consumable in `.astro` frontmatter with **zero data-shape changes** — the migration only moves the *consumption site* (React render → Astro frontmatter), not the data contract.
- **`translations.ts`** is deliberately kept flat and small (110 lines post-v4.0 slice purges) — it is no longer the primary content store (that's `data/*.json`), it only holds `nav`, `meta`, `hero`, `stats`, `footer` subtrees. This makes it cheap to import wholesale into every page's frontmatter without a schema/validation layer.

## Architectural Patterns

### Pattern 1: Build-time locale resolution replaces `LanguageContext`

**What:** Two fully static route trees (`/en/*`, `/es/*`) generated via `astro:i18n` (`locales: ['en','es']`, `defaultLocale: 'en'`). Each page's frontmatter reads `Astro.currentLocale` once, resolves `translations[locale]` and every `data/*.json` `pick(field, locale)` call at build time, and passes the *already-resolved strings* (never the whole bilingual object, never a setter function) into any islands that need text.

**When to use:** Every `.astro` static component and every island that only *displays* localized text (Nav labels, SectionPager aria-labels, Experience expand/collapse labels).

**Trade-offs:** Eliminates the flash-of-wrong-language on load (was the #1 documented React CSR weakness — `LanguageContext` reads `localStorage`/`navigator.language` only after mount). Loses runtime language switching without a page navigation — but the language switcher was always meant to navigate to a new URL prefix in this design, so this is not a regression, it's the correct model for a statically-generated bilingual site (also improves SEO — two indexable, crawlable URLs instead of one URL with client-toggled content).

**Example:**
```astro
---
// src/pages/en/index.astro
import translations from '../../i18n/translations'
import aboutData from '../../data/about.json'
import About from '../../components/astro/About.astro'
import Nav from '../../components/react/Nav.jsx'

const locale = Astro.currentLocale ?? 'en'
const t = translations[locale]
---
<Nav client:load lang={locale} navLabels={t.nav} />
<About locale={locale} data={aboutData} />
```

### Pattern 2: No cross-island Context — props down, or per-island local state

**What:** Astro hydrates each `client:*` component in **complete isolation** — they do not share a JS module scope, a React root, or a Context provider tree, even if they are siblings on the same page. A `LanguageProvider`/`ThemeProvider` wrapping the whole app (today's `App.jsx` pattern) has no Astro equivalent and does not work across separate islands.

**When to use:** Always, when more than one island exists on a page.

**Trade-offs:**
- Locale is not runtime-mutable state in the new model (see Pattern 1) — so no cross-island sync problem exists for language at all; every island simply receives its already-resolved locale string as a prop.
- Theme *is* runtime-mutable client state (user can click the toggle), but only one island in the current component tree needs it: `ThemeToggle`, which today is already a **child component nested inside `Nav`**, not a sibling. Keep it nested — do not promote `ThemeToggle` to its own top-level Astro island (the design spec's island table lists it as a separate row, which is directionally fine for the JS/architecture story but should not be read as "mount `<ThemeToggle client:load />` as its own tag" — that would duplicate hydration bootstrapping for something that only ever renders inside Nav today). The toggle mutates `document.documentElement.dataset.theme` directly (a DOM side-effect, not React state passed elsewhere) and persists to `localStorage` — no provider needed, `useState(() => document.documentElement.dataset.theme)` as local island state is sufficient.
- If a future page genuinely needs theme state shared across two *independent* top-level islands, the correct tool is a tiny shared store (e.g. `nanostores`) subscribed to by each island — not React Context. Not needed for the current component set; flag only if scope grows.

### Pattern 3: Native HTML/CSS before a React island (Astro's own "static-first" guidance)

**What:** Before wiring `client:*` on a component, check whether the interaction is expressible with a browser-native primitive: `<details>`/`<summary>` for disclosure (expand/collapse), CSS `:target`/`:has()` for simple toggles, `<dialog>` for modals, CSS `@keyframes` + `animation-delay` for entrance stagger (already how Hero/About do their fade/slide-in — this needs **zero** change, it was never React-dependent).

**When to use:** Concretely applies to two places in this codebase that the design spec under-scoped:
1. **Experience expand/collapse** — currently a `useState`-driven `aria-expanded` toggle per card. `<details>`/`<summary>` gives identical accessibility semantics (native disclosure widget, keyboard support, screen-reader announced) with zero JS. Chevron rotation becomes a CSS `details[open] svg { transform: rotate(180deg) }` selector instead of a className toggle.
2. **Hero's `CvDownload` dropdown** — currently a `useState` + click-outside/Escape-key `useEffect`. `<details>`/`<summary>` covers open/close and keyboard dismiss (Escape support varies slightly by browser but is broadly adequate for a two-item CV menu); trades a small amount of custom-close polish for zero JS.

**Trade-offs:** Removes JS entirely for two interactions the original design spec described as needing an island ("Experience expand/collapse `client:visible`"). This directly serves the milestone's core motivation (Lighthouse mobile hard gate). The remaining genuinely-stateful piece of Experience — the **tech filter chips that dim non-matching cards across the whole list** (`activeTech` state in `FilterBar`) — is a separate concern the design spec's rationale ("only the stateful piece is expand/collapse") did not account for; see Gaps below.

### Pattern 4: Content collections are optional here — direct JSON import is sufficient

**What:** Astro Content Collections (`src/content/`, `defineCollection` + Zod `schema`, `glob()` loader) add: (a) automatic TypeScript types generated from a schema, (b) build-time schema validation (fails the build if a JSON entry is malformed), (c) a query API (`getCollection`, `getEntry`) instead of raw `import`.

**When to use vs. direct import:** Content Collections earn their overhead when data volume is large (hundreds of entries), when entries are authored as separate Markdown/MDX files (not applicable — every current data file is one JSON file per section, not per-entry), or when schema drift across entries is a real risk (e.g., many contributors). None of these apply here: 6 data files, single-JSON-per-section, single author, all already conforming to one hand-maintained `{en, es}` shape.

**Recommendation:** Use direct `import data from '../data/experience.json'` in `.astro` frontmatter — same pattern the React components use today (`import data from '../data/experience.json'`), just moved to a build-time context instead of a component-render context. This is a **zero-diff migration for the data layer**. Content Collections would be a net-new abstraction layer solving a validation problem this project does not currently have (the `pick(field, lang)` helper already degrades gracefully — `field?.[lang] ?? field?.en ?? ''` — so malformed entries fail soft, not hard, which is arguably what a portfolio site wants over a hard Zod build failure). Revisit only if the `experience.json`/`projects.json` entry count grows materially or a non-technical content editor is introduced.

## Data Flow

### Static component render (About, Skill, Footer, Projects, Claude)

```
data/<section>.json  →  .astro frontmatter import
                              ↓
                    pick(field, Astro.currentLocale)
                              ↓
                    plain HTML string interpolation in template
                              ↓
                    served as pre-rendered HTML, zero client JS
```

### Island hydration (Nav, SectionPager, Experience filter)

```
page frontmatter resolves: locale, t.nav (or relevant subtree), any *already-picked* strings
                              ↓
        <Nav client:load lang={locale} navLabels={t.nav} /> — props serialized into HTML
                              ↓
        browser downloads ONLY Nav's JS chunk (Astro per-component code-split)
                              ↓
        React hydrates Nav in isolation — reads props, no Context provider needed
                              ↓
        useActiveSection (IntersectionObserver) still runs client-side — unchanged from today
```

### Theme flow (decoupled from all hydration)

```
BaseLayout.astro <head> inline <script> (blocking, runs before paint)
                              ↓
        reads cookie/localStorage/prefers-color-scheme → sets document.documentElement.dataset.theme
                              ↓
        (later, async) Nav island hydrates → ThemeToggle reads current dataset.theme as initial local state
                              ↓
        user click → toggle mutates DOM attribute directly + writes localStorage — no provider round-trip
```

## Scaling Considerations

Not a traffic-scaling concern (static portfolio site) — the relevant "scale" axis here is **island count / JS payload growth** as more interactive features are added over time.

| Scale | Architecture Adjustments |
|-------|---------------------------|
| Current scope (6-7 sections, ~5 islands) | Direct JSON import, no Content Collections, no shared state library — exactly what's proposed above |
| If a CMS-editable content path is added later | Revisit Content Collections with Zod schema for validation at that point — not before |
| If theme/locale state needs to sync across 3+ independent top-level islands | Introduce `nanostores` (Astro's documented recommendation for cross-island state) rather than reintroducing Context |
| If a genuinely dynamic feature is added (e.g., live contact form submission, comments) | That single route/component may need `export const prerender = false` + an adapter (`@astrojs/vercel`) — keep it scoped to that one route, do not flip the whole site to `output: 'server'` |

### Scaling Priorities

1. **First bottleneck:** JS payload creep from over-islanding (reaching for a React island by default instead of checking Pattern 3 first). Mitigate by keeping the `components/astro/` vs `components/react/` folder split as a forcing function, and by treating "does this need `<details>`/CSS/vanilla script instead?" as a mandatory question before writing a new island.
2. **Second bottleneck:** Astro Container API test coverage — it is explicitly experimental (confirmed via Astro's own docs, still marked experimental as of this research date) and is a newer surface than the project's existing 12 Vitest+RTL files. If it cannot assert everything the current RTL suites assert (bilingual text presence, ARIA attributes), some static components may need a thinner smoke-test tier rather than 1:1 parity — budget time for this validation early, not at the end of the milestone.

## Anti-Patterns

### Anti-Pattern 1: Wrapping the app in `LanguageProvider`/`ThemeProvider` the way `App.jsx` does today

**What people do:** Try to preserve the existing Context-provider pattern by wrapping a top-level Astro layout in a single big island that renders the whole page tree inside `<LanguageProvider><ThemeProvider>...</ThemeProvider></LanguageProvider>`.
**Why it's wrong:** This defeats the entire purpose of the migration — it turns the whole page back into one monolithic client-hydrated React tree (exactly the CSR-everything problem the milestone exists to fix) and is also not how Astro islands compose (a single island *can* contain nested React children, but making that island "the whole page" reintroduces the full React runtime + full-page hydration cost this migration is meant to eliminate).
**Do this instead:** Resolve locale at build time (Pattern 1) and keep theme as small, local, DOM-mutating state inside the one island that needs it (Pattern 2).

### Anti-Pattern 2: Assuming `output: 'static'` + a plain `src/middleware.ts` can do the `/` → `/en`|`/es` cookie/Accept-Language redirect at request time

**What people do:** Follow the design spec literally — "Root `/` resolves via Astro middleware... 302-redirect" — while also keeping `output: 'static'` and "no adapter/server runtime needed."
**Why it's wrong:** **This is a factual gap in the source design spec, verified against Astro's own docs during this research.** Astro middleware in `output: 'static'` mode runs **at build time only**, for prerendered pages — it cannot read a request-time cookie or `Accept-Language` header, because there is no server processing individual requests after the static build ships. Per-request middleware (cookies, headers, `Astro.redirect()` at runtime) requires either `output: 'server'`, or `output: 'hybrid'` with the specific route marked `export const prerender = false`, and in both cases an adapter (e.g. `@astrojs/vercel`) is required to actually execute that code on Vercel's infrastructure.
**Do this instead — three viable options, pick one during the foundation phase, not mid-migration:**
1. **Vercel platform-level Edge Middleware** (a `middleware.ts` at the *project root*, Vercel's own feature, independent of Astro's rendering mode) — runs on Vercel's edge network for every request regardless of whether the Astro output is static, and can read cookies/`Accept-Language` and issue a redirect/rewrite to `/en` or `/es` before Astro's static files are served. This is the option that best preserves the spec's stated goal ("no adapter/server runtime" for the *Astro app itself*) while still achieving a true zero-flash, request-time redirect.
2. **`output: 'hybrid'` + `@astrojs/vercel` adapter, only `/` marked `prerender = false`** — everything else in the site stays fully static/prerendered; only the redirect route becomes an on-demand Vercel function. Slightly contradicts "no adapter" but is the most idiomatic pure-Astro answer and keeps all redirect logic inside the Astro codebase instead of a separate Vercel-specific file.
3. **Client-side fallback (lowest infra complexity, matches what the app already does today):** `/` ships as a static page with a tiny inline script reading `localStorage`/`navigator.language` and calling `location.replace('/en'|'/es')` — accepts a brief visible flash/redirect hop (the exact behavior the milestone is trying to *improve on*, so this should be treated as a fallback, not the first choice) but requires zero adapter/middleware infrastructure at all.

This decision must be made explicitly in the foundation phase — it changes whether an adapter appears in `astro.config.mjs` at all, which affects the "no adapter/server runtime" framing in every later phase's acceptance criteria.

### Anti-Pattern 3: Treating Experience's tech-filter chips as covered by "expand/collapse is the only stateful piece"

**What people do:** Follow the design spec's Experience row literally — one `client:visible` directive covering "the expand/collapse control only."
**Why it's wrong:** Read directly from `Experience.jsx`, the component has **two independent pieces of client state**, not one: (1) per-card `openCards` (expand/collapse — solved by Pattern 3, `<details>`, no JS needed), and (2) `activeTech` (tech-chip filter, which dims every non-matching card across the whole visible list based on a shared array of active filters, plus a live `aria-live` match-count region). The filter is a real cross-entry interaction and was not accounted for in the spec's island-boundary rationale.
**Do this instead:** Scope Experience's remaining JS to the filter only, and prefer a vanilla `<script>` (DOM class/attribute toggling driven by `data-tech` attributes already present on server-rendered `.astro` markup) over a React island — the filter logic is pure DOM traversal + class toggling with no component tree to reconcile, so it does not need React's runtime at all. If a React island is preferred for consistency with the rest of the codebase, scope it tightly (`ExperienceFilter.jsx`, `client:visible`) and keep it separate from the (now JS-free) expand/collapse cards.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|----------------------|-------|
| Vercel (hosting) | Static file serving, no adapter for the bulk of the site | `vercel.json` SPA-fallback rewrite must be removed (per spec) — Astro emits real per-route files; keeping the rewrite would silently break the new `/en/*`/`/es/*` static tree by serving `index.html` for every path |
| `@vercel/analytics` | Currently a plain dependency, presumably script-injected | Re-verify it still initializes correctly with per-route static HTML instead of a single SPA `index.html` — low risk, but worth a phase-close check |
| Google Analytics (`G-4TZJGR3MXR`, referenced in PROJECT.md) | `<script>` tag in `<head>` | Move into `BaseLayout.astro` `<head>`, same as today's HTML-spec-compliant placement (v3.5 Phase 5 decision) — no architectural change, just a new host file |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|----------------|-------|
| Static pages ↔ islands | Serialized props only (strings, numbers, plain objects) | No functions, no class instances, no React Context values can cross this boundary — verified against Astro's official island-props serialization docs |
| Nav island ↔ ThemeToggle | Direct React parent/child (nested in the same island), not a separate hydration boundary | See Pattern 2 — do not split these into two Astro-level islands |
| Locale switcher (inside Nav) ↔ routing | Real `<a href="/es/...">` / `<a href="/en/...">` links, not client-side state change | Must preserve the current in-page hash fragment when switching languages (per design spec) — needs a small build-time or client-side helper to compute `getLocalizedPath(currentPath, targetLocale)` |
| Experience filter ↔ static entry cards | `data-tech="..."` attributes on server-rendered cards, read/toggled by a vanilla script or scoped island | No component-level data duplication needed — the filter script operates on already-rendered DOM, it does not need its own copy of `experience.json` |

## Gaps / Corrections vs. the Source Design Spec

For the downstream roadmap consumer — these are concrete deltas from `docs/superpowers/specs/2026-07-19-astro-migration-design.md`'s island-boundary table, found during this research:

1. **Claude section is missing from the island-boundary table entirely.** `src/components/Claude.jsx` exists in the current codebase (largest copy block, per PROJECT.md's Slice 7 description) and reads `data/claude.json` with no `useState`/`useEffect` found in it — it belongs in `components/astro/` alongside About/Skill/Footer/Projects. Add it explicitly to whatever phase migrates the other static sections.
2. **Contact's "re-verify react-hook-form" risk note is stale.** Current `package.json` (read directly) has **no** `react-hook-form` or `axios` dependency at all — both were already removed prior to this milestone (likely during the CRA→Vite migration). Contact is confirmed fully static content today; no live form exists to migrate or re-verify.
3. **About has an undocumented count-up animation** (`useCountUp` in `About.jsx`, identical logic to Hero's `Stat` component, both animating "quick facts" numbers on mount). The spec lists About as fully static (`none` hydration) — true for its *content*, but this one animation-only piece needs a decision: convert to the shared vanilla `scripts/count-up.ts` enhancer (recommended, Pattern 3) or accept it as a small island. Either way, this duplicated hook should not be copy-pasted into two separate React islands.
4. **`/` root redirect cannot work as literally specified** under `output: 'static'` with no adapter — see Anti-Pattern 2. This is the single highest-priority open item for the foundation phase, since it determines whether `astro.config.mjs` needs an adapter at all.
5. **Experience is under-scoped as one stateful concern** (expand/collapse) when it actually has two (expand/collapse + tech filter) — see Anti-Pattern 3. Native `<details>` resolves the first with zero JS; the filter needs its own explicit, narrow scope.

## Suggested Migration/Build Order

Numbered for roadmap phase sequencing; each phase should close with build green + its test tier green (Astro Container API for `.astro`, Vitest+RTL for remaining islands), per the design spec's stated gate discipline.

1. **Foundation** — Astro scaffold, `astro.config.mjs` (`output: 'static'`, `astro:i18n` with `locales: ['en','es']`, `defaultLocale: 'en'`), `BaseLayout.astro` (head script, meta/OG/JSON-LD), `translations.ts` adapted for build-time import, Astro Container API test harness stood up (`@astrojs/react` integration + `getContainerRenderer`), root-redirect strategy **decided and implemented** (resolve Anti-Pattern 2 here, not later), `vercel.json` SPA-rewrite removed, `three` dependency removed. This phase blocks everything else — no per-section work should start before the two-locale route tree and layout shell exist and render *something*.
2. **Nav island** — `Nav.jsx` as `client:load` (ThemeToggle nested, not separate), scroll-spy (`useActiveSection`) carried over unchanged, locale switcher wired to real `/en`/`/es` links preserving hash. Landing this early gives every subsequent phase a working, navigable, testable shell for incremental UAT.
3. **Static content sections** (any order among themselves, no cross-dependencies): About, Skill, Footer, Projects, Claude → `components/astro/*`, each consuming its existing `data/*.json` directly. Lowest risk, validates the Astro Container API testing pattern before tackling islands.
4. **Hero** — LCP-critical static HTML/CSS stays as-is (already framework-agnostic); decide CSS `steps()` vs. small island for char-reveal; convert `CvDownload` to native `<details>`; consolidate count-up (Hero + About) into `scripts/count-up.ts`.
5. **SectionPager** — `client:visible`, unchanged logic, depends on `useActiveSection` already proven in phase 2.
6. **Experience** — native `<details>` for expand/collapse (zero JS); scoped `ExperienceFilter` (vanilla script or narrow island) for the tech-chip dimming behavior only.
7. **Lighthouse gate + cleanup** — run `npm run lighthouse:mobile` against the Astro build, verify perf ≥0.95 / a11y/best-practices/SEO = 1.0 (existing hard gate script, unchanged), remove any remaining CRA/Vite-CSR leftovers, merge to `main` only once green (per milestone exit criteria).

## Sources

- [Astro Islands architecture](https://docs.astro.build/en/concepts/islands/) — island isolation, no cross-island Context, "static-first" guidance
- [Astro Internationalization (i18n) routing](https://docs.astro.build/en/guides/internationalization/) — `Astro.currentLocale`, `defaultLocale`/`locales`, `prefixDefaultLocale`
- [Astro Middleware](https://docs.astro.build/en/guides/middleware/) — build-time vs. per-request execution, prerendered vs. on-demand pages
- [Astro On-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) — cookies/headers only available for non-prerendered routes
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) — schema/type benefits, when glob-loader overhead is/isn't justified
- [Astro Container API (experimental)](https://docs.astro.build/en/reference/container-reference/) — status confirmed still experimental at research date, matches design spec's own noted risk
- [withastro/astro issue #13875 — isPrerendered/middleware static output nuance](https://github.com/withastro/astro/issues/13875) — corroborates static-output middleware limitation
- Direct source reads: `src/App.jsx`, `src/index.jsx`, `src/i18n/LanguageContext.jsx`, `src/i18n/ThemeContext.jsx`, `src/i18n/translations.js`, `src/hooks/useActiveSection.js`, `src/components/Nav.jsx`, `src/components/Hero.jsx`, `src/components/Experience.jsx`, `src/components/SectionPager.jsx`, `src/components/_shared/ThemeToggle.jsx`, `src/components/About.jsx`, `src/data/about.json`, `src/data/projects.json`, `package.json`, `vercel.json` — current-codebase confidence HIGH
- `docs/superpowers/specs/2026-07-19-astro-migration-design.md` (commit `6a3bf4a`) — source design spec being extended/corrected by this research

---
*Architecture research for: Astro SSG + React islands migration (v5 milestone)*
*Researched: 2026-07-19*
