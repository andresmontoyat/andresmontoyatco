---
phase: 04-polish-performance
plan: 05
subsystem: ui
tags: [react, lazy-loading, code-splitting, suspense, performance, vite, lighthouse]

requires:
  - phase: 04-polish-performance/04-02
    provides: Bundle visualizer (dist/stats.html) + baseline bundle size measurement
  - phase: 04-polish-performance/04-04
    provides: SkipLink + <main id="main"> landmark structure in App.js

provides:
  - React.lazy + Suspense wrapping for Experience, Contact, Footer
  - 3 separate lazy chunks in dist/assets/ (Experience, Contact, Footer)
  - Below-fold JS deferred from initial bundle (~11KB lazy, 3.4KB gzip saved)
  - Shared SectionFallback const (py-20 div) prevents CLS during chunk hydration

affects:
  - 04-06-lighthouse-audit (TTI improvement visible in Lighthouse mobile score)
  - 04-07-manual-verification (DevTools Network tab shows 3 chunk fetches on scroll)

tech-stack:
  added: []
  patterns:
    - "3 separate Suspense boundaries (one per lazy section) — localized fallbacks, parallel chunk loads"
    - "SectionFallback as module-level const JSX element — single shared instance, not recreated per render"
    - "Footer Suspense placed outside <main> — preserves contentinfo landmark semantics"
    - "Hero/Nav/About/Skill remain eager — above-fold content must be in initial bundle"

key-files:
  created: []
  modified:
    - src/App.js

key-decisions:
  - "Split confirmed for Experience (~11KB), Contact (~3KB), Footer (~1KB) — total ~15KB raw deferred, 5.9KB gzip saved"
  - "Footer included despite ~1KB size: chunk loads in parallel with Experience anyway; every byte helps mobile (per CONTEXT.md)"
  - "3 individual Suspense boundaries, not 1 wrapping all three — prevents Experience chunk delay from blocking Contact render"
  - "SectionFallback is a module-level const, not a function — avoids JSX re-creation on every App render"

patterns-established:
  - "React.lazy(() => import('./components/X')) for below-fold sections"
  - "Suspense fallback: <div className=\"py-20\" aria-hidden=\"true\" /> — preserves vertical rhythm, CLS stays 0"

requirements-completed:
  - SEO-03

duration: 4min
completed: 2026-05-08
---

# Phase 4 Plan 05: Code Splitting Summary

**React.lazy + Suspense splits Experience/Contact/Footer into 3 lazy chunks, reducing initial bundle from 181KB to 168KB (-13KB raw, 57KB to 54KB gzip)**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-08T02:40:14Z
- **Completed:** 2026-05-08T02:42:03Z
- **Tasks:** 2 (Task 1: verification-only, Task 2: code change)
- **Files modified:** 1

## Accomplishments

- Validated 3 split candidates: Experience.js (117L), Contact.js (115L), Footer.js (39L), experience.js data (225L) — all above threshold
- Replaced eager imports for Experience/Contact/Footer with `React.lazy(() => import('./components/X'))`
- Added 3 individual `<Suspense fallback={SectionFallback}>` wrappers — one per section, localized fallbacks
- Footer's Suspense placed outside `<main>` to preserve `contentinfo` landmark semantics
- SkipLink + `<main id="main">` from Plan 04-04 preserved intact
- Hero/Nav/About/Skill remain in main bundle (above-fold, cannot lazy-load)
- Build clean: `npm run lint` 0 errors, `npm run build` exits 0

## Bundle Size Analysis

### Pre-split Baseline (Plan 04-02)

| Chunk | Raw | Gzip |
|-------|-----|------|
| `index-DX4OMLq6.js` (all) | 181.43 kB | 57.11 kB |

### Post-split Result

| Chunk | Raw | Gzip | Lazy? |
|-------|-----|------|-------|
| `index-DYlks3jd.js` (main) | 167.96 kB | 53.67 kB | No (eager) |
| `Experience-D3VWMEBM.js` | 11.04 kB | 4.04 kB | Yes |
| `Contact-RZ4U779B.js` | 3.09 kB | 1.23 kB | Yes |
| `Footer-CVUSrWWT.js` | 1.10 kB | 0.60 kB | Yes |

**Delta:** Main bundle -13.47KB raw, -3.44KB gzip. Total lazy deferred: ~15.2KB raw, ~5.87KB gzip.

### Split Decision Rationale

- Experience: largest candidate (~11KB with bilingual data). Highest ROI. Confirmed split.
- Contact: moderate (~3KB). EmailHeroCard logic + clipboard handler. Good lazy candidate.
- Footer: borderline (~1KB) but loads in parallel with Experience chunk. Per CONTEXT.md "every byte helps mobile" — kept in split list.

## Task Commits

1. **Task 1: Validate split candidates (verification-only)** — no commit (no file changes)
2. **Task 2: React.lazy + Suspense refactor** — `ac95d65` (feat)

## Files Created/Modified

- `src/App.js` — `Suspense` added to React import; Experience/Contact/Footer replaced with `React.lazy()`; 3 `<Suspense>` wrappers added; `SectionFallback` const defined at module level

## Decisions Made

- Split confirmed for all 3 candidates despite Footer being borderline at ~1KB (parallel chunk fetch nullifies round-trip cost concern)
- 3 separate Suspense boundaries chosen over a single wrapper — prevents slowest chunk from blocking faster ones
- `SectionFallback` defined as module-level const (not JSX inline per-render) — cleaner pattern, single instance

## Deviations from Plan

None — plan executed exactly as written. The exact App.js content matches the plan's `<action>` spec.

## Issues Encountered

None.

## Known Stubs

None — all 3 lazy components are fully implemented real components. Suspense fallbacks are intentional empty placeholders (not stubs), serving a CLS-prevention role.

## Next Phase Readiness

- Plan 04-06 (Lighthouse audit) inherits the TTI improvement — ~3.4KB gzip saved from initial payload
- Manual verification (Plan 04-07): DevTools Network throttled to "Slow 4G" should show 3 separate chunk fetches after main JS evaluates; no FOUC; no CLS
- CLS verification via Lighthouse: Suspense `py-20` fallback preserves vertical rhythm during chunk hydration

---
*Phase: 04-polish-performance*
*Completed: 2026-05-08*
