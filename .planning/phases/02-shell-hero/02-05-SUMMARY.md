---
phase: 02-shell-hero
plan: 05
subsystem: ui
tags: [react, tailwind, animation, hero, i18n, accessibility, char-reveal, motion-safe]

# Dependency graph
requires:
  - phase: 02-shell-hero
    provides: "tailwind.config.js with animate-fade-in, animate-slide-up, animate-pulse2 keyframes; bg-hero-gradient, bg-grid-subtle tokens; translations.js hero.* and stats.* keys"
provides:
  - "Fully animated Hero section with 7-step entrance stagger"
  - "useCharReveal hook: 40ms/char h1b gradient text reveal with blinking cursor"
  - "Dual always-visible CV download CTAs (EN + ES, both languages regardless of active lang)"
  - "prefers-reduced-motion layered defense (motion-safe: prefix + global CSS + char-reveal early-return)"
  - "section id='hero' anchor for Nav logomark scroll target"
  - "bg-hero-gradient + bg-grid-subtle background (no orbs, no JS background animation)"
affects:
  - 02-shell-hero
  - nav (logomark href='#hero' now lands correctly)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useCharReveal(target, startOffsetMs, perCharMs): inline custom hook with useRef timer cleanup, window.matchMedia reduce-motion guard, SSR-safe typeof window check"
    - "motion-safe:opacity-0 + motion-safe:animate-{fade-in|slide-up} + style={{animationDelay, animationFillMode:'forwards', animationDuration}} — stagger pattern for all entrance animations"
    - "aria-label on h1 wrapping full headline text; aria-hidden on char-reveal span so screen readers skip staged reveal"
    - "Function ordering: hooks before components (useCharReveal → Stat → Hero) to satisfy no-use-before-define ESLint rule"

key-files:
  created: []
  modified:
    - src/components/Hero.js

key-decisions:
  - "useCharReveal defined before Hero (not after) to satisfy ESLint no-use-before-define rule — deviation from plan template order but functionally identical"
  - "Unicode arrow → used directly instead of &rarr; HTML entity — avoids semicolon-containing HTML entity in JSX and cleaner source"
  - "Tailwind animate-fade-in and animate-slide-up verified already present from Phase 1 — Task 1 was a no-op verification requiring no file changes"

patterns-established:
  - "Stagger sequence: badge 0ms → h1a 150ms → h1b 300ms → h1c 500ms → lead 650ms → CTAs 800ms → stats 950ms"
  - "All animated elements use paired class motion-safe:opacity-0 + motion-safe:animate-* to respect OS reduce-motion at utility level"
  - "animationFillMode:'forwards' on all stagger elements to retain final state after animation ends"
  - "useCharReveal resets on target change — supports language switch restarting the reveal cleanly"

requirements-completed:
  - HERO-01
  - HERO-02
  - HERO-03
  - HERO-04
  - HERO-05
  - I18N-03

# Metrics
duration: 18min
completed: 2026-05-05
---

# Phase 02 Plan 05: Hero Section — Animated Redesign Summary

**Bold animated Hero with 7-step entrance stagger, char-reveal gradient headline (40ms/char), dual EN+ES CV download buttons, and layered prefers-reduced-motion suppression**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-05T22:45:00Z
- **Completed:** 2026-05-05T23:03:00Z
- **Tasks:** 2 (Task 1: verification no-op; Task 2: full Hero rewrite)
- **Files modified:** 1

## Accomplishments

- Replaced minimal Hero with full Phase 2 spec: status badge, 3-line h1 (gradient char-reveal center line), lead paragraph, 3-button CTA row, 4-stat grid
- Implemented `useCharReveal` custom hook with 40ms/char timing, `useRef` timer cleanup on unmount and language change, reduce-motion guard that jumps to full string instantly
- Wired dual CV download buttons — `href=/CV_Carlos_Montoya_EN.docx download` and `href=/CV_Carlos_Montoya_ES.docx download` — always visible regardless of active language (HERO-05, I18N-03)
- All 7 animated elements use `motion-safe:opacity-0 motion-safe:animate-*` with exact stagger delays and `animationFillMode:'forwards'` (HERO-02, DSGN-03)
- Background is `bg-hero-gradient` with `bg-grid-subtle` overlay; no orbs, no JS animation (HERO-03)
- Section `id="hero"` set for Nav logomark anchor

## Task Commits

1. **Task 1: Verify Tailwind animate-fade-in and animate-slide-up** — no-op verification (already present from Phase 1, no commit needed)
2. **Task 2: Rewrite Hero.js** — `f5b8e62` (feat)

## Files Created/Modified

- `src/components/Hero.js` — Full rewrite: useCharReveal hook, Stat sub-component, Hero section with 7-step stagger, dual CV CTAs, bg-hero-gradient + bg-grid-subtle background

## Decisions Made

- `useCharReveal` placed at top of file (before Hero) to satisfy ESLint `no-use-before-define` rule — the plan template showed hook at bottom but that triggered a lint error; reordering is semantically identical
- Unicode `→` used instead of `&rarr;` HTML entity — keeps source clean and avoids semicolons in JSX text
- `for` loop retained in useCharReveal (not converted to reduce/forEach) — `for` loop semicolons are syntax delimiters, not statement terminators; ESLint `semi:0` only restricts statement-end semicolons

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reordered useCharReveal before Hero to fix lint error**
- **Found during:** Task 2 (after writing Hero.js per plan template)
- **Issue:** ESLint `no-use-before-define` error: `useCharReveal` was called in Hero (line 6) but defined at bottom of file (line 115). Plan template showed the hook at the bottom which triggers this rule.
- **Fix:** Moved `useCharReveal` and `Stat` function definitions above the `Hero` default export so all referenced symbols are defined before use.
- **Files modified:** `src/components/Hero.js`
- **Verification:** `npm run lint` exits 0 (only pre-existing warnings in Experience.js and Skill.js remain). `npm run build` exits 0.
- **Committed in:** f5b8e62 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug/lint)
**Impact on plan:** Required for lint-clean build. No functional or visual change — symbol ordering in the file only.

## Issues Encountered

- Plan template code placed `useCharReveal` after `Hero`, triggering `no-use-before-define`. Fixed by reordering. All other plan requirements satisfied as written.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Hero section fully implements HERO-01 through HERO-05 and I18N-03
- Nav logomark `href="#hero"` will now scroll to the correct section (id is set)
- CV files must be present at `public/CV_Carlos_Montoya_EN.docx` and `public/CV_Carlos_Montoya_ES.docx` (already present per git status)
- Ready for Phase 2 verify-work UAT checkpoint

---
*Phase: 02-shell-hero*
*Completed: 2026-05-05*
