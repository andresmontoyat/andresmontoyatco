---
phase: 03-content-animations
plan: 02
subsystem: ui
tags: [react, tailwind, css, intersection-observer, animation, hooks]

requires:
  - phase: 02-shell-hero
    provides: useActiveSection.js hook pattern, index.css @layer utilities block, global prefers-reduced-motion rule

provides:
  - useInView(ref, { threshold }) hook — IntersectionObserver, fires once, SSR-safe
  - .animate-on-scroll / .is-visible CSS class pair with 700ms ease-out transition
  - .animate-on-scroll prefers-reduced-motion override (immediately visible, no transition)
  - src/components/_shared/SectionLabel.js — canonical shared component with font-extrabold

affects:
  - 03-03 (About), 03-04 (Skill), 03-05 (Experience), 03-06 (Contact) — all import these three primitives

tech-stack:
  added: []
  patterns:
    - "IntersectionObserver hook: SSR guard + unobserve-on-fire pattern (established in useInView, mirrors useActiveSection)"
    - "CSS-first entrance animation: .animate-on-scroll class toggled by JS, never JS-driven animation"
    - "Shared sub-component extraction: _shared/ directory for cross-section primitives"

key-files:
  created:
    - src/hooks/useInView.js
    - src/components/_shared/SectionLabel.js
  modified:
    - src/index.css

key-decisions:
  - "useInView unobserves after first fire — animation plays once per session, never replays on scroll-back (per UI-SPEC ANIM-02)"
  - "SSR guard sets inView=true immediately so server-rendered output shows content without JS"
  - "SectionLabel uses font-extrabold (800) not font-semibold (600) — Phase 3 type contract enforces only 400 and 800 weights"
  - "animate-on-scroll rules inside existing @layer utilities block — one @layer utilities, not two"
  - "Scoped prefers-reduced-motion block added for .animate-on-scroll, additive to the global rule"

patterns-established:
  - "Pattern 1: useInView hook signature — useInView(ref, { threshold = 0.25 }) returns boolean"
  - "Pattern 2: animate-on-scroll usage — className={'animate-on-scroll' + (inView ? ' is-visible' : '')}"
  - "Pattern 3: shared component import — import SectionLabel from './_shared/SectionLabel'"

requirements-completed: [ANIM-01, ANIM-02, ANIM-03]

duration: 5min
completed: 2026-05-06
---

# Phase 3 Plan 02: Animation Primitives Summary

**IntersectionObserver hook (useInView), CSS entrance-animation class pair (.animate-on-scroll/.is-visible), and shared SectionLabel component (font-extrabold) — three primitives consumed by all Phase 3 section plans**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-06T04:03:06Z
- **Completed:** 2026-05-06T04:05:15Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created `useInView` hook with IntersectionObserver — threshold 0.25, fires once per session (unobserve after first fire), SSR-safe fallback sets inView=true immediately
- Extended `src/index.css` with `.animate-on-scroll` (opacity 0, translateY 16px, 700ms ease-out) and `.animate-on-scroll.is-visible` (opacity 1, translateY 0) under existing `@layer utilities`, plus scoped prefers-reduced-motion guard
- Extracted `SectionLabel` into `src/components/_shared/SectionLabel.js` with `font-extrabold` (800) replacing the `font-semibold` (600) from the four inline definitions — fixes Phase 3 type contract violation at extraction time

## Task Commits

1. **Task 1: useInView IntersectionObserver hook** - `2a00edf` (feat)
2. **Task 2: .animate-on-scroll/.is-visible CSS classes** - `528b550` (feat)
3. **Task 3: shared SectionLabel component** - `7fe7502` (feat)

## Files Created/Modified

- `src/hooks/useInView.js` — Default-export hook: `useInView(ref, { threshold = 0.25 })` returns boolean. SSR guard, unobserve-after-fire, disconnect cleanup.
- `src/index.css` — Added `.animate-on-scroll` + `.animate-on-scroll.is-visible` inside existing `@layer utilities`; added scoped `@media (prefers-reduced-motion: reduce)` block for `.animate-on-scroll` before the existing global rule.
- `src/components/_shared/SectionLabel.js` — Canonical SectionLabel: `font-mono text-xs text-brand uppercase tracking-[3px] font-extrabold`, brand accent span, `mb-4`.

## Decisions Made

- font-extrabold (800) chosen over font-semibold (600) per Phase 3 type contract: only weights 400 and 800 active in Phase 3
- animate-on-scroll rules inserted inside the existing `@layer utilities` block (no duplicate @layer)
- Downstream components (About/Skill/Experience/Contact) NOT modified in this plan — each plan 03-03/04/05 handles its own SectionLabel import swap

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

All three primitives are ready for immediate consumption by plans 03-03, 03-04, 03-05, 03-06:

```js
// Hook import
import useInView from '../hooks/useInView'

// SectionLabel import
import SectionLabel from './_shared/SectionLabel'

// Usage pattern
const ref = useRef(null)
const inView = useInView(ref)
// ...
<section ref={ref} className={'animate-on-scroll' + (inView ? ' is-visible' : '')}>
  <SectionLabel>Section Title</SectionLabel>
```

The four section components (About, Skill, Experience, Contact) can replace their inline `function SectionLabel()` definitions with `import SectionLabel from './_shared/SectionLabel'` without any other changes — the API and rendered output are identical except for `font-extrabold` vs `font-semibold`.

---
*Phase: 03-content-animations*
*Completed: 2026-05-06*
