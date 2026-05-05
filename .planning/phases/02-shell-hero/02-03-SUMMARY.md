---
phase: 02-shell-hero
plan: "03"
subsystem: navigation
tags: [nav, sticky-header, progress-bar, lang-pill, rAF, accessibility]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [sticky-header-shell, scroll-progress-bar, lang-pill-toggle]
  affects: [src/components/Nav.js]
tech_stack:
  added: []
  patterns: [rAF-throttled-scroll-handler, ref-style-mutation, sub-component-per-concern]
key_files:
  modified:
    - src/components/Nav.js
decisions:
  - "ProgressBar uses ref.style.width mutation instead of setState to avoid re-renders on every scroll frame"
  - "DesktopNav hidden below md breakpoint; mobile hamburger deferred to Plan 02-04"
  - "Active-state className wiring deferred to Plan 02-04 (useActiveSection hook)"
  - "NAV-02 smooth scroll wired via existing html{scroll-behavior:smooth} — no JS scroll lib needed"
  - "HTML entities &lt; and &gt; in Logomark are valid JSX — semicolons in entities not JS semicolons"
metrics:
  duration_seconds: 91
  completed_date: "2026-05-05"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 02 Plan 03: Nav Shell Summary

Nav.js fully rewritten as sticky header shell with 4 sub-components (ProgressBar, Logomark, DesktopNav, LangPill) and rAF-throttled scroll progress bar at z-[200].

## What Was Built

### Sub-components Added

| Component | Purpose |
|-----------|---------|
| `ProgressBar` | Fixed 3px brand bar at top of viewport; rAF-throttled scroll handler writes to `ref.current.style.width` |
| `Logomark` | `</cam>` anchor to `#hero`, font-mono text-xs |
| `DesktopNav` | 4 anchor links `hidden md:flex`, font-mono text-xs font-normal, hover:text-brand |
| `LangPill` | EN/ES toggle with bg-ink-500 pill container, active=bg-brand-gradient text-ink-900 font-extrabold |

### rAF Throttling Pattern

```js
function onScroll() {
  if (!ticking) {
    window.requestAnimationFrame(update)
    ticking = true
  }
}
```

The `update` function reads `scrollY / (scrollHeight - innerHeight)` and writes `pct%` directly to `ref.current.style.width`. No React state mutation on scroll — zero re-renders.

### Tokens Applied Per UI-SPEC

| Element | Classes |
|---------|---------|
| Header | `sticky top-0 z-50 backdrop-blur-md bg-ink-900/70 border-b border-ink-600` |
| Progress bar outer | `fixed top-0 left-0 right-0 z-[200] h-[3px] bg-transparent pointer-events-none` |
| Progress bar fill | `h-full bg-brand` |
| Lang pill container | `bg-ink-500 border border-ink-400 rounded-full p-0.5` |
| Active lang button | `bg-brand-gradient text-ink-900 font-extrabold` |
| Inactive lang / nav links | `text-text-secondary font-normal` |
| Nav link hover | `hover:text-brand transition-colors duration-200` |

### NAV-02 Smooth Scroll

Confirmed: `html { scroll-behavior: smooth }` is at line 30 of `src/index.css` — no JS scroll library required. All 4 nav links use plain `href="#section"` anchors.

## What Was NOT Included (Intentional)

- **Mobile hamburger button**: Plan 02-04 inserts `md:hidden` hamburger and portal-rendered `<MobileMenu />`
- **Scroll-spy active state**: Plan 02-04 introduces `useActiveSection` hook; placeholder className structure is ready in `DesktopNav`
- **react-scroll library**: Not imported (D-04: already removed in Phase 1)

## Acceptance Criteria Verification

All acceptance criteria passed:
- `function ProgressBar` count: 1
- `function Logomark` count: 1
- `function DesktopNav` count: 1
- `function LangPill` count: 1
- `export default function Nav` count: 1
- Header class exact match: confirmed
- `fixed top-0 left-0 right-0 z-[200] h-[3px]`: confirmed
- `h-full bg-brand`: confirmed
- `requestAnimationFrame` count: 1
- `addEventListener('scroll'` and `removeEventListener('scroll'`: 1 each
- `passive: true`: 2 occurrences
- `bg-ink-500 border border-ink-400 rounded-full p-0.5`: confirmed
- `bg-brand-gradient text-ink-900 font-extrabold`: confirmed
- `text-text-secondary font-normal`: 2 occurrences
- `hover:text-brand transition-colors duration-200`: confirmed
- hrefs `#about`, `#skills`, `#experience`, `#contact`, `#hero`: all present
- `aria-label="English"`, `aria-label="Español"`: confirmed
- `aria-pressed`: 2 occurrences
- No FontAwesome imports: confirmed
- No react-scroll imports: confirmed
- No JS semicolons (HTML entities &lt;/&gt; are not JS statement terminators): confirmed
- `npm run build`: exits 0
- `eslint src/components/Nav.js`: clean (0 errors, 0 warnings)

## Deviations from Plan

None — plan executed exactly as written.

Pre-existing lint issue in `Hero.js` (`no-use-before-define` for `useCharReveal`) was created by parallel executor Plan 02-05. This is out-of-scope and logged as a deferred item.

## Known Stubs

None. Nav.js is fully functional for its scope. Active-state styling is intentionally deferred to Plan 02-04 (documented, not a stub — it's planned work).

## Task Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 - Rewrite Nav.js with sticky shell | 87202ba | src/components/Nav.js |

## Self-Check: PASSED

- [x] `src/components/Nav.js` exists and was modified
- [x] Commit `87202ba` exists in git log
- [x] `npm run build` succeeded
- [x] `eslint src/components/Nav.js` clean
