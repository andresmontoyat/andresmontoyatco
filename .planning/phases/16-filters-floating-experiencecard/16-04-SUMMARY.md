---
phase: 16-filters-floating-experiencecard
plan: 04
subsystem: ui
tags: [react, wai-aria, slider-multithumb, dual-thumb-slider, chip-filter, controlled-component, a11y, wcag-2.5.5]

# Dependency graph
requires:
  - phase: 16-filters-floating-experiencecard
    provides: filters.js pure selectors, tokens (chip/slider/cvCta), animations (card-fade-in, card-slide-up, chip-flash, etc.), t.game.* filter+card translation keys, scrollbar-hide utility (Plan 16-02 Wave 1)
  - phase: 16-filters-floating-experiencecard
    provides: SkillFilters.test.js RED baseline (Plan 16-01 Wave 0)
  - phase: 14-foundation-data-layer-viewmode-toggle-test-infra
    provides: SKILL_CATEGORIES map with bilingual labels + per-category color
  - phase: 15-accessible-constellation-seo-fallback
    provides: Phase 15 chip / focus-visible / 44px-touch / role=group / aria-pressed conventions (LangPill, ViewModeToggle)
provides:
  - SkillFilters component (controlled, props-driven, zero internal state)
  - Inline WAI-ARIA APG slider-multithumb YearRangeSlider (keyboard-only v1)
  - data-game-interactive root attribute (D-16-FLOW-CLOSE-EMPTY allow-list contributor)
  - Filter-bar layout: flex-wrap with mobile horizontal-scroll fallback (scrollbar-hide)
  - Reset button with native disabled + aria-disabled dual contract
affects: [16-03-useConstellation-renderer-extensions, 16-05-ExperienceCard, 16-06-GameMode-wiring, 17-WebGL-renderer]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WAI-ARIA APG slider-multithumb dual-thumb pattern (two role='slider' buttons with dependent aria-valuemin/max, ±1 opposite-thumb bound)"
    - "Inline pseudo-pad 44×44 touch target (before:absolute before:inset-[-14px] before:content-[''])"
    - "Controlled component contract: all state owned by parent, callbacks via props (mirrors SvgConstellation prop-driven design)"
    - "Shared chip-base className constant with active/inactive triple (mirrors LangPill / ViewModeToggle)"
    - "Inline sub-components (SkillChips, CategoryChips, ResetButton, YearRangeSlider) in single file under 280 LOC"
    - "data-game-interactive allow-list attribute for click-outside discrimination (D-16-FLOW-CLOSE-EMPTY)"

key-files:
  created:
    - src/game/SkillFilters.js
  modified: []

key-decisions:
  - "YearRangeSlider stayed inline in SkillFilters.js (file at 234 LOC, below the 280-LOC extraction threshold from RESEARCH.md §2)"
  - "preventDefault() fires on every handled keyboard key (Arrow/Home/End) including no-op moves at bounds — guarantees page does not scroll when slider thumb is focused"
  - "null yearRange prop is treated as 'render at full bounds' (slider always renders thumbs); parent (Plan 03 useConstellation) accepts both null and full-range as 'no filter' — keeps prop contract simple"
  - "Pointer drag deferred to v2 (RESEARCH.md §2 lines 511-519) — keyboard-only ships first; UAT may add pointer drag later if recruiter testing demands it"
  - "Mobile horizontal-scroll fallback for chip rows via `flex gap-2 overflow-x-auto scrollbar-hide md:flex-wrap md:overflow-visible` — desktop falls back to flex-wrap; mobile-specific top-toolbar positioning is GameMode's responsibility (Plan 06)"
  - "Category chip color uses inline `style={{ backgroundColor: cat.color }}` because category colors are DATA values (skills.js export), not Tailwind tokens — documented exception"

patterns-established:
  - "Dual-thumb slider widget: 2 role='slider' buttons with dependent aria-valuemin/max, ±1 from opposite thumb, keyboard-only handler with switch on e.key, preventDefault on every handled key"
  - "44×44 hit area via before-pseudo-pad inset-[-14px] while visual stays w-4 h-4"
  - "sr-only aria-live='polite' announcement region inside slider for screen-reader range updates"
  - "Inline sub-components in single file for tightly coupled UI surfaces (LOC budget 280)"

