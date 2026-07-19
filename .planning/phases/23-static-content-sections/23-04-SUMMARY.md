---
phase: 23-static-content-sections
plan: 04
subsystem: frontend
tags: [astro, i18n, static-html, zero-js]

# Dependency graph
requires:
  - phase: 23-01
    provides: "About.astro + Container API test pattern"
  - phase: 23-02
    provides: "Skill.astro + Footer.astro"
  - phase: 23-03
    provides: "Projects.astro + Claude.astro"
provides:
  - "src/pages/en/index.astro and src/pages/es/index.astro mount all 5 static components (About -> Skill -> Projects -> Claude -> Footer) in D-05 order, replacing the placeholder <h1>"
  - "Build-verified + browser-verified zero-client-JS render for these 5 sections on both locale routes (STATIC-01 complete end to end)"
affects: ["Phase 24 (Hero mounts next, above About)", "Phase 25 (SectionPager)", "Phase 26 (Experience)", "Phase 27 (Lighthouse gate)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Page-level mounting: import 5 .astro components in frontmatter, render in fixed D-05 order inside <main>, each passed only locale={locale} — no other props needed since components self-resolve their own JSON/translations"

key-files:
  created: []
  modified: [src/pages/en/index.astro, src/pages/es/index.astro]

key-decisions:
  - "D-05 order honored exactly: About -> Skill -> Projects -> Claude -> Footer. Hero/Experience/Contact/SectionPager intentionally left absent (not stubbed) pending their own phases (24-26)."

patterns-established:
  - "Static section mounting pattern: <Component locale={locale} /> repeated per section, zero client: directives, zero additional props beyond locale"

requirements-completed: [STATIC-01, TEST-01]

# Metrics
duration: ~10min
completed: 2026-07-19
---

# Phase 23 Plan 4: Mount 5 static components on /en and /es Summary

**About, Skill, Projects, Claude, and Footer mounted into `src/pages/en/index.astro` and `src/pages/es/index.astro` in D-05 order, replacing the placeholder `<h1>` — build- and browser-verified zero-client-JS render on both locale routes, completing STATIC-01/TEST-01 for Phase 23.**

## Performance

- **Duration:** ~10 min (Task 1 automated + build verification) + human browser checkpoint
- **Tasks:** 2 (1 automated, 1 checkpoint:human-verify)
- **Files modified:** 2 (`src/pages/en/index.astro`, `src/pages/es/index.astro`)

## Accomplishments

- Added five import lines (`About`, `Skill`, `Projects`, `Claude`, `Footer` from `../../components/astro/*.astro`) to both page frontmatters, after the existing `Nav` import.
- Replaced `<h1>Carlos Montoya</h1>` inside `<main>` with the five component tags in exact D-05 order (About → Skill → Projects → Claude → Footer), each passed `locale={locale}`. Applied identically to `en/index.astro` and `es/index.astro`.
- `BaseLayout`, the `Nav client:load` mount, and the `getRelativeLocaleUrl` href computation left untouched. No Hero/Experience/Contact/SectionPager tags added — those stay absent (not stubbed) until Phases 24–26.
- `npm run build` — clean build, 4 pages emitted.
- Build-level zero-JS verification: `dist/en/index.html` contains `id="about"`, `id="skills"`, `id="projects"`, `id="claude-code"`, `<footer`; `dist/es/index.html` contains `Sobre mí` and `Proyectos`; exactly **1** `astro-island` element in each of `dist/en/index.html` / `dist/es/index.html` (Nav is the only hydrated island).
- Full test suite: **115/115 GREEN**, zero regressions (all 5 Container API suites + Nav island suite unaffected by the mounting change).
- Human browser verification (via `npx astro preview` + curl on `/en` and `/es`, coordinator-run): confirmed section ids present, footer bilingual copy present, quick-facts render static `"18+ years"` with no count-up (D-04 honored), exactly 1 `astro-island` in the page (`Nav.CMRTS6_y.js` only, no per-section JS chunks).

## Task Commits

Each task was committed atomically:

1. **Task 1: Mount 5 static components in both locale pages + build zero-JS verification** - `26298c1` (feat)

Task 2 was a `checkpoint:human-verify` gate — no code changes, verification only. Approved by coordinator.

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/pages/en/index.astro` - mounts About/Skill/Projects/Claude/Footer after Nav, D-05 order
- `src/pages/es/index.astro` - identical mount, preserves the `?? 'es'` locale fallback

## Decisions Made

- **D-05 order honored exactly as specified:** About → Skill → Projects → Claude → Footer, matching `23-PATTERNS.md`'s target mounting pattern. No deviation.

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched their `<action>` and `<acceptance_criteria>` blocks without requiring auto-fixes.

## Issues Encountered

None. The jsdom `Not implemented: navigation (except hash changes)` stderr line seen during `npx vitest run` is a pre-existing warning from the Nav island's anchor-click test path, unrelated to this plan's changes, and does not affect the 115/115 pass count.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 23 (Static content sections) is now fully complete: all 5 static `.astro` components exist, are tested via the Astro Container API, and are mounted on both locale routes with zero client-side JS beyond the pre-existing Nav island.
- `STATIC-01` and `TEST-01` in `.planning/REQUIREMENTS.md` were already marked complete by an earlier plan (23-02) before all 5 components existed; verified that marking is now accurate now that mounting is done — no correction needed.
- Ready for Phase 24 (Hero), which will mount above About per the eventual final order (Nav → Hero → About → Skill → Projects → Claude → Footer, pending Experience/Contact/SectionPager phases).

---
*Phase: 23-static-content-sections*
*Completed: 2026-07-19*

## Self-Check: PASSED

`src/pages/en/index.astro` and `src/pages/es/index.astro` verified present on disk with the 5-component mount; task commit `26298c1` verified present in `git log`; full suite 115/115 GREEN re-confirmed; browser checkpoint independently verified by coordinator via `npx astro preview` + curl (section ids, bilingual footer, static quick-facts, single astro-island).
