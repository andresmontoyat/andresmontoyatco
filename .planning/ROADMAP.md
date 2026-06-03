# Roadmap: Carlos Montoya Portfolio Redesign

## Milestones

- ✅ **v3.4** — Brownfield redesign baseline: Vite 6 + React 18 + Tailwind v3.4, sticky bilingual nav, char-reveal hero, vertical experience timeline, email-hero contact, Open Graph, Lighthouse 98/100/100/100 (shipped 2026-05-07 — see [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md))
- ⚠ **v3.5 — Themes, Projects & Production** — Themes & Projects shipped (VIS-01, VIS-03, DEBT-01/02/03); deploy deferred to v3.7 (closed 2026-05-12 — see [`milestones/v3.5-ROADMAP.md`](milestones/v3.5-ROADMAP.md) and [`milestones/v3.5-MILESTONE-AUDIT.md`](milestones/v3.5-MILESTONE-AUDIT.md))
- ✅ **v3.6 — AI Practice & Brand Refresh** — Code shipped: brand palette swap, theme toggle root-cause fix, hero photo, sales-pitch Claude Code section. 5/5 active REQs satisfied. UAT visual+Lighthouse + DEPLOY-01/02/03 + DIAGRAMS-01 carry to v3.7. Closed without git tag (production not yet live). See [`milestones/v3.6-ROADMAP.md`](milestones/v3.6-ROADMAP.md) and [`milestones/v3.6-MILESTONE-AUDIT.md`](milestones/v3.6-MILESTONE-AUDIT.md).
- ⏸ **v3.7 — Production Deploy** *(PAUSED, opened 2026-05-20 — deferred 2026-05-29)* — Vercel auto-deploy done (site live on `*.vercel.app`); Phase 11 Plan 11-05 Lighthouse mobile gate verdict, custom domain (Phase 12), and PR previews (Phase 13) **carried as deferred**. Resumes in a future milestone. Phases 11–13 reserved — NOT renumbered.
- 🚧 **v3.8 — Game Mode** *(ACTIVE, opened 2026-05-29)* — Interactive skill-constellation landing (node = skill, edges = co-occurrence), floating bilingual experience cards, multi-skill/year/category filters, persisted game/dev toggle. Adaptive render (WebGL desktop / SVG-DOM mobile) holds the Lighthouse mobile HARD gate, WCAG 2.1 AA, and SEO. Introduces Vitest + RTL. **Phases 14–17.** Source of truth: [`docs/superpowers/specs/2026-05-29-game-mode-design.md`](../docs/superpowers/specs/2026-05-29-game-mode-design.md).

---

## Phases

### v3.8 Game Mode (Phases 14–17) — ACTIVE

- [x] **Phase 14: Foundation — Data Layer, ViewMode Toggle & Test Infra** *(complete 2026-05-30)* — skills.js category map + skill-graph derivation + numeric `period` field + baked layout; persisted game/dev toggle; Vitest + RTL setup with pure-logic tests
- [ ] **Phase 15: Accessible Constellation & SEO Fallback** — gate-safe SVG/DOM constellation render with category clustering; keyboard nav, dialog semantics, sr-only full-experience fallback, reduced-motion path
- [x] **Phase 16: Filters & Floating ExperienceCard** *(complete 2026-06-03)* — multi-skill + year/timeline + category filters with reset; floating bilingual experience cards with tech chips + CV CTA on skill select. 183/183 tests GREEN, 8.82 kB gz, UAT 9/9 pass
- [ ] **Phase 17: WebGL Desktop Renderer & Lighthouse Gate** — lazy-loaded three.js desktop renderer behind the shared contract; perf budget enforced + Lighthouse mobile HARD gate re-verified

### v3.7 Production Deploy (Phases 11–13) — ⏸ DEFERRED

> **DEFERRED 2026-05-29.** v3.7 deploy work is paused, not done. The site **is live and auto-deploys from `main` on `*.vercel.app`**. Phases 11–13 remain reserved (NOT renumbered, NOT deleted): Plan 11-05 Lighthouse mobile gate verdict was never formally run, the custom domain (Phase 12) and PR previews (Phase 13) are carried as deferred. They resume in a future milestone. Resume file: `.planning/phases/11-vercel-deploy-uat-gate/11-05-PLAN.md`.

