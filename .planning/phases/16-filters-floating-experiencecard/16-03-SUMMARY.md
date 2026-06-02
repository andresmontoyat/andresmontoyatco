---
phase: 16-filters-floating-experiencecard
plan: 03
subsystem: ui-state
tags: [phase-16, react-hook, svg-renderer, filter-state, chip-flash, reduced-motion, tdd-green]

requires:
  - phase: 14-foundation-data-layer-viewmode-toggle-test-infra
    provides: EXPERIENCE.period.{start,end}, SKILLS catalog, buildConstellationGraph (Node.years tuple)
  - phase: 15-accessible-constellation-seo-fallback
    provides: SvgConstellation renderer contract, useConstellation Phase-15 baseline (selectedSkillId/hoveredSkillId/onSelectSkill/onHoverSkill), usePrefersReducedMotion pattern, ARIA contract, weight-1 edge reveal logic
  - phase: 16-filters-floating-experiencecard (16-01 Wave 0, 16-02 Wave 1)
    provides: useConstellation + SvgConstellation RED suites (Plan 16-01); filters.js pure selectors (composeFilters, visibleSkillIds, yearBounds), Phase 16 Tailwind chip-flash keyframe (Plan 16-02)
provides:
  - useConstellation hook with full Phase 16 filter state surface — selectedSkills, yearRange, category, justFilteredId, isFilterActive, yearBounds, highlightedSkillIds (derived), plus 4 setters (toggleSkill, setYearRange, setCategory, resetFilters)
  - 100ms chip-flash trigger mechanism (useRef-tracked setTimeout, 0ms under reduced-motion, cleared on resetFilters and on unmount; no stacked timeouts)
  - SvgConstellation consumes highlightedSkillIds[] + yearRange to dim non-matching nodes/edges at fillOpacity 0.35; nodes whose years[] does not intersect yearRange are also dimmed (D-16-YEAR-EFFECT)
  - SvgConstellation applies motion-safe:animate-chip-flash class on the node <g> when justFilteredId === node.id (resolves checker BLOCKER 2)
  - SvgConstellation node circle inline transition is 'none' under prefers-reduced-motion (resolves checker WARNING 6)
  - 105/105 protected suites GREEN (Phase 14/15 carry-forward intact + Phase 16 Wave 0/1/2 RED tests now GREEN)
affects:
  - 16-04-PLAN (SkillFilters.js can consume the hook surface)
  - 16-05-PLAN (ExperienceCard.js will consume selectedSkillId + filter state)
  - 16-06-PLAN (GameMode integration with SkillFilters + ExperienceCard)

tech-stack:
  added: []
  patterns:
    - "Renderer-consumer split — useConstellation owns derived state, SvgConstellation is a pure-prop consumer (no filter logic in the renderer)"
    - "useRef-tracked setTimeout for transient UI state (justFilteredId), cleared before re-scheduling (RESEARCH §7 anti-pattern: never stack timeouts)"
    - "jsdom-safe matchMedia guard — `typeof window.matchMedia === 'function'` defensive default to avoid throws in test environments without matchMedia polyfill"
    - "Module-level data-derived constants (YEAR_BOUNDS = yearBounds(EXPERIENCE)) — mirrors GameMode.js D-15-LAND-COPY honesty pattern; never hardcode year bounds"
    - "Composite dim predicate (shouldDimNode) — Phase 16 filters take precedence; falls back to Phase 15 single-select dim when no Phase 16 filter is active (additive, non-breaking)"

key-files:
  created: []
  modified:
    - "src/game/useConstellation.js — extended hook with filter state + chip-flash trigger"
    - "src/game/renderers/SvgConstellation.js — extended renderer with dim logic + chip-flash class + reduced-motion transition guard"

key-decisions:
  - "Inline usePrefersReducedMotion in useConstellation.js (option A) — avoided cross-file shared helper churn for v1; identical SSR-safe pattern to SvgConstellation lines 32-59"
  - "Added defensive matchMedia guard (`hasMatchMedia = typeof window.matchMedia === 'function'`) — useConstellation.test.js does not mock matchMedia; without this guard, hook throws on every test render"
  - "Set justFilteredId on toggleSkill ADD path only (REMOVE leaves it untouched) — chip-flash signals new filter intent; removing a chip should not trigger flash on the removed node"
  - "Edge dim multiplies final opacity by 0.35 (not floor at 0.35) — keeps weight-1 edges hidden when filters active and dimmed, preserves Phase 15 D-15-VIS-EDGE"
  - "Node `years` field missing (e.g. test fixtures without years) is treated as NON-matching when yearRange set — safer default than silent pass-through; production graph nodes always carry years per buildConstellationGraph"

