---
gsd_state_version: 1.0
milestone: v4.0
milestone_name: Portfolio Redesign — JSON-Driven Section Refactor
status: in_progress
stopped_at: Slices 1-4 shipped to main; Slice 5 (Experience or Projects or Claude) next
last_updated: 2026-06-13T23:53:00.000Z
last_activity: 2026-06-13 -- PR #26 merged to main (a623ede squash carries Slices 1+2+3+4); 34/34 GREEN; 55.65 kB gz
progress:
  total_slices: 7
  completed_slices: 4
  remaining_slices: 3
  percent: 57
---

# Project State

## Project Reference

See: .planning/PROJECT.md (STALE — still references v3.10/v3.11 as latest shipped; not yet updated for v4.0 redesign milestone)

**Core value:** Hero + first impression must stop recruiters mid-scroll and convert visits into engineering conversations.
**Current focus:** v4.0 — strip game-mode complexity, ship clean section-by-section portfolio with JSON-driven data layer per section.
**Last shipped:** v4.0 baseline on main 2026-06-13 (PR #26 squash a623ede — Slices 1+2+3+4: purge + Contact + About + Skills).

## v4.0 Strategy

Strip every game-mode artifact (v3.8-v3.10 lineage: src/marioWorld, src/game, ViewMode context, WebGL constellation, planets-tier, OnboardingHint). Ship clean section-by-section slices, each one:

1. New `src/data/<section>.json` — bilingual `{en, es}` data contract via uniform `pick(field, lang)` helper.
2. New `<Section>.test.js` — 7 Vitest + RTL specs (section id, EN render, structured content, ES translation, schema sanity).
3. Refactor parked `<Section>.js` → v4 JSON-driven (~50 LOC). Drops `useInView`, `SectionLabel` shared component, `dangerouslySetInnerHTML`, `t.<section>` reads.
4. Strip `t.<section>` subtree from translations.js (preserve `t.nav.<section>` namespace).
5. Wire `<Section />` into App.js in canonical order (Nav → Hero → About → Skill → Experience → Projects → Claude → Contact → Footer).
6. Stacked PR onto `v4.0-slice-1-purge` integration branch (now squashed to main).

## Current Position

Slice: 4 of 7 shipped
Status: Ready to start Slice 5
Last activity: 2026-06-13T23:53Z
Progress bar: `[████████░░░░░░] 4/7 slices on main`

## Shipped Slices (on main)

- **Slice 1 — Game Purge + Base Palette** (PR #26 a623ede) — Strips game-mode + Mario-world + ViewMode + WebGL constellation. Lands dark palette tokens (#0B1020 / accent #00E5A8 + #00C2FF). App.js = Nav + Hero + Footer. Bundle-gate re-baselined (no WebGL chunk; index-*.js WARN 60 / HARD 68).
- **Slice 2 — Contact** (PR #27 79cb0eb → merged into slice-1-purge → main via #26) — 5-card grid from contact.json. v4 JSON-driven pattern established.
- **Slice 3 — About** (PR #28 99c39e1 → merged into slice-1-purge → main via #26) — 3 paragraphs + 5 quick-fact rows from about.json. Bilingual fact values. Kills `dangerouslySetInnerHTML`.
- **Slice 4 — Skills** (PR #29 f44fdc1 → merged into slice-1-purge → main via #26) — 4 categories × 29 chips from skills.json. Bilingual category titles + years suffix (`y` EN / `a` ES).

Section render order on main: Nav → Hero → About → Skill → Contact → Footer.
Final main metrics: 34/34 tests GREEN, build 55.65 kB gz.

## Remaining Slices (parked, awaiting v4 refactor)

- **Slice 5 — Experience** — Parked `Experience.js` reads `EXPERIENCE` array (`src/data/experience.js`) + `t.exp` subtree. Heaviest remaining: vertical timeline with expand/collapse state. Needs `experience.json` schema redesign (per-entry bilingual fields already in legacy data file) + `useState` for expand/collapse + `t.exp.expand`/`collapse` ARIA labels.
- **Slice 6 — Projects** — Parked `Projects.js` reads `t.projects` subtree. Smallest remaining: "Selected work" grid with live + GitHub CTAs.
- **Slice 7 — Claude Code section** — Parked `Claude.js` reads `t.claude` subtree (biggest copy block: counters + values + services + CTAs). AI sales pitch. Largest JSON file expected.

Suggested ship order: 5 → 6 → 7 (canonical nav order). Each is one PR, stacked onto current main now that v4.0 baseline is live.

## Decisions Logged in v4.0

- **D-v4.0-PURGE** — Game mode + Mario-world + WebGL constellation + ViewMode lineage REMOVED. v3.8-v3.10 work archived in git history; not carried into v4.0.
- **D-v4.0-PALETTE** — Dark palette (#0B1020 bg, #00E5A8 accent, #00C2FF secondary accent) via CSS vars + Tailwind tokens (`bg-bg`, `text-text`, `text-muted`, `bg-surface`, `border-border`, `text-accent`). Theme toggle deferred — assume single dark theme until UAT pushback.
- **D-v4.0-JSON-PER-SECTION** — Every section reads from `src/data/<section>.json`. Bilingual via `{en, es}` field shape + universal `pick(field, lang)` helper inlined per component. NO shared util module — duplicating `pick` keeps each section self-contained.
- **D-v4.0-NO-HTML-IN-DATA** — JSON contains plain text only. `<strong>` and inline HTML markup eliminated (kills `dangerouslySetInnerHTML` XSS surface). Emphasis via component-level styling if needed.
- **D-v4.0-NO-SCROLL-REVEAL** — `useInView` + `animate-on-scroll` patterns dropped. v3.x animation layer not carried into v4.
- **D-v4.0-NO-SHARED-SECTIONLABEL** — `_shared/SectionLabel` component dropped. Each section inlines its own mono-accent label pattern (`font-mono text-xs uppercase tracking-[3px] text-accent` + 10px accent bar).
- **D-v4.0-STACKED-PR-INTEGRATION** — Each slice opens a PR onto `v4.0-slice-1-purge` integration branch, not directly onto main. Final integration squash carries the full chain in one main commit. Integration branch retired post-merge; future slices base on main.

## Blockers / Concerns

- **PROJECT.md stale** — Still describes v3.10 as latest shipped + "no next milestone." Needs evolve pass to reflect v4.0 strategy + shipped baseline. Schedule before Slice 5 or at v4.0 close.
- **Theme toggle parked** — `ThemeContext` still wired but no UI toggle. Defer to post-v4.0 milestone OR drop entirely if dark-only stays.
- **Vercel deploy verification pending** — `a623ede` triggered auto-deploy on push. Real-device UAT not yet run.
- **18 stale dependabot PRs** open — None blocking; clean up at v4.0 close.
- **Local mario-world v3.11 planning commits dropped** — `9e564d9` + `7e282db` hard-reset out of local main (2026-06-13). v3.11 mario-world strategy formally retired; v4.0 supersedes.

## Backlog / Deferred (v4.0+)

| Category | Item | Status |
|----------|------|--------|
| section | Slice 5 Experience | parked Experience.js + experience.js data |
| section | Slice 6 Projects | parked Projects.js |
| section | Slice 7 Claude Code | parked Claude.js |
| theme | Light theme toggle | deferred (assess at v4.0 close) |
| copy | Hero CV download buttons | live; review at v4.0 close |
| backlog | VIS-05 claude-kanban + caveman cards | deferred (v3.6 carryover) |
| backlog | DIAGRAMS-01 cross-repo diagrams | deferred (v3.6 carryover) |
| deploy | DEPLOY-02 custom domain andresmontoyat.co | deferred (v3.7 carryover) |
| deploy | DEPLOY-03 PR preview deploys | deferred (v3.7 carryover) |
| uat | v3.9 + v3.10 carried UAT | retired with game-mode purge |

## Session Continuity

Last session: 2026-06-13T23:53:00.000Z (v4.0 baseline ship to main)
Stopped at: STATE.md refreshed to v4.0 milestone. Slices 1-4 on main. Slice 5 (Experience/Projects/Claude) NOT started.
Resume file: none — clean checkpoint
Operator next steps:
  1. (optional) Vercel-prod real-device UAT pass on a623ede deploy.
  2. (optional) Refresh PROJECT.md "Current State" + "Next Milestone" sections to reflect v4.0 milestone + Slice 1-4 ship.
  3. Pick Slice 5: Experience (heaviest, expand/collapse state) OR Projects (lightest) OR Claude (largest copy block).
  4. Cut `v4.0-slice-5-<section>` off main, follow v4.0 slice playbook (json + RED tests + v4 refactor + strip t.* + wire App.js + PR).

## v3.10 Closure Reference (historical — for reverse lookup)

v3.10 3D Constellation milestone SHIPPED 2026-06-10 with PR sequence ending at 5aae37a. Phase 20 (DEPTH-01 — WebGL PerspectiveCamera + OrbitControls + planets-tier) delivered then immediately superseded by v4.0 purge decision 2026-06-12. All v3.10 decisions (D-20-VISUAL-3D, D-20-CLICK-DRAG-THRESHOLD, D-20-PROPS-CONTRACT, D-20-CONTEXT-LOSS, D-20-PLANETS-TIER, D-20-CONTEXT-HINT) are now historical only — not load-bearing on main.
