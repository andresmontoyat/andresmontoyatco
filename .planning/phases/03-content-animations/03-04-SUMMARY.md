---
phase: 03-content-animations
plan: 04
subsystem: ui
tags: [react, tailwind, timeline, animations, intersection-observer, experience, accessibility]

# Dependency graph
requires:
  - phase: 03-content-animations
    plan: 01
    provides: "EXPERIENCE data with tech:[] field per entry, t.exp.expand/collapse translation keys"
  - phase: 03-content-animations
    plan: 02
    provides: "useInView hook, SectionLabel shared component, animate-on-scroll CSS primitives"
provides:
  - "Vertical timeline Experience section with all 12 entries always visible"
  - "Per-card independent expand/collapse via openCards state object"
  - "Tech chips visible on collapsed cards sourced from job.tech[]"
  - "Brand-color rail (w-0.5 bg-brand opacity-30) with 10px brand dots per entry"
  - "Single useInView observer driving 100ms per-card stagger via transitionDelay"
  - "aria-expanded + aria-label accessibility for chevron toggle"
affects: [03-content-animations, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "openCards object state pattern: useState({}) keyed by index for independent per-item expand/collapse"
    - "Single IntersectionObserver ref on container driving per-child stagger via transitionDelay"
    - "ChevronIcon as inline SVG sub-component — no icon library"
    - "TimelineCard as private named sub-component after default export"

key-files:
  created: []
  modified:
    - src/components/Experience.js

key-decisions:
  - "openCards object (useState({})) replaces single expanded boolean — multiple cards can be open simultaneously (D-07)"
  - "All 12 EXPERIENCE entries rendered unconditionally — featured field preserved in data but unused for rendering (D-08)"
  - "Tech chips rendered on collapsed card surface, not behind expand gate (D-06)"
  - "Single useInView observer on timeline container div, inView prop forwarded to each TimelineCard for stagger (D-13, D-15)"
  - "ChevronIcon uses inline SVG with rotate-180 class — no external icon library (D-03)"
  - "h3 used for job title per UI-SPEC type contract (text-base font-extrabold is a weight variation of Body, not a heading size)"

patterns-established:
  - "openCards pattern: useState({}) keyed by item index, toggle via setOpenCards(prev => ({...prev, [i]: !prev[i]}))"
  - "Per-card isOpen: !!openCards[i] evaluates false for unmapped indices (all collapsed by default)"
  - "Private sub-components (TimelineCard, ChevronIcon) defined after default export"
  - "Single observer + transitionDelay stagger: inView from parent, delay computed from index prop"

requirements-completed: [CONT-03, CONT-04, CONT-05, ANIM-01, ANIM-03]

# Metrics
duration: 8min
completed: 2026-05-06
---

# Phase 03 Plan 04: Experience Timeline Summary

**Vertical timeline with 12 always-visible expandable cards: openCards per-card state, brand rail + dots, tech chips, 100ms stagger via single useInView observer**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-06T04:10:00Z
- **Completed:** 2026-05-06T04:18:06Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Rewrote Experience.js from single-toggle global expand to per-card independent expand/collapse using openCards object state
- Removed the featured-based filter that was hiding 7 of 12 entries on first load — all 12 entries now always visible
- Added brand-color vertical rail (w-0.5 bg-brand opacity-30) and per-entry 10px dots with ink-950 ring + brand glow shadow
- Tech chips rendered unconditionally on collapsed card surface sourced from job.tech[] (no library, just Tailwind chips)
- Replaced local SectionLabel definition with shared import from ./_shared/SectionLabel
- Replaced h4 job title with h3 per UI-SPEC type contract; removed font-bold/font-semibold (only font-extrabold active)
- ChevronIcon inline SVG with rotate-180 transition; aria-expanded + aria-label switching between t.exp.expand/t.exp.collapse
- Single useInView observer at threshold 0.25 on timeline container; per-card 100ms stagger via transitionDelay = index * 100ms

## Task Commits

1. **Task 1: Rewrite Experience.js — vertical timeline + per-card expand + tech chips + stagger animation** - `96d2a49` (feat)

## Files Created/Modified

- `src/components/Experience.js` - Fully rewritten: vertical timeline, openCards state, TimelineCard + ChevronIcon sub-components, brand rail/dots, tech chips, useInView stagger

## Decisions Made

- openCards object state pattern chosen over array: object keys by index, missing key evaluates to false (all collapsed by default without initializing 12 booleans)
- Single observer on the container div (not per-card) — avoids 12 simultaneous IntersectionObserver instances, forwards inView boolean to all cards with per-index transitionDelay for stagger effect
- inline SVG for ChevronIcon: no icon library needed, minimal dependency footprint per D-03

## Deviations from Plan

None — plan executed exactly as written. The HTML entity `&#9656;` used for the bullet triangle renders identically to the literal `▸` character while avoiding direct Unicode in source (cosmetic only, no behavioral difference).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Experience section is complete and production-ready: 12 cards, independent expand/collapse, tech chips, brand rail/dots, stagger animation
- All acceptance criteria verified via grep and npm run build (exit 0) + npm run lint (0 errors)
- Phase 03 plans 03 (Skills) and 05 (Contact) in parallel wave can proceed without dependency on this plan
- Plan 06 (Footer) and 07 (SEO/OG) are not blocked by this plan

---
*Phase: 03-content-animations*
*Completed: 2026-05-06*