patterns-established:
  - "Filter-state ownership: useConstellation is the single source of truth for selectedSkills / yearRange / category / justFilteredId; downstream components (SkillFilters in 16-04, ExperienceCard in 16-05) consume via props or via the hook directly"
  - "Reduced-motion gating: 100ms motion-safe path collapses to 0ms under prefers-reduced-motion, with explicit JS guard on the renderer (`!prefersReducedMotion`) belted-and-suspendered with the CSS motion-safe: variant"
  - "Module-derived data bounds (yearBounds, skillCount) computed once at module load, exposed through hook so UI components never duplicate the derivation"

requirements-completed: [GAME-03, GAME-04]

duration: ~6 min
completed: 2026-06-02
---

# Phase 16 Plan 03: Hook Extension + Renderer Consumer Wiring Summary

**useConstellation now owns the full Phase 16 filter state (selectedSkills/yearRange/category + 100ms justFilteredId chip-flash trigger); SvgConstellation consumes highlightedSkillIds + yearRange to dim non-matching nodes/edges and applies motion-safe:animate-chip-flash on the just-toggled node — Phase 15 single-select + reduced-motion behavior preserved verbatim.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-02T14:14:30Z
- **Completed:** 2026-06-02T14:20:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- **Hook extension** — useConstellation gains 4 new useState hooks (selectedSkills, yearRange, category, justFilteredId), 4 setters (toggleSkill, setYearRange, setCategory, resetFilters), a useRef-tracked flashTimerRef, derived highlightedSkillIds (composeFilters + visibleSkillIds), module-level YEAR_BOUNDS from live EXPERIENCE, and isFilterActive boolean — all in-memory only (D-16-PERSIST-MEMORY)
- **Chip-flash trigger wired** — toggleSkill on the ADD path sets justFilteredId immediately and schedules setTimeout(100ms / 0ms reduced) to clear; back-to-back toggles clear the prior timer (no stacked timeouts per RESEARCH §7); resetFilters clears any pending timer; useEffect cleanup clears on unmount (no setState-after-unmount)
- **Renderer dim logic** — SvgConstellation gains nodeMatchesYearRange + shouldDimNode helpers; replaces Phase 15's `selectedSkillId !== null && !isSelected ? 0.35 : 1` with a composite predicate that respects Phase 16 filters first, falls back to Phase 15 single-select; edges incident to dimmed endpoints get their final opacity multiplied by 0.35 (D-16-YEAR-EFFECT)
- **Chip-flash class** — when `justFilteredId === node.id && !prefersReducedMotion`, the node `<g>` carries `motion-safe:animate-chip-flash` (combined with the existing `motion-safe:animate-node-reveal` base class via space-join — both classes coexist on the same element)
- **Reduced-motion fill-opacity transition guard** — node circle inline style now includes `transition: prefersReducedMotion ? 'none' : 'fill-opacity 200ms ease-out'` — resolves checker WARNING 6 (D-16-YEAR-EFFECT: "Reduced-motion path skips opacity transition")
- **No regression** — 105/105 protected suites GREEN (filters, spatialNav, constellation.graph, constellation.layout, ConstellationFallback, useConstellation, SvgConstellation)
- **Production build** — succeeds; GameMode chunk 14.97 kB (gzip 5.91 kB) — well within Phase budget

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend useConstellation.js** — `fcc1d21` (feat) — filter state + justFilteredId chip-flash trigger
2. **Task 2: Extend SvgConstellation.js** — `00bdfbc` (feat) — highlightedSkillIds/yearRange dim + chip-flash class + reduced-motion transition guard

## Files Created/Modified
- `src/game/useConstellation.js` — extended with full Phase 16 filter state surface; jsdom-safe usePrefersReducedMotion; module-level YEAR_BOUNDS from live data; useRef-tracked flashTimerRef; 4 useState + 4 useCallback + 2 useMemo + 2 useEffect (latter for unmount cleanup and matchMedia listener)
- `src/game/renderers/SvgConstellation.js` — added nodeMatchesYearRange + shouldDimNode module-scope helpers; removed eslint-disable comments from highlightedSkillIds/yearRange props; added justFilteredId prop with default null; combined animate-node-reveal + animate-chip-flash classes via groupClassName join; added inline reduced-motion transition guard on node circle

