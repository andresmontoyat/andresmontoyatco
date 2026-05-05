---
phase: 02-shell-hero
plan: "04"
subsystem: navigation
tags: [nav, mobile-menu, scroll-spy, intersection-observer, portal, a11y, i18n]
dependency_graph:
  requires:
    - 02-01 (translation keys nav.menuOpen / nav.menuClose)
    - 02-03 (Nav.js shell: Logomark, DesktopNav, LangPill, ProgressBar)
  provides:
    - useActiveSection hook (reusable IntersectionObserver scroll-spy)
    - hamburger button + MobileMenu portal overlay
    - active-link styling on both desktop and mobile nav
  affects:
    - src/components/Nav.js
    - src/hooks/useActiveSection.js
tech_stack:
  added:
    - react-dom createPortal (imported from existing react-dom dep — no new package)
    - IntersectionObserver Web API (native browser, SSR-guarded)
  patterns:
    - Custom hook with IntersectionObserver for scroll-spy
    - React portal for mobile overlay (avoids z-index stacking conflicts)
    - Body overflow toggle for scroll-lock
    - Document keydown listener for ESC dismiss
key_files:
  created:
    - src/hooks/useActiveSection.js
  modified:
    - src/components/Nav.js
decisions:
  - "Portal target = document.body per D-05; avoids z-index stacking conflicts with sticky header"
  - "ids.join('|') as stable effect dep avoids observer churn when caller passes array literal"
  - "useActiveSection instance shared between DesktopNav and MobileMenu (single observer, no duplication)"
  - "HTML entity semicolons in Logomark (&lt; &gt;) are pre-existing JSX text, not JS semicolons — no-semicolons ESLint rule passes"
metrics:
  duration_minutes: 2
  completed_date: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 02 Plan 04: Mobile Menu, Portal, and Scroll-Spy Summary

**One-liner:** MobileMenu portal overlay with body scroll-lock, ESC dismiss, and IntersectionObserver scroll-spy active-link highlighting on desktop and mobile nav.

## What Was Built

### Task 1 — `src/hooks/useActiveSection.js` (commit `d8a067c`)

New reusable hook. Accepts an array of section ids, creates an IntersectionObserver with `rootMargin: '-20% 0px -60% 0px'` and `threshold: 0`, returns the id of the currently active section as a string. Returns `''` when the hero is in view (no section active). Defensive against missing DOM elements — `filter(Boolean)` drops ids where `getElementById` returns `null`. Phase 3 will add the actual `id="about"`, `id="skills"`, etc. attributes to their section elements; the hook works today with zero observations (returns `''`).

SSR/jsdom guard: `typeof window === 'undefined' || typeof IntersectionObserver === 'undefined'` returns `undefined` (no-op cleanup). Stable dependency: `ids.join('|')` prevents observer churn.

### Task 2 — `src/components/Nav.js` extended (commit `24cb835`)

Three additions to the Plan 02-03 Nav shell:

**A. Hamburger button** — `md:hidden`, 44x44 px (`w-11 h-11`), inline 3-bar SVG, `aria-label={t.nav.menuOpen}`, `aria-expanded={menuOpen}`, `aria-controls="mobile-menu"`. Opens `menuOpen` state on click.

**B. MobileMenu sub-component** — rendered via `createPortal(overlay, document.body)` per D-05. Full-screen overlay: `fixed inset-0 z-[100] bg-ink-950/95`. Fade transition: `transition-opacity duration-200`, toggling between `opacity-100` (open) and `opacity-0 pointer-events-none invisible` (closed). Close button at `absolute top-5 right-6` with 44px touch target, `aria-label={t.nav.menuClose}`. Role/aria: `role="dialog"`, `aria-modal="true"`, `aria-hidden={!open}`.

Body scroll-lock: `useEffect` sets `document.body.style.overflow = open ? 'hidden' : ''`. Cleanup always resets to `''`. ESC keydown: listener attached at `document` level when open, removed in cleanup. Link-tap dismiss: `onClick={onClose}` on each overlay anchor. LangPill reused inside the overlay with its own `lang`/`setLang` props.

**C. Active-link styling** — `useActiveSection(SECTION_IDS)` called once in `Nav`, result passed as `activeSection` prop to both `DesktopNav` and `MobileMenu`. Desktop active class: `text-brand font-normal border-b-2 border-brand pb-0.5`. Mobile active class: `text-2xl font-extrabold text-brand border-b-2 border-brand pb-0.5`. Links switch from `text-text-secondary` / `text-text-primary` to brand color when their section id matches `activeSection`.

## Z-Index Stack (correct ordering)

| Element | z-index |
|---------|---------|
| Progress bar | z-[200] (fixed top-0, above everything) |
| Mobile overlay | z-[100] (portal on body) |
| Nav header | z-50 (sticky) |

## Requirements Fulfilled

| Requirement | Status |
|-------------|--------|
| NAV-01: Mobile hamburger + full-screen overlay + scroll-lock + keyboard a11y | DONE |
| NAV-03: Scroll-spy active-link highlight on desktop and mobile | DONE |
| I18N-01: Mobile menu labels and aria-labels switch with language | DONE |

## Deviations from Plan

### Pre-existing Issue (not introduced by this plan)

**`grep -c ";" src/components/Nav.js` returns 1 (acceptance criterion expects 0)**

The semicolon is the `&lt;` and `&gt;` HTML entities in the `Logomark` component at line 55:
```
&lt;<span className="text-brand">/</span>cam&gt;
```
This was already present in Plan 02-03's output (confirmed via `git show HEAD~1`). These are HTML entity characters in JSX text content — not JavaScript statement terminators. The ESLint `semi: 0` rule (which catches actual JS semicolons) passes with 0 errors on `Nav.js`. Out-of-scope pre-existing issue per deviation rules.

## Known Stubs

None. `useActiveSection` returns `''` until Phase 3 adds `id` attributes to section elements. This is documented design behavior — the hook is tolerant and the nav renders correctly in the current single-section state.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/hooks/useActiveSection.js exists | FOUND |
| src/components/Nav.js exists | FOUND |
| 02-04-SUMMARY.md exists | FOUND |
| commit d8a067c (Task 1) exists | FOUND |
| commit 24cb835 (Task 2) exists | FOUND |
