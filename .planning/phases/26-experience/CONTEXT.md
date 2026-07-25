# Phase 26 — Experience — CONTEXT

**Requirements:** ISLAND-03, STATIC-02 (Experience expand/collapse half — Hero CV-dropdown half delivered Phase 24)

## Situation (reality vs original spec)

Original Phase 26 spec called for two things:

- **STATIC-02 (Experience half):** expand/collapse via **native `<details>`/`<summary>`, zero JS**.
- **ISLAND-03:** tech-chip filter as a **narrowly-scoped** `client:visible` island (or vanilla script), not `client:load`.

Reality on branch `v5-astro-migration` (commits `c9b4a51` → `933bcc3`): Experience was
restored as a **single full React island** (`src/components/react/Experience.jsx`, 312 LOC),
mounted `<Experience client:visible>` in both locale pages, bundling:

- tech-chip filter with dimming + live match count,
- per-card expand/collapse via React `useState` (NOT native `<details>`),
- featured/compact card variants,
- the `CareerGame` canvas island (lazy-loaded, play-cover gated) as a section entry.

## Decision — D-26-MEASURE-FIRST (user, 2026-07-25)

**Accept the existing React island as the Phase 26 deliverable. Do not refactor
to native `<details>` speculatively. Let the Phase 27 Lighthouse mobile gate be
the objective judge.**

Rationale: the spec's "zero JS" was a *means* to the milestone's real end — clearing
the Lighthouse mobile HARD gate (Perf ≥0.95, A11y/BP/SEO = 1.0). If the island clears
the gate in Phase 27, the intent of STATIC-02 is satisfied even where the letter
("native `<details>`") is not. If the gate fails, refactor the expand/collapse to
native `<details>` then (the `details-dismiss.js` enhancer from Phase 24 is already
reusable). No rework unless measurement demands it.

### Requirement dispositions

- **ISLAND-03** — SATISFIED. The requirement permits "a narrowly-scoped `client:visible`
  island **or** vanilla script — not `client:load`." Current mount is `client:visible`.
  The filter interaction is genuinely stateful (chip toggle → dim non-matching + live count).
- **STATIC-02 (Experience half)** — DEFERRED-TO-GATE. Letter not met (React `useState`,
  not native `<details>`). Disposition resolved by the Phase 27 Lighthouse verdict, not
  by letter compliance. Documented divergence, not silent.

## Phase 26 scope (narrowed by D-26)

1. **Close the island test debt.** `src/components/react/Experience.jsx` (the 312-LOC
   island) currently has **zero direct tests**. Write an RTL characterization suite:
   filter chip toggle → dimming + `aria-pressed` + live match count + clear; expand/collapse
   toggle → `aria-expanded` + bullets show/hide; featured vs compact variants; bilingual
   locale prop; visible-flag filtering; active badge on present roles; CareerGame entry present.
2. **Document the divergence** (this file + REQUIREMENTS.md dispositions).
3. **Update tracking** — REQUIREMENTS.md (ISLAND-03 done, STATIC-02 gate-deferred note),
   ROADMAP.md (Phase 26 checkbox + note), STATE.md (Phase 26 complete, next = Phase 27).

## Out of scope

- Native `<details>` refactor of expand/collapse — conditional on Phase 27 gate failure.
- CareerGame internals (delivered + reviewed in the game-feature 16-task track).
- Phase 27 Lighthouse run / cleanup / merge-to-main.
