---
phase: 04-polish-performance
plan: "02"
subsystem: infra
tags: [vite, rollup, bundle-analysis, fonts, fontsource, performance]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: vite.config.js + src/index.js + @fontsource deps
  - phase: 02-shell-hero
    provides: 2-weight typography contract (400 + 800 for Inter)
  - phase: 03-content-animations
    provides: SectionLabel font-extrabold confirmation; 2-weight contract locked
provides:
  - rollup-plugin-visualizer registered in vite.config.js (treemap, dist/stats.html)
  - npm run build:analyze script
  - Inter font imports reduced to 400 + 800 only
  - JetBrains Mono import reduced to 400 only
  - Production dep audit complete (4 deps, all active, none removable)
affects:
  - 04-05 (code splitting — reads dist/stats.html treemap)
  - 04-06 (Lighthouse — measures bundle delta from font strip)

# Tech tracking
tech-stack:
  added:
    - rollup-plugin-visualizer@5.14.0 (devDep)
  patterns:
    - Visualizer plugin registers AFTER react() plugin in plugins array (order matters — must see post-transform graph)
    - Font imports: only weights actively rendered in design system; strip everything else

key-files:
  created: []
  modified:
    - vite.config.js
    - package.json
    - package-lock.json
    - src/index.js

key-decisions:
  - "D-02 font strip: Inter 400+800 only, JBM 400 only — 5 imports stripped, 3 retained (saves ~78KB pre-gzip)"
  - "D-03 visualizer: rollup-plugin-visualizer@5.14.0 pinned; treemap template, emitFile false, open false"
  - "D-02 dep audit: all 4 production deps actively imported — @fontsource/inter, @fontsource/jetbrains-mono, react, react-dom — no removals"
  - "Parallel agent 04-01 wrote preload code into src/index.js; fixed import order and removed redundant ASI-guard semicolon per ESLint import/first + no-extra-semi rules"

patterns-established:
  - "build:analyze is an alias for vite build — visualizer runs on every build, not just analyze runs"
  - "Font weight strip: grep src/ for font-medium/semibold/bold before stripping imports — verified 0 matches"

requirements-completed:
  - SEO-03

# Metrics
duration: 2min
completed: 2026-05-08
---

# Phase 4 Plan 02: Bundle Analysis + Font Strip Summary

**rollup-plugin-visualizer wired to vite.config.js producing dist/stats.html treemap; Inter stripped to 400+800, JBM to 400 — ~78KB pre-gzip eliminated from initial payload**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-08T02:32:04Z
- **Completed:** 2026-05-08T02:34:06Z
- **Tasks:** 3 (+ 1 deviation fix)
- **Files modified:** 4

## Accomplishments

- Stripped Inter 500/600/700 and JetBrains Mono 500/600 imports — bundle ships only 2 Inter weights + 1 JBM weight as required by Phase 2/3 typography contract
- Installed rollup-plugin-visualizer@5.14.0 as devDep and registered in vite.config.js; dist/stats.html (179KB treemap) produced on every `npm run build`
- Added `npm run build:analyze` script; exits 0 on CI and macOS
- Production dep audit confirmed: all 4 deps actively imported, none removable
- Fixed lint errors left by parallel agent (import order + redundant semicolon) — 0 ESLint errors, 4 pre-existing warnings remain (intentional)

## Pre-flight Verification (Task 1 gate)

```
grep -rEn "font-medium|font-semibold|font-bold([^t]|$)" src/ | grep -v "font-bold-italic" | grep -v "extrabold"
```
Result: **zero matches** — typography contract holds, strip approved.

## Font Imports: Before / After

| Import | Before | After |
|--------|--------|-------|
| @fontsource/inter/400.css | KEEP | KEEP |
| @fontsource/inter/500.css | present | STRIPPED |
| @fontsource/inter/600.css | present | STRIPPED |
| @fontsource/inter/700.css | present | STRIPPED |
| @fontsource/inter/800.css | KEEP | KEEP |
| @fontsource/jetbrains-mono/400.css | KEEP | KEEP |
| @fontsource/jetbrains-mono/500.css | present | STRIPPED |
| @fontsource/jetbrains-mono/600.css | present | STRIPPED |

