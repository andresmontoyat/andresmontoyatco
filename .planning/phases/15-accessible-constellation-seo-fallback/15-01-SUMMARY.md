---
phase: 15-accessible-constellation-seo-fallback
plan: 01
subsystem: ui
tags: [react, tailwind, i18n, sr-only, error-boundary, lazy-load, seo, accessibility, tdd, vitest]

# Dependency graph
requires:
  - phase: 14-foundation-data-layer-viewmode-toggle-test-infra
    provides: constellation.graph.js (buildConstellationGraph, CURRENT_YEAR), skills.js (SKILLS, SKILL_CATEGORIES), experience.js (EXPERIENCE 12 entries), ViewModeContext, Vitest+RTL test infra
provides:
  - GameMode orchestrator with derived H1 (yearsActive=19, skillCount=26 from live data)
  - ConstellationFallback (active-lang sr-only semantic experience list, always DOM-present)
  - game.* translation keys (constellationLabel, constellationRoleDesc, subCopy, fallbackHeading, h1Years, h1Skills, h1Tagline) in EN + ES
  - App.js lazy mount of GameMode at viewMode='game' branch (React.lazy + Suspense)
  - ConstellationErrorBoundary class component wrapping renderer slot
affects:
  - 15-accessible-constellation-seo-fallback/15-02 (Slice 2: SvgConstellation plugs into data-testid="renderer-slot" inside ConstellationErrorBoundary)
  - 15-accessible-constellation-seo-fallback/15-03 (Slice 3: roving tabindex, aria-live region, keyboard interaction)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - React class ErrorBoundary (ConstellationErrorBoundary) — first ErrorBoundary in the codebase; wraps renderer slot only; fallback renders outside boundary
    - Module-level live derivation — yearsActive and skillCount exported as named constants derived at module load from EXPERIENCE + SKILLS (never hardcoded)
    - sr-only semantic fallback outside ErrorBoundary — ConstellationFallback is a sibling of the renderer slot, not a child, so it survives renderer crashes
    - React.lazy + Suspense for game route — GameMode lazy-loaded to keep initial JS bundle lean (Lighthouse gate)

key-files:
  created:
    - src/game/GameMode.js
    - src/game/GameMode.test.js
    - src/game/ConstellationFallback.js
    - src/game/ConstellationFallback.test.js
  modified:
    - src/i18n/translations.js
    - src/App.js

key-decisions:
  - "skillCount source: Object.keys(SKILLS).length (canonical SKILLS catalog, not graph node count) per D-15-LAND-COPY — ensures future orphan skills still count"
  - "ConstellationFallback outside ErrorBoundary: fallback is sibling of renderer slot so sr-only content survives any renderer crash"
  - "yearsActive derivation: max(period.end ?? CURRENT_YEAR) - min(period.start) = 2026 - 2007 = 19"
  - "Slice 1 renderer slot placeholder: <p data-testid=renderer-placeholder> inside ConstellationErrorBoundary; Slice 2 replaces body only"

patterns-established:
  - "React ErrorBoundary pattern: class component with getDerivedStateFromError + props.fallback render"
  - "Module-level derivation exports: export const yearsActive, export const skillCount alongside default export for testability"
  - "sr-only fallback placement: ALWAYS outside ErrorBoundary as last child of orchestrator section"

requirements-completed:
  - GAME-01
  - GAME-06

# Metrics
duration: 12min
completed: 2026-06-01
---

# Phase 15 Plan 01: MVP Slice 1 — GameMode Orchestrator + SEO Fallback Summary

**GameMode orchestrator with bilingual live-derived H1 (19 years / 26 skills), sr-only full career fallback for ATS/SR, and ErrorBoundary renderer slot — Slice 1 vertical shippable without SVG**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-01T21:52:00Z
- **Completed:** 2026-06-01T22:04:00Z
- **Tasks:** 3 (6 commits: 2 RED + 2 GREEN + 1 feat + 1 feat)
- **Files modified:** 6

## Accomplishments

- Established GameMode orchestrator (src/game/GameMode.js) with bilingual H1 driven by live-derived yearsActive=19 and skillCount=26 — never hardcoded
- ConstellationFallback renders all 12 career entries (title, company, date, location, bullets, tech) in active language as sr-only DOM content, always present regardless of renderer state
- ErrorBoundary (ConstellationErrorBoundary) wraps only the renderer slot placeholder; ConstellationFallback is intentionally a sibling so it survives any renderer crash in Slice 2/3
- App.js game branch replaced: lazy React.lazy + Suspense mount of GameMode (separate GameMode-*.js chunk confirmed in build output)
- 7 new game.* translation keys (EN + ES): constellationLabel, constellationRoleDesc, subCopy, fallbackHeading, h1Years, h1Skills, h1Tagline — all 4 existing keys preserved
- 69 Vitest tests passing (58 Phase 14 baseline + 5 ConstellationFallback + 6 GameMode); npm run build exits 0

## Task Commits

Each task was committed atomically (TDD: RED then GREEN):

1. **Task 1 RED: failing ConstellationFallback tests** - `d73308f` (test)
2. **Task 1 GREEN: ConstellationFallback + 7 translation keys** - `dbd9cce` (feat)
3. **Task 2 RED: failing GameMode orchestrator tests** - `3c878ad` (test)
4. **Task 2 GREEN: GameMode orchestrator implementation** - `38fa2af` (feat)
5. **Task 3: replace App.js game branch with lazy GameMode** - `63518b3` (feat)

_Note: TDD tasks have explicit RED→GREEN commits per plan requirement_