requirements-completed: [GAME-03]

# Metrics
duration: ~25 min
completed: 2026-06-02
---

# Phase 16 Plan 04: SkillFilters UI Bar + Dual-Thumb YearRangeSlider Summary

**Controlled filter bar with skill/category chips, WAI-ARIA APG dual-thumb year-range slider (keyboard-only v1), and dual-contract (native disabled + aria-disabled) reset button — 13/13 component tests GREEN.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-02T14:05:00Z
- **Completed:** 2026-06-02T14:21:42Z
- **Tasks:** 2
- **Files modified:** 1 (new)

## Accomplishments

- **SkillFilters controlled component** delivered as a single-file 234-LOC module with four inline sub-components: `SkillChips`, `CategoryChips`, `YearRangeSlider`, `ResetButton` — each consuming props from parent, zero internal filter state.
- **WAI-ARIA APG slider-multithumb pattern** implemented inline: two `<button role="slider">` elements with DEPENDENT `aria-valuemin`/`aria-valuemax` (Pitfall 4 guard — strict `start < end` via ±1 opposite-thumb bound), full keyboard contract (ArrowLeft/Right/Up/Down ±1 year, Home/End jumps), `e.preventDefault()` on every handled key (page-scroll guard), `sr-only aria-live="polite"` announcement region.
- **Reset button dual contract** — native `disabled` + `aria-disabled="true"` when no filter is active (D-16-FLAYOUT-RESET).
- **Click-outside allow-list** — root `data-game-interactive` attribute ensures the future ExperienceCard's click-outside listener (Plan 05) treats clicks on the filter bar as in-bounds.
- **WCAG 2.5.5 touch targets** — every interactive element ≥ 44×44px via shared `chipBase` className (`min-h-[44px] min-w-[44px]`); slider thumbs use `before:absolute before:inset-[-14px]` pseudo-pad to expand the 16×16 visual into a 44×44 hit area.
- **Bilingual via `t.game.*` only** — zero inline EN/ES literals; category chip labels resolve via `SKILL_CATEGORIES[k][lang]`.

## Task Commits

Each task was committed atomically:

1. **Task 1: SkillFilters chip clusters + reset button** — `954e074` (feat)
2. **Task 2: YearRangeSlider dual-thumb WAI-ARIA widget** — `45e0bc4` (feat)

Both commits live on branch `worktree-agent-a7ae0f54be79c89d0`.

## Files Created/Modified

- **Created:** `src/game/SkillFilters.js` (234 LOC) — controlled filter bar; default-exports `SkillFilters({ nodes, selectedSkills, yearRange, yearBounds, category, isFilterActive, onToggleSkill, onYearRangeChange, onCategoryChange, onReset, lang, t })`; inline sub-components `SkillChips`, `CategoryChips`, `YearRangeSlider`, `ResetButton`.

## SkillFilters Props Consumed (controlled-component contract)

| Prop                | Type                                | Source (Plan 03 useConstellation) | Usage                                                                |
| ------------------- | ----------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| `nodes`             | `Array<{id,label,category,count}>`  | `GRAPH_NODES` (data layer)        | Renders one skill chip per node                                      |
| `selectedSkills`    | `string[]`                          | `cons.selectedSkills`             | Determines `aria-pressed` on each skill chip                         |
| `yearRange`         | `[number, number] \| null`          | `cons.yearRange`                  | Slider value; `null` falls back to `yearBounds`                       |
| `yearBounds`        | `[number, number]`                  | `cons.yearBounds` (live-derived)  | Slider min/max anchors                                               |
| `category`          | `string \| null`                    | `cons.category`                   | Determines `aria-pressed` on each category chip                      |
| `isFilterActive`    | `boolean`                           | `cons.isFilterActive`             | Toggles native `disabled` + `aria-disabled` on Reset button          |
| `onToggleSkill`     | `(id: string) => void`              | `cons.toggleSkill`                | Skill chip click                                                     |
| `onYearRangeChange` | `(range: [number, number]) => void` | `cons.setYearRange`               | Slider thumb keyboard move                                           |
| `onCategoryChange`  | `(key: string \| null) => void`     | `cons.setCategory`                | Category chip click (passes `null` when re-clicking the active chip) |
| `onReset`           | `() => void`                        | `cons.resetFilters`               | Reset button click                                                   |
| `lang`              | `'en' \| 'es'`                      | `useLanguage()` in GameMode       | Resolves `SKILL_CATEGORIES[k][lang]`                                 |
| `t`                 | `translations[lang]`                | `useLanguage()` in GameMode       | All user-visible strings — never inline literals                     |

