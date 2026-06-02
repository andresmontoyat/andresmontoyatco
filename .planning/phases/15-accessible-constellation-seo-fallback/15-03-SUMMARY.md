---
phase: 15-accessible-constellation-seo-fallback
plan: "03"
subsystem: ui
tags: [game-mode, a11y, keyboard, roving-tabindex, role-application, aria-live, spatial-nav, hint-pill, react, svg, vitest]

requires:
  - phase: 15-accessible-constellation-seo-fallback-01
    provides: ConstellationFallback sr-only, game.constellationLabel/constellationRoleDesc translations
  - phase: 15-accessible-constellation-seo-fallback-02
    provides: SvgConstellation pure renderer, useConstellation hook, onSelectSkill/onHoverSkill contract
  - phase: 14-foundation-data-layer-viewmode-toggle-test-infra
    provides: SKILL_CATEGORIES, SKILL_CATEGORY_COLORS, buildConstellationGraph, computeLayout

provides:
  - spatialNav.findNextNode (pure helper — dot-product half-plane + Euclidean min + wrap fallback)
  - role=application interaction wrapper around SvgConstellation SVG
  - roving tabindex on per-node <g role="button"> (single Tab stop, arrow traversal inside)
  - spatial arrow navigation (ArrowRight/Left/Up/Down via findNextNode)
  - Enter/Space activate focused node (call onSelectSkill(rovingNodeId))
  - Esc clear via toggle-off (onSelectSkill(selectedSkillId)) + restores focus to wrapper
  - bilingual per-node aria-label via buildNodeLabel (SKILL_CATEGORIES + t.game.nodeUsedIn)
  - aria-live polite status region (role=status) announces selection/deselection
  - focus ring <circle stroke="var(--color-brand)"> on focused node
  - pulse <circle class="motion-safe:animate-pulse2"> on biggest node until first interaction
  - hint pill <p> under reduced-motion until first interaction
  - 6 new game.* translation keys (hintPill, skillSelected, selectionCleared, nodeJobSingular, nodeJobPlural, nodeUsedIn)

affects:
  - phase-16-filters-experience-card (consumes selectedSkillId from same onSelectSkill contract; no renderer changes needed)
  - phase-17-webgl-renderer-lighthouse (WebGL adapter plugs same props contract; a11y layer stays in SvgConstellation)

tech-stack:
  added: []
  patterns:
    - spatialNav pure helper (no React deps) — dot-product half-plane filter + Euclidean min distance
    - roving tabindex via nodeRefs useRef map + setTimeout(0).focus() for reliable SVG focus
    - role=application wrapper with eslint-disable for jsx-a11y false positives
    - aria-live via useEffect on selectedSkillId with t.game.skillSelected template substitution
    - hasInteracted flag gates pulse/hint — flips on first click/hover/focus

key-files:
  created:
    - src/game/spatialNav.js
    - src/game/spatialNav.test.js
  modified:
    - src/game/renderers/SvgConstellation.js
    - src/game/renderers/SvgConstellation.test.js
    - src/i18n/translations.js

key-decisions:
  - "Esc uses toggle-off pattern: onSelectSkill(selectedSkillId) instead of onSelectSkill(null) — preserves Slice 2 hook contract without modification"
  - "findNextNode returns currentId (not throws) for all edge cases: unknown direction, empty nodes, missing layout — safe to call unconditionally from handleKeyDown"
  - "eslint-disable block for jsx-a11y/no-noninteractive-element-interactions + jsx-a11y/no-noninteractive-tabindex on role=application div — false positive, correct WAI-ARIA APG pattern"
  - "Pulse on biggest node uses node.color (SKILL_CATEGORY_COLORS) not CSS var — data value exception per Phase 14 convention"
  - "spatialNav.test.js has 11 tests (10 findNextNode + 1 ARROW_VECTORS), resulting in 116 total (not 114 projected) — all passing"

patterns-established:
  - "spatialNav.js: pure function, no React imports, no JSX — safe to test with plain vitest (no RTL)"
  - "Role=application keyboard widget: single tabIndex=0 on wrapper, per-child tabIndex via rovingNodeId, Arrow keys consumed and prevented, Tab exits naturally"
  - "buildNodeLabel: module-scope helper (not exported), receives (node, lang, t) — decouples label from render cycle"

requirements-completed:
  - GAME-01
  - GAME-06

duration: 35min
completed: 2026-06-01
---

# Phase 15 Plan 03: Keyboard Accessibility + Spatial Nav Layer (Slice 3) Summary

