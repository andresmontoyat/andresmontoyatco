---
phase: 16-filters-floating-experiencecard
plan: 06
subsystem: orchestration
tags: [react, integration, wiring, bundle-budget, click-outside, a11y]

# Dependency graph
requires:
  - phase: 16-03
    provides: useConstellation filter-state surface (selectedSkills, yearRange, category, isFilterActive, yearBounds, highlightedSkillIds, justFilteredId, toggleSkill, setYearRange, setCategory, resetFilters)
  - phase: 16-04
    provides: SkillFilters controlled component (11-prop contract; root carries data-game-interactive)
  - phase: 16-05
    provides: ExperienceCard portal+focus-trap+click-outside (position prop, onClose, onToggleSkill)
  - phase: 15
    provides: GameMode Phase 15 skeleton — H1, ErrorBoundary, ConstellationFallback, SvgConstellation renderer slot, LAYOUT computeLayout at module scope, onSelectSkill toggle-off contract
  - phase: 14
    provides: buildConstellationGraph + computeLayout + EXPERIENCE/SKILLS data layer
provides:
  - GameMode orchestrator wiring filter bar + floating card alongside Phase 15 renderer
  - data-game-interactive on Nav <header> (Pitfall 6 fix — click-outside allow-list)
  - data-game-interactive on renderer-slot wrapper (BLOCKER 1 fix — SVG background safe-zone)
  - justFilteredId prop pass-through to SvgConstellation (BLOCKER 2 — chip-flash wire)
  - cardJobs derivation via composeFilters(EXPERIENCE, {skillIds, yearRange, category}) — D-16-INTERSECT-AND
  - position={LAYOUT[selectedSkillId]} for desktop node-anchored popover (SUGGESTION 8)
affects: [Phase-16-end-to-end-user-flow, Phase-17-WebGL-renderer-integration-point]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Orchestrator memoization (useMemo with [selectedSkillId, selectedSkills, yearRange, category] deps) for derived card-jobs intersection — Pitfall 7"
    - "data-game-interactive allow-list contract spans 3 surfaces: SkillFilters root, renderer-slot wrapper, Nav header"
    - "Idempotent onClose via cons.onSelectSkill(cons.selectedSkillId) — Phase 15 hook toggle-off contract; no separate clear-selection handler"
    - "Conditional dialog mount {cons.selectedSkillId !== null && <ExperienceCard ... />} — clean unmount on close; portal lifecycle handles body-overflow + listener cleanup"
    - "Programmatic bundle gate (node + zlib.gzipSync + glob) — three-band PASS/WARN/HARD-FAIL contract per WARNING 4"

key-files:
  created:
    - .planning/phases/16-filters-floating-experiencecard/16-06-SUMMARY.md
  modified:
    - src/game/GameMode.js (Phase 15 → Phase 16 — +57 lines: imports, cardJobs memo, SkillFilters JSX, ExperienceCard conditional, justFilteredId prop, data-game-interactive on slot, position prop)
    - src/game/GameMode.test.js (1 assertion fix — scope BLOCKER 1 swap heading lookup to dialog)
    - src/components/Nav.js (one-line attribute add to <header>)

key-decisions:
  - "Memoize cardJobs with useMemo([selectedSkillId, selectedSkills, yearRange, category]) — prevents recomputation when only theme/lang change; mirrors Pitfall 7 in plan"
  - "selectedSkills prop to ExperienceCard prepends [selectedSkillId, ...selectedSkills] — the LOCKED skill always shows as active+disabled in the tech-chip body (matches isLocked branch in ExperienceCard.js)"
  - "Use ?? null on LAYOUT lookup to defensively handle a node id missing from the layout map (current GRAPH has all 26 ids, but Phase 17 may add transient nodes)"
  - "Test-file fix in GameMode.test.js BLOCKER 1 swap assertion: change getByRole('heading', {level:2}) → scoped dialog.querySelector('#card-skill-heading'). The Phase 15 ConstellationFallback uses an sr-only h2 that the original test selector collided with — test was written before that h2 existed in the rendered tree"
  - "Renderer-slot wrapper retains all 4 existing attrs (data-testid, data-theme, data-prefers-reduced-motion, className); data-game-interactive is added as the 5th — no rearrangement"

