# Phase 21: Foundation — Astro scaffold, i18n routing & layout shell - Research

**Researched:** 2026-07-19
**Domain:** Astro `^7.1.1` static-site scaffold, `astro:i18n` routing, Vercel-native Edge Middleware, Container API test harness, Vercel deploy config
**Confidence:** HIGH (every syntax claim below verified against current official Astro/Vercel docs and/or live npm registry queries during this session — this document does not repeat milestone-level research already captured in `.planning/research/{STACK,ARCHITECTURE,PITFALLS,SUMMARY}.md`, it only adds implementation-precise syntax for Phase 21's deliverables)

> Context7 MCP tools were not available in this environment (no `mcp__context7__*` tools registered, and the `ctx7` CLI is not installed on this machine). All findings below come from direct `WebFetch` of official Astro/Vercel documentation pages (fetched 2026-07-19) and live `npm view` registry queries — tier 2/HIGH per the source hierarchy, not Context7's tier 1, but still primary-source and current-dated.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Redirect / middleware (ROUTE-02)**
- **D-01:** Cookie name stays `cam-lang` — same name as today's `localStorage` key, for continuity. It becomes a real cookie (not localStorage) since the middleware reads it server/edge-side before any JS runs.
- **D-02:** Accept-Language parsing uses the same simple heuristic as today's `LanguageContext.jsx` (`readInitialLang`): header contains `es` → `es`, else → `en`. No q-value weighted parsing library — over-engineering for 2 supported locales.
- **D-03:** Redirect status is `302` (temporary) — the destination depends on the visitor (cookie/header), so `301` would wrongly tell crawlers/browsers to permanently cache `/` → `/en`, breaking detection for other visitors.
- **D-04:** The middleware runs on every route (not just `/`) and refreshes the `cam-lang` cookie on each request based on the path visited (`/en/*` sets `es`→`en`, `/es/*` sets it to `es`). This way a visitor who lands directly on `/es` via search and later revisits `/` from another tab gets redirected to their actual last-visited locale, not just Accept-Language guesswork.

**Canonical domain / SEO (ROUTE-03)**
- **D-05:** Canonical/hreflang/`og:url`/JSON-LD base domain is `https://andresmontoyat.co` — matches what `index.html` already hardcodes today, even though DNS isn't cut over yet (DEPLOY-02, separate backlog). Keeps consistency with existing meta tags; zero code change needed when the domain goes live.
- **D-06:** The base domain is read from a `PUBLIC_SITE_URL` build-time env var (Astro `import.meta.env`), not hardcoded in `BaseLayout.astro`. Single place to update in Vercel project settings when DEPLOY-02 lands — no code/PR needed.

**Meta / OG / JSON-LD in BaseLayout (ROUTE-03, ROUTE-04)**
- **D-07:** `translations.js` already has `meta.title` / `meta.description` per locale (`en` block lines ~29-31, `es` block lines ~82-84) — `BaseLayout.astro` frontmatter resolves these at build time per route, replacing the current runtime `useEffect` override in `LanguageContext.jsx`.
- **D-08:** JSON-LD `Person` schema stays static and untranslated (same English `jobTitle`/`description` in both locales) — schema.org structured data isn't user-facing content and Google doesn't penalize English-only structured data; not worth bilingual duplication effort.
- **D-09:** Google Analytics `gtag` script stays inline in `BaseLayout.astro` `<head>`, copy-pasted as-is from current `index.html` — GA ID isn't sensitive, doesn't vary by environment, out of scope to move to an env var in this phase.

**404 page (new — DEPLOY-02 area)**
- **D-10:** `404.astro` is a single generic route (Astro's standard catch-all) — no per-locale duplication (`/en/404`, `/es/404`), since Astro doesn't route 404s by locale prefix automatically and there's no real benefit here.
- **D-11:** Minimal design: current dark palette Tailwind tokens (`bg-ink-900`, `text-neon`, etc.), simple bilingual message (or locale-inferred from the broken URL's `/en`/`/es` prefix if present), link back to `/`. No new animation/personality work — this is a foundation-phase page almost nobody sees.

### Claude's Discretion
- Exact bilingual copy/wording for the 404 page message.
- Exact middleware cookie-refresh implementation detail (e.g., whether it's a single `middleware.ts` function or split helpers) — implementation detail, not a user-facing decision.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Custom domain DNS cutover (DEPLOY-02 backlog item, separate from this migration) was referenced as context for the `PUBLIC_SITE_URL` decision (D-06) but is explicitly not actioned in this phase.

### Phase Boundary (from CONTEXT.md)
**In scope:** `astro.config.mjs`, `astro:i18n` config, `middleware.ts` (Vercel Edge Middleware), `BaseLayout.astro`, `404.astro`, `vercel.json` edits, `package.json` cleanup, Astro Container API test harness stood up (proof-of-life, not full test migration).
**Out of scope:** Nav/ThemeToggle island (Phase 22), any content-section component (Phase 23+), custom domain DNS cutover (separate backlog, unrelated to this migration).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUTE-01 | Site serves fully static content at `/en` and `/es` via `astro:i18n`, symmetric locale trees | Exact `astro.config.mjs` `i18n` block syntax confirmed (§ Architecture Patterns); file structure `src/pages/en/*`, `src/pages/es/*` confirmed |
| ROUTE-02 | `/` redirected (302) via Vercel Edge Middleware, `cam-lang` cookie first, else `Accept-Language` | Exact `middleware.ts` file location/export signature/`config.matcher` syntax confirmed; manual cookie-parsing requirement identified (no framework-agnostic cookie helper exists) |
| ROUTE-03 | hreflang + canonical tags per locale page | Exact `getAbsoluteLocaleUrl`/`getRelativeLocaleUrl` signatures confirmed; `<link rel="alternate" hreflang>` pattern confirmed |
| ROUTE-04 | `html lang` set per locale at build time | `Astro.currentLocale` confirmed as the build-time source of truth, no runtime mutation needed |
| ISLAND-04 | Theme flips before first paint via blocking inline `<head>` script | Astro's own official `<script is:inline>` dark-mode pattern confirmed verbatim (adapted to project's `dataset.theme` convention, not the tutorial's `class` toggle) |
| DEPLOY-01 | `three` removed from `package.json` | No new syntax needed — confirmed unused via STACK.md's prior grep; plain `npm uninstall three` |
| DEPLOY-02 | `vercel.json` SPA-rewrite removed, `404.astro` authored, cache headers scoped to `/_astro/*` | Vercel's own docs confirm `vercel.json` rewrites are explicitly unsupported for Astro (stronger finding than milestone research had); exact `404.astro` file convention and output filename (`404.html`) confirmed |
| DEPLOY-03 | `engines.node >=22.12.0` pinned; Vercel Node version updated | Exact `engines.node` semver-range-to-deployed-version mapping table confirmed from Vercel's own docs |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

The project-root `CLAUDE.md`'s "Technology Stack" section is **stale for this phase** — it documents a CRA/craco/react-scripts toolchain (`craco.config.js`, `postcss7-compat`) that a prior migration (tracked in user memory as "Stack: Vite/Vitest migration") already replaced with plain Vite. The live `package.json` read during this session confirms: `"dev": "vite"`, `"build": "vite build"`, `vite@^8.0.16`, `vitest@^4.1.9` — no `craco`/`react-scripts` dependency exists at all. **The planner should treat `package.json`/repo state as ground truth over `CLAUDE.md`'s stack narrative for this phase**; this Astro migration further supersedes both (Vite itself becomes wrapped by Astro internally per STACK.md).

Directives that DO still apply and must be honored by the plan:
- **GSD Workflow Enforcement**: All file-changing work in this phase must happen through a GSD command (`/gsd:execute-phase`), not direct ad hoc edits.
- **Bilingual (EN/ES) support is a hard constraint** — carried forward into the Astro migration as `astro:i18n` with symmetric `/en`/`/es` trees (already the phase's ROUTE-01 requirement).
- **Accessibility WCAG 2.1 AA basics** — applies to the new `404.astro` (D-11: keep it simple, but it must still meet contrast/keyboard-nav basics like every other page).
- **Hosting: static site, must build to static assets** — directly reinforced by this research (`output: 'static'`, no adapter, Vercel zero-config static deploy).
- **No semicolons, no comma-dangle enforcement, ESLint airbnb + `plugin:react/recommended`** (from the codebase-conventions doc read via prior sessions) — applies to any new/edited `.jsx`/`.js` files this phase touches (`middleware.ts` is TypeScript so ESLint/airbnb JS rules don't strictly apply, but any `.mjs`/`.js` config files should still follow the no-semicolon convention for consistency, at author's discretion since Astro/TS tooling conventionally does use semicolons in `.ts` files — flag as a style decision for the plan, not a hard requirement here).

## Summary

Astro `7.1.1` (npm `dist-tags.latest`, confirmed live) and `@astrojs/react@6.0.1` are the exact current versions; both match `.planning/research/STACK.md`'s prior findings exactly — no drift since that research pass earlier today. The `astro:i18n` config block, `astro:i18n` module functions (`getRelativeLocaleUrl`, `getAbsoluteLocaleUrl`, `Astro.currentLocale`), the Container API's `experimental_AstroContainer` import path, and the `404.astro` convention are all confirmed unchanged from what STACK.md/ARCHITECTURE.md already documented at the concept level — this research fills in the literal, copy-pasteable syntax.

The single most consequential precision gap closed by this research: **Vercel's own official Astro-integration docs explicitly state "Rewrites only work for static files with Astro... You should not use `vercel.json` to rewrite URL paths with Astro projects; doing so produces inconsistent behavior, and is not officially supported."** This directly confirms DEPLOY-02's SPA-rewrite removal is not just cleanup but a documented Vercel anti-pattern for Astro specifically. Separately, Vercel's Routing Middleware (the platform-native `middleware.ts` this phase's D-01..D-04 decisions require) has **no built-in cookie-parsing helper for non-Next.js frameworks** — the `request.cookies.get()` / `response.cookies.set()` convenience API is Next.js-only (`NextRequest`/`NextResponse`). For a framework-agnostic `middleware.ts` (which is what an Astro project gets), cookies must be read via `request.headers.get('cookie')` (manual string parse) and set via a literal `Set-Cookie` response header string. This is a new, concrete implementation constraint not present in the milestone-level PITFALLS.md.

**Primary recommendation:** Implement `middleware.ts` at the repo root using only standard Web `Request`/`Response`/`Headers` APIs (no `@vercel/functions` package needed for this phase's simple heuristic — that package is only required for `geolocation()`/`ipAddress()` helpers, which D-02 explicitly doesn't need), scope it with `export const config = { matcher: [...] }` to run on every route (per D-04), and hand-roll the two small pure functions this needs: a `Cookie` header parser and an `Accept-Language` two-locale heuristic mirroring `readInitialLang()`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|-----------------|-----------|
| Locale route generation (`/en/*`, `/es/*`) | CDN / Static (build output) | — | Astro's `astro:i18n` resolves routing entirely at build time; the output is pre-rendered static HTML served directly from Vercel's CDN, no server tier involved |
| Root `/` locale detection + redirect | Edge (Vercel Routing Middleware) | — | Must read a live cookie/`Accept-Language` header per request before the static file is served — this is inherently a request-time concern; Astro's `output: 'static'` build has no server tier to own it, so Vercel's platform-level Edge tier is the only tier that can (see Anti-Pattern 2, milestone ARCHITECTURE.md) |
| `hreflang`/canonical `<head>` tags | CDN / Static (build output) | — | Computed once per page at build time from `Astro.currentLocale` + `PUBLIC_SITE_URL`; no per-request logic needed |
| Theme flip (FOUC prevention) | Browser / Client | — | Must run synchronously before first paint, in the browser, before any framework hydrates — a blocking inline `<script is:inline>` in `<head>` is the only tier that can act early enough |
| `404` handling | CDN / Static (build output) | Edge (Vercel's default 404 serving) | Astro pre-builds `404.html` at the static tier; Vercel's own platform serves it automatically for unmatched paths — no middleware/edge logic authored by this phase is needed for 404 dispatch itself |
| Cache-Control policy for hashed assets vs. HTML | CDN / Static (`vercel.json` `headers`) | — | Pure edge-cache configuration, no runtime code; scoped narrowly to `/_astro/(.*)` per Pitfall 8 (milestone PITFALLS.md) |
| Dependency/engine hygiene (`three` removal, `engines.node`) | Build tooling (not a runtime tier) | — | `package.json`-only changes, resolved entirely at install/build time, no architectural tier owns this at runtime |

**Why this matters for this phase specifically:** the phase's single highest-risk item (root `/` redirect) is the *only* capability in this table that requires the Edge tier at all — every other Phase 21 deliverable lives entirely in the static/build-output tier or the browser tier. This sanity-checks the phase's own D-01..D-04 decisions: introducing Vercel Edge Middleware is justified specifically and only by the redirect requirement, not by anything else in scope this phase. If a future task in the plan reaches for `middleware.ts` for something other than the `/` redirect + cookie refresh, that would be a tier misassignment worth challenging against this map.

## Standard Stack

### Core (re-verified live during this session — no drift from STACK.md)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | `7.1.1` [VERIFIED: npm registry, `dist-tags.latest`, queried live this session] | SSG build pipeline | Current GA; `engines.node: ">=22.12.0"` confirmed live via `npm view astro engines` |
| `@astrojs/react` | `6.0.1` [VERIFIED: npm registry, `dist-tags.latest`, queried live this session] | React island integration | `peerDependencies`: `react`/`react-dom` `^17.0.2 \|\| ^18.0.0 \|\| ^19.0.0` — confirmed live, no conflict with installed `react@18.3.1` |
| `@types/react` | latest matching `^18.x` [VERIFIED: npm registry, queried live] | Type defs for `@astrojs/react`'s peer set | DefinitelyTyped-maintained, `time.created: 2016` — long-established package |
| `@types/react-dom` | latest matching `^18.x` [VERIFIED: npm registry, queried live] | Type defs pair | Same as above |

No new supporting packages beyond what STACK.md already identified are required for this phase's deliverables. Specifically **do not add `@vercel/functions`** — D-02's simple two-locale Accept-Language heuristic and D-01's plain cookie read need only the standard Web `Request`/`Response`/`Headers` API; `@vercel/functions` is only needed for the `geolocation()`/`ipAddress()` convenience helpers, which are out of scope here (unless Open Question 1 below resolves in favor of needing `next()` for pass-through — see caveat there).

**Installation** (verified against this session's live registry queries — same commands as STACK.md, re-confirmed current):
```bash
npm install astro @astrojs/react
npm install @types/react @types/react-dom
npm uninstall three
```

## Package Legitimacy Audit

`slopcheck` was available and run live against the four packages this phase installs.

| Package | Registry | Age | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-------------|-----------|-------------|
| `astro` | npm | created 2021-03-13, last published 2026-07-17 | `github.com/withastro/astro` | `[OK]` | Approved |
| `@astrojs/react` | npm | created 2022-03-18, last published 2026-07-02 | `github.com/withastro/astro` (monorepo) | `[OK]` | Approved |
| `@types/react` | npm | created 2016-05-17, last published 2026-06-05 | `github.com/DefinitelyTyped/DefinitelyTyped` | `[OK]` | Approved |
| `@types/react-dom` | npm | created 2016-05-17, last published 2025-11-12 | `github.com/DefinitelyTyped/DefinitelyTyped` | `[OK]` | Approved |

**Packages removed due to slopcheck `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** none.

All four packages are confirmed via Context7-tier-equivalent official sources (live npm registry + official docs referencing them), pass `slopcheck [OK]`, and are years-old with official/DefinitelyTyped-maintained source repos — tagged `[VERIFIED: npm registry]` per the provenance rule (package names originated from the already-verified STACK.md research, cross-confirmed live in this session, not freshly discovered via unverified search).

*Note on process:* `slopcheck install` performs a real `npm install` (not a dry-run check, despite its name) — running it against this repo mid-research modified `package.json`/`package-lock.json`. Both were reverted via `git checkout -- package.json package-lock.json` immediately after the check completed, and `node_modules` was resynced via `npm install` to match the reverted lockfile. The repo is confirmed clean (git status shows no diff on either file) — no residual change from this research session. **Flag for the planner:** the actual `npm install astro @astrojs/react @types/react @types/react-dom` + `npm uninstall three` must still be a real execution step in Phase 21's plan; this research session only verified legitimacy, it did not perform the phase's actual dependency install.

## Architecture Patterns

### `astro.config.mjs` — exact syntax for this phase

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  output: 'static', // default, but explicit — no adapter installed
  integrations: [react()],
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: true, // both /en/* and /es/* — no bare-root default-locale tree
      redirectToDefaultLocale: false, // the Vercel Edge Middleware (D-01..D-04) owns "/", not Astro's own i18n redirect
    },
  },
})
```
Source: [Astro i18n guide](https://docs.astro.build/en/guides/internationalization/), [Astro configuration reference](https://docs.astro.build/en/reference/configuration-reference/) — `i18n.locales` (required), `i18n.defaultLocale` (required), `i18n.routing.prefixDefaultLocale` (default `false`, must be set `true` explicitly here), `i18n.routing.redirectToDefaultLocale` (default `false` — setting it explicitly here is defensive documentation, not a behavior change, but makes the "middleware owns `/`" decision legible in the config itself). `output: 'static'` is Astro's own default and does not require a value at all, but writing it explicitly documents the phase's D-locked "no adapter" architecture for future readers.

**Required page file structure** (confirmed):
```
src/pages/
├── index.astro       # thin static page — NOT the redirect mechanism, see middleware.ts below
├── en/
│   └── index.astro
├── es/
│   └── index.astro
└── 404.astro          # catch-all, unprefixed — see below
```

### `middleware.ts` — Vercel-native Edge Middleware, exact file/signature

**File location: repo root**, same level as `package.json` — **not** `src/middleware.ts` (that path is Astro's own middleware, confirmed inert under `output: 'static'` per the milestone PITFALLS.md finding, and this file must not be confused with it or coexist ambiguously with it).

```ts
// middleware.ts  (repo root, next to package.json)
export const config = {
  matcher: '/(.*)', // D-04: run on every route, not just "/"
  // runtime defaults to 'edge' — do not set runtime: 'nodejs' here, Edge is required for D-04's per-request cookie refresh to stay fast
}

const KNOWN_LOCALES = ['en', 'es'] as const
type Locale = (typeof KNOWN_LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'en'
const COOKIE_NAME = 'cam-lang' // D-01: same name as today's localStorage key

function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined
  const match = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return match?.slice(name.length + 1)
}

function resolveLocaleFromAcceptLanguage(header: string | null): Locale {
  // D-02: mirrors readInitialLang() — header contains 'es' → 'es', else 'en'. No q-value parsing.
  return header?.toLowerCase().includes('es') ? 'es' : DEFAULT_LOCALE
}

function isKnownLocale(value: string | undefined): value is Locale {
  return KNOWN_LOCALES.includes(value as Locale)
  // Security: never redirect to an unvalidated locale value — see Security Domain section
}

export default function middleware(request: Request): Response {
  const url = new URL(request.url)
  const pathLocale = url.pathname.match(/^\/(en|es)(\/|$)/)?.[1] as Locale | undefined
  const cookieLocale = parseCookie(request.headers.get('cookie'), COOKIE_NAME)

  // D-04: refresh the cookie on every /en/* or /es/* visit, regardless of "/" redirect
  if (pathLocale) {
    const response = new Response(null, { status: 200 })
    // fall through to "continue" behavior for non-root paths — Vercel serves the
    // static file after Routing Middleware returns; a 200 body-less Response here
    // is NOT confirmed to be a true pass-through — see Open Question 1 below.
    response.headers.append('Set-Cookie', `${COOKIE_NAME}=${pathLocale}; Path=/; Max-Age=31536000; SameSite=Lax`)
    return response
  }

  if (url.pathname === '/') {
    const target = isKnownLocale(cookieLocale)
      ? (cookieLocale as Locale)
      : resolveLocaleFromAcceptLanguage(request.headers.get('accept-language'))

    return new Response(null, {
      status: 302, // D-03: temporary — destination is visitor-dependent, never 301
      headers: {
        Location: `/${target}`,
        'Set-Cookie': `${COOKIE_NAME}=${target}; Path=/; Max-Age=31536000; SameSite=Lax`,
      },
    })
  }

  return new Response(null, { status: 200 })
}
```

Source: [Vercel Routing Middleware overview](https://vercel.com/docs/routing-middleware), [Routing Middleware API reference](https://vercel.com/docs/routing-middleware/api), [Getting Started with Routing Middleware](https://vercel.com/docs/routing-middleware/getting-started).

**Critical implementation gap this research surfaces — verify before planning treats the above as final:** Vercel's own docs show middleware **returning a `Response` to short-circuit** the request (for redirects, or explicit `next()`/`rewrite()` calls from the `@vercel/functions` package for framework-agnostic "other" targets). The docs' own "other" framework examples for **pass-through** (i.e., "don't redirect, let Astro serve the static file normally") use `import { next } from '@vercel/functions'; return next({ headers: {...} })` — a bare `new Response(null, { status: 200 })` is what a `middleware()` handler returns in Vercel's simplest logging example, but the docs do not show a bare 200 Response being treated as "continue to the static file" in the "other frameworks" track the same way `next()` is shown for Next.js. **This is a genuine open item, not resolved by this research pass** — the phase's implementation plan must either (a) import `next()` from `@vercel/functions` for the pass-through/cookie-refresh case (contradicting the "no extra package" assumption above, but only a ~1KB helper, not an SSR adapter), or (b) validate via a real Vercel preview deploy that a bare 200 `Response` correctly passes through to the static file (which the milestone's own Blockers/Concerns in STATE.md already flags as mandatory validation regardless: *"must be validated against a real Vercel preview deploy in Phase 21, not just `astro dev`"*). Flag this explicitly as a Wave 0 / early spike task, not an assumption baked into the plan.

**Matcher scoping note:** `matcher: '/(.*)'` runs the middleware on literally every request per D-04, including static asset requests (`/_astro/*.js`, images, etc.). This has a real Edge-invocation cost (Routing Middleware is priced per the fluid-compute model, per Vercel's docs) — the phase should decide whether to narrow the matcher to exclude `/_astro/(.*)` and known static extensions (mirroring Vercel's own documented negative-lookahead example: `'/((?!_next/static|_next/image|favicon.ico).*)'`, adapted to Astro's `/_astro/` asset prefix) versus accepting the cost for D-04's stated behavior. This is a cost/correctness tradeoff the design decisions (D-04) didn't explicitly address — flag as an open question for planning, not something this research can resolve unilaterally since it's a scope call, not a syntax question.

### `BaseLayout.astro` — exact syntax for head script, hreflang/canonical, `<html lang>`

```astro
---
// src/layouts/BaseLayout.astro
import { getAbsoluteLocaleUrl } from 'astro:i18n'

interface Props {
  title: string
  description: string
}
const { title, description } = Astro.props
const locale = Astro.currentLocale ?? 'en'
const path = Astro.url.pathname.replace(/^\/(en|es)/, '') || '/'
const siteUrl = import.meta.env.PUBLIC_SITE_URL // D-06: build-time env var, not hardcoded
---
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />

    <link rel="canonical" href={new URL(Astro.url.pathname, siteUrl).toString()} />
    <link rel="alternate" hreflang="en" href={getAbsoluteLocaleUrl('en', path, { base: siteUrl })} />
    <link rel="alternate" hreflang="es" href={getAbsoluteLocaleUrl('es', path, { base: siteUrl })} />
    <link rel="alternate" hreflang="x-default" href={getAbsoluteLocaleUrl('en', path, { base: siteUrl })} />

    <script is:inline>
      // ISLAND-04: blocking, runs before paint — adapted from Astro's own official
      // dark-mode recipe pattern to this project's dataset.theme convention
      // (Source: https://docs.astro.build/en/tutorial/6-islands/2/, adapted)
      const theme = (() => {
        const stored = localStorage.getItem('theme')
        if (stored === 'dark' || stored === 'light') return stored
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      })()
      document.documentElement.dataset.theme = theme
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

Source: [Astro i18n API reference](https://docs.astro.build/en/reference/modules/astro-i18n/) (`getAbsoluteLocaleUrl(locale, path?, options?)` signature), [Astro script directives reference](https://docs.astro.build/en/reference/directives-reference/) (`is:inline` — "leave the `<script>` tag as-is in the final output HTML... will not be bundled... will be rendered in the final output HTML exactly where it is authored"), [Astro build-a-blog tutorial, dark mode step](https://docs.astro.build/en/tutorial/6-islands/2/) (official `<script is:inline>` FOUC-prevention pattern, adapted here from the tutorial's `classList` toggle to the project's existing `dataset.theme` attribute convention per ARCHITECTURE.md's documented pattern).

**Note on `getAbsoluteLocaleUrl`'s `options.base`:** the exact `GetLocaleOptions` shape (whether it accepts a `base` override or always derives the absolute URL from `astro.config.mjs`'s own `site` field) was not independently confirmed against Astro's TypeScript source in this pass — flagged `[ASSUMED]`, see Assumptions Log. If `base` is not a real option, the fallback is Astro's documented `site` config field (`defineConfig({ site: import.meta.env.PUBLIC_SITE_URL })` is not itself valid since `astro.config.mjs` cannot read `import.meta.env` the same way page frontmatter can — this needs a small build-time env read via `process.env.PUBLIC_SITE_URL` directly in `astro.config.mjs` if `site` must be set there instead). Verify this specific API surface with a quick spike before committing the BaseLayout task to this exact code.

### `404.astro` — exact convention

```astro
---
// src/pages/404.astro — no special frontmatter required, works under output: 'static'
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>404 — Not Found</title>
  </head>
  <body>
    <h1>404</h1>
    <p>Page not found.</p>
    <a href="/">Return home</a>
  </body>
</html>
```
Source: [Astro basics — Pages](https://docs.astro.build/en/basics/astro-pages/) — "For a custom 404 error page, you can create a `404.astro` or `404.md` file in `src/pages`... This will build to a `404.html` page. Most deploy services will find and use it." Confirmed: single file, no locale-prefixed variants (matches D-10), no `prerender` frontmatter needed (unlike 500 pages, which explicitly do not support prerendering — irrelevant here since this project has no 500 page).

### Astro Container API — exact import path, confirmed current for `astro@7.1.1`

```ts
// e.g. src/pages/404.test.ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { expect, test } from 'vitest'
import NotFoundPage from './404.astro'

test('404 page renders a link back to /', async () => {
  const container = await AstroContainer.create()
  const result = await container.renderToString(NotFoundPage)
  expect(result).toContain('href="/"')
})
```
Source: [Astro Container API reference](https://docs.astro.build/en/reference/container-reference/) — **confirmed still `experimental_AstroContainer` from `astro/container`** as of `astro@7.1.1` (no version-gated change found; cross-checked via WebSearch — no evidence the import path or `experimental_` prefix has been dropped in Astro 5, 6, or 7 as of this research date). "This API is experimental and subject to breaking changes, even in minor or patch releases," and the docs state "no current estimated stabilization date." Treat exactly as STACK.md already warned — do not build test infrastructure that assumes API stability.

**`vitest.config.ts` wiring** (required for Container API tests to resolve Astro's own JSX/compiler pipeline):
```ts
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
  test: {
    // project's existing Vitest options merge here
  },
})
```
Source: [Astro testing guide](https://docs.astro.build/en/guides/testing/).

**If a future `.astro` component under test contains a nested React island** (not needed for Phase 21's proof-of-life harness per the phase's own scope — no content-section components migrate yet — but documented here since Phase 23 will need it and the harness stood up in Phase 21 should not need rework):
```ts
import { getContainerRenderer as reactContainerRenderer } from '@astrojs/react/container-renderer'
import { loadRenderers } from 'astro:container'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'

const renderers = await loadRenderers([reactContainerRenderer()])
const container = await AstroContainer.create({ renderers })
```
Source: [Astro Container API reference](https://docs.astro.build/en/reference/container-reference/), confirmed via WebSearch cross-check on `@astrojs/react` changelog (`getContainerRenderer` export, entrypoint `@astrojs/react/container-renderer` — "legacy import from the package root is deprecated").

### `vercel.json` — corrected shape for this phase

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/_astro/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

Key changes from the current file (read directly this session):
- **`"rewrites"` block removed entirely** — not just the SPA-fallback rule. Source: [Vercel's Astro integration docs](https://vercel.com/docs/frameworks/frontend/astro), verbatim: *"Rewrites only work for static files with Astro. You must use Vercel's Routing Middleware for rewrites. You should not use `vercel.json` to rewrite URL paths with Astro projects; doing so produces inconsistent behavior, and is not officially supported."* This is a stronger, more explicit statement than the milestone PITFALLS.md's Pitfall 8 already captured — confirmed directly against Vercel's Astro-specific guidance, not just general GitHub-issue inference.
- **`"framework"` changed from `"vite"` to `"astro"`** — confirmed valid framework-preset slug.
- **`"outputDirectory"` stays `"dist"`** — Astro's default build output directory is also `dist` (same as the current Vite setup), so no change needed here specifically, but worth stating explicitly since it's easy to assume it changed.
- **Headers array scoped to `/_astro/(.*)` only** — Astro's actual hashed-asset path prefix (confirmed via Astro's own build-output convention: `_astro/` is the default asset directory name). The old `/assets/(.*)` pattern targeted Vite's CRA-era convention and no longer matches anything real post-migration. The old `/index.html` and `/` cache-control rules are removed because HTML routes should use Vercel's framework-detected defaults for Astro static output (short/no aggressive caching) rather than a hand-written blanket rule — confirmed as the correct posture by milestone PITFALLS.md's Pitfall 8, this research did not find a reason to override that guidance.
- **No `middleware`/Edge config needed inside `vercel.json` itself** — Vercel auto-detects `middleware.ts` at the repo root; nothing in `vercel.json` is required to activate it.

### `package.json` — exact `engines.node` syntax + Vercel Node version interaction

```json
{
  "engines": {
    "node": ">=22.12.0"
  }
}
```

**Exact precedence confirmed** (source: [Vercel supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)): `engines.node` in `package.json` **overrides** whatever is selected in Vercel's Project Settings → Node.js Version dropdown, when both are present. Vercel's own mapping table example: a `package.json` semver range of `>=20.0.0` deploys with the **latest available major version that satisfies the range** — for this project's `>=22.12.0`, that resolves to the latest available major (currently **24.x**, since 24.x is Vercel's current default/latest LTS and satisfies `>=22.12.0`), not necessarily 22.x. **This is a meaningful correction to STACK.md's phrasing** ("Vercel's Project Settings → Node.js Version must be set to 22.x+") — with `engines.node: ">=22.12.0"` correctly set, **the Project Settings dropdown does not need a manual change at all**, since `engines.node` takes precedence. The Project Settings UI change becomes optional/redundant once the `package.json` field is correct, not a required parallel step. Available Vercel major versions today are confirmed as **24.x (default), 22.x, 20.x** — 22.x is still available and would be selected if the range were narrowed to `22.x` specifically instead of an open-ended `>=`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| hreflang/canonical URL construction | Manual string concatenation of locale + path + domain | `getAbsoluteLocaleUrl()` / `getRelativeLocaleUrl()` from `astro:i18n` | Handles the `prefixDefaultLocale`/trailing-slash/base-URL edge cases Astro's own router already resolves consistently; hand-rolled string concatenation risks a canonical/hreflang mismatch with what `astro:i18n` actually generates as real page URLs |
| Locale detection from `Accept-Language` | A full q-value-weighted parser (e.g. `accept-language-parser` npm package) | The simple `.includes('es')` heuristic (D-02) | Explicitly decided against for 2 locales — do not introduce a dependency for this; would be over-engineering per the locked decision |
| `.astro`-to-HTML test rendering | A custom string-based HTML renderer/snapshot tool | Astro's own Container API (`experimental_AstroContainer`) | Even though experimental, it is Astro's own first-party solution and is what the milestone's TEST-01 requirement is built around; a custom renderer would diverge from Astro's actual compiled output |

**Key insight:** Everything in this phase is either a first-party Astro API (`astro:i18n`, Container API) or a documented platform primitive (Vercel Routing Middleware's standard `Request`/`Response`) — there is no legitimate reason to add a third-party npm dependency for any of this phase's seven syntax questions. The only real temptation is over-parsing `Accept-Language` (explicitly rejected by D-02) or reaching for `@vercel/functions` prematurely (only justified if the bare-200-passthrough approach in `middleware.ts` turns out not to work against a real deploy — see the flagged gap above).

## Common Pitfalls

### Pitfall: Vercel Routing Middleware has no cookie-parsing helper for non-Next.js frameworks

**What goes wrong:** Copy-pasting a `request.cookies.get('name')` pattern from a Next.js-focused tutorial or Vercel community post — this API (`RequestCookies`/`ResponseCookies`) is part of `NextRequest`/`NextResponse`, which do not exist for the framework-agnostic "other frameworks" track Astro falls into.
**Why it happens:** The overwhelming majority of Vercel Middleware examples online (and even some sections of Vercel's own docs, which are heavily Next.js-weighted) show the Next.js convenience API without flagging that it's Next.js-specific.
**How to avoid:** For Astro's `middleware.ts`, manually parse `request.headers.get('cookie')` (a raw `"name1=value1; name2=value2"` string) and set cookies via a literal `Set-Cookie` string in the `Response`'s `headers` object — exactly as shown in the `middleware.ts` code example above.
**Warning signs:** TypeScript errors on `request.cookies` (property doesn't exist on the global `Request` type) — this is the compiler correctly telling you the Next.js-only API isn't available here.

### Pitfall: `matcher: '/(.*)'` runs the middleware on static asset requests too

**What goes wrong:** D-04 requires the middleware to run on every route to refresh the cookie — but a broad matcher also invokes it for every `/_astro/*.js`, `/*.webp`, etc. request, which is unnecessary Edge-invocation cost for files that never need a locale-cookie refresh.
**Why it happens:** The simplest matcher syntax (`'/(.*)'`, or omitting `config.matcher` entirely — which defaults to "every route") is the path of least resistance, and D-04's wording ("runs on every route") doesn't explicitly address static assets.
**How to avoid:** Consider a negative-lookahead matcher excluding `/_astro/` and common static extensions, mirroring Vercel's own documented pattern. This is a scope decision, not purely a bug — flag for the plan to decide explicitly rather than defaulting silently either way.

### Pitfall: `getAbsoluteLocaleUrl`'s exact options shape is unconfirmed for a custom base domain

**What goes wrong:** D-06 requires reading the canonical base domain from `PUBLIC_SITE_URL` at build time, but whether `getAbsoluteLocaleUrl(locale, path, { base })` is a real, documented option (vs. Astro deriving the absolute URL solely from `astro.config.mjs`'s own `site` field) was not independently confirmed against source in this pass.
**How to avoid:** Spike this specific call early (Wave 0) — if `{ base }` isn't real, the fallback is setting `site` in `astro.config.mjs` itself (reading `process.env.PUBLIC_SITE_URL`, since `astro.config.mjs` runs in a plain Node context and does not have access to Astro's `import.meta.env` mid-config), or constructing absolute URLs manually via `new URL(getRelativeLocaleUrl(locale, path), siteUrl)` — the milestone-locked `PUBLIC_SITE_URL` env-var decision (D-06) is unaffected either way, only the exact code inside `BaseLayout.astro` changes.

### Pitfall: assuming a bare `200 Response` from `middleware.ts` passes the request through to the static file

**What goes wrong:** Vercel's simplest Routing Middleware example (`return new Response('Hello from your Middleware!')`) replaces the response body entirely — it does not demonstrate "continue normally, serve the static file Astro built." For a locale-prefixed path (`/en/*`, `/es/*`) where the only job is refreshing a cookie, the middleware must let Vercel serve the real static file underneath, not return its own placeholder body.
**How to avoid:** Verify against a real Vercel preview deploy (not `astro dev`, not `vercel dev` alone) that a `Response` with only `Set-Cookie` headers and an empty body correctly serves the underlying static route rather than replacing its content — flagged as an unresolved implementation gap above, must be validated before this phase is considered done, consistent with STATE.md's own Blockers/Concerns note.

## Code Examples

See § Architecture Patterns above — all seven requested syntax areas (astro.config.mjs, middleware.ts, BaseLayout.astro, 404.astro, Container API, vercel.json, package.json engines) are documented there with full runnable snippets and inline source citations, rather than duplicated here.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| `@astrojs/tailwind` integration for Tailwind + Astro | Native Vite PostCSS pickup (Tailwind v3) or `@tailwindcss/vite` (Tailwind v4) | `@astrojs/tailwind` capped at Astro `^5.0.0` peer range, per STACK.md's live registry check | Confirmed unchanged from STACK.md — not re-verified independently this pass since it's outside this phase's 7 target syntax areas, no new information found |
| Astro's own `src/middleware.ts` for the `/` locale redirect (as the original design spec assumed) | Vercel-native `middleware.ts` at repo root | Confirmed by both the milestone PITFALLS.md and this session's direct fetch of Vercel's Astro integration docs, which independently states "Rewrites only work for static files with Astro... You should use Astro's middleware over Vercel's Routing Middleware **wherever possible**" — a mild tension with the phase's locked decision worth naming explicitly (see note below) | This phase (locked via CONTEXT.md decisions D-01..D-04) | The project's decision to use Vercel-native middleware is *correct given the constraint* (`output: 'static'`, no adapter) — Vercel's general "prefer framework-native" guidance assumes an SSR-capable Astro deploy (adapter installed), which this milestone explicitly rules out. This is not new information contradicting the locked decision, just worth the plan documenting *why* the project's choice diverges from Vercel's general-case recommendation, so a future reader doesn't "fix" it back toward Astro middleware without understanding it would require adding the Vercel adapter |

**Deprecated/outdated:** None new beyond what STACK.md already flagged (`@astrojs/tailwind`, direct `@vitejs/plugin-react` devDependency).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `getAbsoluteLocaleUrl(locale, path, { base })` accepts a `base` override option for a custom domain | Architecture Patterns → `BaseLayout.astro` | Low-medium — if wrong, `BaseLayout.astro`'s hreflang/canonical code needs a one-line rework (manual `new URL()` construction instead), not a redesign; D-06's `PUBLIC_SITE_URL` env-var decision is unaffected |
| A2 | A bare `new Response(null, { status: 200 })` (no `next()` from `@vercel/functions`) correctly passes an Astro static route through unmodified when returned from `middleware.ts` | Architecture Patterns → `middleware.ts` | Medium-high — if wrong, every `/en/*`/`/es/*` page would return an empty 200 body instead of the real page content, breaking the site entirely. Must be validated against a real Vercel preview deploy before this phase is considered complete (already flagged as a mandatory validation step in STATE.md's Blockers/Concerns, independent of this research) |
| A3 | The `matcher` config's negative-lookahead syntax (`'/((?!_next/static\|...).*)'`, Next.js-flavored in Vercel's own example) applies identically to a framework-agnostic Astro `middleware.ts`, substituting `_astro` for `_next/static` | Architecture Patterns → `middleware.ts` matcher scoping note | Low — worst case, an incorrectly-scoped matcher over-invokes the middleware on static assets (cost/perf issue, not a correctness bug); easy to fix post-deploy by inspecting Vercel's function logs |

## Open Questions

1. **Does a bare 200 `Response` from `middleware.ts` pass through to the static file, or does it need `next()` from `@vercel/functions`?**
   - **RESOLVED (operationalized) via Plan 21-05 Task 2 live checkpoint** — the bare-200 pass-through is implemented in Plan 21-03 Task 2 and validated against a real Vercel preview deploy in Plan 21-05 Task 2 (checks 4/5 assert the real page HTML is served); the documented `next()` from `@vercel/functions` fallback is wired into that same checkpoint's resume-signal to trigger if the preview proves pass-through fails. This question is not decidable by documentation alone (see below), so its resolution is deferred to that live checkpoint by design, not left open.
   - What we know: Vercel's Next.js-specific examples use `NextResponse.next()` for pass-through; the "other frameworks" track's docs show `next()` imported from `@vercel/functions` for the equivalent "continue" behavior in one example, but also show a bare `Response` returned in the simplest logging example without clarifying whether that's a true pass-through or a response replacement.
   - What's unclear: Whether Vercel's Routing Middleware treats *any* returned `Response` (without an explicit `next()`/`rewrite()` call) as "serve this response verbatim, replacing the static file" universally across all runtimes/frameworks, or whether an empty-body 200 is specifically special-cased as pass-through.
   - Recommendation: Spike this against a real Vercel preview deployment in Phase 21's Wave 0, before writing the full cookie-refresh logic. If a bare Response replaces content, add `@vercel/functions` (~1KB, still no SSR adapter) and use `next({ headers: {...} })` for the pass-through case instead.

2. **Does `getAbsoluteLocaleUrl` support a runtime `base` override, or does it require `site` set in `astro.config.mjs`?**
   - **RESOLVED via Plan 21-02 Task 1 spike** — the ~5-minute `{ base }` autocomplete/throwaway-call spike (Assumption A1) runs at the top of Plan 21-02 Task 1 before `BaseLayout.astro`'s hreflang/canonical code is committed; the plan branches to the `new URL(getRelativeLocaleUrl(...), siteUrl)` fallback if `{ base }` is not a real option, and records the chosen path in `21-02-SUMMARY.md`.
   - What we know: The function signature is `(locale, path?, options?) => string`; `options` type is named `GetLocaleOptions` in Astro's own type exports, but this research did not read Astro's TypeScript source directly to confirm its exact member list.
   - What's unclear: Whether `{ base: someUrl }` is a real, current member of `GetLocaleOptions`.
   - Recommendation: A 5-minute spike (`astro add react` scaffold + a throwaway `.astro` file calling the function with an object literal and letting TypeScript/the IDE autocomplete the options) resolves this definitively before `BaseLayout.astro` is written for real.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Astro `7.x` build (`engines.node >=22.12.0`) | ✓ | Local dev machine confirmed on a compatible version per STACK.md's prior check (v26.5.0) | — |
| npm | package install | ✓ | present (project uses `package-lock.json`) | — |
| `slopcheck` (Python) | Package Legitimacy Gate | ✓ | Already installed at `/opt/homebrew/bin/slopcheck`, confirmed via `command -v` this session | — |
| Vercel CLI / real Vercel preview deploy | Validating the `middleware.ts` pass-through behavior (Open Question 1) | Not verified in this session — no `vercel` CLI check performed | — | If unavailable locally, the phase's plan must include a step that pushes to a branch and inspects the resulting Vercel preview URL directly (the project already deploys to Vercel per `vercel.json`/`@vercel/analytics` — a preview environment is expected to exist, just not probed in this research pass) |

**Missing dependencies with no fallback:** none identified as blocking — the one genuinely unverified environment dependency (a live Vercel preview deploy) has an existing project-standard path (push a branch, Vercel auto-deploys a preview) rather than a novel one to set up.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | Site has no authentication surface |
| V3 Session Management | No | The `cam-lang` cookie is a preference cookie, not a session/auth token — no session-management controls apply |
| V4 Access Control | No | No access-controlled resources exist |
| V5 Input Validation | Yes | Redirect target (locale) must be validated against the exact `['en','es']` allowlist before being used to construct the `Location` header — never pass a raw cookie/header value into a redirect URL unchecked |
| V6 Cryptography | No | No cryptographic operations in this phase's scope |

### Known Threat Patterns for this phase's stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Open redirect via unvalidated `cam-lang` cookie or `Accept-Language` value | Spoofing (attacker crafts a cookie/header value that gets reflected into an untrusted redirect target) | Match the parsed locale value against the literal `['en', 'es']` array (`isKnownLocale()` in the `middleware.ts` example above) — never string-concatenate an unvalidated value directly into the `Location` header. This mirrors the milestone PITFALLS.md's own "Security Mistakes" table entry, re-confirmed here as directly applicable to this phase's exact code, not just a general caution |
| Inline `<head>` script scope creep (theme script accreting unrelated logic over time) | Tampering (accidental — not an external-attacker threat, but a code-hygiene one flagged by milestone PITFALLS.md) | Keep `<script is:inline>` in `BaseLayout.astro` scoped to exactly the theme-flip logic shown above; do not add unrelated cookie/analytics logic to this specific inline block just because it already runs early |
| Cookie set without `SameSite`/reasonable `Max-Age` | Tampering/CSRF-adjacent (low severity here since it's a non-auth preference cookie, but still correct hygiene) | The `middleware.ts` example above sets `SameSite=Lax` and a 1-year `Max-Age` explicitly — do not omit these attributes even though the cookie carries no sensitive data |

## Sources

### Primary (HIGH confidence — official docs, fetched live this session, or live npm registry queries)
- https://docs.astro.build/en/guides/internationalization/ — `i18n` config block syntax, `Astro.currentLocale`, `getRelativeLocaleUrl`/`getAbsoluteLocaleUrl` usage
- https://docs.astro.build/en/reference/configuration-reference/ — `i18n.locales`/`defaultLocale`/`routing.prefixDefaultLocale`/`routing.redirectToDefaultLocale` exact field names/defaults, `output` option values
- https://docs.astro.build/en/reference/modules/astro-i18n/ — exact function signatures for `getRelativeLocaleUrl`/`getAbsoluteLocaleUrl`
- https://docs.astro.build/en/reference/container-reference/ — Container API import path (`experimental_AstroContainer` from `astro/container`), `create()`/`renderToString()` signatures, `getContainerRenderer` pattern for React-in-`.astro` tests
- https://docs.astro.build/en/guides/testing/ — `getViteConfig()` Vitest wiring, Container API + Vitest example
- https://docs.astro.build/en/basics/astro-pages/ — `404.astro`/`404.md` convention, `404.html` build output, no special frontmatter required
- https://docs.astro.build/en/reference/directives-reference/ — `is:inline` script directive exact behavior
- https://docs.astro.build/en/tutorial/6-islands/2/ — official `<script is:inline>` dark-mode/FOUC-prevention code pattern
- https://vercel.com/docs/routing-middleware — `middleware.ts` file location/export signature, basic redirect example
- https://vercel.com/docs/routing-middleware/api — full `config`/`matcher` syntax, `Request`/`Response` shape, `next()`/`rewrite()` helpers from `@vercel/functions`, geolocation/IP helpers (confirmed NOT needed for this phase)
- https://vercel.com/docs/routing-middleware/getting-started — step-by-step redirect tutorial, middleware reference table (file location, export, config export, default runtime)
- https://vercel.com/docs/frameworks/frontend/astro — **Astro-specific** Vercel guidance: rewrites unsupported for Astro, static zero-config deploy confirmed, Astro-native vs. Vercel-native middleware tradeoff explicitly discussed
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions — exact `engines.node` semver-range-to-deployed-version precedence and mapping table
- npm registry live queries this session: `npm view astro version` → `7.1.1`; `npm view astro engines` → `{node: '>=22.12.0', ...}`; `npm view @astrojs/react version` → `6.0.1`; `npm view @astrojs/react peerDependencies`; `npm view <pkg> time.created/time.modified/repository.url` for all 4 phase-relevant packages
- Direct repo reads this session: `package.json`, `vercel.json`, `.planning/phases/21-.../21-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/config.json`, `CLAUDE.md`

### Secondary (MEDIUM confidence — WebSearch cross-checks, not independently fetched from primary doc pages)
- WebSearch: "Astro Container API stable" — confirmed no evidence of the `experimental_` import prefix changing across Astro 5/6/7 as of this research date
- WebSearch: "@astrojs/react getContainerRenderer" — confirmed `@astrojs/react/container-renderer` entrypoint and `getContainerRenderer()` export, cross-referenced against a GitHub commit reference (`4385bf7`) for the feature's introduction
- WebSearch: `vercel.json` `"framework": "astro"` slug validity — confirmed as a recognized framework preset value

### Tertiary (LOW confidence)
- None — every claim in this document traces to at least one primary official-docs fetch or a live registry/tool query from this session; the two genuinely unresolved items (Assumptions A1, A2) are explicitly flagged as open questions requiring a spike, not stated as fact.

## Metadata

**Confidence breakdown:**
- Astro config/i18n/layout syntax: HIGH — every code sample traces to a live `WebFetch` of the current official Astro docs page, fetched this session (2026-07-19)
- Vercel Routing Middleware syntax: HIGH for file location/export/config shape (directly quoted from official docs); MEDIUM for the pass-through/`next()` question specifically (flagged as Open Question 1, genuinely unresolved by documentation alone — requires a deploy spike)
- Container API: HIGH — import path and experimental status independently confirmed via both official docs fetch and a WebSearch cross-check finding no evidence of change
- `vercel.json`/`engines.node`: HIGH — Astro-specific Vercel guidance fetched directly, stronger and more specific than the milestone-level research had

**Research date:** 2026-07-19
**Valid until:** 2026-08-18 (30 days — Astro is on a fast release cadence, 9 patch/minor releases in the ~2.5 months between `7.0.0` and `7.1.1` per the live version list checked this session; re-verify exact syntax if planning is deferred past this window)

---
*Phase-level research for: 21-foundation-astro-scaffold-i18n-routing-layout-shell*
*Researched: 2026-07-19*
*Supplements (does not replace): `.planning/research/{STACK,ARCHITECTURE,PITFALLS,SUMMARY}.md` (milestone-level, same date)*