## Files Created/Modified

- `src/game/ConstellationFallback.js` — Pure functional component: sr-only section with h2 heading, ordered list of 12 experience entries (title, date, location, bullets, tech) in active language. Props: `{ experiences, lang, t }`. Returns null when experiences is null.
- `src/game/ConstellationFallback.test.js` — 5 tests: EN/ES heading, 12-entry count, ES bullet rendering, null guard
- `src/game/GameMode.js` — Orchestrator: module-level yearsActive/skillCount derivations (named exports), ConstellationErrorBoundary class, GameMode functional component with H1 + sub-copy + renderer slot placeholder + ConstellationFallback outside boundary
- `src/game/GameMode.test.js` — 6 tests: pure derivation assertions (yearsActive=19, skillCount=26), rendered H1 in EN/ES, ConstellationFallback presence, renderer-slot testid
- `src/i18n/translations.js` — 7 new keys added to en.game and es.game blocks (existing 4 keys preserved)
- `src/App.js` — Added `const GameMode = React.lazy(...)` import; replaced game branch placeholder section with `<Suspense fallback={SectionFallback}><GameMode /></Suspense>`; removed unused `const { t } = useLanguage()` from MainContent

## Decisions Made

- **skillCount derivation source:** `Object.keys(SKILLS).length` (D-15-LAND-COPY mandate). The plan action said `__graphNodes.length` but behavior and CONTEXT both mandate SKILLS catalog count. Both yield 26 today; divergence possible if a future skill exists in SKILLS with no experience.tech reference — canonical count wins.
- **ConstellationFallback outside ErrorBoundary:** Sibling of renderer-slot div (not child of ConstellationErrorBoundary) so sr-only content is DOM-present even when the error boundary is in error state.
- **Removed unused `const { t }` from MainContent:** After game branch replacement, `t` was only used by `t.game.loadingTitle`/`t.game.loadingBody` which were removed. SkipLink still uses `useLanguage()` separately.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Operator-linebreak lint error in multi-line math expression**
- **Found during:** Task 2 (GameMode.js GREEN — npm run lint)
- **Issue:** `export const yearsActive = Math.max(...) - Math.min(...)` across 2 lines triggered airbnb `operator-linebreak` error
- **Fix:** Extracted to `const maxYear` and `const minYear` intermediate constants, then `export const yearsActive = maxYear - minYear` (single line)
- **Files modified:** src/game/GameMode.js
- **Committed in:** 38fa2af

**2. [Rule 1 - Bug] react/destructuring-assignment in ErrorBoundary render method**
- **Found during:** Task 2 (GameMode.js GREEN — npm run lint)
- **Issue:** `this.state.hasError` and `this.props.fallback`/`this.props.children` inline access triggers airbnb destructuring rule
- **Fix:** Added `const { hasError } = this.state` and `const { fallback, children } = this.props` at top of render()
- **Files modified:** src/game/GameMode.js
- **Committed in:** 38fa2af

**3. [Rule 1 - Bug] Missing React import in test files caused react/react-in-jsx-scope lint error**
- **Found during:** Task 2 (lint check)
- **Issue:** ConstellationFallback.test.js and GameMode.test.js used JSX without `import React from 'react'`
- **Fix:** Added React import to both test files
- **Files modified:** src/game/ConstellationFallback.test.js, src/game/GameMode.test.js
- **Committed in:** 38fa2af

**4. [Rule 1 - Bug] Unused imports in GameMode.test.js**
- **Found during:** Task 2 (lint check)
- **Issue:** `EXPERIENCE`, `SKILLS`, `CURRENT_YEAR` imported in test file but the plan's derivation tests were written as pure assertions on the exported named constants (not raw re-derivation). The imports were unused.
- **Fix:** Removed the 3 unused imports from GameMode.test.js
- **Files modified:** src/game/GameMode.test.js
- **Committed in:** 38fa2af

---

**Total deviations:** 4 auto-fixed (all Rule 1 - code correctness/lint)
**Impact on plan:** All fixes were lint compliance corrections; no behavior changed. No scope creep.

## Issues Encountered

- Baseline test count was 58 (not 57 as stated in plan). Plan says "57 (Phase 14 baseline) + 5 + 6 = 68". Actual: 58 + 5 + 6 = 69. The discrepancy is a Phase 14 test count update not reflected in plan docs. All tests pass.

## Known Stubs

- `data-testid="renderer-placeholder"` (`<p>` with `t.game.empty`) inside `data-testid="renderer-slot"` is an intentional Slice 1 placeholder. Slice 2 replaces this `<p>` body with `<SvgConstellation />`. The wrapper `<div data-testid="renderer-slot">` and `<ConstellationErrorBoundary>` MUST remain in place.

## Threat Flags

No new threat surface introduced beyond the plan's threat model. T-15-01-S (ATS cloaking) mitigated by active-lang-only rendering. T-15-01-XSS mitigated by React text escaping (no dangerouslySetInnerHTML in new code).

## Next Phase Readiness

- Slice 2 (SvgConstellation renderer) has a stable mount point: `data-testid="renderer-slot"` inside `<ConstellationErrorBoundary fallback={...}>`. Slice 2 replaces the placeholder `<p>` body with `<SvgConstellation />`.
- ConstellationFallback is sibling of slot and must stay outside the boundary — do not move it.
- yearsActive and skillCount are named exports from GameMode.js, importable by any future test or component.
- All 69 tests green; build passes with separate GameMode chunk; lint clean for new files.

---
*Phase: 15-accessible-constellation-seo-fallback*
*Completed: 2026-06-01*