5 imports stripped, 3 retained. Estimated saving: ~78KB pre-gzip (~3 woff2 × ~24KB + 3 woff2 JBM × ~6KB + CSS files).

## dist/stats.html

- Size on first run: **178,736 bytes** (real treemap, not stub)
- Subsequent build: **179,969 bytes**
- Template: treemap
- gzipSize: true, brotliSize: true

## Production Dep Audit

All 4 production deps actively imported — none removable:

| Dep | Used in |
|-----|---------|
| @fontsource/inter | src/index.js (2 weight imports) |
| @fontsource/jetbrains-mono | src/index.js (1 weight import) |
| react | src/App.js, src/components/*, src/i18n/LanguageContext.js, src/index.js |
| react-dom | src/index.js, src/components/Nav.js |

**Audit conclusion: 4 production dependencies actively imported. None removable.**

## Task Commits

1. **Task 1: Strip Inter 500/600/700 + JBM 500/600 font imports** — `dedc366` (chore)
2. **Task 2: Install rollup-plugin-visualizer + build:analyze** — `3a1c477` (chore)
3. **Task 3: Dep audit (documentation only)** — no separate commit (no file changes)
4. **Deviation fix: lint error from parallel agent** — `e02ea59` (fix)

**Plan metadata:** (committed with docs commit below)

## Files Created/Modified

- `src/index.js` — stripped 5 font imports; fixed import order + ASI semicolon from parallel agent
- `vite.config.js` — added visualizer import + plugin registration after react()
- `package.json` — added rollup-plugin-visualizer devDep + build:analyze script
- `package-lock.json` — updated by npm install

## Decisions Made

- Stripped exactly 5 imports (Inter 500/600/700 + JBM 500/600); confirmed by pre-flight grep showing 0 uses of font-medium/semibold/bold in src/
- Visualizer plugin version resolved to 5.14.0 (npm resolved from ^5.12.0 constraint)
- `build:analyze` script uses `|| true` so `open dist/stats.html` failure on Linux/CI does not fail the script
- Parallel agent 04-01 had already modified src/index.js with preload imports — preserved their work, fixed only the lint violations (import order + ASI semicolon)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ESLint errors from parallel agent 04-01 modifications to src/index.js**
- **Found during:** Post-Task-1 lint run
- **Issue:** Parallel agent 04-01 inserted `preloadWoff2` function and `?url` imports after the `forEach` call, causing `import/first` and `no-extra-semi` ESLint errors (5 errors total)
- **Fix:** Moved all imports to top of file; removed redundant leading semicolon before array literal (function declaration above does not trigger ASI hazard)
- **Files modified:** src/index.js
- **Verification:** `npm run lint` exits with 0 errors; `npm run build` exits 0
- **Committed in:** `e02ea59`

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug from parallel execution conflict)
**Impact on plan:** Fix was necessary for lint success criterion. Preserved all work from parallel agent 04-01. No scope creep.

## Issues Encountered

- Parallel wave execution: agent 04-01 modified src/index.js between Task 1 commit and the lint verification pass, inserting preload infrastructure. Import ordering violation and ASI-guard semicolon caused 5 lint errors. Resolved inline per deviation Rule 1.

## Known Stubs

None — all deliverables are functional. dist/stats.html is a real treemap. Font imports are real.

## Next Phase Readiness

- Plan 04-05 (code splitting): read `dist/stats.html` to identify heavy chunks for React.lazy boundaries
- Plan 04-06 (Lighthouse): baseline bundle is now leaner by ~78KB; measure before/after each optimization
- Both plans inherit a verified-clean production dep graph (4 deps, all active)

---
*Phase: 04-polish-performance*
*Completed: 2026-05-08*

## Self-Check: PASSED

- FOUND: src/index.js
- FOUND: vite.config.js
- FOUND: package.json
- FOUND: .planning/phases/04-polish-performance/04-02-SUMMARY.md
- FOUND: commit dedc366 (font strip)
- FOUND: commit 3a1c477 (visualizer + build:analyze)
- FOUND: commit e02ea59 (lint fix)
- VERIFIED: grep for Inter 500/600/700 + JBM 500/600 in src/index.js = 0 matches
- VERIFIED: visualizer import present in vite.config.js
- VERIFIED: build:analyze script present in package.json
