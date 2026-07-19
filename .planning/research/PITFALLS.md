# Pitfalls Research

**Domain:** React CSR (Vite) → Astro SSG + React islands migration, with `astro:i18n` locale routing, Vercel static hosting, and a strict pre-existing Lighthouse mobile hard gate (Perf ≥0.95, A11y/BP/SEO = 1.0)
**Researched:** 2026-07-19
**Confidence:** MEDIUM-HIGH (Astro/Vercel platform mechanics verified against official docs and GitHub issues; project-specific consequences reasoned from the approved design spec)

## Critical Pitfalls

### Pitfall 1: Astro middleware-based locale redirect does not run per-request in `output: 'static'`

**What goes wrong:**
The approved design spec (`docs/superpowers/specs/2026-07-19-astro-migration-design.md`) specifies `output: 'static'` **and** "Root `/` resolves via Astro middleware: check `cam-lang` cookie first, fall back to `Accept-Language` header, 302-redirect to `/en` or `/es`." These two decisions contradict each other. In Astro's static output mode, `src/middleware.ts` only runs at **build time**, not on every incoming request — there is no server process to intercept a live visitor hitting `/`. `Astro.redirect()` is explicitly unavailable outside on-demand (SSR) rendering. If this is implemented as written, `/` will build to a static HTML file with no working per-request cookie/header inspection, and the "redirect" logic silently becomes a no-op or a build-time-only default — every visitor to `/` gets the same static page regardless of their cookie or browser language.

**Why it happens:**
Astro's own middleware concept (`src/middleware.ts`) is easy to confuse with Vercel's platform-level Edge Middleware (`middleware.ts` at repo root, framework-agnostic). Blog posts and even some Astro docs pages discuss "middleware" without always being explicit about which one requires `output: 'server'`/on-demand rendering. The spec's Non-Goals section ("no adapter/server runtime needed") locks in an assumption that stays compatible with a pure static build, which conflicts with the routing requirement described two sections earlier in the same document.

**How to avoid:**
Pick one of two concrete, verified paths before writing any routing code:
1. **Vercel-native Edge Middleware** (`middleware.ts` at project root, `@vercel/edge`) — framework-agnostic, runs on Vercel's edge network independent of Astro's rendering mode, works with a fully static Astro build. This preserves the spec's "no adapter/server runtime" intent for the rest of the site; only the redirect hop is dynamic. This is the closer match to the original design intent.
2. **Astro on-demand rendering for one route only** — keep `output: 'static'` (the Astro 5+ default) and add `export const prerender = false` to `src/pages/index.astro` alone, deployed with `@astrojs/vercel` so Vercel builds that single route as a Function while every other route stays static. Requires adding the Vercel adapter as a dependency, which the spec currently doesn't scope.
Do not implement `Astro.redirect()` inside `src/middleware.ts` and assume it works against a static build — it will pass locally in `astro dev` (which always runs on-demand) and silently fail or misbehave once deployed as a static build, which is a dangerous local/production divergence.

**Warning signs:**
- `astro dev` shows the redirect working, but the same behavior isn't visible in `astro build && astro preview` (preview serves the static output, closer to production behavior).
- No cookie/header logic executes in the Vercel deployment logs for requests to `/`.
- `/` always resolves to the same locale in an incognito window regardless of `Accept-Language`.

**Phase to address:**
Routing-foundation phase (the phase that stands up `astro:i18n` + the `/` redirect), **before** any content or island migration work begins. This decision determines whether the Vercel adapter is a dependency at all, which affects deployment config for every later phase.

---

### Pitfall 2: Missing or incorrect hreflang/canonical tags when splitting one page into two locale trees

**What goes wrong:**
The current site is one SPA with client-side language switching — search engines see one URL. Post-migration, `/en/*` and `/es/*` are two fully separate, fully static HTML trees. Without explicit `hreflang` alternate tags and self-referencing `canonical` tags on both trees, search engines can treat `/en` and `/es` as duplicate or unrelated content, and Google may serve the wrong language variant in search results to a given user. This is a **net new SEO risk introduced by this migration** — the current single-URL SPA didn't have this failure mode.

