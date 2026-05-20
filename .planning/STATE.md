---
gsd_state_version: 1.0
milestone: v3.6
milestone_name: — AI Practice & Brand Refresh (CLOSED 2026-05-20)
status: v3.6 archived. Awaiting v3.7 Production Deploy kickoff via /gsd-new-milestone.
stopped_at: "Milestone v3.6 closed. Next: /clear then /gsd-new-milestone (questioning → research → requirements → roadmap for v3.7)"
last_updated: "2026-05-20T20:45:00.000Z"
last_activity: "2026-05-20 — v3.6 milestone closed: archived ROADMAP+REQUIREMENTS+AUDIT to .planning/milestones/, evolved PROJECT.md, reorganized ROADMAP.md, MILESTONES.md entry appended"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20 after v3.6 close)

**Core value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos — and now: convert visits into engineering conversations.
**Current focus:** Start v3.7 Production Deploy via `/gsd-new-milestone` — UAT pre-deploy gate + Vercel deploy + custom domain + PR previews.

## Current Position

Milestone: v3.6 archived (closed 2026-05-20). v3.7 not yet opened.
Phase: 0 of v3.7 (pre-kickoff)
Plan: n/a
Status: Awaiting `/gsd-new-milestone` to formally open v3.7 with refined REQs and phase list.

## Shipped Milestones

- **v3.4** (2026-05-07) — Brownfield redesign baseline; Lighthouse 98/100/100/100
- **v3.5** (2026-05-12, partial) — Themes + Projects shipped; deploy deferred
- **v3.6** (2026-05-20) — Brand palette swap + theme root-cause fix + hero photo + AI / Claude Code section; deploy still deferred to v3.7. Closed without git tag.

## Provisional v3.7 Scope (refine via /gsd-new-milestone)

- **UAT-GATE** — Phase 10 UAT Tests 3-11 against production build (Test #11 Lighthouse mobile = HARD gate)
- **DEPLOY-01** — Vercel auto-deploy from `main` (vite-react preset, output `dist/`)
- **DEPLOY-02** — Custom domain `andresmontoyat.co` + DNS records → Vercel; HTTPS via auto-cert
- **DEPLOY-03** — PR preview deploys + OG card validation

Backlog candidates for v3.7 promotion: 999.1-deploy-vercel-auto, 999.2-deploy-custom-domain, 999.3-deploy-pr-preview.

## Deferred Items (acknowledged at v3.6 close)

Items explicitly carried forward from v3.6 close on 2026-05-20:

| Category | Item | Status | Notes |
|----------|------|--------|-------|
| uat | Phase 10 Test #3 (theme prod build) | skip → v3.7 pre-deploy gate | Lighthouse + UAT executed against `dist/` in v3.7 Phase 1 |
| uat | Phase 10 Test #4 (localStorage persistence) | skip → v3.7 pre-deploy gate | — |
| uat | Phase 10 Test #5 (hero photo at viewports) | skip → v3.7 pre-deploy gate | — |
| uat | Phase 10 Test #6 (hero photo light mode) | skip → v3.7 pre-deploy gate | — |
| uat | Phase 10 Test #7 (reduced-motion) | skip → v3.7 pre-deploy gate | — |
| uat | Phase 10 Test #8 (nav scroll-spy click) | skip → v3.7 pre-deploy gate | — |
| uat | Phase 10 Test #9 (AI section CTAs + EN/ES) | skip → v3.7 pre-deploy gate | — |
| uat | Phase 10 Test #10 (WCAG AA light mode contrast) | skip → v3.7 pre-deploy gate | — |
| uat | Phase 10 Test #11 (Lighthouse mobile audit) | skip → v3.7 pre-deploy HARD gate | Blocks Vercel production deploy |
| phase | Phase 11 DIAGRAMS-01 (cross-repo diagrams) | de-scoped → future milestone | Re-roadmap when bandwidth permits |
| backlog | VIS-05 (claude-kanban + caveman cards) | backlog | AI-01 shipped 3 of original 5 featured apps |
| backlog | Test infrastructure | deferred 8th consecutive milestone | Vitest/Playwright/RTL — revisit if regression cost climbs |
| deploy | DEPLOY-01 Vercel | → v3.7 | Carries from v3.5/v3.6 |
| deploy | DEPLOY-02 custom domain | → v3.7 | Carries from v3.5/v3.6 |
| deploy | DEPLOY-03 PR previews | → v3.7 | Carries from v3.5/v3.6 |

## Accumulated Decisions (from v3.6)

- **D-v3.6-CSS-VAR**: Tailwind config refactored to reference `var(--color-*)` instead of hardcoded hex. Theme system now genuinely token-driven — future palette work needs only `index.css` updates.
- **D-v3.6-BRAND**: Blue-500 + emerald-500 palette locks in for v3.6+; WCAG AA holds in both modes.
- **D-v3.6-HERO-VARIANT-C**: `<picture>` + WebP 800w/1600w + theme-aware `--hero-*` CSS vars + sharp pipeline as reference pattern for any future hero/imagery work.
- **D-v3.6-AI-SECTION**: Lazy-load Suspense + bilingual `t.claude.*` namespace + scroll-spy entry mirror Projects pattern — reusable template for any new section addition.
- **D-v3.6-AI-DOC-DRIFT**: AI-01 shipped 3 featured-app cards instead of 5 (VIS-05 backlog). ROADMAP Phase 9 SC2 patched: "7 counters / 5 services" matches shipped section.
- **D-v3.6-CLOSE**: Phase 10 UAT closed early (9/11 skip → v3.7 pre-deploy gate). Conscious milestone-closure decision, debt tracked in audit + Deferred Items above.
- **D-v3.6-NO-TAG**: No git tag at close — consistent with v3.5; tag deferred until production site is live (v3.7).

## Blockers/Concerns Entering v3.7

- Vercel account + DNS access prerequisites: need Vercel login + `vercel link` + DNS registrar credentials (CNAME/A records for `andresmontoyat.co`)
- Lighthouse mobile audit (Test #11) must hold v3.4 baseline 98/100/100/100 — risk if hero photo / AI section regressed performance vs baseline
- 8 consecutive milestones deferring test infrastructure — first sign of regression debt warrants revisit decision

## Session Continuity

Last session: 2026-05-20T20:45:00.000Z — v3.6 milestone close complete
Stopped at: All v3.6 archive work done. Next is `/clear` + `/gsd-new-milestone` to open v3.7.
Resume file: n/a (clean milestone-boundary state)
