---
phase: 21-foundation-astro-scaffold-i18n-routing-layout-shell
plan: 04
subsystem: frontend
tags: [astro, 404, i18n, testing, container-api]

# Dependency graph
requires: ["21-02"]
provides:
  - "src/pages/404.astro — standalone bilingual 404 page, real dark-palette tokens, locale-inferred from broken URL prefix (DEPLOY-02)"
  - "src/pages/404.test.ts — Astro Container API proof-of-life test (TEST-01 harness stand-up)"
affects: ["Phase 23 (scales the Container API harness pattern to full static-component test coverage)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "404.astro is a standalone <html> doc, NOT wrapped in BaseLayout — avoids reusing canonical/hreflang/OG machinery built for real content pages on an error page with no meaningful Astro.currentLocale"
    - "experimental_AstroContainer from astro/container + renderToString() is the harness pattern Phase 23 will scale; forced to @vitest-environment node per-file (esbuild/jsdom TextEncoder incompatibility, unrelated to test assertions)"

key-files:
  created: [src/pages/404.astro, src/pages/404.test.ts]
  modified: []

key-decisions:
  - "404.astro does NOT wrap <BaseLayout> — BaseLayout's canonical/hreflang/OG derive from Astro.currentLocale (unset outside src/pages/en|es) and assume real page content; a standalone minimal doc matches D-11's 'no personality' call and RESEARCH.md's documented convention"
  - "src/pages/404.test.ts forces `// @vitest-environment node` (per-file override) — Astro's compiler invokes esbuild synchronously, and esbuild's startup invariant check fails under jsdom's shimmed TextEncoder; renderToString() output is plain HTML text so no DOM APIs are needed"
  - "Added `<meta name=\"robots\" content=\"noindex\">` to the 404 page (not explicitly required by UI-SPEC/RESEARCH) — standard SEO correctness for error pages, avoids indexing a page with no canonical target"

requirements-completed: [DEPLOY-02]

# Metrics
duration: ~12min
completed: 2026-07-19
---

# Phase 21 Plan 4: 404 page + Astro Container API harness Summary

**Standalone bilingual `404.astro` (locale inferred from the broken URL's `/en`/`/es` prefix, real dark-palette tokens only) builds to `dist/404.html`, and the first Astro Container API test in the repo proves the `.astro` test harness works — 104/104 suite GREEN.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 2
- **Files created:** 2 (404.astro, 404.test.ts)

## Accomplishments
- `src/pages/404.astro` authored as a standalone `<html lang>` doc (decision below) — infers locale from `Astro.url.pathname` (`/es` prefix → ES copy + `/es` CTA; `/en` prefix or bare unknown path → EN copy + `/en` or `/` CTA respectively), renders the full UI-SPEC bilingual copy contract (eyebrow/numeral/heading/body/CTA), uses only real tokens (`bg-ink-900`, `text-text-primary`/`text-text-secondary`, `text-brand`, `border-ink-400`, `bg-brand-gradient bg-clip-text text-transparent`) — zero `text-neon`/`bg-grad-neon`/`shadow-neon` hits, confirmed by the plan's own forbidden-token check
- CTA meets 44px touch target (`min-h-[44px]`) and has a visible `focus-visible:ring-2 focus-visible:ring-brand` keyboard focus state (WCAG AA)
- `npx astro build` verified: emits `dist/404.html`; the plan's automated assertion script (forbidden-token check + `ink-900` presence + home-CTA href pattern + "404" text) prints `OK`
- `src/pages/404.test.ts` stands up the Astro Container API harness: `experimental_AstroContainer` from `astro/container` creates a container, `renderToString(NotFoundPage)` compiles and renders the `.astro` component, asserting it resolves truthy and the output contains a home link + "404" — first `.astro` component test in the repo, proof-of-life for Phase 23's full static-component migration
- Discovered and fixed a real environment incompatibility (Rule 1/3 — blocking bug): esbuild's startup invariant (`new TextEncoder().encode("") instanceof Uint8Array`) fails under the repo's default jsdom test environment; fixed with a per-file `// @vitest-environment node` override on `404.test.ts` only — no change to `vitest.config.ts`'s repo-wide jsdom default, so all other (React/RTL) tests are unaffected
- Full suite re-verified GREEN: **104/104 tests passing** (102 pre-existing + 2 new), zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Author 404.astro** - `1ea1d80` (feat)
2. **Task 2: Stand up Container API harness with 404.astro proof-of-life test** - `f5f243e` (feat)

## Files Created/Modified
- `src/pages/404.astro` - new: standalone bilingual 404 page, locale-inferred copy/CTA, real dark-palette tokens, WCAG AA focus state
- `src/pages/404.test.ts` - new: Astro Container API proof-of-life test, forced to `node` test environment

## Decisions Made
- **BaseLayout-wrap vs standalone (plan's required decision point):** Chose standalone. `BaseLayout.astro` computes `locale = Astro.currentLocale ?? 'en'`, which is always `'en'` on this unprefixed catch-all route (it never resolves to `'es'` even when the broken path started with `/es`) — this would silently desync the `<html lang>` attribute from the page's own locale-inferred copy. BaseLayout's canonical/hreflang/OG block also resolves URLs meant for real, indexable content pages; pointing them at an arbitrary broken path is not correct SEO behavior for an error page, and would additionally require `PUBLIC_SITE_URL` to be set just to build a page that has no canonical target. A small self-contained doc (~20 lines of head/body), matching RESEARCH.md's documented `404.astro` convention and reusing only the real dark-palette tokens, satisfies D-11's minimalism call more directly.
- **`// @vitest-environment node` per-file override:** Astro's Container API compiles `.astro` files via esbuild at test time. esbuild's own startup check breaks under jsdom's `TextEncoder` shim (a known esbuild/jsdom incompatibility, not specific to this codebase). Since `renderToString()` returns a plain string (no DOM interaction needed in the test), forcing this one file to Node's environment via the Vitest docblock convention is the minimal fix — it does not touch `vitest.config.ts`'s repo-wide jsdom default that every React/RTL test still depends on.
- **`<meta name="robots" content="noindex">` added** to the 404 page's head — not explicitly called for by UI-SPEC or RESEARCH.md, but standard, low-risk SEO correctness for an error page with no canonical target (Rule 2 — missing correctness detail, not a new feature).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1/3 - Bug/Blocking] esbuild fails under jsdom test environment for Container API tests**
- **Found during:** Task 2 verification (`npx vitest run src/pages/404.test.ts`)
- **Issue:** `experimental_AstroContainer.create()` triggers Astro's esbuild-backed compiler pipeline. esbuild's internal invariant check (`new TextEncoder().encode("") instanceof Uint8Array`) evaluates false under the repo's default jsdom test environment (`environment: 'jsdom'` in `vitest.config.ts`), throwing before any test body runs — a documented esbuild/jsdom global-shim incompatibility, unrelated to the 404 page's own logic.
- **Fix:** Added a `// @vitest-environment node` docblock comment at the top of `src/pages/404.test.ts` (Vitest's supported per-file environment override). No change to the shared `vitest.config.ts`.
- **Files modified:** `src/pages/404.test.ts`
- **Verification:** `npx vitest run src/pages/404.test.ts` → 2/2 passing. `npx vitest run` (full suite) → 104/104 passing, confirming the jsdom-dependent React/RTL tests are unaffected.

**2. [Rule 2 - Correctness] `noindex` meta added to the 404 page**
- **Found during:** Task 1 (authoring the page head)
- **Issue:** Neither the plan nor UI-SPEC explicitly calls for a `robots` meta tag, but an error page with no canonical target and no unique indexable content is standard practice to keep out of search indices.
- **Fix:** Added `<meta name="robots" content="noindex">` to `404.astro`'s `<head>`.
- **Files modified:** `src/pages/404.astro`
- **Verification:** Visual/source inspection of `dist/404.html`; does not affect any plan verification assertion (forbidden-token/`ink-900`/href/`404` checks all still pass).

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 correctness)
**Impact on plan:** No scope creep — both changes stay inside this plan's two files and directly serve the plan's own stated verification/acceptance criteria.

## Issues Encountered
None beyond the two deviations above.

## Next Phase Readiness
- `DEPLOY-02` is now fully satisfied: `astro build` emits a real, authored `dist/404.html` (not an SPA fallback) with correct dark-palette tokens and a working home link.
- The Astro Container API harness is proven working end-to-end (`experimental_AstroContainer` + `renderToString()` + `@vitest-environment node` per-file override for files that compile `.astro` components) — Phase 23 can copy this exact pattern for full static-component test coverage (TEST-01), including the environment-override workaround discovered here.
- This closes out Phase 21's remaining scope; the only open item is Plan 21-05 (validate `middleware.ts` against a real Vercel preview deploy — unrelated to this plan's files).

---
*Phase: 21-foundation-astro-scaffold-i18n-routing-layout-shell*
*Completed: 2026-07-19*

## Self-Check: PASSED

All created files verified present (src/pages/404.astro, src/pages/404.test.ts); both task commits (1ea1d80, f5f243e) verified present in git log; full suite 104/104 GREEN.
