# Roadmap: Carlos Montoya Portfolio Redesign

## Shipped Milestones

- **v3.4** — Brownfield redesign: Vite 6 + React 18 + Tailwind v3.4, sticky bilingual nav, char-reveal hero, vertical experience timeline, email-hero contact, Open Graph, Lighthouse 98/100/100/100. (Shipped 2026-05-07 — see [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md))
- **v3.5** ⚠ — Themes & Projects shipped (VIS-01, VIS-03, DEBT-01/02/03); **deploy deferred to v3.7** (DEPLOY-01/02/03 carry forward). Closed 2026-05-12 without git tag. See [`milestones/v3.5-ROADMAP.md`](milestones/v3.5-ROADMAP.md) and [`milestones/v3.5-MILESTONE-AUDIT.md`](milestones/v3.5-MILESTONE-AUDIT.md).

---

## Active Milestone: v3.6 — AI Practice & Brand Refresh

**Goal:** Refresh brand palette (blue + emerald), fix theme toggle root bug, integrate hero photo, and ship a sales-focused AI/Claude Code section positioning Carlos as engineer-for-hire.

**Requirements:** 5 capabilities (THEME-01, COLOR-01, HERO-01, AI-01 + AI-01-CICD sub-feature, DIAGRAMS-01)
**Phases:** 7–11 (continuing numbering from v3.5; Phase 7 slot reused since v3.5 deploy work deferred to v3.7)
**Git tag:** No tag at close (consistent with v3.5; site still not live until v3.7 deploy)

## Phases

- [ ] **Phase 7: Tailwind CSS-var refactor + Brand palette** — fix theme toggle root cause, swap brand→blue-500 and accent→emerald-500
- [ ] **Phase 8: Hero photo integration** — me.jpg as overlay full-bleed in Hero
- [ ] **Phase 9: AI / Claude Code section** — sales pitch (engineer-for-hire) between Projects and Contact, bilingual
- [ ] **Phase 10: Real-browser UAT + a11y sweep** — verify themes ACTUALLY flip (Phase 5 false-positive correction), Lighthouse re-audit
- [ ] **Phase 11: Architecture diagrams (cross-repo)** — generate diagrams in each AI repo (gradle plantuml + structurizr for JVM; Mermaid manual for non-JVM), sync to portfolio, render in AI section modal

## Phase Details

### Phase 7: Tailwind CSS-var refactor + Brand palette swap
**Goal**: Theme toggle actually flips ALL visible surfaces, text, and accents — not just `<body>` background. Brand identity shifts from indigo/coral to blue/emerald across light and dark modes.
**Depends on**: Phase 6 (v3.5)
**Requirements**: THEME-01, COLOR-01
**Success Criteria** (what must be TRUE):
  1. Clicking the sun/moon button visually flips every section (Hero, About, Skills, Experience, Projects, Contact, Footer) between dark and light themes — not just the body bg
  2. `tailwind.config.js` color palettes (`ink.*`, `brand.*`, `accent.*`, `text.*`) reference CSS variables via `var(--color-*)` instead of hardcoded hex values
  3. New brand palette is visible: every reference to former indigo `#6C63FF` now renders as blue-500 `#3B82F6`; every reference to former coral `#FF6B6B` now renders as emerald-500 `#10B981`
  4. Both `:root` (dark defaults) and `[data-theme="light"]` blocks in `index.css` define the full token set; light mode preserves WCAG AA contrast on all text+surface combinations
  5. `npm run og:gen` still produces a valid `og-image.png` with the new gradient (no breakage in self-hosted og-template)
**Plans**: TBD (planner derives)
**UI hint**: yes

### Phase 8: Hero photo integration
**Goal**: A visitor opening the site immediately sees Carlos's face as a cinematic full-bleed Hero background, with the existing headline + CTAs layered cleanly on top.
**Depends on**: Phase 7
**Requirements**: HERO-01
**Success Criteria** (what must be TRUE):
  1. `me.jpg` is served from `public/me.jpg` (moved from repo root); no `public/` reference is broken
  2. Hero renders the photo as a full-bleed background with `filter: grayscale(0.2) brightness(0.35)` and the existing gradient overlay; the photo is visible but does not compete with the text for attention
  3. Existing Hero elements remain functional: status badge with pulsing dot, char-reveal h1, role line, EN+ES CV CTAs, 4-stat grid, scroll cue
  4. Headline text uses a `text-shadow` for legibility against the photo at all 4 breakpoints (iPhone 14, Pixel 7, iPad, 1440px+)
  5. Image loads efficiently (acceptable size, lazy attribute where appropriate) — Lighthouse Performance stays ≥ 95 mobile; no CLS regression
**Plans**: TBD
**UI hint**: yes

### Phase 9: AI / Claude Code section
**Goal**: Visitors who scroll past Projects encounter a sales-focused section positioning Carlos as an AI-disciplined backend engineer-for-hire; CTAs route to Contact.
**Depends on**: Phase 8
**Requirements**: AI-01
**Success Criteria** (what must be TRUE):
  1. A new section with `id="claude-code"` exists in `App.js`, lazy-loaded via `Suspense`, positioned between Projects and Contact; nav scroll-spy highlights it (entry in `SECTION_IDS` + `DesktopNav` + `MobileMenu`)
  2. The section renders the V7 sales-pitch layout (sketched in `.planning/sketches/v3.6-variants.html`): centered headline + sub-lead + dual CTAs, 4 value-prop cards, proof block with 7 counters, 5 service cards, 3 featured-app cards (GSD / spring-ai-qdrant-mcp / ci-templates), stack-strip credentials
  3. All copy renders bilingually from `translations.js` (`t.claude.*` namespace in both EN and ES); language toggle flips the section content without remount
  4. Primary CTA links to `#contact`; secondary CTA links to `#projects`; both work on desktop and mobile
  5. The section emits a separate lazy chunk in `vite build` output (verified via build manifest); main bundle does not grow beyond the v3.5 Projects-chunk pattern
