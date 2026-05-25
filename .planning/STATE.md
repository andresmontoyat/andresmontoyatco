---
gsd_state_version: 1.0
milestone: v3.7
milestone_name: Production Deploy
status: executing
stopped_at: "Phase 11 CONTEXT.md + DISCUSSION-LOG.md committed (5a30b2c); next: `/clear` then `/gsd-plan-phase 11`"
last_updated: "2026-05-25T14:15:11.384Z"
last_activity: 2026-05-25 -- Phase 11 execution started
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 5
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20 — v3.7 milestone open)

**Core value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos — and convert visits into engineering conversations.
**Current focus:** Phase 11 — vercel-deploy-uat-gate

## Current Position

Phase: 11 (vercel-deploy-uat-gate) — EXECUTING
Plan: 1 of 5
Status: Executing Phase 11
Last activity: 2026-05-25 -- Phase 11 execution started

## Milestone Scope (v3.7)

3 REQs across 3 phases (continues numbering from v3.6; Phase 11 slot reused since DIAGRAMS-01 stayed backlog):

- **Phase 11 — DEPLOY-01 + UAT-GATE** Vercel auto-deploy from main + pre-deploy gate (Tests 3-10 against local `npx serve dist`; Test #11 Lighthouse against deployed Vercel URL — HARD gate)
- **Phase 12 — DEPLOY-02** Custom domain andresmontoyat.co + DNS (CNAME/A) → Vercel; HTTPS auto-cert; OG card validates on canonical domain
- **Phase 13 — DEPLOY-03** PR preview deploys + OG card validation per PR

## Accumulated Decisions (from v3.6)

- **D-v3.6-CSS-VAR**: Tailwind config refactored to reference `var(--color-*)` — theme system token-driven
- **D-v3.6-BRAND**: Blue-500 + emerald-500 palette in both modes; WCAG AA holds
- **D-v3.6-HERO-VARIANT-C**: `<picture>` + WebP 800w/1600w + sharp pipeline + theme-aware `--hero-*` CSS vars
- **D-v3.6-AI-SECTION**: Lazy-load + bilingual `t.*` namespace + scroll-spy pattern (reusable template)
- **D-v3.6-AI-DOC-DRIFT**: AI-01 shipped 3 featured-app cards instead of 5 (VIS-05 backlog)
- **D-v3.6-CLOSE**: Phase 10 UAT closed early; 9 tests carried to v3.7 Phase 11 as pre-deploy gate
- **D-v3.6-NO-TAG**: Tag deferred until production live (v3.7)

## v3.7 Decisions (logged at milestone open)

- **D-v3.7-SEQ**: Deploy-first → DNS-after sequence (user preference 2026-05-20). Verify on `*.vercel.app` URL before DNS cutover. Reduces blast radius if deploy config has issues.
- **D-v3.7-UAT-FOLD**: UAT pre-deploy gate folded into Phase 11 (not standalone phase). Tests 3-10 against local `npx serve dist`; Test #11 Lighthouse mobile against deployed Vercel URL.
- **D-v3.7-LIGHTHOUSE-GATE**: Test #11 Lighthouse mobile is HARD gate — must hold v3.4 baseline 98/100/100/100. Blocks Phase 12 custom-domain cutover.
- **D-v3.7-TAG**: Tag `v3.7` once production live at `andresmontoyat.co`. First tag since v3.4 — implicitly covers v3.5/v3.6 deliveries as "site went live with v3.7".

## Blockers/Concerns Entering v3.7

- **Vercel account + auth**: requires `vercel login` + `vercel link` before Phase 11 (provision project, get deploy URL)
- **DNS registrar credentials**: required for Phase 12 (CNAME/A records for `andresmontoyat.co`). Confirm registrar (likely Namecheap/Cloudflare/GoDaddy — verify before Phase 12)
- **Lighthouse mobile baseline risk**: hero photo (Phase 8) + AI section (Phase 9) added since v3.4. Risk if combined payload regressed Performance below 95.
- **8 consecutive milestones deferring test infrastructure** — first sign of regression debt warrants revisit decision post-deploy

## Backlog / Out of Scope (for v3.7)

- VIS-05 (claude-kanban + caveman cards)
- DIAGRAMS-01 (cross-repo diagrams, backlog 999.13)
- VIS-02 (company logos), VIS-04 (testimonials)
- ASEO-01/02/03 (JSON-LD, WebP pipeline, sitemap)
- INTX-01/02/03 (contact form backend, blog, GH activity)
- Test infrastructure (Vitest / Playwright / RTL) — 9th milestone deferred

## Session Continuity

Last session: 2026-05-20T21:15:00.000Z — Phase 11 context discussion complete
Stopped at: Phase 11 CONTEXT.md + DISCUSSION-LOG.md committed (5a30b2c); next: `/clear` then `/gsd-plan-phase 11`
Resume file: `.planning/phases/11-vercel-deploy-uat-gate/11-CONTEXT.md`
