---
gsd_state_version: 1.0
milestone: v3.5
milestone_name: Themes, Projects & Production
status: planning
stopped_at: Roadmap created — ready for Phase 5 planning
last_updated: "2026-05-05T00:00:00.000Z"
last_activity: 2026-05-05
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)

**Core value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos.
**Current focus:** Phase 05 — theme-tech-debt (not started)

## Current Position

Phase: 05
Plan: Not started
Status: Roadmap approved — ready to plan Phase 5
Last activity: 2026-05-05

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity (v3.4 baseline):**

- Total plans completed (v3.4): 23
- Timeline: 16 days (2026-04-21 → 2026-05-07)
- Files modified: 111

**v3.5 By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 05 | TBD | - | - |
| 06 | TBD | - | - |
| 07 | TBD | - | - |

*Updated after each plan completion*

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

Last session: 2026-05-05
Stopped at: Roadmap created for v3.5 — ROADMAP.md + REQUIREMENTS.md written
Resume file: None