**Plans**: TBD
**UI hint**: yes

### Phase 10: Real-browser UAT + a11y sweep
**Goal**: Every v3.6 capability is verified in a live browser by a human (Phase 5 had a false-positive UAT — this phase pays that debt) and Lighthouse mobile scores hold the v3.4 baseline.
**Depends on**: Phase 9
**Requirements**: (UAT/verification of THEME-01, COLOR-01, HERO-01, AI-01, AI-01-CICD)
**Success Criteria** (what must be TRUE):
  1. Theme toggle is exercised in `npm run dev` AND in production `dist/` build — both modes visually flip ALL sections at iPhone 14, iPad, and 1440px viewports
  2. Light mode passes WCAG AA contrast on every text element introduced in v3.6 (Hero overlay, AI section values, services, proof counters)
  3. The Hero photo overlay renders correctly with text legibility at all 4 breakpoints; reduced-motion users still see a static Hero (no animation regressions)
  4. The AI section is reachable via nav on Desktop and Mobile (scroll-spy + click); CTAs to `#contact` and `#projects` scroll smoothly
  5. Lighthouse mobile audit: Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100 — no regression vs v3.4 baseline (Performance 98 / 100 / 100 / 100)
**Plans**: TBD
**UI hint**: yes

### Phase 11: Architecture diagrams (cross-repo)
**Goal**: Each featured AI project carries its own architecture diagrams in its repo, and the portfolio AI section surfaces them via a modal on each app card.
**Depends on**: Phase 9
**Requirements**: DIAGRAMS-01
**Success Criteria** (what must be TRUE):
  1. `spring-ai-qdrant-mcp` adopts a gradle PlantUML + Structurizr pattern (`io.gitlab.plunts.plantuml v2.3.0` + Structurizr DSL + a `structurizrExport` task); `./gradlew build` produces `architecture/diagrams/*.{puml,svg}` and `architecture/structurizr/export/{mermaid,plantuml}/*` without errors
  2. Each non-JVM repo (GSD, claude-kanban, ci-templates, caveman) has Mermaid `.mmd` source(s) under `docs/architecture/` matching the per-repo coverage spec (1–2 diagrams per repo)
  3. `scripts/sync-diagrams.sh` in the portfolio repo reads each AI repo (path-configurable env vars or config block) and copies outputs to `public/claude-code/diagrams/<repo-slug>/`; re-runnable, idempotent (same outputs on second run)
  4. AI section app cards become clickable; clicking opens a modal that renders the diagram (Mermaid live via `mermaid.js` for `.mmd`; `<img>` for SVG/PNG exports); modal closes on Escape, backdrop click, and explicit close button; keyboard focus trap during open
  5. AI section continues to lazy-load — modal/Mermaid library do not inflate the main bundle (only loaded on demand when a card is clicked)
**Plans**: TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Tailwind CSS-var refactor + Brand palette | 0/TBD | Not started | - |
| 8. Hero photo integration | 0/TBD | Not started | - |
| 9. AI / Claude Code section | 0/TBD | Not started | - |
| 10. Real-browser UAT + a11y sweep | 0/TBD | Not started | - |
| 11. Architecture diagrams (cross-repo) | 0/TBD | Not started | - |

---

## Backlog

Tracked but not yet scoped to a milestone. Each item lives as a `999.x-slug` phase directory under `.planning/phases/` and is reviewed via `/gsd-review-backlog`.

### Deployment (v3.7 candidate — carried from v3.5)

### Phase 999.1: deploy-vercel-auto (BACKLOG)

**Requirement:** DEPLOY-01
**Goal:** Vercel auto-deploy from `main` on every push
**Directory:** `.planning/phases/999.1-deploy-vercel-auto/`

### Phase 999.2: deploy-custom-domain (BACKLOG)

**Requirement:** DEPLOY-02
**Goal:** andresmontoyat.co custom domain + HTTPS via Vercel DNS
**Directory:** `.planning/phases/999.2-deploy-custom-domain/`

### Phase 999.3: deploy-pr-preview (BACKLOG)

**Requirement:** DEPLOY-03
**Goal:** PR preview deploys + Open Graph card validation
**Directory:** `.planning/phases/999.3-deploy-pr-preview/`

### Visual polish

### Phase 999.4: vis-company-logos (BACKLOG)

**Requirement:** VIS-02
**Goal:** Company logo SVGs in experience timeline entries
**Directory:** `.planning/phases/999.4-vis-company-logos/`

### Phase 999.5: vis-testimonials (BACKLOG)

**Requirement:** VIS-04
**Goal:** Testimonials section with rotating quote cards
**Directory:** `.planning/phases/999.5-vis-testimonials/`

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
**Goal:** Vitest + Playwright + RTL test infrastructure (7 milestones deferred)
**Directory:** `.planning/phases/999.12-test-infrastructure/`
