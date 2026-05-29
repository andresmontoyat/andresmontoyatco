---
gsd_state_version: 1.0
milestone: v3.8
milestone_name: Game Mode
status: planning
stopped_at: "Milestone v3.8 started (Game Mode). Defining requirements → roadmap. Spec approved: docs/superpowers/specs/2026-05-29-game-mode-design.md"
last_updated: "2026-05-29T14:50:00.000Z"
last_activity: 2026-05-29 -- Milestone v3.8 Game Mode started
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29 — v3.8 milestone open)

**Core value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos — and convert visits into engineering conversations.
**Current focus:** v3.8 Game Mode — interactive skill-constellation landing.
**Design source of truth:** `docs/superpowers/specs/2026-05-29-game-mode-design.md`

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-05-29 — Milestone v3.8 started

## Milestone Scope (v3.8 Game Mode)

8 REQs, phases continue from v3.7 → start at Phase 14.

- **GAME-01** Adaptive constellation render — WebGL desktop / SVG-DOM mobile (same data, two intensities)
- **GAME-02** Skill graph — nodes=skill, edges=co-occurrence, category clustering
- **GAME-03** Filters — multi-skill + year/timeline + categories + reset
- **GAME-04** Floating bilingual ExperienceCard on skill select + CV CTA
- **GAME-05** Game/dev toggle — default game, persisted localStorage (`cam-viewmode`) + `?mode=`
- **GAME-06** A11y (keyboard nodes, dialog cards, sr-only fallback, reduced-motion) + SEO
- **GAME-07** Hold Lighthouse mobile HARD gate + perf budget
- **TEST-01** Vitest + RTL test infrastructure (pays down debt deferred 9 milestones)

## v3.8 Decisions (logged at milestone open)

- **D-v3.8-SCOPE**: Feature inside existing portfolio repo; new milestone, NOT new-project / not a repo replace.
- **D-v3.8-METAPHOR**: Skill constellation; **node = skill** (job secondary; click skill → experiences as cards).
- **D-v3.8-NATURE**: Playable interactive visualization — explorable/playful, no objective, no win/lose.
- **D-v3.8-DEFAULT**: Game mode is the default landing; toggle to dev view persisted.
- **D-v3.8-ADAPTIVE**: WebGL desktop / SVG-DOM mobile resolves the conflict between game-default and the HARD Lighthouse mobile gate. DOM fallback doubles as SEO + a11y.
- **D-v3.8-TEST**: Introduce Vitest + RTL this milestone (test-infra debt paydown).
- **D-v3.8-PHASES**: Phase numbering continues → v3.8 starts at Phase 14.

## v3.7 → v3.8 Pivot (2026-05-29)

- **D-PIVOT**: Paused v3.7 (Production Deploy) to start v3.8 (Game Mode). Site already live + auto-deploy verified.
- **Deploy carried as deferred** (site live on `*.vercel.app`):
  - **11-05 Lighthouse gate verdict** — not yet run against production; still HARD gate before custom-domain cutover.
  - **DEPLOY-02** custom domain andresmontoyat.co + DNS.
  - **DEPLOY-03** PR preview deploys + OG validation.
  - Resume file (when deploy resumes): `.planning/phases/11-vercel-deploy-uat-gate/11-05-PLAN.md`

## Accumulated Decisions (historical, from v3.6/v3.7 — still constrain the codebase)

- **D-v3.6-CSS-VAR**: Tailwind config references `var(--color-*)` — theme system token-driven.
- **D-v3.6-BRAND**: Blue-500 + emerald-500 palette in both modes; WCAG AA holds.
- **D-v3.6-HERO-VARIANT-C**: `<picture>` + WebP 800w/1600w + sharp pipeline + theme-aware `--hero-*` CSS vars.
- **D-v3.6-AI-SECTION**: Lazy-load + bilingual `t.*` namespace + scroll-spy pattern (reusable template).
- **D-theme/lang Context pattern**: ThemeContext/LanguageContext = provider + hook + localStorage key. ViewModeContext (v3.8) mirrors this.

## Blockers/Concerns Entering v3.8

- **WebGL library choice** (three.js vs react-three-fiber vs thin force-graph wrapper) — bundle vs ergonomics; resolve in planning.
- **Desktop breakpoint** for WebGL activation — resolve in planning.
- **Lighthouse mobile gate risk**: game is default landing; must keep mobile path light enough to hold Perf ≥95. Adaptive render is the mitigation.
- **Test-infra is brand new** (Vitest+RTL) — first test setup in the project; budget for scaffolding.

## Backlog / Out of Scope (for v3.8)

- Deploy/domain (carried from v3.7 — see Pivot above)
- Text search in game mode, sound, tutorial/onboarding, URL-encoded filter state, achievement animations, WebGL on mobile
- VIS-05 (claude-kanban + caveman cards), DIAGRAMS-01 (cross-repo diagrams)
- VIS-02 (company logos), VIS-04 (testimonials), ASEO-01/02/03, INTX-01/02/03

## Session Continuity

Last session: 2026-05-29 — Brainstormed v3.8 Game Mode, design spec approved + committed (1ba2ea1). Started milestone v3.8: PROJECT.md updated, STATE.md reset. Next: define REQUIREMENTS.md → roadmap.
Stopped at: Milestone v3.8 open, defining requirements.
Resume file: —
