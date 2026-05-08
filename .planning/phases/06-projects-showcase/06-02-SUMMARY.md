---
phase: 06-projects-showcase
plan: 02
subsystem: navigation + app-composition
tags: [nav, scroll-spy, lazy-load, react-suspense, projects]
dependency_graph:
  requires: ["06-01"]
  provides: ["Projects section navigable via Nav scroll-spy", "Projects lazy chunk in build"]
  affects: ["src/components/Nav.js", "src/App.js"]
tech_stack:
  added: []
  patterns: ["React.lazy + Suspense code-splitting", "SECTION_IDS scroll-spy array"]
key_files:
  modified:
    - src/components/Nav.js
    - src/App.js
decisions:
  - "Insert 'projects' in SECTION_IDS between 'experience' and 'contact' — maintains document-order scroll-spy highlight"
  - "Use existing links-array pattern in both DesktopNav and MobileMenu — no structural changes needed"
  - "Match existing SectionFallback shape for Projects Suspense boundary"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-08"
  tasks_completed: 2
  files_modified: 2
---

# Phase 6 Plan 2: Nav + App Wiring for Projects — Summary

**One-liner:** Wired Projects into Nav scroll-spy (SECTION_IDS + DesktopNav + MobileMenu) and App.js lazy boundary between Experience and Contact, emitting a separate `Projects-DucOh_hO.js` chunk.

## What Was Done

### Task 1 — Nav.js: SECTION_IDS + DesktopNav + MobileMenu

File: `src/components/Nav.js`

Three minimal edits:
- `SECTION_IDS` updated from `['about','skills','experience','contact']` to `['about','skills','experience','projects','contact']`
- `DesktopNav` links array: `{ id: 'projects', label: t.nav.projects }` inserted between experience and contact entries
- `MobileMenu` links array: same entry inserted in same position

All existing nav elements preserved: Logomark, ProgressBar, LangPill, ThemeToggle, Hamburger button, aria attributes, focus-trap/Escape logic, portal rendering.

Commit: `36233f3`

### Task 2 — App.js: lazy import + Suspense boundary

File: `src/App.js`

Two edits:
- Added `const Projects = React.lazy(() => import('./components/Projects'))` immediately after the Experience lazy import
- Added `<Suspense fallback={SectionFallback}><Projects /></Suspense>` between the Experience and Contact Suspense blocks inside `<main id="main">`

SkipLink, ThemeProvider, LanguageProvider, main#main, and all existing Suspense boundaries for Experience/Contact/Footer preserved unchanged.

Commit: `8de3a3d`

## Verification Results

| Check | Result |
|---|---|
| `grep -c "'projects'" src/components/Nav.js` | 3 (SECTION_IDS + DesktopNav + MobileMenu) |
| `grep -c "t.nav.projects" src/components/Nav.js` | 2 (DesktopNav + MobileMenu) |
| `grep -cE "ThemeToggle\|LangPill" src/components/Nav.js` | 6 |
| `grep -c "Projects" src/App.js` | 2 |
| `grep -c "Suspense" src/App.js` | 9 |
| `grep -c 'id="main"' src/App.js` | 1 |
| `grep -c "SkipLink" src/App.js` | 2 |
| `npm run build` exit code | 0 |
| Lazy chunk emitted | `dist/assets/Projects-DucOh_hO.js` (4.74 kB) |
| `npm run lint` errors | 0 errors (4 pre-existing warnings) |

Note on `href="#projects"` literal check: both menus use `href={\`#${l.id}\`}` template literal rendering — no literal `href="#projects"` string exists in source, but the rendered output is correct. Both `t.nav.projects` occurrences confirm both menus include the Projects link.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None in the files modified by this plan. Projects.js (from 06-01) renders placeholder project data from `src/data/projects.js` — that stub is tracked in 06-01-SUMMARY.md.

## Self-Check: PASSED

- `src/components/Nav.js` — FOUND
- `src/App.js` — FOUND
- Commit `36233f3` — FOUND
- Commit `8de3a3d` — FOUND
- `dist/assets/Projects-DucOh_hO.js` — FOUND
