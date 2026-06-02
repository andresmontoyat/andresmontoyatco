---
gsd_state_version: 1.0
milestone: v3.8
milestone_name: Game Mode
status: executing
stopped_at: Phase 15 UI-SPEC approved
last_updated: "2026-06-02T02:50:26.010Z"
last_activity: 2026-06-02 -- Phase 15 execution started
progress:
  total_phases: 18
  completed_phases: 1
  total_plans: 10
  completed_plans: 6
  percent: 6
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29 — v3.8 milestone open)

**Core value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos — and convert visits into engineering conversations.
**Current focus:** Phase 15 — accessible-constellation-seo-fallback
**Design source of truth:** `docs/superpowers/specs/2026-05-29-game-mode-design.md`

## Current Position

Phase: 15 (accessible-constellation-seo-fallback) — EXECUTING
Plan: 1 of 3
Status: Executing Phase 15
Last activity: 2026-06-02 -- Phase 15 execution started

## v3.8 Phase Structure (created 2026-05-29)

Coarse granularity → 4 phases. Build order keeps the accessible/light path before the heavy WebGL
enhancement so the Lighthouse mobile gate is never at risk.

- **Phase 14 — Foundation: Data Layer, ViewMode Toggle & Test Infra** → GAME-02 (derivation), GAME-05, TEST-01
- **Phase 15 — Accessible Constellation & SEO Fallback** → GAME-01 (contract + SVG path), GAME-02 (render), GAME-06
- **Phase 16 — Filters & Floating ExperienceCard** → GAME-03, GAME-04
- **Phase 17 — WebGL Desktop Renderer & Lighthouse Gate** → GAME-01 (WebGL adapter), GAME-07

## Milestone Scope (v3.8 Game Mode)

8 REQs, phases continue from v3.7 → 14–17.

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
- **D-v3.8-ORDER** (roadmap 2026-05-29): Light/SVG path (Phase 15) + filters/cards (Phase 16) ship BEFORE the WebGL enhancement (Phase 17), so GAME-07 / Lighthouse gate is gated behind the proven gate-safe baseline. TEST-01 lands in Phase 14 so pure graph/filter logic is tested as it's built.

## v3.7 → v3.8 Pivot (2026-05-29)

- **D-PIVOT**: Paused v3.7 (Production Deploy) to start v3.8 (Game Mode). Site already live + auto-deploy verified.
- **Deploy carried as deferred** (site live on `*.vercel.app`):
  - **11-05 Lighthouse gate verdict** — not yet run against production; still HARD gate before custom-domain cutover.
  - **DEPLOY-02** custom domain andresmontoyat.co + DNS.
  - **DEPLOY-03** PR preview deploys + OG validation.
  - Resume file (when deploy resumes): `.planning/phases/11-vercel-deploy-uat-gate/11-05-PLAN.md`
  - v3.7 phases 11–13 retained in ROADMAP.md as DEFERRED (reserved, NOT renumbered).

## Plan 14-01 Decisions (2026-05-29)

- **D-14-01-TEST**: Vitest 2.1.9 (2.2.x not yet published) + RTL test block colocated inside vite.config.js to preserve esbuild.loader:jsx for .js test files; 36 tests green.
- **D-14-01-GRAPH**: buildConstellationGraph() pure fn; CURRENT_YEAR=2026 constant (no new Date()) for deterministic output; GCP→Google Cloud alias resolution before counting nodes.
- **D-14-01-LAYOUT**: Deterministic radial category-centroid layout chosen over d3-force — zero new dependencies, trivially deterministic, no d3-force in client bundle.

## Plan 14-02 Decisions (2026-05-29)

- **D-14-02-LOCALSTORAGE-BRIDGE**: Node.js 22+ exposes native localStorage on globalThis — vitest populateGlobal skips it (already defined); bridged jsdom.window.localStorage to window/globalThis in setup.js so component tests and app code share the same jsdom store.
- **D-14-02-VIEWMODE-PROVIDER**: ViewModeProvider placed inside LanguageProvider; inner MainContent component used to call useViewMode() inside provider tree (mirrors SkipLink pattern).
- **D-14-02-GAME-PLACEHOLDER**: Game-mode branch renders plain section + h1 + p with real DOM text (no aria-hidden); Phase 15 replaces this block with the constellation renderer.

## Accumulated Decisions (historical, from v3.6/v3.7 — still constrain the codebase)

- **D-v3.6-CSS-VAR**: Tailwind config references `var(--color-*)` — theme system token-driven.
- **D-v3.6-BRAND**: Blue-500 + emerald-500 palette in both modes; WCAG AA holds.
- **D-v3.6-HERO-VARIANT-C**: `<picture>` + WebP 800w/1600w + sharp pipeline + theme-aware `--hero-*` CSS vars.
- **D-v3.6-AI-SECTION**: Lazy-load + bilingual `t.*` namespace + scroll-spy pattern (reusable template).
- **D-theme/lang Context pattern**: ThemeContext/LanguageContext = provider + hook + localStorage key. ViewModeContext (v3.8) mirrors this.

## Blockers/Concerns Entering v3.8

- **WebGL library choice** (three.js vs react-three-fiber vs thin force-graph wrapper) — bundle vs ergonomics; resolve in Phase 17 planning.
- **Desktop breakpoint** for WebGL activation — resolve in Phase 15/17 planning.
- **Lighthouse mobile gate risk**: game is default landing; must keep mobile path light enough to hold Perf ≥95. Adaptive render is the mitigation; gate re-verified at Phase 17 close.
- **Test-infra is brand new** (Vitest+RTL) — first test setup in the project; Phase 14 budgets for scaffolding.

## Backlog / Out of Scope (for v3.8)

- Deploy/domain (carried from v3.7 — see Pivot above)
- Text search in game mode, sound, tutorial/onboarding, URL-encoded filter state, achievement animations, WebGL on mobile
- VIS-05 (claude-kanban + caveman cards), DIAGRAMS-01 (cross-repo diagrams)
- VIS-02 (company logos), VIS-04 (testimonials), ASEO-01/02/03, INTX-01/02/03

## Session Continuity

Last session: 2026-06-01T21:44:35.326Z
Stopped at: Phase 15 UI-SPEC approved
Resume file: .planning/phases/15-accessible-constellation-seo-fallback/15-UI-SPEC.md
