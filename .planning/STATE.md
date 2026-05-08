---
gsd_state_version: 1.0
milestone: v3.5
milestone_name: — Themes, Projects & Production
status: executing
stopped_at: Completed 06-01-PLAN.md
last_updated: "2026-05-08T17:26:30.306Z"
last_activity: 2026-05-08
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 6
  completed_plans: 5
  percent: 83
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)

**Core value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos.
**Current focus:** Phase 06 — projects-showcase

## Current Position

Phase: 06 (projects-showcase) — EXECUTING
Plan: 2 of 2
Status: Ready to execute
Last activity: 2026-05-08

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity (v3.4 baseline):**

- Total plans completed (v3.4): 23
- Timeline: 16 days (2026-04-21 → 2026-05-07)
- Files modified: 111

**v3.5 By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 05 | 4 | - | - |
| 06 | TBD | - | - |
| 07 | TBD | - | - |

*Updated after each plan completion*
| Phase 05-theme-tech-debt P01 | 8 | 3 tasks | 4 files |
| Phase 05-theme-tech-debt P02 | 3min | 3 tasks | 3 files |
| Phase 05 P03 | 5min | 3 tasks | 3 files |
| Phase 05-theme-tech-debt P04 | 4min | 3 tasks | 2 files |
| Phase 06-projects-showcase P01 | 2 | 3 tasks | 3 files |

## Accumulated Context

### Decisions (carried from v3.4)

- **D-01**: In-place component modification — no V2 files, retain git history per file
- **D-02/03**: Native CSS scroll-behavior + custom IntersectionObserver hooks (useActiveSection, useInView) — no react-scroll, no JS animation library
- **D-05**: Mobile menu via createPortal(document.body) — avoids z-index conflicts with sticky nav
- **D-06**: Manual browser-only testing — no test infrastructure (5 consecutive phases deferred, locked to v3.6+)
- **D-13/14/15**: IntersectionObserver useInView(threshold: 0.25) + .animate-on-scroll/.is-visible CSS classes; 100ms stagger via transitionDelay; all motion-safe: prefixed

### v3.5 Locked Decisions

- Theme: Dark (default, current ink palette) + Light only — no system/prefers-color-scheme mode
- Theme persistence: localStorage key `cam-theme`
- Theme toggle UI: icon button (sun/moon) in Nav next to LangPill; ThemeContext mirrors LanguageContext pattern
- Projects data: src/data/projects.js — bilingual {en, es} object per field, mirrors experience.js shape
- Projects screenshots: public/projects/*.webp or .png — user provides; graceful degradation if absent
- Projects position in App.js: between Experience and Contact
- Deploy: Vercel — vite-react preset, build cmd `npm run build`, output `dist/`
- Domain: andresmontoyat.co (already owned) — DNS to Vercel
- Tech debt: folded into Phase 5 (not deferred to v3.6)

### Pending Todos

- User to provide project screenshots (public/projects/*.webp) before or during Phase 6 execution
- Manual DNS checkpoint required during Phase 7 (DEPLOY-02) — autonomous: false

### Blockers/Concerns

None at roadmap creation. Phase 7 has one expected manual pause for DNS propagation verification.

## Session Continuity

Last session: 2026-05-08T17:26:30.301Z
Stopped at: Completed 06-01-PLAN.md
Resume file: None
