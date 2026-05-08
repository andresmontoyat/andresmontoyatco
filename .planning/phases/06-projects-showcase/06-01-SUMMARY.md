---
phase: 06-projects-showcase
plan: "01"
subsystem: projects-section
tags: [projects, data, i18n, component, grid, animations]
dependency_graph:
  requires: [phase-03-content-animations, phase-05-theme-tech-debt]
  provides: [src/data/projects.js, src/components/Projects.js, translations.projects]
  affects: [src/i18n/translations.js]
tech_stack:
  added: []
  patterns: [useInView+animate-on-scroll stagger, bilingual-data-module, section-scaffold, brand-gradient-fallback]
key_files:
  created:
    - src/data/projects.js
    - src/components/Projects.js
  modified:
    - src/i18n/translations.js
decisions:
  - "Followed actual useInView(ref, options) -> inView signature from hooks/useInView.js; plan scaffold showed destructure pattern but hook returns scalar — aligned with Experience.js pattern"
  - "4th project slug ai-coding-workflows derives from current Coderio role AI tooling bullets"
  - "Buttons div rendered only when liveUrl or githubUrl is truthy (all null this phase)"
metrics:
  duration: "4 minutes"
  completed_date: "2026-05-08"
  tasks_completed: 3
  files_modified: 3
---

# Phase 06 Plan 01: Projects Data + Component Summary

**One-liner:** Bilingual PROJECTS data module, translations keys, and responsive animated card grid component with brand-gradient screenshot fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create projects data module | dd2f203 | src/data/projects.js |
| 2 | Add projects translation keys | d7fdab6 | src/i18n/translations.js |
| 3 | Create Projects section component | 6192c3f | src/components/Projects.js |

## PROJECTS Entry Slugs and Tech Tokens

| Slug | Tech chips |
|------|-----------|
| `person-api` | Java 21, Spring Boot, PostgreSQL, Hexagonal Architecture, Testcontainers |
| `gudd-api` | Java, Spring Boot, Kafka, Redis, AWS |
| `blockchain-credentials` | Kotlin, Spring Boot, Ethereum, Keycloak, KrakenD, Kubernetes, GKE |
| `ai-coding-workflows` | Claude Code, GitHub Copilot, TDD, Hexagonal Architecture, Spring Boot |

## Translation Keys Added

- `en.nav.projects` = `'Projects'`
- `es.nav.projects` = `'Proyectos'`
- `en.projects.label` = `'PROJECTS'`
- `es.projects.label` = `'PROYECTOS'`
- `en.projects.h2` = `'Selected work'`
- `es.projects.h2` = `'Trabajo destacado'`
- `en.projects.intro` = `'A focused look at the systems I have shipped recently.'`
- `es.projects.intro` = `'Una mirada enfocada a los sistemas que he entregado recientemente.'`
- `en.projects.live` = `'View Live'` / `es.projects.live` = `'Ver Live'`
- `en.projects.github` = `es.projects.github` = `'GitHub'`

## Component Architecture

`Projects.js` default-exports a function component that:
- Uses two `useRef`+`useInView` pairs — one for the header block, one for the grid — matching Experience.js pattern
- Maps `PROJECTS` to `ProjectCard` sub-components with 100ms stagger via `transitionDelay`
- `ProjectCard` renders `aspect-video` screenshot slot with `bg-brand-gradient` fallback when `project.screenshot` is null
- Conditional button row only rendered when at least one URL is truthy (all null this phase, so no buttons render)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected useInView hook call signature**
- **Found during:** Task 3 implementation
- **Issue:** Plan scaffold showed `const [ref, inView] = useInView({ threshold: 0.25 })` (returning array with ref), but actual `src/hooks/useInView.js` signature is `useInView(ref, options) -> inView` (takes ref, returns scalar boolean)
- **Fix:** Used `useRef(null)` + `useInView(ref, { threshold })` pattern matching Experience.js exactly
- **Files modified:** src/components/Projects.js
- **Commit:** 6192c3f

## Known Stubs

| File | Field | Reason |
|------|-------|--------|
| src/data/projects.js | `liveUrl: null` (all 4 entries) | Placeholder — user provides URLs post-deploy |
| src/data/projects.js | `githubUrl: null` (all 4 entries) | Placeholder — user provides URLs post-deploy |
| src/data/projects.js | `screenshot: null` (all 4 entries) | Placeholder — user drops files at `public/projects/{slug}.webp` |

These stubs are **intentional** per plan D-01/D-08/D-10 and do not prevent the plan's goal (building block delivery). Plan 06-02 wires the section into App.js + Nav. Real content is user-provided post-deploy.

## Verification

- `npm run build` exits 0 (962ms, all assets generated)
- `npm run lint` exits with 0 errors (4 pre-existing warnings in Experience.js + useActiveSection.js, unrelated)

## Self-Check: PASSED
