---
phase: 04-polish-performance
plan: 01
subsystem: ui
tags: [react, tailwind, animations, accessibility, inview, scroll-animation]

# Dependency graph
requires:
  - phase: 03-content-animations
    provides: animate-on-scroll CSS class, useInView hook, ChipBadge, TimelineCard, EmailHeroCard
provides:
  - ChipBadge gated on parent inView — no hardcoded is-visible
  - Experience heading wrapped in animate-on-scroll with own headerRef/headerInView observer
  - Contact Copy email button satisfying 44px tap-target floor
affects: [04-06-lighthouse-a11y, 04-07-manual-responsive-sweep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Double-observer pattern: heading ref + content ref fire independently in same section component"
    - "ChipBadge inView prop threading: parent observer state passed down to child component"

key-files:
  created: []
  modified:
    - src/components/Skill.js
    - src/components/Experience.js
    - src/components/Contact.js

key-decisions:
  - "py-2 not changed when bumping min-h: min-h floor enforces height without reducing intentional interior padding"
  - "Two independent IntersectionObserver refs in Experience: headerRef fires when heading enters viewport, sectionRef fires when timeline container enters — independent thresholds, independent animation gates"

patterns-established:
  - "Double-observer pattern in Experience.js: heading and content blocks each have own useInView, animating independently"

requirements-completed: [RESP-03]

# Metrics
duration: 2min
completed: 2026-05-08
---

# Phase 4 Plan 01: Phase 3 Carryover Fixes Summary

**Chip stagger now fires on scroll via inView prop threading, Experience heading gets its own scroll-animation observer, and Copy email button meets the 44px tap-target floor**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-08T02:31:45Z
- **Completed:** 2026-05-08T02:33:29Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- W-01 closed: ChipBadge no longer hardcodes `is-visible` — chip stagger now driven by parent `inView` matching the pattern used by category rows and all other animated elements
- I-01 closed: Experience section heading (SectionLabel + h2 + intro) wrapped in its own `animate-on-scroll` container with a dedicated `headerRef`/`headerInView` observer — now consistent with About, Skill, and Contact section headings
- D-06 closed: Copy email button `min-h` bumped 32px → 44px, clearing the only known tap-target violation before the Lighthouse a11y audit in Plan 04-06

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix W-01 — Gate Skill.js ChipBadge on parent inView** - `43e7ba7` (fix)
2. **Task 2: Fix I-01 — Wrap Experience.js heading in animate-on-scroll** - `aa71b71` (fix)
3. **Task 3: Apply D-06 — Bump Contact.js Copy email button to min-h-[44px]** - `ccaeb8d` (fix)

## Files Created/Modified
- `src/components/Skill.js` — ChipBadge signature updated to `{ chip, index, inView }`; hardcoded `is-visible` replaced with `${inView ? ' is-visible' : ''}`; call site passes `inView={inView}`
- `src/components/Experience.js` — Added `headerRef` + `headerInView` (threshold 0.25); heading block wrapped in `<div ref={headerRef} className={animate-on-scroll...}>` before timeline `sectionRef` div
- `src/components/Contact.js` — `min-h-[32px]` → `min-h-[44px]` on EmailHeroCard Copy button

## Decisions Made
- `py-2` not changed when bumping min-h: the `min-h-[44px]` floor enforces the required height without reducing intentional interior padding. Reducing `py-2` would counteract the goal of feeling tappable.
- Two independent `useInView` observers in `Experience.js` (not one): heading enters viewport before the timeline container, so independent thresholds ensure the heading animation fires first rather than both waiting on the timeline container scroll position.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- `npm run lint` showed pre-existing errors in `src/index.js` (extra semicolon, import order) and pre-existing warnings in `Experience.js` (array-index-key) and `useActiveSection.js` (exhaustive-deps). All confirmed pre-existing per plan CONTEXT.md line 147 — no new lint issues introduced by this plan's changes.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Plan 04-06 (Lighthouse a11y): Contact section has 0 known tap-target violations for the Copy email button
- Plan 04-07 (manual responsive sweep): All four content sections (About, Skill, Experience, Contact) now have fully consistent scroll-animation patterns on their headings
- ChipBadge chip stagger animation fires on scroll instead of at mount — visual polish consistent with design intent

---
## Self-Check: PASSED

- Skill.js: FOUND (43e7ba7 — hardcoded is-visible removed, ChipBadge signature updated, call site wired)
- Experience.js: FOUND (aa71b71 — headerRef + headerInView added, heading wrapped in animate-on-scroll)
- Contact.js: FOUND (ccaeb8d — min-h-[44px] present, min-h-[32px] absent)
- 04-01-SUMMARY.md: FOUND
- All 3 task commits verified in git log

---
*Phase: 04-polish-performance*
*Completed: 2026-05-08*