## Decisions Made
- **jsdom matchMedia guard** — extended the standard Josh Comeau pattern with `hasMatchMedia = typeof window.matchMedia === 'function'`; without this guard the useConstellation tests (which do not mock matchMedia) would throw on every render. This is a hardening that also benefits production SSR environments.
- **REMOVE path does NOT clear flash timer** — toggleSkill removing a chip leaves the current flash window alone. Rationale: a user adding A then immediately removing B should still see A's flash complete; the flash represents NEW filter intent on the ADD path.
- **Combined class string for the node `<g>`** — `animate-node-reveal` (Phase 15 entrance animation) and `animate-chip-flash` (Phase 16 flash) must coexist on the same element. Implemented via `[baseAnim, flashClass].filter(Boolean).join(' ')` to keep both intact and avoid mutually-exclusive class swaps.
- **Edge dim by multiplication, not floor** — chose `edgeOpacity *= 0.35` over `Math.max(0.35, edgeOpacity)` so weight-1 hidden edges (opacity 0) stay hidden; only weight-≥2 edges get the 0.35 dim. Preserves D-15-VIS-EDGE.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Defensive `window.matchMedia` guard in useConstellation.js**
- **Found during:** Task 1 (initial run of useConstellation.test.js after first edit pass)
- **Issue:** useConstellation.test.js does NOT install a `window.matchMedia` mock (unlike SvgConstellation.test.js which sets one in beforeEach). The plan's `<action>` block recommended "option A: inline matchMedia check matching SvgConstellation lines 32-59" but that pattern unconditionally calls `window.matchMedia(QUERY)`, which throws `TypeError: window.matchMedia is not a function` in jsdom-by-default. All 23 tests failed with this exception.
- **Fix:** Added `hasMatchMedia = !isServer && typeof window.matchMedia === 'function'` module-level constant; `usePrefersReducedMotion` returns `false` (treat as "no-preference") when matchMedia is unavailable and skips listener registration. Same hardening principle as the existing `isServer` guard.
- **Files modified:** `src/game/useConstellation.js` (within the same Task 1 commit)
- **Verification:** All 23 useConstellation tests GREEN after fix; SvgConstellation tests unaffected (its test file installs the mock)
- **Committed in:** `fcc1d21` (Task 1 commit — single atomic commit, not split)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical functionality: robust environment detection)
**Impact on plan:** Defensive guard is essential for correctness in any test environment that does not polyfill matchMedia, and is also beneficial for production SSR. No scope creep.

## Issues Encountered

- None beyond the matchMedia guard above. Both tasks went straight from RED to GREEN in one edit pass each.

## User Setup Required

None — no external services or configuration changes.

## Next Phase Readiness

- **For 16-04 (SkillFilters component):** Hook surface ready — `selectedSkills`, `toggleSkill`, `yearRange`, `setYearRange`, `category`, `setCategory`, `yearBounds`, `resetFilters`, `isFilterActive` are all exposed and tested.
- **For 16-05 (ExperienceCard):** Existing Phase 15 `selectedSkillId` + `onSelectSkill` unchanged; new `highlightedSkillIds` available for the AND-intersection job filtering (D-16-INTERSECT-AND).
- **For 16-06 (GameMode integration):** Pass `highlightedSkillIds`, `yearRange`, `justFilteredId` props through from useConstellation to SvgConstellation; render `<SkillFilters />` + `<ExperienceCard />` siblings.
- **Phase 15 carry-forward verified intact:** Roving tabindex (D-15-KB-ACTIVATE), weight-1 edge reveal (D-15-VIS-EDGE), halo on selected (D-15-VIS-HALO), ARIA contract, sr-only fallback policy — all PASS.
- **Test posture:** 105/105 protected suites GREEN; 3 deliberately RED suites (SkillFilters / ExperienceCard / GameMode 3-of-14) are tracked for Plans 04/05/06 per `<verification>` block of this plan.

## Self-Check: PASSED

- File existence:
  - FOUND: `src/game/useConstellation.js`
  - FOUND: `src/game/renderers/SvgConstellation.js`
  - FOUND: `.planning/phases/16-filters-floating-experiencecard/16-03-SUMMARY.md`
- Commit existence:
  - FOUND: `fcc1d21` (Task 1)
  - FOUND: `00bdfbc` (Task 2)
- Test verification:
  - `npx vitest run src/game/useConstellation.test.js` → 23/23 PASS
  - `npx vitest run src/game/renderers/SvgConstellation.test.js` → 27/27 PASS
  - 105/105 protected suites PASS
- Grep acceptance criteria:
  - `grep -c "localStorage" src/game/useConstellation.js` → 0
  - `grep -c "justFilteredId" src/game/useConstellation.js` → 4
  - `grep -c "flashTimerRef" src/game/useConstellation.js` → 5
  - `grep -c "shouldDimNode" src/game/renderers/SvgConstellation.js` → 4
  - `grep -c "animate-chip-flash" src/game/renderers/SvgConstellation.js` → 2
  - Reduced-motion transition guard match count → 1

---
*Phase: 16-filters-floating-experiencecard*
*Completed: 2026-06-02*