- [~] **Phase 11: Vercel auto-deploy + UAT pre-deploy gate** (DEPLOY-01) — auto-deploy live; Plan 11-05 Lighthouse gate verdict deferred
- [ ] **Phase 12: Custom domain andresmontoyat.co + DNS** (DEPLOY-02) — deferred
- [ ] **Phase 13: PR preview deploys + OG card validation** (DEPLOY-03) — deferred

---

## Phase Details (v3.8 — ACTIVE)

### Phase 14: Foundation — Data Layer, ViewMode Toggle & Test Infra
**Goal**: The pure data and state foundation for game mode exists and is tested — a curated skill catalog with categories, a derived skill graph (nodes/edges/year ranges) from real experience data, a baked deterministic layout, and a persisted one-click game/dev view toggle.
**Mode:** mvp
**Depends on**: v3.6 codebase (live on `*.vercel.app`); independent of paused v3.7 deploy work
**Requirements**: GAME-02, GAME-05, TEST-01
**Success Criteria** (what must be TRUE):
  1. A new `skills.js` catalog maps every skill in `experience.js` `tech[]` to a category + color + aliases, with `GCP`/`Google Cloud` normalized to one canonical skill node (GKE stays separate)
  2. `constellation.graph.js` derives skill nodes (with category, color, count, year range, experience indices) and co-occurrence edges (weight = shared jobs) purely from `experience.js` + `skills.js`; each experience carries a numeric `period: { start, end|null }`
  3. Node layout positions are baked deterministically at build time (no d3-force in the client bundle); the same positions are available to any renderer
  4. The visitor can toggle between game and dev view with one click; game is the default landing; the choice persists in `localStorage` (`cam-viewmode`) and is addressable via a `?mode=` deep-link, surviving reload
  5. `npm test` runs a Vitest + React Testing Library suite; the pure graph/filter logic is unit-tested near-100% and the ViewMode toggle + persistence has a passing component test
**Plans**: 2 plans
  - [x] 14-01-PLAN.md — Vitest+RTL test infra + skills.js catalog + skill-graph/layout derivation + numeric `period` (GAME-02, TEST-01; Wave 1, autonomous)
  - [x] 14-02-PLAN.md — ViewModeContext + Game/Dev toggle pill + App/Nav wiring + crawlable game placeholder + persistence/`?mode=` component test (GAME-05, TEST-01; Wave 2, autonomous, depends on 14-01)
**UI hint**: yes

### Phase 15: Accessible Constellation & SEO Fallback
**Goal**: The visitor lands on an interactive, accessible skill constellation rendered via the lightweight SVG/DOM path — the gate-safe baseline that ships value on its own with full keyboard, screen-reader, and crawler support.
**Mode:** mvp
**Depends on**: Phase 14 (graph data, baked layout, ViewMode toggle, test infra)
**Requirements**: GAME-01 (SVG/DOM path + renderer contract), GAME-02 (visual render), GAME-06
**Success Criteria** (what must be TRUE):
  1. On default landing the visitor sees a skill constellation: skills as nodes (size reflecting how many jobs used them), edges connecting skills that co-occur in the same job, visually clustered by category color/zone
  2. The render is driven by the SVG/DOM renderer behind a single props contract, chosen by capability + viewport + `prefers-reduced-motion` + save-data detection (the same contract a desktop renderer will later plug into); reduced-motion shows a static path with no physics/particles
  3. Skill nodes are keyboard-navigable (Tab/arrow keys, Enter selects) with descriptive `aria-label`s (skill name + experience count); AA contrast holds for nodes/edges in both dark and light themes
  4. A visually-hidden but DOM-present semantic list of all 12 experiences (full bilingual text) is in the markup so screen readers, crawlers, and ATS read the complete career content
  5. Skill nodes and edges render bilingually (EN/ES) and follow the active theme; an empty/no-data state degrades gracefully instead of crashing
**Plans**: 3 plans
  - [x] 15-01-PLAN.md — GameMode orchestrator + sr-only ConstellationFallback + derived bilingual H1 (GAME-01, GAME-06; Wave 1, autonomous, MVP Slice 1)
  - [x] 15-02-PLAN.md — SvgConstellation visual renderer + useConstellation hook + constellation tokens/keyframes + GameMode wiring (GAME-01, GAME-02; Wave 2, autonomous, MVP Slice 2, depends on 15-01)
  - [x] 15-03-PLAN.md — spatialNav helper + role=application wrapper + roving tabindex + Enter/Space/Esc + aria-live + focus ring + hint pill (GAME-01, GAME-06; Wave 3, autonomous, MVP Slice 3, depends on 15-01,15-02)
