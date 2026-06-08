# Requirements: Carlos Montoya Portfolio — v3.9

**Defined:** 2026-06-08
**Milestone:** v3.9 Game Mode Polish
**Core Value:** The hero section and overall first impression must stop recruiters mid-scroll, make them want to learn more about Carlos, and convert visits into engineering conversations.

## v3.9 Requirements

Micro-milestone — pure polish/parity on v3.8 Game Mode. Two UX issues that surfaced in the first real post-v3.8 session.
Phase numbering continues from v3.8 → **starts at Phase 18**.

### Game Mode Polish

- [ ] **POLISH-01** Visitor landing on game mode sees the constellation **above the fold** without scrolling, on every standard viewport: desktop ≥1024px, tablet ~768px, mobile ~390px. Filters bar must NOT push the constellation below the fold on initial load. Constellation visible + minimum 1 visible node within the first viewport on all 3 breakpoints.
- [ ] **POLISH-02** Constellation never reads as static — perceptible ambient motion (or visually equivalent affordance) on **every render path including SVG**. Phase 17 ambient drift/glow pulse/halo brighten currently fires WebGL-only; SVG users (reduced-motion gated, save-data, <1024px viewport, no-WebGL clients) see a fully static rendering. Solution must keep `prefers-reduced-motion: reduce` users on the static path (a11y locked) but every other render path gets motion.

## Constraints (carried from v3.8 — still active)

- Lighthouse mobile HARD gate: Perf ≥95 / A11y 100 / BP 100 / SEO 100 — must not regress. Re-verify on milestone close.
- Mobile chunk gz budget: ≤ 38.82 kB (current 8.91 kB gz). POLISH-02 SVG motion must not bloat mobile chunk over the ceiling.
- WCAG 2.1 AA contrast holds in dark and light themes.
- Bilingual EN+ES — no new translation keys expected (polish is layout + animation only).
- No new heavy deps (zero npm install if avoidable).

## Out of Scope (for v3.9)

| Feature | Reason |
|---------|--------|
| New game-mode features (scoring, sharing, tutorial) | Pure polish milestone, not feature expansion |
| Redesigning filter bar UX | Layout fix only — chip cluster/slider/reset stay as Phase 16 shipped them |
| Custom domain andresmontoyat.co + DNS (DEPLOY-02) | Carried as deferred from v3.7 — separate milestone |
| Plan 11-05 deployed-URL Lighthouse verdict | Carried as deferred from v3.7 — Phase 17 cleared local gate; deployed gate is v3.10+ |
| VIS-05 claude-kanban + caveman cards | Carries from v3.6 — separate scope |
| DIAGRAMS-01 cross-repo architecture diagrams | Carries from v3.6 — separate scope |
| New WebGL features (depth, parallax, particles) | Out of polish scope — adds complexity for marginal lift |

## Deferred (carried from v3.7 — site live on *.vercel.app, auto-deploy verified)

Resume file: `.planning/phases/11-vercel-deploy-uat-gate/11-05-PLAN.md`

| ID | Carried item | Reason |
|----|--------------|--------|
| DEPLOY-01 (gate) | Lighthouse mobile gate verdict against deployed `*.vercel.app` URL (Plan 11-05) | Phase 17 cleared local gate; deployed-URL verdict separate |
| DEPLOY-02 | Custom domain andresmontoyat.co + DNS + HTTPS | Carried |
| DEPLOY-03 | PR preview deploys + OG card validation | Carried |

## Traceability

| REQ-ID | Phase(s) | Status |
|--------|----------|--------|
| POLISH-01 | Phase 18 | Pending |
| POLISH-02 | Phase 19 | Pending |

**Coverage:** 2/2 v3.9 requirements mapped. One requirement per phase (micro-milestone). No orphans.