**Roving-tabindex keyboard widget with spatial arrow nav, aria-live announcements, and bilingual per-node labels shipped on top of the Slice 2 SVG renderer without changing its props contract**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-01T22:15:00Z
- **Completed:** 2026-06-01T22:50:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `spatialNav.findNextNode` pure helper — dot-product half-plane filter + Euclidean min distance + wrap fallback; 11 unit tests, no React deps
- `SvgConstellation.js` Slice 3 enrichment — role=application wrapper, roving tabindex, Enter/Space/Esc handlers, aria-live announcement, focus ring, pulse on Java, hint pill under reduced-motion
- 6 new bilingual `game.*` translation keys for all keyboard interaction copy

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: spatialNav tests** - `d69f374` (test)
2. **Task 1 GREEN: spatialNav implementation** - `777bd97` (feat)
3. **Task 1: translations 6 game.* keys** - `c832346` (feat)
4. **Task 2 RED: SvgConstellation a11y tests** - `7cab3e9` (test)
5. **Task 2 GREEN: SvgConstellation a11y layer** - `e9960ed` (feat)

## Files Created/Modified

- `src/game/spatialNav.js` — ARROW_VECTORS + findNextNode pure helper (dot-product half-plane + Euclidean min)
- `src/game/spatialNav.test.js` — 11 unit tests covering all edge cases
- `src/game/renderers/SvgConstellation.js` — Slice 3 enrichments: role=application, roving tabindex, keyboard handlers, aria-live, focus ring, pulse, hint pill
- `src/game/renderers/SvgConstellation.test.js` — extended from 10 to 22 tests (12 new a11y/interaction specs)
- `src/i18n/translations.js` — added 6 game.* keys (hintPill, skillSelected, selectionCleared, nodeJobSingular/Plural, nodeUsedIn) in both EN and ES

## Decisions Made

- **Esc toggle-off:** `onSelectSkill(selectedSkillId)` instead of `onSelectSkill(null)` — `useConstellation` toggles `prev === id ? null : id`, so passing the same id clears selection without modifying Slice 2 hook contract
- **eslint-disable for role=application:** `jsx-a11y/no-noninteractive-element-interactions` + `jsx-a11y/no-noninteractive-tabindex` are false positives — WAI-ARIA APG explicitly requires `tabIndex` and keyboard handlers on `role="application"` widgets; suppressed with block disable
- **spatialNav ARROW_VECTORS test added:** Plan projected 10 tests but test file has 11 (ARROW_VECTORS exports verification added as good practice) — 116 total tests vs 114 projected; all pass

## Deviations from Plan

None - plan executed as specified with one minor scope addition (1 extra test for ARROW_VECTORS coverage).

## Issues Encountered

- `jsx-a11y` lint rules fired false positives on `role="application"` div — resolved with targeted `eslint-disable` block (standard workaround for WAI-ARIA APG compliant keyboard widgets)

## Known Stubs

None — all keyboard interaction behaviors are implemented. Phase 16 adds the visible ExperienceCard that opens on selection; `selectedSkillId` state is already plumbed through.

## Threat Flags

No new threat surface beyond the plan's threat model. All keyboard event handlers operate on repo-controlled data (node ids, translation strings). No user-supplied strings are interpolated into `aria-live` or `aria-label` content.

## Next Phase Readiness

- Phase 15 is complete: Slices 1, 2, and 3 shipped. GAME-01 and GAME-06 satisfied.
- Phase 16 (filters + ExperienceCard) can begin immediately. `selectedSkillId` state flows from `useConstellation` through `GameMode` → `SvgConstellation`; the visible card just reads `selectedSkillId` and renders.
- The renderer props contract did NOT change from Slice 2 — no `GameMode.js` updates needed for Phase 16.
- Mobile VoiceOver + NVDA/JAWS UAT remains for Phase 17 gate (per plan scope).

## Self-Check: PASSED

- `src/game/spatialNav.js` — FOUND
- `src/game/spatialNav.test.js` — FOUND
- `src/game/renderers/SvgConstellation.js` — FOUND
- `src/game/renderers/SvgConstellation.test.js` — FOUND
- `src/i18n/translations.js` — FOUND
- Commits `d69f374`, `777bd97`, `c832346`, `7cab3e9`, `e9960ed` — all FOUND in git log
- 116 tests passing
- `npm run build` exits 0

---
*Phase: 15-accessible-constellation-seo-fallback*
*Completed: 2026-06-01*