**UI hint**: yes

### Phase 16: Filters & Floating ExperienceCard
**Goal**: The visitor can explore the constellation — narrow it by skills, years, and categories — and on selecting a skill sees the jobs where Carlos used it as floating bilingual experience cards.
**Mode:** mvp
**Depends on**: Phase 15 (accessible constellation render + node selection)
**Requirements**: GAME-03, GAME-04
**Success Criteria** (what must be TRUE):
  1. The visitor can select multiple skills, set a year/timeline range (2007–2026), and pick skill-category chips; the filters combine as an intersection and a reset clears all of them at once
  2. Applying filters highlights the matching skill subset (nodes + their edges) and dims the rest, computed by pure selectors with no flicker or jank
  3. Selecting a skill opens floating bilingual `ExperienceCard`(s) for the jobs that used it — showing title, company, date, location, bullets, and tech chips colored by category
  4. Each experience card exposes a CV CTA that downloads the correct `CV_Carlos_Montoya_{EN,ES}.docx` for the active language
  5. Filter selectors and the experience-card content render correctly in both EN/ES and both themes; selecting a skill with no matching experiences shows an empty state, never a crash
**Plans**: 6 plans
  - [ ] 16-01-PLAN.md — RED tests scaffold for filters/useConstellation/SkillFilters/ExperienceCard/SvgConstellation/GameMode (GAME-03+04; Wave 0, autonomous)
  - [ ] 16-02-PLAN.md — filters.js pure selectors + i18n t.game.* keys + Tailwind tokens/keyframes + index.css vars (GAME-03+04; Wave 1, autonomous, depends on 16-01)
  - [ ] 16-03-PLAN.md — useConstellation filter state + SvgConstellation highlightedSkillIds/yearRange dim consumer (GAME-03; Wave 2, autonomous, depends on 16-02)
  - [ ] 16-04-PLAN.md — SkillFilters bar with chip clusters + WAI-ARIA dual-thumb YearRangeSlider + reset button (GAME-03; Wave 3, autonomous, depends on 16-02)
  - [ ] 16-05-PLAN.md — ExperienceCard role=dialog portal with focus trap + click-outside + tech chips + bilingual CV CTA + empty state (GAME-04; Wave 4, autonomous, depends on 16-02)
  - [ ] 16-06-PLAN.md — GameMode wiring + Nav data-game-interactive + bundle budget check (GAME-03+04; Wave 5, autonomous, depends on 16-03+04+05)
**UI hint**: yes

### Phase 17: WebGL Desktop Renderer & Lighthouse Gate
**Goal**: Desktop visitors get the full WebGL "wow" constellation as a lazy-loaded enhancement plugged into the same contract — without ever risking the Lighthouse mobile HARD gate, which is re-verified at the close.
**Mode:** mvp
**Depends on**: Phase 16 (full feature set on the light path proven); Phase 15 (renderer contract + SVG fallback)
**Requirements**: GAME-01 (WebGL desktop path), GAME-07
**Success Criteria** (what must be TRUE):
  1. On desktop (≥ breakpoint, WebGL supported, no reduced-motion/save-data) the visitor sees the full WebGL constellation with gentle physics/glow around the baked positions; it implements the identical props contract as the SVG renderer and exposes the same selection/filter behavior
  2. three.js (and any WebGL deps) load only in a lazy desktop chunk via React.lazy + Suspense — they are absent from the initial mobile load; a WebGL init failure falls back to the SVG renderer via an ErrorBoundary, never a broken screen
  3. The mobile/light path adds < ~30KB gz over the current baseline (no three.js, no d3-force on the client; vector-only assets, reused fonts)
  4. A Lighthouse mobile audit on the game-mode default landing passes the HARD gate: Performance ≥95 / Accessibility 100 / Best Practices 100 / SEO 100 — matching the v3.4 baseline
  5. The desktop WebGL renderer has a capability-based-selection component test confirming it is chosen on desktop and the SVG path is chosen otherwise
**Plans**: TBD
**UI hint**: yes

---

## Phase Details (v3.7 — ⏸ DEFERRED, reserved)

> Carried as deferred 2026-05-29. Site is live + auto-deploys from `main` on `*.vercel.app`. Full detail retained for resume; not in v3.8 scope.

