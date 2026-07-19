---
phase: 21-foundation-astro-scaffold-i18n-routing-layout-shell
plan: 01
subsystem: infra
tags: [astro, vitest, vite, i18n, build-tooling]

# Dependency graph
requires: []
provides:
  - Astro build toolchain (astro@7.1.1, @astrojs/react@6.0.1) installed and wired as the project's build tool
  - astro.config.mjs with astro:i18n configured for symmetric /en + /es trees (prefixDefaultLocale true)
  - vitest.config.ts wired through Astro's getViteConfig(), preserving the full existing Vitest/RTL suite
  - three dependency removed (DEPLOY-01); engines.node >=22.12.0 pinned (DEPLOY-03)
affects: [21-02, 21-03, 21-04, 21-05, "all later Phase 21+ plans that build/test the Astro app"]

# Tech tracking
tech-stack:
  added: [astro@7.1.1, "@astrojs/react@6.0.1", "@types/react", "@types/react-dom"]
  patterns:
    - "vitest.config.ts wraps astro/config's getViteConfig() instead of a standalone vite.config.js test block"
    - "astro.config.mjs is the single source of truth for the Vite pipeline going forward (no vite.config.js)"

key-files:
  created: [astro.config.mjs, vitest.config.ts]
  modified: [package.json, package-lock.json, .gitignore]

key-decisions:
  - "three removed via real npm uninstall (not hand-edited) — DEPLOY-01"
  - "engines.node pinned to >=22.12.0 as a package.json sibling of dependencies — DEPLOY-03"
  - "vite.config.js deleted outright; rollup-plugin-visualizer and the @ alias intentionally dropped for this phase (build:analyze flagged stale, out of Phase 21 scope per plan)"
  - "astro:i18n routing.prefixDefaultLocale=true and routing.redirectToDefaultLocale=false set explicitly to document that Vercel Edge Middleware (Plan 21-03) owns the '/' redirect, not Astro's own i18n redirect"
  - "site field intentionally omitted from astro.config.mjs — PUBLIC_SITE_URL wiring is Plan 21-02 scope (D-06)"

patterns-established:
  - "Astro config files use no-semicolon single-quote style (astro.config.mjs) matching the repo's existing vite.config.js convention; vitest.config.ts uses semicolons per TS/Astro convention (author's discretion per 21-RESEARCH.md)"

requirements-completed: [ROUTE-01, DEPLOY-01, DEPLOY-03]

# Metrics
duration: 5min
completed: 2026-07-19
---

# Phase 21 Plan 1: Foundation — Astro scaffold, i18n routing & layout shell (build toolchain) Summary

**Astro 7.1.1 + @astrojs/react 6.0.1 installed as the build tool, astro:i18n configured for symmetric /en+/es routing, and the existing 102-test Vitest/RTL suite migrated to run through Astro's getViteConfig() with zero regressions.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-19T19:36:00Z
- **Completed:** 2026-07-19T19:40:57Z
- **Tasks:** 3
- **Files modified:** 6 (package.json, package-lock.json, .gitignore, astro.config.mjs created, vitest.config.ts created, vite.config.js deleted)

## Accomplishments
- `astro` + `@astrojs/react` + `@types/react` + `@types/react-dom` installed via real `npm install`; `three` removed via real `npm uninstall` (no hand-edits, lockfile updated)
- `engines.node: ">=22.12.0"` pinned; `dev`/`build`/`preview` scripts swapped to `astro dev`/`astro build`/`astro preview`
- `astro.config.mjs` authored with `output: 'static'`, `react()` integration, and `i18n` block (`locales: ['en','es']`, `defaultLocale: 'en'`, `prefixDefaultLocale: true`, `redirectToDefaultLocale: false`); `npx astro sync` exits 0
- `vitest.config.ts` created wrapping `getViteConfig()`, carrying the full `test` block (jsdom environment, `setupFiles: ['./src/test/setup.jsx']`, coverage config) verbatim from the retired `vite.config.js`; `vite.config.js` deleted
- Full existing test suite verified GREEN under the new config: **102/102 tests passing** (13 test files) — no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Astro deps, remove three, pin engines.node, swap core scripts** - `5f01dbc` (feat)
2. **Task 2: Author astro.config.mjs with astro:i18n and react integration** - `7531a88` (feat)
3. **Task 3: Move Vitest config to vitest.config.ts via getViteConfig; retire vite.config.js** - `4acc545` (feat)

## Files Created/Modified
- `package.json` - Astro/React-types deps added, `three` removed, `engines.node` pinned, dev/build/preview scripts swapped to astro
- `package-lock.json` - real install/uninstall lockfile update
- `astro.config.mjs` - new: static output, react integration, astro:i18n config
- `vitest.config.ts` - new: `getViteConfig()`-wrapped test config, setupFiles preserved
- `vite.config.js` - deleted: superseded by astro.config.mjs + vitest.config.ts
- `.gitignore` - added `.astro/` (Astro's generated types cache, produced by `astro sync`/`vitest run`)

## Decisions Made
- Followed 21-RESEARCH.md's exact syntax verbatim for `astro.config.mjs` and `vitest.config.ts` — no deviation from the documented interfaces.
- `.astro/` generated types directory added to `.gitignore` (Rule 3 — blocking issue: `npx astro sync` and `npx vitest run` both regenerate this directory as untracked build output; leaving it untracked-but-uncommitted would violate the "never leave generated files untracked" task-commit protocol).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `.astro/` to `.gitignore`**
- **Found during:** Task 2 (astro.config.mjs authoring, after running `npx astro sync` verification)
- **Issue:** `npx astro sync` generates a `.astro/` directory (type declarations, content collection cache) at the repo root that was not previously gitignored — left as untracked build output, violating the executor's "never leave generated files untracked" rule.
- **Fix:** Added `.astro/` to `.gitignore` under a new "Astro generated types cache" section.
- **Files modified:** `.gitignore`
- **Verification:** `git status --short` shows no untracked `.astro/` entries after the change.
- **Committed in:** `7531a88` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary housekeeping fix caused directly by running the plan's own verification command (`npx astro sync`). No scope creep — no functional code changed.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Astro is now the build tool; `astro dev`/`astro build`/`astro preview` all resolve to real Astro commands.
- `astro:i18n` is configured for `/en` and `/es` — Plan 21-02 can now author `BaseLayout.astro` and the locale page tree on top of this config.
- Vitest suite runs green (102/102) through `vitest.config.ts`'s `getViteConfig()` wiring — later plans' Container API tests (proof-of-life) can be added without reworking this config.
- No `src/pages/` directory exists yet (`astro sync` warns "Missing pages directory") — expected, this is Plan 21-02+ scope (route tree, BaseLayout, middleware, 404).
- Open Question 1 from 21-RESEARCH.md (bare-200 middleware pass-through vs. `next()` from `@vercel/functions`) remains unresolved by this plan — explicitly deferred to Plan 21-03/21-05 per the research document's own resolution plan; not this plan's responsibility.

---
*Phase: 21-foundation-astro-scaffold-i18n-routing-layout-shell*
*Completed: 2026-07-19*

## Self-Check: PASSED

All created files verified present (astro.config.mjs, vitest.config.ts, 21-01-SUMMARY.md); vite.config.js confirmed removed; all 3 task commits (5f01dbc, 7531a88, 4acc545) verified present in git log.
