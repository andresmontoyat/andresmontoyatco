---
phase: 25-sectionpager
plan: 01
subsystem: frontend
tags: [astro, react-island, i18n, section-pager, client-visible]

# Dependency graph
requires: ["22-01"]
provides:
  - "src/components/react/SectionPager.jsx — Context-free client:visible React island (scroll-gated section-jump control)"
  - "SectionPager mounted on /en and /es with locale prop"
affects: ["Phase 27 (legacy src/components/SectionPager.jsx cleanup, still referenced by not-yet-removed CSR entry point)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "client:visible directive — first use in this repo of deferred (as opposed to client:load) island hydration, correct for a scroll-gated control (window.scrollY > 320)"
    - "Context→props island boundary (locale prop indexing translations[locale]) — second application of the Phase 22 Nav pattern, confirms it generalizes to a second island"

key-files:
  created: [src/components/react/SectionPager.jsx, src/components/react/SectionPager.test.jsx]
  modified: [src/pages/en/index.astro, src/pages/es/index.astro]

key-decisions:
  - "SectionPager mounted immediately after <Nav> and before <main> on both locale pages — both are fixed-position chrome outside the content flow; grouping page-level island mounts together (Claude's Discretion, matches 25-PATTERNS.md's suggested placement)"
  - "useActiveSection mocked to 'hero' (not 'about' as in Nav.test.jsx) in the ported test suite — preserves the original dial-color assertion's semantics (SECTION_IDS[0] / #00E5A8)"

requirements-completed: [ISLAND-02]

# Metrics
duration: ~10min
completed: 2026-07-19
---

# Phase 25 Plan 1: SectionPager Summary

**SectionPager ported verbatim into a Context-free `client:visible` React island, replacing `useLanguage()` with a `locale` prop, mounted on both `/en` and `/es` alongside Nav — the last remaining work for ISLAND-02.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files created:** 2 (SectionPager.jsx, SectionPager.test.jsx)
- **Files modified:** 2 (en/index.astro, es/index.astro)

## Accomplishments

- `src/components/react/SectionPager.jsx` — ports `src/components/SectionPager.jsx` (139 lines) verbatim except imports and signature. `SECTION_IDS`, `SECTION_COLORS`, `prefersReducedMotion`, `scrollToY`, `scrollToId`, `ICONS`, `PagerButton`, `ProgressDial`, and the `requestAnimationFrame`-throttled scroll/resize `useEffect` carry zero logic changes (D-03). Signature changed to `SectionPager({ locale })`; `const { t } = useLanguage()` replaced by `const t = translations[locale]`, mirroring Phase 22's Nav pattern exactly (D-02) — confirms the Context→props idiom generalizes cleanly to a second island.
- `src/components/react/SectionPager.test.jsx` — ports all 6 `it` blocks from the legacy `src/components/SectionPager.test.jsx` unchanged in assertions. Dropped `LanguageProvider` wrapper; added `vi.mock('../../hooks/useActiveSection', () => ({ default: () => 'hero' }))` (mocked to `'hero'`, not `'about'` like Nav's test, to preserve the dial-color assertion's original `SECTION_IDS[0]`/`#00E5A8` semantics); `renderPager(locale)` replaces `renderWithLang(lang)`. RED confirmed first (import-resolution failure against the not-yet-created component), then GREEN after the component was authored — TDD gate satisfied.
- `src/pages/en/index.astro` / `src/pages/es/index.astro` — both import `SectionPager` and mount `<SectionPager client:visible locale={locale} />` immediately after the existing `<Nav client:load ... />` line, still outside `<main>` (D-04). `client:visible` deliberately differs from Nav's `client:load` — SectionPager is scroll-gated (`window.scrollY > 320`) so nothing is lost deferring hydration until it scrolls near (D-01).
- `npm run build` verified: `dist/en/index.html` and `dist/es/index.html` both carry an `astro-island` element with `client="visible"` — confirms the hydration directive compiled correctly, distinct from Nav's `client="load"`.
- Full existing suite re-verified GREEN: **136/136 tests passing** (130 baseline + 6 new), zero regressions.

## Task Commits

Each task was committed atomically (TDD RED/GREEN split for Task 1):

1. **Task 1 RED: add failing RTL suite for SectionPager island** — `c25f0c6` (test)
2. **Task 1 GREEN: port SectionPager into Context-free client:visible island** — `001b9e7` (feat)
3. **Task 2: mount SectionPager client:visible on /en and /es** — `f460a7c` (feat)

## Files Created/Modified

- `src/components/react/SectionPager.jsx` - new: Context-free `client:visible` island, `locale` prop, ported verbatim logic (D-03)
- `src/components/react/SectionPager.test.jsx` - new: 6-spec RTL suite, no LanguageProvider, useActiveSection mocked to `'hero'`
- `src/pages/en/index.astro` - modified: imports + mounts `<SectionPager client:visible locale={locale} />` after Nav
- `src/pages/es/index.astro` - modified: imports + mounts `<SectionPager client:visible locale={locale} />` after Nav

## Decisions Made

- Mounted SectionPager directly after `<Nav>`, both outside `<main>` — matches 25-PATTERNS.md's suggested placement, keeps all page-level island mounts grouped together for readability.
- Mocked `useActiveSection` to `'hero'` in the test file rather than reusing Nav's `'about'` mock — required to keep the ported dial-color assertion (`SECTION_IDS[0]` / `#00E5A8`) semantically identical to the pre-migration test.

## Deviations from Plan

None — plan executed exactly as written. Both tasks' acceptance criteria (RTL specs GREEN, zero `useLanguage`/`LanguageContext` occurrences, correct signature/imports, `client:visible` not `client:load`, build succeeds, dist carries `client="visible"`, full suite GREEN) were met without deviation.

## Issues Encountered

None.

## Known Stubs

None — SectionPager renders its full interactive contract (4 nav buttons, progress dial, section-jump behavior) with real data; no placeholder/empty states introduced.

## Threat Flags

None beyond the plan's own `<threat_model>` (T-25-01/02/03/SC), which were satisfied exactly as specified: `locale` prop originates server-side from `Astro.currentLocale` (allowlisted), `scrollToId` only ever receives ids from the hardcoded module-level `SECTION_IDS` array, and the scroll/resize listeners remain `requestAnimationFrame`-throttled + `{ passive: true }` + further deferred by `client:visible`. No new package-manager installs.

## Next Phase Readiness

- ISLAND-02 requirement complete — SectionPager is the last remaining piece of that requirement per the plan's objective.
- `SectionPager.jsx`'s `{ locale }` prop contract is stable and locked; no other consumer currently expected.
- Legacy `src/components/SectionPager.jsx` and its test were intentionally left untouched (still referenced by the not-yet-removed CSR entry point) — cleanup deferred to Phase 27, same pattern established in Phase 24's Hero deviation note.
- Phase 25 is now complete (single-plan phase). Next step: Phase 26 (Experience island + STATIC-02 Experience half).

---
*Phase: 25-sectionpager*
*Completed: 2026-07-19*

## Self-Check: PASSED