**Why it happens:**
`astro:i18n` handles routing (URL generation, `Astro.currentLocale`) but does not automatically inject `hreflang` tags into `<head>` — that's an explicit authoring step using `getAbsoluteLocaleUrl`/`getRelativeLocaleUrl` inside the layout. It's easy to migrate routing correctly (pages render, links work) while missing the SEO metadata step entirely, because the site visually and functionally "works" without it.

**How to avoid:**
In `BaseLayout.astro`, for every page emit:
- `<link rel="canonical" href="{absolute URL for current locale/page}">`
- `<link rel="alternate" hreflang="en" href="{absolute /en/... URL}">`
- `<link rel="alternate" hreflang="es" href="{absolute /es/... URL}">`
- `<link rel="alternate" hreflang="x-default" href="{absolute /en/... URL}">` (or whichever is the default locale)
Since this is a single-page-per-locale site (no per-content-item routing), the mapping is trivial — hardcode the pairing in the layout rather than building a general slug-mapping system.

**Warning signs:**
- Lighthouse SEO category flags "Document does not have a valid `rel=canonical`" if canonical is missing entirely (this one **is** a scored Lighthouse SEO audit, directly relevant to the SEO=1.0 hard gate).
- `hreflang` correctness itself is not scored by Lighthouse, so this pitfall can pass the automated gate while still being broken for real search visibility — don't rely on the Lighthouse run alone to catch this.

**Phase to address:**
Routing-foundation phase, same phase as Pitfall 1 — `hreflang`/canonical belong in `BaseLayout.astro` from the first locale-tree build, not bolted on later once content phases have already shipped pages without it.

---

### Pitfall 3: Redirect loop from `astro:i18n` default-locale prefix settings

**What goes wrong:**
Astro's i18n routing defaults changed across major versions (`prefixDefaultLocale`, `redirectToDefaultLocale`). A misconfigured combination — e.g., `prefixDefaultLocale: true` plus a custom `/` redirect (Pitfall 1's fix) that itself targets `/en` — can produce a redirect chain or, in worse cases, an actual loop if the custom redirect and Astro's built-in default-locale redirect both fire and disagree about the canonical root.

**Why it happens:**
The spec calls for `defaultLocale: 'en'` with **both** locales prefixed (`/en`, `/es` — no bare, unprefixed default-locale routes). This is a deliberate, symmetric design (good — it avoids the classic "default locale has no prefix" asymmetry that causes most `astro:i18n` redirect bugs), but it must be set explicitly (`prefixDefaultLocale: true`) — the framework default is unprefixed default locale, which would silently produce a mismatched URL structure (`/` = English content, `/es/*` = Spanish, no `/en/*` tree at all) rather than the two symmetric trees the spec describes.

**How to avoid:**
Explicitly set in `astro.config.mjs`:
```js
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'es'],
  routing: {
    prefixDefaultLocale: true,
    redirectToDefaultLocale: false, // custom middleware/edge redirect owns "/", don't let Astro also redirect it
  },
}
```
Do not layer a custom root redirect (Pitfall 1) on top of Astro's own `redirectToDefaultLocale: true` — pick exactly one mechanism that owns `/`.

**Warning signs:**
- Browser network tab shows 2+ redirects for a fresh visit to `/` (also fails the Lighthouse "Avoid multiple page redirects" performance audit at 2+ hops — see Pitfall 9).
- `astro build` produces a `src/pages/index.astro`-generated redirect page in the output root that conflicts with the custom root page.

**Phase to address:**
Routing-foundation phase.

---

### Pitfall 4: React island props must be JSON-serializable — Context removal breaks silently, not loudly

**What goes wrong:**
`LanguageContext`/`ThemeContext` (React Context + `useLanguage()` hook, used in nearly every current component) are removed per the spec; islands receive locale/`t` as **props** instead. Astro serializes island props into an inline JSON payload embedded in the HTML to rehydrate the component client-side. If any current pattern that gets carried over into an island passes a function, a `Map`, or anything non-JSON-serializable as a prop (e.g., a `pick(field, lang)` helper function, or the full translation object if it ever grows a computed/derived accessor), the island fails to hydrate — often with a cryptic runtime error rather than a compile-time one, since prop shape isn't statically checked across the Astro/React boundary.

