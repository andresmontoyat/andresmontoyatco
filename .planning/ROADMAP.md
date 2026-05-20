# Roadmap: Carlos Montoya Portfolio Redesign

## Milestones

- ✅ **v3.4** — Brownfield redesign baseline: Vite 6 + React 18 + Tailwind v3.4, sticky bilingual nav, char-reveal hero, vertical experience timeline, email-hero contact, Open Graph, Lighthouse 98/100/100/100 (shipped 2026-05-07 — see [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md))
- ⚠ **v3.5 — Themes, Projects & Production** — Themes & Projects shipped (VIS-01, VIS-03, DEBT-01/02/03); deploy deferred to v3.7 (closed 2026-05-12 — see [`milestones/v3.5-ROADMAP.md`](milestones/v3.5-ROADMAP.md) and [`milestones/v3.5-MILESTONE-AUDIT.md`](milestones/v3.5-MILESTONE-AUDIT.md))
- ✅ **v3.6 — AI Practice & Brand Refresh** — Code shipped: brand palette swap, theme toggle root-cause fix, hero photo, sales-pitch Claude Code section. 5/5 active REQs satisfied. UAT visual+Lighthouse + DEPLOY-01/02/03 + DIAGRAMS-01 carry to v3.7. Closed without git tag (production not yet live). See [`milestones/v3.6-ROADMAP.md`](milestones/v3.6-ROADMAP.md) and [`milestones/v3.6-MILESTONE-AUDIT.md`](milestones/v3.6-MILESTONE-AUDIT.md).
- 📋 **v3.7 — Production Deploy** *(next, to be defined via `/gsd-new-milestone`)* — Run UAT pre-deploy gate (Tests 3-11 from Phase 10), ship to Vercel, configure andresmontoyat.co domain + DNS + HTTPS, enable PR preview deploys.

---

## Phases

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

### 📋 v3.7 Production Deploy (next — to be defined via `/gsd-new-milestone`)

Provisional phase outline (refine in `/gsd-new-milestone`):

- [ ] **Phase 1 (v3.7): UAT pre-deploy gate** — execute Phase 10 Tests 3-11 against production build; Test #11 Lighthouse mobile is HARD gate
- [ ] **Phase 2 (v3.7): deploy-vercel-auto** — Vercel auto-deploy from main (was backlog 999.1) — DEPLOY-01
- [ ] **Phase 3 (v3.7): deploy-custom-domain** — andresmontoyat.co + DNS + HTTPS (was backlog 999.2) — DEPLOY-02
- [ ] **Phase 4 (v3.7): deploy-pr-preview** — PR preview deploys + OG card validation (was backlog 999.3) — DEPLOY-03

---

## Progress Table

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
| 11. Architecture diagrams | v3.6 | 0 / not planned | ✗ De-scoped → future | — |
| 1-4. (v3.7 deploy phases) | v3.7 | — | 📋 To be defined | — |

---

## Backlog

Tracked but not yet scoped to a milestone. Each item lives as a `999.x-slug` phase directory under `.planning/phases/` and is reviewed via `/gsd-review-backlog`.

### Deployment (v3.7 candidate — carried from v3.5/v3.6)

### Phase 999.1: deploy-vercel-auto (BACKLOG → v3.7 candidate)

**Requirement:** DEPLOY-01
**Goal:** Vercel auto-deploy from `main` on every push
**Directory:** `.planning/phases/999.1-deploy-vercel-auto/`

### Phase 999.2: deploy-custom-domain (BACKLOG → v3.7 candidate)

**Requirement:** DEPLOY-02
**Goal:** andresmontoyat.co custom domain + HTTPS via Vercel DNS
**Directory:** `.planning/phases/999.2-deploy-custom-domain/`

### Phase 999.3: deploy-pr-preview (BACKLOG → v3.7 candidate)

**Requirement:** DEPLOY-03
**Goal:** PR preview deploys + Open Graph card validation
**Directory:** `.planning/phases/999.3-deploy-pr-preview/`

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
**Goal:** Vitest + Playwright + RTL test infrastructure (8 milestones deferred through v3.6)
**Directory:** `.planning/phases/999.12-test-infrastructure/`