patterns-established:
  - "Orchestrator wiring rule: parent computes derived state in useMemo, passes through to controlled children; child components stay pure (no internal filter state)"
  - "Click-outside allow-list spans every parent of the constellation interactive region: <header>, <SkillFilters root>, <renderer-slot wrapper>, <ExperienceCard dialog>. The implicit rule: any persistent surface a user might click while the card is open MUST carry data-game-interactive"
  - "Programmatic bundle gate via inline node script with three bands (PASS ≤14kB, WARN 14-16kB, HARD-FAIL >16kB) — vendor-neutral, no extra dependency"

requirements-completed: [GAME-03, GAME-04]

# Metrics
duration: ~10 min
completed: 2026-06-02
---

# Phase 16 Plan 06: GameMode Integration + Bundle Gate Summary

**Final wave wiring SkillFilters + ExperienceCard into GameMode — Phase 16 end-to-end user flow live; full Vitest suite 183/183 GREEN; GameMode lazy chunk 8.62 kB gz (PASS band).**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-06-02T10:45:00Z
- **Completed:** 2026-06-02T10:53:00Z
- **Tasks:** 2 (both atomic commits)
- **Files modified:** 3 (2 source + 1 test selector fix)
- **Build size:** GameMode chunk 25.56 kB raw / **8.62 kB gz** (well under 14 kB PASS band)

## Accomplishments

### Task 1 — Wire SkillFilters + ExperienceCard into GameMode (commit `11ef23c`)

- **Imports added:** `SkillFilters`, `ExperienceCard`, `composeFilters` (plus existing `SKILLS` reused for the composition argument).
- **cardJobs derivation** — `useMemo` over `[selectedSkillId, selectedSkills, yearRange, category]`, calling `composeFilters(EXPERIENCE, {skillIds: [selectedSkillId, ...selectedSkills.filter(s => s !== selectedSkillId)], yearRange, category}, SKILLS)`. This enforces D-16-INTERSECT-AND across the locked skill + filter set + year range + category.
- **`<SkillFilters />` insertion** — placed AFTER the H1 block and BEFORE the renderer-slot wrapper. All 11 props sourced from `cons.*`: nodes (GRAPH_NODES), selectedSkills, yearRange, yearBounds, category, isFilterActive, onToggleSkill, onYearRangeChange, onCategoryChange, onReset, lang, t.
- **Renderer-slot wrapper** gained `data-game-interactive` as its FIRST attribute (BLOCKER 1 fix). All four prior attributes (`data-testid`, `data-theme`, `data-prefers-reduced-motion`, className) preserved verbatim.
- **`<SvgConstellation />` gained `justFilteredId={cons.justFilteredId}`** (BLOCKER 2 — chip-flash wire-through from hook → renderer).
- **`<ExperienceCard />` conditional render** — `{cons.selectedSkillId !== null && selectedNode && <ExperienceCard ... />}`. Props: `selectedNode` (lookup in GRAPH_NODES), `jobs={cardJobs}`, `selectedSkills={[cons.selectedSkillId, ...cons.selectedSkills]}` (locked + secondary), `lang`, `t`, `onClose={() => cons.onSelectSkill(cons.selectedSkillId)}` (D-16-FLOW-CLOSE-EMPTY idempotent toggle), `onToggleSkill={cons.toggleSkill}`, `position={LAYOUT[cons.selectedSkillId] ?? null}` (SUGGESTION 8 node-anchored popover).
- **Phase 15 preserved verbatim** — ConstellationErrorBoundary, ConstellationFallback, H1 + sub-copy, theme/capabilities detection.

### Task 2 — Nav header attribute + bundle gate (commit `f3a208c`)

- **One-line edit** to `src/components/Nav.js` line 26: `data-game-interactive` attribute added before className on the `<header>` element. No other Nav change.
- **Bundle measured programmatically** via inline node + zlib + readdirSync (no `gzip-size-cli` install needed):
  - `dist/assets/GameMode-avtN7BLT.js`: **8823 bytes gz = 8.62 kB**
  - Verdict: **PASS** (≤ 14 kB)
  - Logged to `/tmp/wave5-bundle.log`
- **Build output** clean: no warnings, no failed chunks, all 14 lazy chunks shipped.
- **Full Vitest suite re-run:** 183/183 GREEN.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] BLOCKER 1 swap-card test assertion was over-broad**

