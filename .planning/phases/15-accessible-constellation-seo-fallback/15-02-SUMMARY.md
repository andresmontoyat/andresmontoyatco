---
phase: 15-accessible-constellation-seo-fallback
plan: 02
subsystem: ui
tags: [react, svg, tailwind, animation, reduced-motion, accessibility, tdd, vitest, game-mode, constellation]

# Dependency graph
requires:
  - phase: 15-accessible-constellation-seo-fallback/15-01
    provides: GameMode orchestrator with renderer-slot (data-testid="renderer-slot"), ConstellationErrorBoundary, ConstellationFallback (sr-only), 7 game.* translation keys, App.js lazy mount
  - phase: 14-foundation-data-layer-viewmode-toggle-test-infra
    provides: buildConstellationGraph, computeLayout, SKILL_CATEGORIES, experience.js (EXPERIENCE 12 entries), Vitest+RTL test infra
provides:
  - SvgConstellation renderer (locked props contract) — pure SVG renderer with sqrt-count node sizing, weight-gated edges, category colors, light-mode AA strokes, reveal animation (motion-safe), halo on selectedSkillId, reduced-motion guards (Pitfalls 1+3+4+5)
  - useConstellation hook (selection/hover/Phase16 placeholders) — selectedSkillId toggle, hoveredSkillId, highlightedSkillIds=[], yearRange=null
  - constellation CSS tokens (5 vars × 2 themes) — edge, edgeHeavy, halo, hintPillBg, hintPillText in :root (dark) and [data-theme="light"]
  - 3 keyframes (nodeReveal, edgeReveal, hintFadeOut) + 3 animation utilities in tailwind.config.js
  - GameMode wiring (renderer + capability detection) — SvgConstellation replaces renderer-placeholder, detectCapabilities runs once on mount, data-prefers-reduced-motion exposed on renderer-slot div