## YearRangeSlider Keyboard Map (WAI-ARIA APG slider-multithumb)

| Key                  | Effect on focused thumb                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `ArrowRight` / `ArrowUp`   | `aria-valuenow += 1`, clamped at dependent bound (start: `end - 1`; end: `yearMax`)                       |
| `ArrowLeft` / `ArrowDown`  | `aria-valuenow -= 1`, clamped at dependent bound (start: `yearMin`; end: `start + 1`)                     |
| `Home`               | Jump to `aria-valuemin` (start: `yearMin`; end: `start + 1`)                                              |
| `End`                | Jump to `aria-valuemax` (start: `end - 1`; end: `yearMax`)                                                |
| Any other key        | No-op (handler returns early without preventDefault)                                                      |

`e.preventDefault()` fires on every handled key, including no-op moves at bounds — guarantees the page never scrolls while a slider thumb is focused.

## Buttons Rendered for the Live Constellation

For the production catalog (`src/data/skills.js`, 26 skill nodes + 8 categories):

| Cluster              | Count                          | Notes                                                  |
| -------------------- | ------------------------------ | ------------------------------------------------------ |
| Skill chips          | 26 (one per `nodes` entry)      | All show `aria-pressed={selectedSkills.includes(id)}` |
| Category chips       | 8 (one per `SKILL_CATEGORIES`)  | `aria-pressed={category === key}`                      |
| YearRangeSlider thumbs | 2 (`role="slider"`)            | start + end, dependent ARIA bounds                     |
| Reset button         | 1                              | Native `disabled` + `aria-disabled` when no filter     |

**Total interactive elements: 37 buttons + 1 root role="group" wrapper.**

## Decisions Made

- **YearRangeSlider stays inline** in SkillFilters.js — file at 234 LOC, below the 280-LOC extraction threshold (RESEARCH.md §2). No separate `src/game/YearRangeSlider.js` needed.
- **Mobile responsive layout** delegated to GameMode (Plan 06) — this component renders `flex flex-wrap` with `overflow-x-auto md:flex-wrap` on chip rows. Mobile-specific top-toolbar positioning is GameMode's responsibility.
- **Pointer drag deferred to v2** per RESEARCH.md §2 lines 511-519 — keyboard-only ships first. UAT (Plan 16 close-out) will assess whether to add pointer drag in a future minor version.
- **Inline category color** via `style={{ backgroundColor: cat.color }}` is the documented data-exception (skills.js values are DATA, not Tailwind tokens) — same exception Phase 14 took for node fill colors in the constellation.
- **`null` yearRange = "render at full bounds"** — keeps the parent contract simple; useConstellation can later treat full-range-equals-bounds as "no filter active" without coupling that logic into the slider component.

## Deviations from Plan

None — plan executed exactly as written.

The plan explicitly anticipated:
- The 5 slider tests remain RED after Task 1 (placeholder slider) → confirmed and addressed by Task 2.
- ExperienceCard.test.js + GameMode.test.js (new Phase 16 tests) stay RED until Plans 05/06 → confirmed in regression run.
- useConstellation.test.js + SvgConstellation.test.js Phase 16 extensions stay RED until Plan 16-03 (Wave 2) → confirmed in regression run.