### Phase 11: Vercel auto-deploy + UAT pre-deploy gate
**Goal**: Portfolio is live at a stable `*.vercel.app` URL, auto-deploys on every push to `main`, and the v3.6 UAT visual+Lighthouse debt is paid (Phase 10 Tests 3-11) before the deploy config merges.
**Depends on**: v3.6 milestone close (✓ done 2026-05-20)
**Requirements**: DEPLOY-01 (folds UAT-GATE)
**Status**: Auto-deploy live (Plans 11-01..11-04 done); Plan 11-05 Lighthouse mobile gate verdict DEFERRED — still a HARD gate before custom-domain cutover.
**Success Criteria** (what must be TRUE):
  1. Vercel project linked to repo (`vercel link`); pushing to `main` triggers a production deploy that completes successfully; deployed URL renders the portfolio identically to local `npx serve dist`
  2. Phase 10 UAT Tests 3-10 all PASS against local `npx serve dist` build (theme prod build, localStorage persistence, hero photo at iPhone 14 / Pixel 7 / iPad / 1440px, hero photo light mode, reduced-motion, nav scroll-spy click, AI section CTAs + EN/ES, WCAG AA contrast light mode)
  3. Phase 10 Test #11 Lighthouse mobile audit run against the deployed `*.vercel.app` URL passes the HARD gate: Performance ≥ 95 / Accessibility 100 / Best Practices 100 / SEO 100 — matching v3.4 baseline 98/100/100/100. Lighthouse fail blocks Phase 12. *(DEFERRED — formal run pending.)*
  4. SPA fallback verified: direct hit on `*.vercel.app/#contact` (or any anchor) serves `index.html` and scroll-jumps correctly; no 404 page from Vercel for deep-link anchors
  5. Cache headers respected: static assets (hashed bundles in `dist/assets/*`) have long max-age + immutable; `index.html` is no-cache or short-cache so deploys propagate
**Plans**: 5 plans
  - [x] 11-01-PLAN.md — vercel.json + .gitignore (.vercel/) + index.html og:url typo fix (Wave 1, autonomous)
  - [x] 11-02-PLAN.md — adapt lighthouse:mobile for deployed URL + tighten lighthouse:check thresholds to Phase 11 HARD gate (Wave 1, autonomous, parallel with 11-01)
  - [x] 11-03-PLAN.md — local UAT Tests 3-10 against `npx serve dist` (Wave 2, non-autonomous, human browser-driven)
  - [x] 11-04-PLAN.md — vercel login + vercel link + first production deploy + curl-verify SPA fallback + cache headers (Wave 3, non-autonomous, interactive CLI auth)
  - [ ] 11-05-PLAN.md — Lighthouse mobile audit against deployed *.vercel.app URL + HARD gate verdict (Wave 4, mixed; Phase 12 unblock signal) — **DEFERRED**
**UI hint**: no (infra phase)

