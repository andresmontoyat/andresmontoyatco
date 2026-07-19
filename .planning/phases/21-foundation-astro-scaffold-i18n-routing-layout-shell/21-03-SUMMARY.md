---
phase: 21-foundation-astro-scaffold-i18n-routing-layout-shell
plan: 03
subsystem: infra
tags: [vercel, edge-middleware, i18n, redirect, security]

# Dependency graph
requires: ["21-01"]
provides:
  - "vercel.json rewritten for Astro static output: no rewrites block, framework astro, cache headers scoped to /_astro/(.*) only"
  - "middleware.ts at repo root: Vercel-native Edge Middleware owning the / -> /en|/es 302 redirect with an open-redirect allowlist guard, plus cam-lang cookie refresh on /en/* and /es/* visits"
affects: ["21-04", "21-05 (validates the bare-200 pass-through assumption against a real Vercel preview deploy)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "middleware.ts hand-rolls cookie parsing via request.headers.get('cookie') and a literal Set-Cookie response header string — no Next.js-only request.cookies/NextResponse API (framework-agnostic Vercel Routing Middleware constraint)"
    - "isKnownLocale() allowlist gate applied server-side before any value enters the Location header — same allowlist-before-commit shape as src/i18n/LanguageContext.jsx setLang"

key-files:
  created: [middleware.ts]
  modified: [vercel.json]

key-decisions:
  - "vercel.json rewrites block removed entirely (not just SPA fallback) — Vercel's own Astro docs state vercel.json rewrites are unsupported for Astro (DEPLOY-02)"
  - "middleware.ts matcher uses a negative-lookahead excluding /_astro/ and common static-asset extensions instead of RESEARCH.md's literal '/(.*)' — narrows D-04's 'every route' wording to 'every page route' to avoid per-asset Edge invocation cost; exact matcher string recorded below for user sign-off"
  - "bare-200 Response pass-through (Assumption A2 / Open Question 1) implemented as specified but NOT validated locally — explicitly deferred to Plan 21-05's real Vercel preview deploy; no @vercel/functions dependency added in this plan"

requirements-completed: [ROUTE-02, DEPLOY-02]

# Metrics
duration: 10min
completed: 2026-07-19
---

# Phase 21 Plan 3: middleware.ts (/ redirect + cookie refresh + open-redirect guard) Summary

**Vercel-native Edge Middleware at repo root 302-redirects `/` to `/en`/`/es` (cam-lang cookie first, else Accept-Language heuristic) behind an `isKnownLocale()` open-redirect allowlist, refreshes the `cam-lang` cookie on every locale page visit, and `vercel.json` is rewritten to the Astro static-output shape with the unsupported SPA rewrites block removed.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files modified:** 2 (vercel.json rewritten, middleware.ts created)

## Accomplishments

- `vercel.json`: `rewrites` block removed entirely (Vercel's own Astro docs: "You should not use `vercel.json` to rewrite URL paths with Astro projects"), `framework` switched `vite` → `astro`, `headers` reduced to a single rule scoped to `/_astro/(.*)` with `Cache-Control: public, max-age=31536000, immutable`. Stale `/assets/*`, `/index.html`, `/`, and image-extension cache rules dropped. Verification assertion prints `OK`.
- `middleware.ts` authored at repo root (sibling of `package.json`, not `src/middleware.ts`): `isKnownLocale()` allowlist (`['en','es']`) gates every value before it enters the `Location` header (T-21-03-01 open-redirect mitigation), `parseCookie()` manually reads `request.headers.get('cookie')` (no Next.js-only `request.cookies`), `resolveLocaleFromAcceptLanguage()` mirrors `LanguageContext.jsx`'s `readInitialLang` substring heuristic (D-02, no q-value parser), `/` returns 302 with `Location: /en` or `/es` plus a `Set-Cookie: cam-lang=...; Path=/; Max-Age=31536000; SameSite=Lax` header (D-01, D-03), and `/en/*`/`/es/*` refresh the same cookie on every visit (D-04). Verification assertion prints `OK`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite vercel.json for Astro static output** - `d0e7fbb` (feat)
2. **Task 2: Author middleware.ts — / redirect + cookie refresh + open-redirect guard** - `b707bbb` (feat)

## Files Created/Modified

- `vercel.json` - no `rewrites`, `framework: "astro"`, single `/_astro/(.*)` cache rule
- `middleware.ts` - new: Vercel Edge Middleware, `/` redirect + cookie refresh + open-redirect guard

## Matcher String (for user sign-off)

```
'/((?!_astro/|.*\.(?:ico|png|jpg|jpeg|webp|svg|gif|woff|woff2|css|js|mjs|json|xml|txt|map)$).*)'
```

**D-04 interpretation flagged for confirmation:** D-04 says the middleware "runs on every route." This plan interprets that as every **page** route: the matcher above uses a negative-lookahead that excludes `/_astro/` (Astro's hashed-asset prefix) and a list of common static-file extensions, so the `cam-lang` cookie still refreshes on every `/en/*` and `/es/*` **page** visit (D-04's actual purpose — cookie refresh on locale page visits) without the middleware paying an Edge invocation per static asset (JS/CSS/image/font request). This narrows D-04's literal "every route" wording rather than accepting the unscoped `'/(.*)'` matcher RESEARCH.md's code sample used verbatim. RESEARCH.md itself flagged this exact matcher-scoping question as an open cost/correctness tradeoff for planning to resolve, not something the research pass could decide unilaterally — this plan's decision is documented here per the plan's own instruction, awaiting user confirmation rather than being silently narrowed.

## Decisions Made

- Followed 21-RESEARCH.md's `middleware.ts` code block as the primary source for all logic (cookie parsing, Accept-Language heuristic, allowlist guard, 302 redirect, cookie refresh), diverging only on the `matcher` value per the plan's explicit "DECISION FOR THIS PLAN" instruction (negative-lookahead vs. RESEARCH.md's unscoped `'/(.*)'`).
- `vercel.json`'s `headers` array reduced to exactly one rule (`/_astro/(.*)`) — HTML routes intentionally left to Vercel's Astro-detected defaults rather than hand-written cache rules, per RESEARCH.md's confirmed guidance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworded a code comment to avoid the literal string `@vercel/functions`**
- **Found during:** Task 2 verification (the plan's own `<verify>` automated assertion asserts the string `@vercel/functions` is absent from the file, while the plan's `<action>` text separately instructs adding a comment naming that exact package as the documented pass-through fallback)
- **Issue:** The plan's action text and its own verify script are in tension: the action says to name `@vercel/functions` in a comment; the verify script fails the build if that literal substring appears anywhere in the file, including comments. Running the verify command as written surfaced the conflict immediately (a genuine blocker — the task could not pass verification as originally drafted).
- **Fix:** Reworded the fallback comment to describe the same package by its role ("the `next()` helper exported from Vercel's Edge Functions runtime helper package (see 21-RESEARCH.md)") instead of the literal npm specifier string, preserving the informational intent of the action instruction while satisfying the verify script's literal-string exclusion (which exists to guard against accidentally importing/depending on the package in this plan, not against ever mentioning its name in prose).
- **Files modified:** `middleware.ts`
- **Verification:** Re-ran the plan's exact verify command after the edit — prints `OK`.
- **Committed in:** `b707bbb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No functional/behavioral change — comment wording only. No scope creep.

## Known Stubs

None — this plan produces infra config only, no UI/data stubs applicable.

## Threat Flags

None beyond the plan's own `<threat_model>` — no new trust boundaries, endpoints, or auth paths were introduced outside what the plan's STRIDE register already accounts for (T-21-03-01..04).

## Issues Encountered

None beyond the deviation documented above.

## User Setup Required

None for this plan's code changes. Carried forward from 21-02 (still pending, unrelated to this plan): `PUBLIC_SITE_URL` must be configured in Vercel Project Settings before any production/preview deploy.

## Next Phase Readiness

- `vercel.json` and `middleware.ts` are both source-verified (assertions pass) but **not yet validated against a real deploy**. Plan 21-05 is the mandatory checkpoint: it must confirm (a) the bare-200 `Response` from `middleware.ts` actually passes `/en`/`/es` requests through to the static Astro page rather than serving an empty body (Assumption A2 / T-21-03-04, currently disposed "transfer"), and (b) the `/` → `/en`/`/es` 302 redirect and cookie refresh behave as coded against a live Vercel preview URL.
- The matcher string above is a plan-level decision narrowing D-04's literal wording — flagged explicitly in this SUMMARY (not silently narrowed) per the plan's own instruction; surface for user confirmation before/at the 21-05 validation checkpoint.
- No `@vercel/functions` dependency was added. If Plan 21-05's preview validation shows the bare-200 pass-through does NOT work, that plan is where the `next()` fallback import gets added — not retroactively into this plan.

---
*Phase: 21-foundation-astro-scaffold-i18n-routing-layout-shell*
*Completed: 2026-07-19*

## Self-Check: PASSED

All created/modified files verified present (vercel.json, middleware.ts, 21-03-SUMMARY.md); both task commits (d0e7fbb, b707bbb) verified present in git log.
