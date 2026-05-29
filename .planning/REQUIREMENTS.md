# Requirements: Carlos Montoya Portfolio — v3.8

**Defined:** 2026-05-29
**Milestone:** v3.8 Game Mode
**Core Value:** The hero section and overall first impression must stop recruiters mid-scroll, make them want to learn more about Carlos, and convert visits into engineering conversations.
**Design source of truth:** `docs/superpowers/specs/2026-05-29-game-mode-design.md`

## v3.8 Requirements

Interactive "game mode" — a skill constellation as the default landing, with a persisted toggle to the
current ("dev") view. Phase numbering continues from v3.7 → **starts at Phase 14**. Adaptive render
(WebGL desktop / SVG-DOM mobile) holds the Lighthouse mobile gate, WCAG 2.1 AA, and SEO.

### Game Mode

- [ ] **GAME-01** Visitor lands on an interactive skill constellation by default; the render adapts to the
  device — full WebGL on desktop, a lightweight SVG/DOM static path on mobile (and on no-WebGL,
  reduced-motion, or save-data). Same content in both; capability + viewport + `prefers-reduced-motion`
  detection chooses the renderer behind a single props contract.
- [ ] **GAME-02** Constellation nodes are skills (Carlos's technologies); edges connect skills that
  co-occur in the same job; nodes cluster visually by skill category (color/zone). Graph derived from
  `experience.js` `tech[]` + a new `skills.js` category map (with GCP/Google Cloud normalization).
- [ ] **GAME-03** Visitor can filter/navigate by selecting multiple skills, by a year/timeline range
  (2007–2026), and by skill category; a reset clears all filters. Filters are combinable (intersection)
  and computed by pure selectors.
- [ ] **GAME-04** Selecting a skill shows the experiences where Carlos used it as floating bilingual
  cards — title, company, date, location, bullets, tech chips (colored by category) — plus a CV CTA.
- [ ] **GAME-05** Visitor can toggle between game mode and the current dev view with one click; game mode
  is the default landing; the choice persists in `localStorage` (`cam-viewmode`) and is addressable via a
  `?mode=` deep-link.
- [ ] **GAME-06** Game mode is accessible and crawlable: skill nodes are keyboard-navigable with
  `aria-label`s, experience cards use dialog/popover semantics (focus trap, Esc to close), a visually-hidden
  full-experience list is present in the DOM for screen readers / crawlers / ATS in both render paths, and
  `prefers-reduced-motion` disables physics/particles. WCAG 2.1 AA contrast holds in dark and light themes.
- [ ] **GAME-07** Game mode holds the Lighthouse mobile HARD gate (Perf ≥95 / A11y 100 / BP 100 / SEO 100,
  matching the v3.4 baseline): three.js loads only in the lazy desktop chunk, layout positions are baked at
  build time (no d3-force in the client), and the mobile path adds < ~30KB gz over the current baseline.

### Testing

- [ ] **TEST-01** The project has a Vitest + React Testing Library test setup; pure graph/filter logic
  (`constellation.graph.js` derivation, `useConstellation` selectors) is unit-tested near-100%, and key
  components (ViewMode toggle + persistence, ExperienceCard open/close/focus, SkillFilters selection,
  capability-based renderer selection) have component tests.

## Deferred (carried from v3.7 — site live on `*.vercel.app`, auto-deploy verified)

Not in v3.8 scope; resumed in a future milestone. Resume file: `.planning/phases/11-vercel-deploy-uat-gate/11-05-PLAN.md`.

| ID | Carried item | Reason |
|----|--------------|--------|
| DEPLOY-01 (gate) | Lighthouse mobile gate verdict (Plan 11-05) | Deferred 2026-05-29; site auto-deploys from main, formal gate run pending. Remains HARD gate before custom-domain cutover. |
| DEPLOY-02 | Custom domain andresmontoyat.co + DNS + HTTPS | User chose to pivot to Game Mode; deploy/domain resumed later. |
| DEPLOY-03 | PR preview deploys + OG card validation | Same — carried as deferred. |

## Out of Scope (for v3.8)

| Feature | Reason |
|---------|--------|
| Text search of skills/companies in game mode | Deferred — keyboard nav covers a11y; add later if needed |
| Sound / music in game mode | Not needed; risk to perf + UX |
| Tutorial / onboarding overlay | Defer — UI should be self-evident in v1 |
| URL-encoded filter state (beyond `?mode=`) | Defer — shareable filter links are nice-to-have |
| Achievement / score animations | Out of nature scope (no win/lose per D-v3.8-NATURE) |
| WebGL on mobile | Adaptive strategy intentionally serves the light path on mobile (gate + GPU) |
| Changing dev-view content or experience copy | Game mode re-presents existing content; no content rewrite |
| VIS-05 (claude-kanban + caveman cards), DIAGRAMS-01, VIS-02, VIS-04, ASEO-01/02/03, INTX-01/02/03 | Unchanged backlog from prior milestones |

## Traceability

| REQ-ID | Phase(s) | Status |
|--------|----------|--------|
| GAME-01 | TBD (roadmap) | Pending |
| GAME-02 | TBD (roadmap) | Pending |
| GAME-03 | TBD (roadmap) | Pending |
| GAME-04 | TBD (roadmap) | Pending |
| GAME-05 | TBD (roadmap) | Pending |
| GAME-06 | TBD (roadmap) | Pending |
| GAME-07 | TBD (roadmap) | Pending |
| TEST-01 | TBD (roadmap) | Pending |

_Traceability filled by the roadmapper once phases are created._