## Issues Encountered

None — the only complication was a momentary `git stash` of the Task 2 working tree during regression-verification, immediately recovered via `git stash pop`. No commits were lost; both task hashes (`954e074`, `45e0bc4`) remain on the branch.

## Verification Evidence

### Acceptance grep checks (all pass)

| Check                                                                       | Expected | Actual                                |
| --------------------------------------------------------------------------- | -------- | ------------------------------------- |
| `grep -c 'role="slider"' src/game/SkillFilters.js` (JSX attribute lines)     | 2        | 2 (lines 146 + 160; +2 comment lines) |
| `grep -cE 'aria-(valuemin\|valuemax\|valuenow\|valuetext)' SkillFilters.js`  | ≥8       | 10                                    |
| `grep -c 'data-game-interactive' SkillFilters.js`                            | ≥1       | 2 (header comment + JSX attribute)    |
| `grep -c 'localStorage' SkillFilters.js`                                     | 0        | 0                                     |
| `grep -cE 'onPointerDown\|setPointerCapture' SkillFilters.js`                | 0        | 0 (pointer drag deferred)             |
| `grep -cE "'Reset'\|'Limpiar'\|'Years'\|'Años'" SkillFilters.js`             | 0        | 0 (all copy via `t.game.*`)           |
| `grep -c '^[^/]*;$' SkillFilters.js`                                         | 0        | 0 (no-semi style)                     |
| `grep -E '(2007\|2026)' SkillFilters.js`                                     | 0        | 0 (bounds come from prop, not hardcoded) |
| `grep -E 'end - 1\|start + 1' SkillFilters.js` (dependent-bound math)        | ≥1       | 6                                      |
| `wc -l SkillFilters.js`                                                     | ≤280     | 234                                   |

### Test outcomes

- **`npx vitest run src/game/SkillFilters.test.js`** → **13 passed / 13 total**, including all 5 dual-thumb WAI-ARIA APG slider tests (ArrowRight increments, ArrowLeft floor no-op, Home jump, End jump, dependent valuemax cap).
- **`npx vitest run` (full suite)** → 147 passed / 20 failed (167 total). The 20 failures are all Plan 16-01 RED baseline tests waiting on later waves: useConstellation (Plan 03), SvgConstellation (Plan 03), ExperienceCard (Plan 05), GameMode (Plan 06) — exactly as documented in the plan's verification block.

### Build

- `npm run build` → **exit 0**, 601ms.
- `dist/assets/GameMode-D4rjTGYC.js` = **12.30 kB / 5.09 kB gz** (unchanged from Phase 15 baseline — SkillFilters.js is currently tree-shaken because nothing imports it yet; Plan 06 will wire it into GameMode at which point the chunk gains the component code).
- Total build artefacts: no new CSS, no new JS chunk for SkillFilters (correct — it's bundled into the lazy GameMode chunk once imported).

## Self-Check

- `[ -f src/game/SkillFilters.js ]` → FOUND
- `git log --oneline | grep 954e074` → FOUND (Task 1)
- `git log --oneline | grep 45e0bc4` → FOUND (Task 2)
- `.planning/phases/16-filters-floating-experiencecard/16-04-SUMMARY.md` will be FOUND after this commit

## Self-Check: PASSED

## Next Phase Readiness

- **Plan 16-03 (Wave 2)** can now consume the `toggleSkill` / `setYearRange` / `setCategory` / `resetFilters` callback names used by this component — useConstellation's hook signature is locked.
- **Plan 16-05 (Wave 4 — ExperienceCard)** can rely on `[data-game-interactive]` as the click-outside allow-list selector; this plan contributes one root element to that allow-list.
- **Plan 16-06 (Wave 5 — GameMode wiring)** is unblocked for the filter-bar import; SkillFilters takes 12 props from useConstellation and renders without context (no provider wrapping needed).
- **No blockers.** Inline LOC at 234 (under 280) — no extraction-to-separate-file follow-up required.

---
*Phase: 16-filters-floating-experiencecard*
*Completed: 2026-06-02*
