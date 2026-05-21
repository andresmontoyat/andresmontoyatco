# Roadmap: Carlos Montoya Portfolio Redesign

## Milestones

- ✅ **v3.4** — Brownfield redesign baseline: Vite 6 + React 18 + Tailwind v3.4, sticky bilingual nav, char-reveal hero, vertical experience timeline, email-hero contact, Open Graph, Lighthouse 98/100/100/100 (shipped 2026-05-07 — see [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md))
- ⚠ **v3.5 — Themes, Projects & Production** — Themes & Projects shipped (VIS-01, VIS-03, DEBT-01/02/03); deploy deferred to v3.7 (closed 2026-05-12 — see [`milestones/v3.5-ROADMAP.md`](milestones/v3.5-ROADMAP.md) and [`milestones/v3.5-MILESTONE-AUDIT.md`](milestones/v3.5-MILESTONE-AUDIT.md))
- ✅ **v3.6 — AI Practice & Brand Refresh** — Code shipped: brand palette swap, theme toggle root-cause fix, hero photo, sales-pitch Claude Code section. 5/5 active REQs satisfied. UAT visual+Lighthouse + DEPLOY-01/02/03 + DIAGRAMS-01 carry to v3.7. Closed without git tag (production not yet live). See [`milestones/v3.6-ROADMAP.md`](milestones/v3.6-ROADMAP.md) and [`milestones/v3.6-MILESTONE-AUDIT.md`](milestones/v3.6-MILESTONE-AUDIT.md).
- 🚧 **v3.7 — Production Deploy** *(active, opened 2026-05-20)* — Vercel auto-deploy first (Phase 11 folds UAT-GATE: Tests 3-10 local + Test #11 Lighthouse mobile HARD gate), custom domain andresmontoyat.co + DNS (Phase 12), PR preview deploys (Phase 13). Tag `v3.7` once production live.

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

### 🚧 v3.7 Production Deploy (active, opened 2026-05-20)

**Goal:** Ship the portfolio live at `andresmontoyat.co` via Vercel. Deploy-first → DNS-after → PR previews sequence per user decision 2026-05-20.

- [ ] **Phase 11: Vercel auto-deploy + UAT pre-deploy gate** (DEPLOY-01)
- [ ] **Phase 12: Custom domain andresmontoyat.co + DNS** (DEPLOY-02)
- [ ] **Phase 13: PR preview deploys + OG card validation** (DEPLOY-03)

## Phase Details (v3.7)

### Phase 11: Vercel auto-deploy + UAT pre-deploy gate
**Goal**: Portfolio is live at a stable `*.vercel.app` URL, auto-deploys on every push to `main`, and the v3.6 UAT visual+Lighthouse debt is paid (Phase 10 Tests 3-11) before the deploy config merges.
**Depends on**: v3.6 milestone close (✓ done 2026-05-20)
**Requirements**: DEPLOY-01 (folds UAT-GATE)
**Success Criteria** (what must be TRUE):
  1. Vercel project linked to repo (`vercel link`); pushing to `main` triggers a production deploy that completes successfully; deployed URL renders the portfolio identically to local `npx serve dist`
  2. Phase 10 UAT Tests 3-10 all PASS against local `npx serve dist` build (theme prod build, localStorage persistence, hero photo at iPhone 14 / Pixel 7 / iPad / 1440px, hero photo light mode, reduced-motion, nav scroll-spy click, AI section CTAs + EN/ES, WCAG AA contrast light mode)
  3. Phase 10 Test #11 Lighthouse mobile audit run against the deployed `*.vercel.app` URL passes the HARD gate: Performance ≥ 95 / Accessibility 100 / Best Practices 100 / SEO 100 — matching v3.4 baseline 98/100/100/100. Lighthouse fail blocks Phase 12.
  4. SPA fallback verified: direct hit on `*.vercel.app/#contact` (or any anchor) serves `index.html` and scroll-jumps correctly; no 404 page from Vercel for deep-link anchors
  5. Cache headers respected: static assets (hashed bundles in `dist/assets/*`) have long max-age + immutable; `index.html` is no-cache or short-cache so deploys propagate
**Plans**: 5 plans
  - [ ] 11-01-PLAN.md — vercel.json + .gitignore (.vercel/) + index.html og:url typo fix (Wave 1, autonomous)
  - [ ] 11-02-PLAN.md — adapt lighthouse:mobile for deployed URL + tighten lighthouse:check thresholds to Phase 11 HARD gate (Wave 1, autonomous, parallel with 11-01)
  - [ ] 11-03-PLAN.md — local UAT Tests 3-10 against `npx serve dist` (Wave 2, non-autonomous, human browser-driven)
  - [ ] 11-04-PLAN.md — vercel login + vercel link + first production deploy + curl-verify SPA fallback + cache headers (Wave 3, non-autonomous, interactive CLI auth)
  - [ ] 11-05-PLAN.md — Lighthouse mobile audit against deployed *.vercel.app URL + HARD gate verdict (Wave 4, mixed; Phase 12 unblock signal)
**UI hint**: no (infra phase)

### Phase 12: Custom domain andresmontoyat.co + DNS
**Goal**: The portfolio resolves at `https://andresmontoyat.co` with valid HTTPS; OG card validates on the canonical domain.
**Depends on**: Phase 11 (Vercel deploy URL stable + Lighthouse gate passed)
**Requirements**: DEPLOY-02
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
**Success Criteria** (what must be TRUE):
  1. Opening a PR against `main` triggers a Vercel preview deploy to a unique URL (`*-pr-<num>.vercel.app` or branch-derived); Vercel GitHub bot posts the URL as a PR comment within ~2 minutes of push
  2. The preview URL renders the portfolio identically to production (theme toggle, hero photo, AI section, bilingual EN/ES) — no environment drift between preview and production
  3. OG meta tags work on preview URLs: no hard-coded `https://andresmontoyat.co` `og:url` causing share-debugger to reject preview hosts; share-debugger on a sample preview URL returns the og-image.png + title/description
  4. Closing or merging a PR cleans up the preview deploy (Vercel default behavior — verify it does not accumulate stale previews)
  5. Branch protection on `main` updated to require Vercel deploy check (optional but recommended) — preview deploy success becomes a merge gate
**Plans**: TBD
**UI hint**: no

## Progress Table (v3.7)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 11. Vercel auto-deploy + UAT gate | 0/5 | Planned | - |
| 12. Custom domain andresmontoyat.co + DNS | 0/TBD | Not started | - |
| 13. PR preview deploys + OG validation | 0/TBD | Not started | - |

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
| 11. Architecture diagrams | v3.6 | 0 / not planned | ✗ De-scoped → 999.13 backlog | — |
| 11. Vercel deploy + UAT gate | v3.7 | 0/5 | Planned | — |
| 12. Custom domain + DNS | v3.7 | 0/TBD | Not started | — |
| 13. PR preview deploys | v3.7 | 0/TBD | Not started | — |

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
**Goal:** Vitest + Playwright + RTL test infrastructure (8 milestones deferred through v3.6)
**Directory:** `.planning/phases/999.12-test-infrastructure/`