**Why it happens:**
The codebase's `pick(field, lang)` helper is currently duplicated inline per-component as a plain function call at render time inside a fully client-rendered React tree, where passing functions around is unremarkable. Once components move behind the Astro/React serialization boundary, "just pass it as a prop" is no longer safe for anything except plain data (strings, numbers, plain objects/arrays, booleans, null).

**How to avoid:**
For each island, resolve `pick(field, lang)` server-side in the `.astro` parent (where `Astro.currentLocale` is available) and pass only the **already-resolved bilingual string values** as props — never the helper function or the raw `{en, es}` object plus a resolver. Audit every island's prop list before wiring it into a page for functions, and prefer flat primitive/plain-object props matching the existing `EXPERIENCE`/`skills.json` shapes (which are already plain data, so this mostly self-resolves for data-driven components — the risk is specifically in ad hoc helper functions).

**Warning signs:**
- Browser console error mentioning serialization/JSON on page load for a specific island.
- An island renders its initial (server) HTML correctly but never becomes interactive (hydration silently failed).

**Phase to address:**
Island-migration phase for each component (Nav, Hero interactive part, Experience expand/collapse, SectionPager, ThemeToggle) — verify prop shape as part of each component's migration checklist, not as a single project-wide pass at the end.

---

### Pitfall 5: Over-hydrating islands blows the Performance ≥0.95 budget the migration exists to fix

**What goes wrong:**
The entire motivation for this migration is that CSR-everything struggles against the hard Lighthouse gate. If islands default to `client:load` "to be safe" rather than the more precise `client:visible`/`client:idle`/`client:media` directives per the Island Boundary table in the spec, the migration reproduces the same "ship JS eagerly" problem in a new shape — just with several smaller bundles loaded eagerly instead of one big one, which can still fail the same Performance budget that motivated the migration.