- **Found during:** Task 1 verification (`npx vitest run src/game/GameMode.test.js`)
- **Issue:** Test line 147 used `screen.getByRole('heading', { level: 2 })` after the card swap. This selector collided with Phase 15's `ConstellationFallback` `<h2 id="constellation-fallback-heading">` (sr-only but still in the a11y tree), throwing `Found multiple elements with the role "heading"`. The card swap itself was working correctly (the second h2 contained "Docker").
- **Fix:** Scope the heading lookup to the dialog: replace the `getByRole` call with `screen.getByRole('dialog').querySelector('#card-skill-heading')`. The card's heading already carries the stable `id="card-skill-heading"` (Plan 05 ExperienceCard contract).
- **Files modified:** `src/game/GameMode.test.js` (lines 146-150 only)
- **Commit:** `11ef23c` (bundled with Task 1 wiring per atomic-test-and-impl convention)
- **Justification:** Test was authored in Plan 01 RED suite before Phase 15's `ConstellationFallback` sr-only h2 existed in the assembled tree. The implementation IS correct — Docker card renders on swap; only the assertion lookup was ambiguous. Rule 1 applies.

### Architectural / Decision Deviations

None.

### Auth Gates

None — no external services touched by this plan.

## Test Status

```
src/game/GameMode.test.js            14/14 ✓ (was 11 GREEN + 3 RED, now 14 GREEN)
src/game/SkillFilters.test.js        13/13 ✓
src/game/ExperienceCard.test.js      16/16 ✓
src/game/SvgConstellation.test.js     N/N ✓ (extended in 16-03; no regression)
src/game/useConstellation.test.js    23/23 ✓
src/game/filters.test.js              N/N ✓
src/game/ConstellationFallback.test.js 5/5 ✓
... (all 14 test files)
─────────────────────────────────────────────
Total: 183/183 GREEN
```

## Bundle Gate Detail

```
File:                                  dist/assets/GameMode-avtN7BLT.js
Raw size:                              25.56 kB
Gzip size:                             8823 bytes = 8.62 kB
Gate (WARNING 4):
  PASS  ≤ 14 kB gz   ← ACTIVE BAND
  WARN  14-16 kB gz
  HARD FAIL > 16 kB gz
```

Phase 15 baseline was ~5.09 kB; Phase 16 add (`filters.js` selectors + extended `useConstellation` + `SkillFilters` + `ExperienceCard` + tokens + wire-up) totaled ~3.5 kB. Comfortable budget headroom for Phase 17 WebGL adapter.

## End-to-End User Flow (now testable)

All 6 Phase 16 acceptance criteria from `16-CONTEXT.md` are now end-to-end testable in the browser:

1. **Filter bar visible** below the H1 (chip clusters, year slider, category chips, Reset).
2. **Click skill chip** → constellation dims non-matching nodes (highlightedSkillIds derived via composeFilters).
3. **Year slider** → keyboard ArrowRight/Left adjusts yearRange; nodes outside range dim.
4. **Category chip** → category nodes brighten via highlightedSkillIds.
5. **Reset** → clears all filters; constellation returns to full visibility.
6. **Node click** → ExperienceCard portal opens with role=dialog, jobs intersected via composeFilters, position anchored to node on desktop, bottom-sheet on mobile. Tech-chip click adds to filter (intersection); chip-flash trigger fires; CV CTA downloads per-lang `.docx`; Esc/click-outside close (Nav theme/lang toggle preserved as in-bounds).

## Files Touched

| File | Lines changed | Purpose |
|---|---|---|
| `src/game/GameMode.js` | +57 / -2 | Wire SkillFilters + ExperienceCard; cardJobs memo; justFilteredId + position + data-game-interactive |
| `src/game/GameMode.test.js` | +5 / -3 | Scope BLOCKER 1 swap assertion to dialog (Rule 1 fix) |
| `src/components/Nav.js` | +1 / -1 | Add data-game-interactive to <header> |

## Self-Check: PASSED

- File `src/game/GameMode.js` present with all imports + JSX changes (verified via `rg`).
- File `src/components/Nav.js` carries exactly 1 `data-game-interactive` occurrence on the `<header>`.
- File `src/game/GameMode.test.js` carries the scoped dialog query.
- Commit `11ef23c` present in git log (`feat(16-06): wire SkillFilters + ExperienceCard into GameMode`).
- Commit `f3a208c` present in git log (`feat(16-06): add data-game-interactive to Nav header + finalize bundle`).
- `dist/assets/GameMode-avtN7BLT.js` exists; gz size 8823 bytes; logged to `/tmp/wave5-bundle.log`.
- Full Vitest suite 183/183 GREEN at commit `f3a208c`.
- `grep -c "localStorage" src/game/GameMode.js` returns 0 (D-16-PERSIST-MEMORY honored).
