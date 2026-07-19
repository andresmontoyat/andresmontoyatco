---
phase: 21-foundation-astro-scaffold-i18n-routing-layout-shell
plan: 02
subsystem: frontend
tags: [astro, i18n, seo, layout, theme]

# Dependency graph
requires: ["21-01"]
provides:
  - "src/layouts/BaseLayout.astro — shared <head> shell (meta/OG/JSON-LD/GA + hreflang/canonical + html lang + blocking theme script)"
  - "Symmetric /en + /es static route tree wrapping BaseLayout"
  - "Bare / static fallback (src/pages/index.astro) — not the redirect, middleware.ts (21-03) owns that"
affects: ["21-03", "21-04", "21-05", "Phase 22+ (content-section migration builds on this route tree + layout)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BaseLayout resolves locale via Astro.currentLocale at build time, indexes translations.js meta for per-route title/description (replaces LanguageContext's runtime useEffect, D-07)"
    - "canonical/hreflang built via getRelativeLocaleUrl(locale, path) + new URL(..., siteUrl) — NOT getAbsoluteLocaleUrl({ base }), because astro@7.1.1's public astro:i18n GetLocaleOptions type has no base override (verified against node_modules/astro/dist/i18n/index.d.ts)"
    - "Blocking <script is:inline> theme-flip in <head>, wrapped in try/catch, reads 'cam-theme' (mirrors ThemeContext.jsx's readInitialTheme exactly)"

key-files:
  created: [src/layouts/BaseLayout.astro, src/pages/index.astro, src/pages/en/index.astro, src/pages/es/index.astro, .env]
  modified: []

key-decisions:
  - "Spike resolved 21-RESEARCH.md Open Question 2: getAbsoluteLocaleUrl's { base } option does NOT exist in astro@7.1.1 — took the documented fallback (getRelativeLocaleUrl + new URL(..., siteUrl))"
  - "og:url and og:image resolved from PUBLIC_SITE_URL (not hardcoded, unlike index.html's static value) — extends D-06's 'never hardcoded' rule to the whole file for consistency, since leaving one hardcoded domain literal next to the env-var-driven canonical/hreflang would be an inconsistency in the same file"
  - "og:url set to the per-locale canonical URL (not a single static homepage URL as in the old single-page index.html) — correct behavior now that /en and /es are separate real routes"
  - "Local .env (gitignored, not committed) created with PUBLIC_SITE_URL=https://andresmontoyat.co so `astro build` succeeds locally; the real Vercel env var still needs configuring by the user per the plan's user_setup block"

requirements-completed: [ROUTE-01, ROUTE-03, ROUTE-04, ISLAND-04]

# Metrics
duration: ~7min
completed: 2026-07-19
---

# Phase 21 Plan 2: Foundation — BaseLayout + /en /es route tree Summary

**Single shared `BaseLayout.astro` head shell (ported index.html's meta/OG/JSON-LD/GA) drives symmetric static `/en` + `/es` routes with build-time `<html lang>`, hreflang/canonical, and a pre-paint `cam-theme` blocking script — zero runtime FOUC or client-side meta mutation.**

## Performance

- **Duration:** ~7 min
- **Tasks:** 2
- **Files created:** 5 (BaseLayout.astro, 3 route .astro files, local .env)

## Accomplishments
- `src/layouts/BaseLayout.astro` authored: favicon/viewport/hero-preload/theme-color, per-locale `<title>`/description resolved at build time from `translations.js` `meta` (D-07), canonical + 3 hreflang alternates (en/es/x-default) built from `PUBLIC_SITE_URL` (D-05/D-06), static JSON-LD Person block verbatim/English-only (D-08), GA gtag script verbatim (D-09), blocking `<script is:inline>` theme-flip reading `cam-theme` with `try/catch`, defaulting to `dark` (ISLAND-04)
- Spiked and resolved 21-RESEARCH.md's Open Question 2 (`getAbsoluteLocaleUrl({ base })`): inspected `node_modules/astro/dist/i18n/index.d.ts` directly — the public `astro:i18n` `GetLocaleOptions` type only exposes `normalizeLocale`/`prependWith`; `base`/`site` are injected internally by Astro's own runtime module from `astro.config.mjs`. Took the documented fallback: `getRelativeLocaleUrl(locale, path)` + `new URL(..., siteUrl)`
- `src/pages/en/index.astro` and `src/pages/es/index.astro` created as thin `BaseLayout`-wrapped placeholders — prove the route tree resolves per locale; no content-section components ported (Phase 22+ scope)
- `src/pages/index.astro` created as a minimal static `/` fallback (links to `/en`/`/es`) — explicitly NOT the redirect mechanism; Plan 21-03's `middleware.ts` owns `/`
- `astro build` verified: emits `dist/en/index.html` (`lang="en"`), `dist/es/index.html` (`lang="es"`), both carrying canonical + 3 hreflang alternates + inlined `dataset.theme` script; `dist/index.html` fallback present
- Full existing suite re-verified GREEN: **102/102 tests passing**, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Author BaseLayout.astro** - `99b23f6` (feat)
2. **Task 2: Create /en, /es, / route tree using BaseLayout** - `f3dc6a8` (feat)

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - new: shared head shell, build-time i18n meta, hreflang/canonical, blocking theme script
- `src/pages/en/index.astro` - new: thin `/en` locale entry
- `src/pages/es/index.astro` - new: thin `/es` locale entry
- `src/pages/index.astro` - new: minimal static `/` fallback (not the redirect)
- `.env` - new, gitignored (matches existing `.env*` rule): local `PUBLIC_SITE_URL` fallback for `astro build` to succeed on this machine

## Decisions Made
- Fallback path for hreflang/canonical URL construction confirmed via direct TypeScript source inspection (not just doc-reading) — `getAbsoluteLocaleUrl`'s public option shape has no `base` override in the installed `astro@7.1.1`.
- Extended D-06's "never hardcoded domain" rule to `og:url`/`og:image` as well (not just canonical/hreflang) for internal file consistency — same `siteUrl` value drives every absolute URL in the file.
- `og:url` is now the per-route canonical URL rather than a single static homepage URL, correct now that `/en`/`/es` are real separate routes (the old `index.html` was a single page, so a static `og:url` made sense then; it no longer does).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Local `.env` with `PUBLIC_SITE_URL` created to unblock `astro build`**
- **Found during:** Task 2 verification (`npx astro build`)
- **Issue:** `BaseLayout.astro`'s `siteUrl` reads `import.meta.env.PUBLIC_SITE_URL`; with no env var set, `new URL(Astro.url.pathname, siteUrl)` throws (invalid base URL), failing the build entirely — the plan's own verification command requires a successful `astro build`.
- **Fix:** Created a local `.env` (already covered by the repo's existing `.env*` gitignore rule — not committed) with `PUBLIC_SITE_URL=https://andresmontoyat.co` (D-05's value). The plan's `user_setup` block already documents that the *real* Vercel env var must be configured by the user in Project Settings before production builds work; this local file only unblocks dev/CI builds on this machine, per the plan's own note ("a local .env fallback keeps dev/CI builds correct").
- **Files modified:** `.env` (untracked/gitignored, not part of any commit)
- **Verification:** `npx astro build` succeeds; `git status --short` confirms `.env` does not appear as untracked (gitignore rule `.env*` already covers it).

---

**2. [Rule 2 - Consistency] `og:url`/`og:image` resolved from `PUBLIC_SITE_URL` instead of copied as a hardcoded literal**
- **Found during:** Task 1 (porting the static OG/Twitter block from `index.html`)
- **Issue:** `index.html`'s OG block hardcodes `https://andresmontoyat.co/` for `og:url` and `og:image`. D-06 states the base domain "is read from the `PUBLIC_SITE_URL` build-time env var... never hardcoded in `BaseLayout.astro`" — a literal reading of this decision extends past just canonical/hreflang to the whole file. Leaving a hardcoded domain string a few lines above the env-var-driven canonical link would be an inconsistency within the same file and a maintenance hazard if the domain ever changes.
- **Fix:** `og:url` and `og:image` now derive from the same `siteUrl`/`canonicalUrl`/`ogImageUrl` values used for canonical/hreflang. `og:url` also became per-route (matches `canonicalUrl`) rather than a single static homepage URL, which is more correct now that `/en`/`/es` are real distinct routes.
- **Files modified:** `src/layouts/BaseLayout.astro`
- **Verification:** Built `dist/en/index.html` and `dist/es/index.html` show `og:url` content correctly resolving to `https://andresmontoyat.co/en/` and `https://andresmontoyat.co/es/` respectively (verified by direct grep against build output).

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 consistency/correctness)
**Impact on plan:** No scope creep — both changes stay inside `BaseLayout.astro`'s stated purpose (build-time `<head>` correctness) and directly serve D-06's own stated intent. No functional/architectural change outside this plan's file list.

## Issues Encountered
None beyond the two deviations above.

## User Setup Required
- **Vercel:** `PUBLIC_SITE_URL` must be configured in Vercel Project → Settings → Environment Variables (value: `https://andresmontoyat.co`) before this feeds canonical/hreflang/og:url in production builds. A local `.env` fallback (gitignored) keeps this machine's dev/CI builds correct in the meantime — see Deviations above.

## Next Phase Readiness
- `BaseLayout.astro` is the single shared head shell every future route wraps — Phase 22+'s Nav island and content sections render inside its `<slot />`.
- `/en` and `/es` are real, build-verified, SEO-correct static routes (ROUTE-01/03/04) — ready for Plan 21-03's `middleware.ts` to redirect `/` into them.
- `src/pages/index.astro`'s bare fallback deliberately does nothing beyond linking to `/en`/`/es` — Plan 21-03 is fully responsible for the actual cookie/Accept-Language redirect logic; this plan does not assume anything about that mechanism's outcome.
- Open Question 2 from 21-RESEARCH.md (`getAbsoluteLocaleUrl`'s `base` option) is now closed — confirmed absent from the public API by direct source inspection; future plans referencing `astro:i18n` helpers should use `getRelativeLocaleUrl` + manual `new URL()` resolution, not assume a `base`/`site`-override option exists at the call site.

---
*Phase: 21-foundation-astro-scaffold-i18n-routing-layout-shell*
*Completed: 2026-07-19*

## Self-Check: PASSED

All created files verified present (src/layouts/BaseLayout.astro, src/pages/index.astro, src/pages/en/index.astro, src/pages/es/index.astro, 21-02-SUMMARY.md); both task commits (99b23f6, f3dc6a8) verified present in git log.
