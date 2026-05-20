---
gsd_state_version: 1.0
milestone: v3.6
milestone_name: — AI Practice & Brand Refresh
status: Phase 10 UAT closed (2 pass + 9 skip → v3.7 pre-deploy gate). Ready for milestone audit + close.
stopped_at: "v3.6 closure prep — next: /gsd-audit-milestone 3.6 then /gsd-complete-milestone 3.6, then /gsd-new-milestone v3.7 (deploy)"
last_updated: "2026-05-20T20:06:00.000Z"
last_activity: "2026-05-20 — Phase 10 UAT closed early (milestone-closure decision); doc-drift patches landed; pivoting to v3.7 deploy"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-12)

**Core value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos.
**Current focus:** v3.6 milestone closure → v3.7 deploy kickoff (Vercel)

## Current Position

Milestone: v3.6 — closing
Phase: 10 of 4 (UAT closed early)
Plan: 10-UAT.md → closed 2026-05-20
Status: All 4 active phases delivered. UAT 2/11 pass + 9/11 skip (deferred to v3.7 pre-deploy gate).

## Completed Phases (v3.6)

- **Phase 7** — Tailwind CSS-var refactor + brand palette swap (THEME-01 + COLOR-01) — verified 2026-05-12
- **Phase 8** — Hero photo integration (HERO-01) — verified 2026-05-12
- **Phase 9** — AI / Claude Code section (AI-01 + AI-01-CICD) — verified 2026-05-13 (5/5 success criteria)
- **Phase 10** — Real-browser UAT + a11y sweep — closed 2026-05-20 (2 pass, 9 skip → v3.7 gate)

## Phase 10 UAT — closure summary

- pass (2): Test #1 desktop 1440px (2026-05-18), Test #2 iPhone 14 390×844 (2026-05-20)
- skip (9): Tests 3-11 deferred to v3.7 Phase 1 as pre-deploy gate
- **Critical pre-deploy gate**: Test #11 Lighthouse mobile audit (Perf ≥95 / A11y 100 / BP 100 / SEO 100) MUST pass before Vercel production deploy

## Accumulated Context

### Decisions (carried from v3.4 / v3.5)

- **D-01**: In-place component modification — no V2 files
- **D-02/03**: Native CSS scroll-behavior + IntersectionObserver hooks
- **D-05**: Mobile menu via createPortal(document.body)
- **D-06**: Manual browser-only testing — no test infrastructure
- **D-13/14/15**: useInView(0.25) + .animate-on-scroll/.is-visible + 100ms stagger + motion-safe:

### Decisions (v3.6 closure)

- **D-v3.6-CLOSE**: Phase 10 UAT closed early with 9 tests deferred — milestone-closure decision (priority shifted to v3.7 deploy). Tests carry forward as v3.7 pre-deploy gate, not lost coverage.
- **D-v3.6-DRIFT**: AI-01 shipped with 3 featured-app cards (GSD/spring-ai-qdrant-mcp/ci-templates) instead of 5 — claude-kanban + caveman moved to backlog as VIS-05.

### Active for v3.7 (next milestone)

- **DEPLOY-01**: Vercel production deploy — auto-deploy from main, vite-react preset, build `npm run build`, output `dist/`
- **DEPLOY-02**: Custom domain andresmontoyat.co + DNS records → Vercel; HTTPS via auto-cert
- **DEPLOY-03**: Auto-preview deploys per PR with OG card validation
- **UAT-GATE**: Tests 3-11 from Phase 10 must pass before production deploy (Lighthouse mobile is hard gate)

### Pending Todos

None.

### Blockers/Concerns

- Vercel account auth + DNS coordination required for v3.7
- Lighthouse mobile audit (Test #11) is a hard pre-deploy gate — must hold v3.4 baseline 98/100/100/100

## Session Continuity

Last session: 2026-05-20T20:06:00.000Z — v3.6 closure in progress
Stopped at: STATE.md refreshed; next is /gsd-audit-milestone 3.6
Resume file: n/a (clean milestone-boundary state)