### Phase 12: Custom domain andresmontoyat.co + DNS
**Goal**: The portfolio resolves at `https://andresmontoyat.co` with valid HTTPS; OG card validates on the canonical domain.
**Depends on**: Phase 11 (Vercel deploy URL stable + Lighthouse gate passed)
**Requirements**: DEPLOY-02
**Status**: DEFERRED 2026-05-29.
**Success Criteria** (what must be TRUE):
  1. `andresmontoyat.co` is registered as a custom domain on the Vercel project; DNS records configured at the registrar (apex `A 76.76.21.21` + `www` CNAME `cname.vercel-dns.com`, or apex CNAME flattening if registrar supports it)
  2. HTTPS certificate auto-provisioned by Vercel (Let's Encrypt); TLS handshake valid on both `andresmontoyat.co` and `www.andresmontoyat.co` (verify via `curl -vI https://andresmontoyat.co` or `openssl s_client`)
  3. Canonical redirect chosen and implemented: either `www.andresmontoyat.co` → `andresmontoyat.co` (apex canonical) or reverse. One stable canonical URL; no redirect loops.
  4. OG meta tags work on the canonical domain: `og:url` + `<link rel="canonical">` updated in `index.html` if they were relative or hardcoded to dev URL; LinkedIn / Twitter / Facebook share-debugger renders the og-image.png correctly with title/description
  5. After cutover, the deployed Vercel URL (`*.vercel.app`) either keeps working or redirects to canonical — no broken bookmarks for anyone who hit Phase 11 URL during deploy validation
**Plans**: TBD
**UI hint**: no

### Phase 13: PR preview deploys + OG card validation
**Goal**: Every PR against `main` gets an auto-deployed preview URL with working OG meta tags, so reviewers and recruiters can validate visual changes pre-merge.
**Depends on**: Phase 11 (Vercel project) + Phase 12 (canonical OG meta tags)
**Requirements**: DEPLOY-03
**Status**: DEFERRED 2026-05-29.
**Success Criteria** (what must be TRUE):
  1. Opening a PR against `main` triggers a Vercel preview deploy to a unique URL (`*-pr-<num>.vercel.app` or branch-derived); Vercel GitHub bot posts the URL as a PR comment within ~2 minutes of push
  2. The preview URL renders the portfolio identically to production (theme toggle, hero photo, AI section, bilingual EN/ES) — no environment drift between preview and production
  3. OG meta tags work on preview URLs: no hard-coded `https://andresmontoyat.co` `og:url` causing share-debugger to reject preview hosts; share-debugger on a sample preview URL returns the og-image.png + title/description
  4. Closing or merging a PR cleans up the preview deploy (Vercel default behavior — verify it does not accumulate stale previews)
  5. Branch protection on `main` updated to require Vercel deploy check (optional but recommended) — preview deploy success becomes a merge gate
**Plans**: TBD
**UI hint**: no

---

## Past Phases (collapsed)

<details>
<summary>✅ v3.4 Brownfield Redesign (Phases 1-4) — SHIPPED 2026-05-07</summary>

See [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md) for full phase details.

</details>

<details>
<summary>⚠ v3.5 Themes, Projects & Production (Phases 5-7) — CLOSED 2026-05-12 (Phase 7 deploy deferred)</summary>

- [x] Phase 5: Theme & Tech Debt (4/4 plans) — completed 2026-05-08
- [x] Phase 6: Projects Showcase (2/2 plans) — completed 2026-05-08
- [ ] Phase 7: Production Deploy — **not delivered**, deferred to v3.7

See [`milestones/v3.5-ROADMAP.md`](milestones/v3.5-ROADMAP.md).

</details>

<details>
<summary>✅ v3.6 AI Practice & Brand Refresh (Phases 7-10) — CLOSED 2026-05-20 (Phase 11 de-scoped)</summary>

- [x] Phase 7: Tailwind CSS-var refactor + Brand palette (2/2 plans) — completed 2026-05-12 (THEME-01, COLOR-01)
- [x] Phase 8: Hero photo integration (1/1 plan) — completed 2026-05-12 (HERO-01) — visual UAT deferred to v3.7 pre-deploy gate
- [x] Phase 9: AI / Claude Code section (1/1 plan) — completed 2026-05-12 (AI-01, AI-01-CICD) — visual UAT deferred to v3.7 pre-deploy gate
- [◐] Phase 10: Real-browser UAT + a11y sweep — closed partial 2026-05-20 (2/11 pass + 9 skip → v3.7 pre-deploy gate)
- [ ] Phase 11: Architecture diagrams (cross-repo) — **de-scoped** from v3.6 (DIAGRAMS-01 re-roadmap in future milestone)

See [`milestones/v3.6-ROADMAP.md`](milestones/v3.6-ROADMAP.md) and [`milestones/v3.6-MILESTONE-AUDIT.md`](milestones/v3.6-MILESTONE-AUDIT.md).

</details>

---

## Progress Table (v3.8 — ACTIVE)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 14. Foundation — Data, ViewMode & Test Infra | 2/2 | Complete    | 2026-05-30 |
| 15. Accessible Constellation & SEO Fallback | 3/3 | Complete    | 2026-06-02 |
| 16. Filters & Floating ExperienceCard | 0/TBD | Not started | - |
| 17. WebGL Desktop Renderer & Lighthouse Gate | 0/TBD | Not started | - |

## Progress Table (all milestones)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4 | v3.4 | All | ✓ Complete | 2026-05-07 |
| 5. Theme & Tech Debt | v3.5 | 4/4 | ✓ Complete | 2026-05-08 |
| 6. Projects Showcase | v3.5 | 2/2 | ✓ Complete | 2026-05-08 |
| 7. (v3.5 deploy) | v3.5 | 0 / not planned | ✗ Deferred → v3.7 | — |
| 7. Tailwind CSS-var + Brand | v3.6 | 2/2 | ✓ Complete | 2026-05-12 |
| 8. Hero photo integration | v3.6 | 1/1 | ✓ Complete (code) | 2026-05-12 |
| 9. AI / Claude Code section | v3.6 | 1/1 | ✓ Complete (code) | 2026-05-12 |
| 10. Real-browser UAT + a11y | v3.6 | UAT (no PLAN) | ◐ Closed Partial (2/11) | 2026-05-20 |
| 11. Architecture diagrams | v3.6 | 0 / not planned | ✗ De-scoped → 999.13 backlog | — |
| 11. Vercel deploy + UAT gate | v3.7 | 4/5 | ⏸ Deferred (11-05 pending) | — |
| 12. Custom domain + DNS | v3.7 | 0/TBD | ⏸ Deferred | — |
| 13. PR preview deploys | v3.7 | 0/TBD | ⏸ Deferred | — |
| 14. Foundation — Data, ViewMode & Test | v3.8 | 0/2 | Planned | — |
| 15. Accessible Constellation & SEO | v3.8 | 0/TBD | Not started | — |
| 16. Filters & Floating ExperienceCard | v3.8 | 0/TBD | Not started | — |
| 17. WebGL Desktop + Lighthouse Gate | v3.8 | 0/TBD | Not started | — |

---

## Backlog

Tracked but not yet scoped to a milestone. Each item lives as a `999.x-slug` phase directory under `.planning/phases/` and is reviewed via `/gsd-review-backlog`.

### Architecture diagrams (de-scoped from v3.6 Phase 11)

### Phase 999.13: diagrams-cross-repo (BACKLOG)

**Requirement:** DIAGRAMS-01
**Goal:** Cross-repo architecture diagrams (gradle PlantUML + Structurizr for `spring-ai-qdrant-mcp`; Mermaid `.mmd` for GSD/claude-kanban/ci-templates/caveman); sync to portfolio; clickable AI app cards open modal
**Directory:** *(to be created when re-roadmap'd)*

### Visual polish

### Phase 999.4: vis-company-logos (BACKLOG)

**Requirement:** VIS-02
**Goal:** Company logo SVGs in experience timeline entries
**Directory:** `.planning/phases/999.4-vis-company-logos/`

### Phase 999.5: vis-testimonials (BACKLOG)

**Requirement:** VIS-04
**Goal:** Testimonials section with rotating quote cards
**Directory:** `.planning/phases/999.5-vis-testimonials/`

### Phase 999.14: vis-claude-kanban-caveman-cards (BACKLOG)

**Requirement:** VIS-05
**Goal:** Add claude-kanban + caveman featured-app cards back into AI section (deferred from AI-01 — shipped with 3 of original 5)
**Directory:** *(to be created when re-roadmap'd)*

### SEO & performance

### Phase 999.6: aseo-jsonld-person (BACKLOG)

**Requirement:** ASEO-01
**Goal:** JSON-LD Person schema in `index.html` head
**Directory:** `.planning/phases/999.6-aseo-jsonld-person/`

### Phase 999.7: aseo-webp-pipeline (BACKLOG)

**Requirement:** ASEO-02
**Goal:** WebP image optimization pipeline (sharp + responsive sizes)
**Directory:** `.planning/phases/999.7-aseo-webp-pipeline/`

### Phase 999.8: aseo-sitemap (BACKLOG)

**Requirement:** ASEO-03
**Goal:** `sitemap.xml` generation at build time
**Directory:** `.planning/phases/999.8-aseo-sitemap/`

### Interaction & content

### Phase 999.9: intx-contact-form (BACKLOG)

**Requirement:** INTX-01
**Goal:** Functional contact form (requires backend / forwarder)
**Directory:** `.planning/phases/999.9-intx-contact-form/`

### Phase 999.10: intx-blog (BACKLOG)

**Requirement:** INTX-02
**Goal:** Blog / articles section with MDX or markdown source
**Directory:** `.planning/phases/999.10-intx-blog/`

### Phase 999.11: intx-github-activity (BACKLOG)

**Requirement:** INTX-03
**Goal:** GitHub activity integration (recent commits / PR / contribution graph)
**Directory:** `.planning/phases/999.11-intx-github-activity/`

### Testing

### Phase 999.12: test-infrastructure (BACKLOG)

**Requirement:** TEST-INFRA
**Goal:** Vitest + Playwright + RTL test infrastructure (8 milestones deferred through v3.6) — *(note: Vitest + RTL portion now active in v3.8 Phase 14 / TEST-01; Playwright E2E remains backlog)*
**Directory:** `.planning/phases/999.12-test-infrastructure/`