**Why it happens:**
`client:load` is the most commonly reached-for directive in Astro tutorials because it's the most React-like ("just works, hydrates immediately"), and it's tempting to use it uniformly during a migration to reduce the number of variables being changed at once. The design spec already made the right calls per-component (`client:visible` for Experience's expand/collapse and SectionPager; `client:load` reserved for Nav and ThemeToggle, which are above-the-fold and need to work immediately) — the risk is drift during implementation, not a flaw in the design.

**How to avoid:**
Treat the Island Boundary table in the design spec as a literal implementation contract, not a suggestion — deviating from it (e.g., "just use `client:load` everywhere for phase 1, optimize later") reintroduces the exact bundle-eagerness problem the migration is meant to solve, and "optimize later" tends not to happen once the gate passes. Re-verify the hydration directive for every island against the table at PR review time for that component's phase.

**Warning signs:**
- Lighthouse "Reduce JavaScript execution time" or "Minimize main-thread work" flags a component whose interaction isn't needed until scroll (Experience, SectionPager).
- Total JS shipped on initial `/en` load is close to or larger than the old CSR bundle's initial chunk.

**Phase to address:**
Each island-migration phase, individually — this is a per-component discipline item, and the final Lighthouse-gate phase is where regressions from drift get caught, but by then they're expensive to unwind across multiple components at once. Recommend a lightweight bundle-size check after each island phase, not only at the final gate.

---

### Pitfall 6: Theme FOUC survives migration if the inline script and the ThemeToggle island disagree at hydration

**What goes wrong:**
The spec correctly moves theme application to a blocking inline `<head>` script in `BaseLayout.astro` (good — this is the standard, verified fix for FOUC, and removes the dependency on React hydration timing that the current CSR app has). But the `ThemeToggle` island itself still needs an initial rendered state (which icon to show, sun or moon) for its **own** first paint before it hydrates and reads `data-theme`. If the island's initial server-rendered markup (built with no knowledge of the user's cookie/localStorage — that information doesn't exist at Astro build time) doesn't match what the inline script has already set on `<html data-theme>` by the time the island hydrates, you get exactly the class of visible flash the migration is meant to eliminate — but now scoped to a small icon flicker rather than a whole-page flash, so it's easy to miss.

**Why it happens:**
The inline script and the island are two independent code paths that both determine "what does the theme UI look like right now," and nothing enforces them staying in sync except developer discipline — this is the same class of problem as Pitfall 4 (state that used to live in one Context now lives in two disconnected places).

**How to avoid:**
Have `ThemeToggle` read `document.documentElement.dataset.theme` (already set correctly by the inline script, which runs first, before Astro/React hydrate) as its initial React state during mount, rather than defaulting to a hardcoded icon and re-rendering after an effect. Do not give the island a static default prop for "current theme" computed at Astro/build time — build time has no access to the visitor's cookie or `prefers-color-scheme`, so any build-time default will be wrong for roughly half of visitors.

**Warning signs:**
- Icon visibly flips on load in a manual test with a non-default theme already set in `localStorage`/cookie.
- React hydration mismatch warning in the console specifically for `ThemeToggle`.

**Phase to address:**
Theming phase (inline script + `ThemeToggle` island together, as one unit of work — do not split the inline-script phase from the `ThemeToggle` island phase, since correctness depends on both being designed against each other).

---

### Pitfall 7: Astro Container API cannot replace RTL 1:1 — client-side interaction is untestable at that layer

**What goes wrong:**
The design spec's own Risks section already flags this correctly, but it's worth being concrete: the Container API renders `.astro` output to a string and lets you assert on the resulting HTML/attributes (good for: bilingual text presence, ARIA attributes, structural markup for the now-static About/Skill/Footer/Projects components). It **cannot** simulate clicks, state changes, or any client-side behavior — that's explicitly out of scope for the API today, per Astro's own docs, and requires Playwright/Cypress-style e2e instead. If a component that should become an island (e.g., Experience's expand/collapse) is mistakenly tested only via Container API "because it's the new pattern," the interactive behavior (the actual thing that used to be RTL-tested) silently loses coverage — the test suite goes green while testing less than before.

**Why it happens:**
"Move every test file to the new Astro-native testing tool" is an easy blanket instruction to follow during a mechanical migration, but it's wrong for exactly the components in the `client:*` (island) column of the Island Boundary table — those need to **keep** RTL (per the spec, correctly), not switch to Container API. The failure mode is applying the migration uniformly instead of per the Island Boundary table's static/island split.

**How to avoid:**
Test-tool selection must exactly mirror the Island Boundary table: Astro Container API only for the "Astro static / none" row (About, Skill, Footer, Projects, and the static parts of Hero/Contact); RTL unchanged for every `client:*` row (Nav, Hero's interactive part, Experience's expand/collapse control, SectionPager, ThemeToggle). Additionally, per the spec's own flagged risk, verify before depending on it that Container API assertions can actually reach the same things the current 7-spec-per-section pattern checks (bilingual text, structural content, schema sanity) — spot-check one migrated component's Container API test against its old RTL test's assertion list before treating the pattern as validated for the rest. Also watch two documented Container API constraints while doing this: only one JSX framework can be used per test run (not an issue here — React only), and `astroConfig` overrides (e.g. custom i18n settings) are not reliably applied at container-creation time, so tests that depend on `Astro.currentLocale` may need locale passed explicitly as a prop/param rather than relying on config-driven detection.

**Warning signs:**
- A Container API test for an island-adjacent interactive control (e.g., asserting an `aria-expanded` toggle actually changes) passes trivially because it only checks the initial static HTML, never the state change.
- Test count drops after migration (a proxy for lost assertions, not a guarantee).

**Phase to address:**
Test-infrastructure phase, run in parallel with (not after) each component's migration phase — decide the test tool for a component as part of deciding whether it's static or an island, since that's the same decision.

---

### Pitfall 8: `vercel.json` SPA-fallback removal is necessary but not sufficient — missing 404 handling and cache-header regressions

**What goes wrong:**
The spec correctly identifies that the current `"/(.*)" -> "/index.html"` SPA rewrite must be removed (Astro emits real per-route files; the rewrite is unnecessary and actively harmful against a multi-route static build — confirmed against Vercel's own guidance that `vercel.json` rewrites are not officially supported/reliable for Astro projects, and framework-native solutions should be used instead). Two follow-on gaps are easy to miss once that rewrite is gone:
1. **No more implicit catch-all page.** The old SPA fallback meant *every* unmatched path served the app shell. Once removed, unmatched paths (typos, old bookmarked hash-only URLs, crawlers hitting `/about` when the real path is `/en#about`) now hit Vercel's default 404 unless an explicit `404.astro` is authored.
2. **Cache-Control regressions.** If any custom headers block is retained/copied from the old `vercel.json` (or a new one is authored broadly), it's easy to apply the aggressive `immutable, max-age=31536000` caching appropriate for hashed `/_astro/*` assets to the actual locale HTML pages (`/en`, `/es`) as well — those must stay revalidated on every deploy (short/no cache), or returning visitors get stale HTML after a content update ships.

**How to avoid:**
Author a `404.astro` (bilingual, matching site branding) as part of the same phase that removes the SPA rewrite — don't treat 404 handling as a later polish item. Scope any custom `vercel.json` `headers` block narrowly to `/_astro/(.*)` (immutable, long max-age — safe because filenames are content-hashed) and leave HTML routes on Vercel's framework-detected defaults (short/no aggressive caching) rather than writing a blanket headers rule.

**Warning signs:**
- Manually hitting a stale/typo'd URL in the deployed preview returns a generic Vercel 404 instead of the branded page.
- After shipping a content change, a returning visitor (or the Lighthouse CI runner, if it doesn't bust cache) still sees old HTML.

**Phase to address:**
Deployment/rollout phase, same phase as the `vercel.json` rewrite removal — these are one unit of "fix static hosting config," not separate concerns.

---

### Pitfall 9: Auditing the wrong URL masks the real-world cost of the `/` redirect against the Lighthouse gate

**What goes wrong:**
Once Pitfall 1 is resolved and `/` performs a real per-request redirect to `/en` or `/es`, there are now two meaningfully different URLs to reason about: the redirect entry point (`/`) and the locale landing pages (`/en`, `/es`). If the milestone's Lighthouse CI run (`npm run lighthouse:mobile`/`lighthouse:check`) is pointed at `/en` directly (the easier, more deterministic target — no redirect-hop variance to account for), the gate can pass green while every real first-time visitor (who lands on `/`, the URL that's actually shared/bookmarked/indexed as the canonical entry) pays the extra network round-trip that the audited URL never experienced. Lighthouse's own "Avoid multiple page redirects" audit only fails at 2+ hops, so a single `/ → /en` redirect won't itself fail an audit that *does* include it — but it also won't be caught at all by an audit that excludes it.

**Why it happens:**
Testing the post-redirect destination is the path of least resistance (stable URL, no cookie/header setup needed to get a deterministic result), and the spec's own Risks section flags "should be measured against the Lighthouse TTFB/perf budget during the final gate check" without pinning down *which* URL that check runs against.

**How to avoid:**
Explicitly run the Lighthouse gate against `/` (with default/no cookie, exercising the `Accept-Language` fallback path) as the primary milestone exit-criteria check, in addition to (not instead of) `/en` and `/es` directly. Treat all three as required gate targets, not just the two locale pages.

**Warning signs:**
- Lighthouse CI config/script only lists `/en` and `/es` as targets, with no entry for `/`.
- Performance score for `/` is meaningfully lower than `/en`/`/es` when manually checked, even though it "passes" because no one is gating on it.

**Phase to address:**
Final Lighthouse-gate/UAT phase — but the *target URL list* should be decided during the routing-foundation phase (Pitfall 1/3), since that's when the redirect mechanism and its expected latency profile are chosen.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Ship all islands as `client:load` for the first migration pass, "optimize directives later" | Fewer variables to debug per component; matches old CSR mental model | Reproduces the exact eager-JS problem the migration exists to fix (Pitfall 5); "later" often doesn't happen once the gate is green | Never — the Island Boundary table's directives are cheap to get right the first time |
| Use `redirectToDefaultLocale: true` (Astro's built-in) instead of authoring a custom cookie/`Accept-Language` redirect | Zero custom code, ships faster | Loses the cookie-persistence/`Accept-Language` fallback behavior the spec explicitly wants; conflicts with a custom root redirect if both are wired (Pitfall 3) | Only if the cookie/`Accept-Language` requirement is explicitly descoped from the milestone |
| Skip authoring `hreflang`/canonical tags until "SEO polish" pass | Faster initial routing phase | Real search-engine duplicate-content risk accrues from day one of the split locale trees; not caught by the automated Lighthouse gate (canonical is checked, hreflang correctness is not) | Never for canonical (Lighthouse-scored); acceptable to defer `x-default` fine-tuning only, not the core `en`/`es` pair |
| Blanket `vercel.json` headers rule applied to all routes instead of scoping to `/_astro/*` | One rule, less config to write | Stale HTML served to returning visitors after every content deploy | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Vercel + Astro `output: 'static'` | Assuming `src/middleware.ts` (Astro's own) runs per-request on a static deploy | Use Vercel-native `middleware.ts` (Edge Middleware) or opt one route into on-demand rendering via `export const prerender = false` + the Vercel adapter |
| `astro:i18n` + Vercel deploy | Testing locale redirect only in `astro dev` (which is always on-demand) and assuming it matches `astro build && astro preview`/production static behavior | Verify the redirect against `astro preview` (serves the actual static output) or the real Vercel preview deployment, not just `astro dev` |
| Lighthouse CI + redirect routing | Auditing only the post-redirect URL (`/en`) | Audit `/`, `/en`, and `/es` all three as gate targets (Pitfall 9) |
| React islands + removed Context | Passing the `pick(field, lang)` helper function or raw bilingual object as an island prop | Resolve bilingual strings server-side in the `.astro` parent; pass only plain-data props across the island boundary |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| `client:load` used where `client:visible`/`client:idle` was specified in the design | Total initial JS payload creeps back toward old CSR bundle size | Enforce the Island Boundary table's directive column at PR review per component-migration phase | First Lighthouse Performance check after 2-3 islands are wired with the wrong directive |
| Single redirect hop at `/` on every cold visit, measured on throttled mobile | `/` Performance score noticeably lower than `/en`/`/es` even though no single audit "fails" | Audit all three URLs (Pitfall 9); keep the redirect logic itself trivial (cookie/header check only, no additional fetch/compute) | Becomes visible only once someone actually gates on `/` — invisible if only `/en`/`/es` are checked |
| Aggressive `vercel.json` cache headers applied to HTML routes | Returning visitors see stale content after a deploy; hard to reproduce (only affects cached repeat visits, not fresh Lighthouse runs which typically bypass cache) | Scope cache headers narrowly to `/_astro/*` only | First content-only hotfix deploy after the header rule ships |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Redirect logic trusts `Accept-Language`/cookie value directly into a redirect target without validating it against the known `['en', 'es']` locale list | Open redirect if the value is ever concatenated into a URL rather than matched against an allowlist | Match parsed locale against the exact `locales` array from `astro:i18n` config; default to `defaultLocale` on any non-match, never redirect to an unvalidated path |
| `is:inline` theme script in `<head>` grows to read/write more than `data-theme` over time (e.g., picks up other cookie values) without review | Inline scripts bypass Astro's usual script processing/CSP nonce handling; scope creep here is a common place for accidental data leakage into client-visible inline JS | Keep the inline script minimal and reviewed as a single, stable unit — resist adding unrelated logic to it just because it already runs early |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Language switcher becomes a full page navigation (new static page) instead of the old instant client-side context flip | Perceived slower/less smooth language switch than the current SPA; scroll position/section can be lost if the hash fragment isn't preserved | Nav island constructs the target `/en#section` or `/es#section` URL using the current hash (per spec) — verify this is actually implemented, not just designed, since it's the one place where migration makes the UX measurably different from today by default |
| Theme icon flicker on load for non-default theme visitors (Pitfall 6) | Visible flash undermines exactly the polish this migration is meant to add | Island reads `data-theme` from the DOM (already set by inline script) on mount, never a build-time default |
| 404 for any previously-bookmarked/shared hash-only URL pattern once SPA fallback is removed | Recruiters/visitors following an old link get a dead end instead of the app shell they used to get | Author a branded, bilingual `404.astro` in the same phase as the `vercel.json` rewrite removal (Pitfall 8) |

## "Looks Done But Isn't" Checklist

- [ ] **Locale redirect at `/`:** Looks done when `astro dev` shows correct behavior — verify it also works against `astro build && astro preview` or an actual Vercel deployment, not just the dev server (Pitfall 1).
- [ ] **`hreflang`/canonical tags:** Looks done when both `/en` and `/es` render and look correct visually — verify `view-source:` on both pages actually contains the `<link rel="alternate" hreflang="...">` pairs, not just a working page (Pitfall 2).
- [ ] **Island hydration:** Looks done when the component renders on the server (visible HTML) — verify it's also interactive after hydration (click it, don't just look at it) and that no hydration-mismatch warning appears in the console (Pitfall 4, Pitfall 6).
- [ ] **Test suite "migrated":** Looks done when all test files are green — verify the test tool for each file actually matches that component's row in the Island Boundary table (static → Container API, island → RTL), not just that some test exists (Pitfall 7).
- [ ] **`vercel.json` cleanup:** Looks done when the SPA rewrite line is deleted — verify a `404.astro` exists and cache headers are scoped correctly, not just that the old broken rule is gone (Pitfall 8).
- [ ] **Lighthouse gate "passing":** Looks done when `/en` and `/es` are green — verify `/` (the real entry point) is also audited (Pitfall 9).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| Middleware redirect doesn't work in production (Pitfall 1) | MEDIUM | Swap to Vercel-native `middleware.ts` or add the Vercel adapter for one on-demand route; both are additive changes, not a rearchitecture, if caught before other phases build on the assumption that `/` is fully static |
| Missing hreflang discovered post-launch (Pitfall 2) | LOW | Add the `<link>` tags to `BaseLayout.astro`; takes effect on next deploy, no data migration needed, but real-world SEO recovery (re-crawl) takes longer than the code fix |
| Island prop serialization failure discovered late (Pitfall 4) | LOW-MEDIUM | Move the resolution logic from the island into its `.astro` parent for the specific broken component; isolated per-component fix |
| Test coverage silently thinner post-migration (Pitfall 7) | MEDIUM-HIGH | Requires re-auditing each migrated test file's assertions against the original RTL spec list; harder to catch after the fact since tests are green, not failing — cheaper to prevent than to recover |
| Stale HTML from over-broad cache headers (Pitfall 8) | LOW | Fix `vercel.json` headers scope and redeploy; existing CDN cache entries expire on their own or can be manually purged in the Vercel dashboard |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| 1. Middleware redirect incompatible with `output: 'static'` | Routing-foundation phase | Test against `astro preview` / real Vercel preview deploy, not just `astro dev` |
| 2. Missing hreflang/canonical | Routing-foundation phase | `view-source:` check on both `/en` and `/es`; Lighthouse SEO audit for canonical presence |
| 3. Redirect loop from i18n prefix config | Routing-foundation phase | Network tab shows exactly one redirect hop for `/`, none for `/en`/`/es` direct hits |
| 4. Non-serializable island props | Per island-migration phase | Manual click-test on each island after wiring; check console for hydration/serialization errors |
| 5. Over-hydration (wrong `client:*` directive) | Per island-migration phase | Bundle-size check per phase against the Island Boundary table; don't defer to the final gate only |
| 6. Theme FOUC / icon-flip at hydration | Theming phase (inline script + ThemeToggle together) | Manual test with non-default theme pre-set in storage; visually confirm no flicker |
| 7. Astro Container API misapplied to interactive components | Test-infrastructure phase, in lockstep with each component's migration | Test tool choice cross-checked against Island Boundary table per component, not decided once globally |
| 8. `vercel.json` cleanup incomplete (404, cache headers) | Deployment/rollout phase | Manual 404 check on a bad URL; cache-control header inspection on an HTML route vs a `/_astro/*` asset |
| 9. Lighthouse gate audits wrong URL | Decided in routing-foundation phase; verified in final gate phase | Gate script/config explicitly lists `/`, `/en`, `/es` as three separate required targets |

## Sources

- [Internationalization (i18n) Routing - Astro Docs](https://docs.astro.build/en/guides/internationalization/)
- [i18n experimental routing creates a redirect page in the root · Issue #9300 · withastro/astro](https://github.com/withastro/astro/issues/9300)
- [Internationalization API Reference - Astro Docs](https://docs.astro.build/en/reference/modules/astro-i18n/)
- [Middleware - Astro Docs](https://docs.astro.build/en/guides/middleware/)
- [Astro.redirect is not available in static mode - Astro Docs](https://docs.astro.build/en/reference/errors/static-redirect-not-available/)
- [On-demand rendering - Astro Docs](https://docs.astro.build/en/guides/on-demand-rendering/)
- [astrojs/vercel - Astro Docs](https://docs.astro.build/en/guides/integrations-guide/vercel/)
- [Astro on Vercel - Vercel Docs](https://vercel.com/docs/frameworks/frontend/astro)
- [Vercel Rewrite: SPA Fallback except for API endpoints · vercel/vercel · Discussion #5448](https://github.com/vercel/vercel/discussions/5448)
- [Vercel rewrites not working · Issue #6446 · withastro/astro](https://github.com/withastro/astro/issues/6446)
- [Astro Container API (experimental) - Astro Docs](https://docs.astro.build/en/reference/container-reference/)
- [Testing - Astro Docs](https://docs.astro.build/en/guides/testing/)
- [Override Astro config using Container API and Vitest #11585 · withastro/astro](https://github.com/withastro/astro/issues/11585)
- [Component hydration breaks when using `client:load="react"` · Issue #4491 · withastro/astro](https://github.com/withastro/astro/issues/4491)
- [React Component Hydration Error · Issue #7709 · withastro/astro](https://github.com/withastro/astro/issues/7709)
- [Islands architecture - Astro Docs](https://docs.astro.build/en/concepts/islands/)
- [What the FOUC? Dark mode with Astro transitions and Tailwind](https://www.simonporter.co.uk/posts/what-the-fouc-astro-transitions-and-tailwind/)
- [GitHub - AVGVSTVS96/astro-fouc-killer](https://github.com/avgvstvs96/astro-fouc-killer)
- [Astro i18n in 2026: The Complete Guide From ui.ts to Edge-Native KV | EdgeKits](https://edgekits.dev/en/blog/astro-i18n-complete-guide-2026/)
- [Astro SEO: the definitive guide - Joost.blog](https://joost.blog/astro-seo-complete-guide/)
- [The "Stateful Island" Paradox: Architecting Astro for Enterprise Scale - DEV Community](https://dev.to/nabindebnath/the-stateful-island-paradox-architecting-astro-for-enterprise-scale-2m49)
- [Migrating from Create React App (CRA) - Astro Docs](https://docs.astro.build/en/guides/migrate-to-astro/from-create-react-app/)
- [Avoid multiple page redirects | Lighthouse | Chrome for Developers](https://developer.chrome.com/docs/lighthouse/performance/redirects)
- [Middleware doesn't run for static files with the vercel adapter's `edgeMiddleware` feature · Issue #10536 · withastro/astro](https://github.com/withastro/astro/issues/10536)
- [Using Vercel adapter with Astro for a static site does not take external redirects into account · Issue #13900 · withastro/astro](https://github.com/withastro/astro/issues/13900)
- Project spec: `docs/superpowers/specs/2026-07-19-astro-migration-design.md` (commit `6a3bf4a`)
- Project state: `.planning/PROJECT.md`

---
*Pitfalls research for: React CSR → Astro SSG + islands migration, v5 milestone*
*Researched: 2026-07-19*
*Note: This file supersedes the prior v3.10 3D-Constellation-era PITFALLS.md content, which covered a WebGL/game-mode feature line purged from the codebase at the v4.0 milestone boundary (2026-06-12) and is no longer relevant to the active codebase.*
