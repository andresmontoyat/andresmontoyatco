---
phase: 04-polish-performance
plan: 04
subsystem: ui
tags: [accessibility, a11y, eslint, skip-link, aria, keyboard-nav, wcag]

requires:
  - phase: 04-polish-performance/04-01
    provides: Vite build system + ESLint baseline configuration

provides:
  - jsx-a11y ESLint rules promoted to error severity (D-07 ratchet locked)
  - Skip-to-content keyboard shortcut wired in EN + ES
  - <main id="main"> landmark with stable href target
  - .skip-link visible-on-focus CSS utility class
  - t.nav.skipToContent translation key in both locales

affects:
  - 04-06-lighthouse-audit (a11y baseline raised before audit)
  - 04-07-manual-verification (skip-link keyboard behavior to verify)

tech-stack:
  added: []
  patterns:
    - "SkipLink private component in App.js consumes useLanguage for bilingual copy"
    - "jsx-a11y rules at error severity prevent future a11y regressions at lint time"
    - ".skip-link: absolute position off-screen, :focus slides to top:0 via 150ms transition"

key-files:
  created: []
  modified:
    - .eslintrc.js
    - src/App.js
    - src/i18n/translations.js
    - src/index.css

key-decisions:
  - "jsx-a11y promotion is a no-op pass (0 warnings existed before) — locks ratchet so future regressions break CI"
  - "SkipLink defined as private function component inside App.js rather than separate file — one-off component, no reuse needed"
  - "color: var(--color-text-inverse, #fff) with fallback because --color-text-inverse not in current token set"
  - "Heading hierarchy verified: exactly 1 <h1> in Hero, 1 <h2> per section (About/Skill/Experience/Contact), no headings in Footer — no code changes required"

patterns-established:
  - "Skip-link pattern: absolute top:-100px hidden until :focus at top:0, reduced-motion suppressed by existing global rule"
  - "A11y ratchet: ESLint jsx-a11y errors catch future violations at CI time, not just in review"

requirements-completed:
  - RESP-03

duration: 2min
completed: 2026-05-08
---

# Phase 4 Plan 04: Accessibility Baseline Summary

**jsx-a11y ESLint ratchet locked at error severity + skip-to-content keyboard shortcut wired bilingual in App.js**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-08T02:37:17Z
- **Completed:** 2026-05-08T02:39:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Promoted 4 jsx-a11y rules from `warn` to `error` in .eslintrc.js — CI now breaks on future a11y regressions
- Added `t.nav.skipToContent` in EN ("Skip to content") and ES ("Saltar al contenido") to translations.js
- Added `.skip-link` CSS utility class (off-screen until `:focus`, slides to `top: 0` in 150ms)
- Wired `<SkipLink />` as first focusable element in App.js, added `id="main"` to `<main>` landmark
- Verified heading hierarchy: exactly 1 `<h1>` (Hero), 1 `<h2>` per section, no heading in Footer — all correct

## Lint Baseline Result

jsx-a11y warnings before promotion: **0** (confirmed via `npm run lint 2>&1 | grep "jsx-a11y" | wc -l`).
Promotion was a clean ratchet — no existing code needed fixing.

After promotion: `npm run lint` exits 0 with only 4 pre-existing intentional warnings:
- 2x `react/no-array-index-key` (Experience.js) — intentional `key={i}` usage
- 2x `react-hooks/exhaustive-deps` (useActiveSection.js) — intentional `ids.join('|')` pattern

## Task Commits

1. **Task 1: Promote jsx-a11y rules warn → error** - `358cc90` (chore)
2. **Task 2: Add skipToContent translation + .skip-link CSS** - `ed944eb` (feat)
3. **Task 3: Wire SkipLink into App.js + id="main"** - `4b7a31d` (feat)

## Files Created/Modified

- `.eslintrc.js` — 4 jsx-a11y rules changed from `'warn'` to `'error'`; comment updated to "promoted to error in Phase 4 (D-07)"
- `src/i18n/translations.js` — `skipToContent` key added to `en.nav` and `es.nav` blocks
- `src/index.css` — `.skip-link` + `.skip-link:focus` utility class added to `@layer utilities`
- `src/App.js` — `SkipLink` private component added; `useLanguage` imported; `<SkipLink />` placed before `<Nav />`; `<main>` gains `id="main"`

## ARIA Landmark Verification

All landmarks were already present — only `id="main"` was missing:

| Landmark | Element | Component | Status |
|----------|---------|-----------|--------|
| banner | `<header>` | Nav.js line 14 | Present |
| navigation | `<nav>` | Nav.js line 68 (desktop) | Present |
| dialog | `role="dialog"` | Nav.js line 179 (mobile) | Present |
| main | `<main id="main">` | App.js | Added id |
| contentinfo | `<footer>` | Footer.js line 13 | Present |

## Heading Hierarchy Verification

| Component | Heading | Line | Status |
|-----------|---------|------|--------|
| Hero.js | `<h1>` | 71 | Single h1 — correct |
| About.js | `<h2>` | 16 | Section heading — correct |
| About.js | `<h3>` | 31 | Quick facts subheading — correct |
| Skill.js | `<h2>` | 16 | Section heading — correct |
| Experience.js | `<h2>` | 24 | Section heading — correct |
| Contact.js | `<h2>` | 18 | Section heading — correct |
| Footer.js | none | — | No heading — correct |

## Decisions Made

- jsx-a11y promotion is a no-op pass (0 warnings existed before) — locks ratchet so future regressions break CI
- `SkipLink` defined as private function component inside App.js rather than a separate shared file — one-off component with no reuse need
- `color: var(--color-text-inverse, #fff)` with fallback because `--color-text-inverse` is not in the current token set
- Heading hierarchy verified as correct — no code changes required (plan documented this correctly)

## Deviations from Plan

None — plan executed exactly as written. The CSS fallback `var(--color-text-inverse, #fff)` is a minor refinement within Task 2 (not in plan spec, but ensures skip-link text is readable even without the token).

## Issues Encountered

None.

## Known Stubs

None — all functionality is fully wired. Skip-link renders real bilingual copy from translations, navigates to real `<main id="main">`.

## Next Phase Readiness

- Plan 04-05 (image optimization) can proceed — no dependencies on this plan
- Plan 04-06 (Lighthouse a11y audit) inherits a clean baseline:
  - `<main>` landmark present with `id`
  - Skip-link is first focusable element on Tab
  - Single `<h1>`, `<h2>` per section
  - jsx-a11y ESLint ratchet will prevent future regressions

---
*Phase: 04-polish-performance*
*Completed: 2026-05-08*