affects:
  - 15-accessible-constellation-seo-fallback/15-03 (Slice 3: adds role="application" wrapper, per-node role="button" with roving tabindex, spatial arrow nav, Enter/Space/Esc, aria-live announcements ON TOP of existing renderer; renderer contract unchanged)
  - 15-accessible-constellation-seo-fallback/15-04 (Phase 16 filter UI wires highlightedSkillIds + yearRange from useConstellation)
  - 15-accessible-constellation-seo-fallback/15-05 (Phase 17 WebGL adapter plugs into same props contract; detectCapabilities branch point already in GameMode)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SVG constellation renderer with pure props contract (no hooks inside renderer; all state lifted to useConstellation in GameMode)
    - usePrefersReducedMotion hook (Josh Comeau pattern, SSR-safe, reactive to OS change) — defined inline in SvgConstellation.js
    - Pitfall 1 guard: transformBox=fill-box + transformOrigin=center on each node <g> to prevent SVG scale from wrong origin
    - Pitfall 3 guard: animationDelay conditionally set to 0ms under reduced-motion (global CSS rule doesn't suppress delays)
    - Pitfall 4 guard: selectedSkillId !== null check before applying 0.35 fillOpacity (no pre-selection dimming)
    - Pitfall 5 guard: opacity-only edge reveal (NOT stroke-dashoffset which requires pathLength normalization for % values in SVG)
    - WCAG AA light-theme strokes: LIGHT_THEME_STROKES map applies darker shade ring (1.5px strokeWidth) on failing/borderline categories
    - detectCapabilities function at file scope with typeof window guard — runs once on mount via useState initializer

key-files:
  created:
    - src/game/renderers/SvgConstellation.js
    - src/game/renderers/SvgConstellation.test.js
    - src/game/useConstellation.js
    - src/game/useConstellation.test.js
  modified:
    - src/game/GameMode.js
    - src/game/GameMode.test.js
    - src/index.css
    - tailwind.config.js

key-decisions:
  - "SKILL_CATEGORY_COLORS not exported from skills.js: used node.color from buildConstellationGraph output (already embedded per Phase 14) — no need to import SKILL_CATEGORY_COLORS directly"
  - "translations.js default export (not named): test file fixed from { translations } to default import"
  - "matchMedia mock for usePrefersReducedMotion: default beforeEach mock uses no-preference=true (motion-safe path) so halo tests work; reduced-motion tests override per-test"
  - "nodes param in useConstellation: intentionally unused (Phase 16 will use it for filters) — eslint-disable-next-line no-unused-vars added as documented placeholder"
  - "skillCount source: now uses GRAPH_NODES.length (26) from buildConstellationGraph, replacing Object.keys(SKILLS).length (26) from Slice 1 — both yield 26; graph-derived is more accurate for display"

patterns-established:
  - "Pure renderer pattern: SvgConstellation accepts all state as props, no hook calls except usePrefersReducedMotion (capability detection); state lifted to useConstellation in GameMode"
  - "Renderer contract lock: { nodes, edges, layout, highlightedSkillIds, selectedSkillId, yearRange, theme, lang, t, onSelectSkill, onHoverSkill } — Phase 17 WebGL adapter uses same surface"
  - "Constellation tokens: CSS vars in :root + [data-theme='light'] + mapped to tailwind.config.js constellation.* and hintPill.* color tokens"

requirements-completed:
  - GAME-01
  - GAME-02

# Metrics
duration: 68min
completed: 2026-06-02
---

# Phase 15 Plan 02: MVP Slice 2 — SvgConstellation Renderer + Tokens Summary

**SVG constellation renderer with sqrt-count node sizing, opacity-fade reveal animation, WCAG AA light-mode strokes, and capability-detected GameMode wiring — 93 Vitest tests passing, build clean**

## Performance

- **Duration:** ~68 min
- **Started:** 2026-06-02T02:01:00Z
- **Completed:** 2026-06-02T03:09:51Z
- **Tasks:** 4 (7 commits: 1 chore + 2 RED + 2 GREEN + 1 RED + 1 GREEN)
- **Files modified:** 8

## Accomplishments

- `SvgConstellation.js` renders 26 category-colored nodes with sqrt(count) radius scaling, weight-gated edges (opacity:0 for weight=1, visible for weight≥2), stagger-reveal animation (motion-safe only), WCAG AA strokes on light theme for 8 categories, and drop-shadow halo on selectedSkillId (skipped under reduced-motion)
- `useConstellation.js` hook holds selection/hover state with toggle-on-reclick behavior; Phase 16 filter placeholders (highlightedSkillIds=[], yearRange=null) ready for wiring
- GameMode wired: SvgConstellation replaces the Slice 1 renderer-placeholder; detectCapabilities runs once on mount; data-prefers-reduced-motion exposed on renderer-slot div for Slice 3's hint-pill decision
- 5 new CSS custom properties added to :root (dark) and [data-theme="light"] (light); 3 keyframes (nodeReveal, edgeReveal, hintFadeOut) + animations in tailwind.config.js; verified in emitted CSS
- All 4 pitfall guards implemented: transformBox/transformOrigin (Pitfall 1), animationDelay null on reduced-motion (Pitfall 3), selectedSkillId !== null pre-dim guard (Pitfall 4), opacity-only edge reveal not stroke-dashoffset (Pitfall 5)

## Task Commits

1. **Task 1: constellation tokens + keyframes** - `483de6a` (chore)
2. **Task 2 RED: useConstellation failing tests** - `5d08f85` (test)
3. **Task 2 GREEN: useConstellation hook** - `d74dba7` (feat)
4. **Task 3 RED: SvgConstellation failing tests** - `d0e2960` (test)
5. **Task 3 GREEN: SvgConstellation renderer** - `382f1aa` (feat)
6. **Task 4 RED: GameMode wiring tests** - `6bbece4` (test)
7. **Task 4 GREEN: GameMode wiring** - `00c4ed2` (feat)

## Files Created/Modified

- `src/game/renderers/SvgConstellation.js` — Pure SVG renderer; locked props contract; sqrt-count sizing; LIGHT_THEME_STROKES; edgeStrokeWidth; usePrefersReducedMotion inline; Pitfalls 1/3/4/5 guards
- `src/game/renderers/SvgConstellation.test.js` — 10 tests: nodes/edges render, weight-1 hidden, empty state, reduced-motion animation skip, light-theme stroke, sqrt radius growth, no pre-selection dim, halo on selected, no halo under reduced-motion
- `src/game/useConstellation.js` — Hook: selectedSkillId (toggle), hoveredSkillId, highlightedSkillIds=[], yearRange=null; useCallback + useMemo
- `src/game/useConstellation.test.js` — 10 tests: init state, set/toggle/replace selection, hover update/clear, memoization
- `src/game/GameMode.js` — Added imports (computeLayout, useConstellation, SvgConstellation); refactored to single buildConstellationGraph call; added detectCapabilities; wired renderer; removed renderer-placeholder
- `src/game/GameMode.test.js` — 4 new tests: SVG in renderer-slot, 26 nodes, dark-theme no-arch-stroke, ConstellationFallback still present
- `src/index.css` — 5 CSS vars in :root (dark defaults) + 5 overrides in [data-theme="light"]
- `tailwind.config.js` — nodeReveal/edgeReveal/hintFadeOut keyframes + animation utilities + constellation/hintPill color tokens

## Decisions Made

- **node.color from graph vs SKILL_CATEGORY_COLORS import:** `SKILL_CATEGORY_COLORS` is not exported from `skills.js`; `buildConstellationGraph` embeds it in each node as `node.color` (Phase 14 decision). Used `node.color` directly — cleaner and no new import needed.
- **translations default import in test:** `translations.js` uses `export default translations` (not named). Fixed from `{ translations }` to default import in SvgConstellation.test.js.
- **matchMedia mock direction:** The `usePrefersReducedMotion` hook queries `(prefers-reduced-motion: no-preference)` — default mock returns `matches: false` for this, meaning `!false = true` = reduced motion active. Fixed `beforeEach` to return `matches: true` for no-preference query by default (motion-safe path), with `makeMockMatchMedia(true)` helper for reduced-motion tests.
- **nodes param lint:** `nodes` parameter in `useConstellation` is unused in Phase 15 (Phase 16 will use for filter derivation). Added `eslint-disable-next-line no-unused-vars` with documentation comment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SKILL_CATEGORY_COLORS not exported from skills.js**
- **Found during:** Task 3 GREEN (SvgConstellation implementation)
- **Issue:** Plan action says `import { SKILL_CATEGORY_COLORS } from '../../data/skills'` but this constant is not exported — only `SKILL_CATEGORIES`, `SKILLS`, and `resolveCanonical` are exported
- **Fix:** Used `node.color` directly (already embedded by `buildConstellationGraph` from Phase 14). Added `LIGHT_THEME_STROKES` const at module level for the 1.5px AA ring strokes.
- **Files modified:** src/game/renderers/SvgConstellation.js
- **Committed in:** 382f1aa

**2. [Rule 1 - Bug] translations.js is a default export, not named export**
- **Found during:** Task 3 RED (SvgConstellation.test.js creation)
- **Issue:** Plan code example uses `import { translations }` but translations.js has `export default translations`
- **Fix:** Changed to `import translations from '../../i18n/translations.js'` in test file
- **Files modified:** src/game/renderers/SvgConstellation.test.js
- **Committed in:** 382f1aa

**3. [Rule 1 - Bug] matchMedia mock direction for usePrefersReducedMotion**
- **Found during:** Task 3 GREEN (test run — halo test failing)
- **Issue:** Default `beforeEach` mock returned `matches: false` for ALL queries. The hook queries `(prefers-reduced-motion: no-preference)` and interprets `!matches` = `!false = true` as "reduced motion = ON". Tests needing motion-safe path (halo) were running as if reduced-motion was active.
- **Fix:** Added `makeMockMatchMedia(prefersReducedMotion)` helper that returns `matches: !prefersReducedMotion` for the no-preference query. Default `beforeEach` uses `makeMockMatchMedia(false)` (motion-safe); reduced-motion tests use `makeMockMatchMedia(true)`.
- **Files modified:** src/game/renderers/SvgConstellation.test.js
- **Committed in:** 382f1aa

**4. [Rule 1 - Bug] key-spacing ESLint error in LIGHT_THEME_STROKES and SIZING constants**
- **Found during:** Task 3 GREEN (npm run lint)
- **Issue:** Aligned colons with extra spaces triggered `key-spacing` ESLint rule
- **Fix:** Removed alignment spaces, used single space after colon per airbnb style
- **Files modified:** src/game/renderers/SvgConstellation.js
- **Committed in:** 382f1aa

**5. [Rule 1 - Bug] dot-notation error in SvgConstellation test**
- **Found during:** Task 3 GREEN (npm run lint)
- **Issue:** `circlesByNodeId['Java']` and `circlesByNodeId['AWS']` triggered `dot-notation` rule
- **Fix:** Changed to `circlesByNodeId.Java` and `circlesByNodeId.AWS`
- **Files modified:** src/game/renderers/SvgConstellation.test.js
- **Committed in:** 382f1aa

---

**Total deviations:** 5 auto-fixed (all Rule 1 — import/export/mock/lint correctness)
**Impact on plan:** All fixes were API surface or lint corrections; no behavior changed from plan spec. No scope creep.

## Issues Encountered

- jsdom does not implement `HTMLCanvasElement.prototype.getContext` — logs "Not implemented" during tests when `detectCapabilities` calls `canvas.getContext('webgl')`. This is expected jsdom behavior; the try/catch in `detectCapabilities` handles it gracefully (`hasWebGL = false`). Tests pass. This is not a production issue.
- skillCount in GameMode.js was changed from `Object.keys(SKILLS).length` (Slice 1 approach) to `GRAPH_NODES.length` (Slice 2 approach) since `buildConstellationGraph` is now called at module level for the renderer. Both yield 26 today. The H1 derivation test (`yearsActive=19, skillCount=26`) continues to pass.

## Known Stubs

None — renderer is fully functional for the Slice 2 scope. Phase 16 placeholders (`highlightedSkillIds=[]`, `yearRange=null`) are intentional and documented with `// Phase 16` comments.

## Threat Flags

No new threat surface introduced beyond the plan's threat model:
- T-15-02-CSP: inline `style={{ filter: 'drop-shadow(...)' }}` on halo circles requires `style-src 'unsafe-inline'` if strict CSP is added later. Deferred per plan's `accept` disposition.
- T-15-02-I: capability detection reads `navigator.connection.saveData` and canvas WebGL context — not transmitted off-device, no new disclosure surface.

## Next Phase Readiness

- Slice 3 layers `role="application"` wrapper + per-node `<g role="button">` with roving tabindex + spatial arrow nav + Enter/Space/Esc + aria-live announcements ON TOP of the existing renderer. The renderer contract does NOT change; Slice 3 enriches the `<g>` elements with interaction attrs and the SVG container with the application wrapper.
- `data-prefers-reduced-motion` attribute on the renderer-slot div is available for Slice 3's hint-pill vs pulse decision
- Phase 16 filter UI wires `highlightedSkillIds` and `yearRange` into `useConstellation` — the hook shape does not change
- Phase 17 WebGL adapter plugs into the same props contract; `detectCapabilities.hasWebGL` branch point is already in GameMode (with `// Phase 17` comment)

## Self-Check

- [x] `src/game/renderers/SvgConstellation.js` exists
- [x] `src/game/useConstellation.js` exists
- [x] `src/game/GameMode.js` imports SvgConstellation, useConstellation, computeLayout
- [x] `renderer-placeholder` removed from GameMode.js
- [x] 93 tests passing (69 baseline + 10 useConstellation + 10 SvgConstellation + 4 GameMode)
- [x] npm run build exits 0
- [x] constellation tokens in emitted CSS confirmed

## Self-Check: PASSED

---
*Phase: 15-accessible-constellation-seo-fallback*
*Completed: 2026-06-02*
