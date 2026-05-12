# Requirements: Carlos Montoya Portfolio — v3.6

**Defined:** 2026-05-12
**Milestone:** v3.6 AI Practice & Brand Refresh
**Core Value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos — and now: convert visits into engineering conversations.

## v3.6 Requirements

Requirements for the v3.6 release. Phase numbering continues from v3.5 (which left Phase 7 unfilled when deploy was deferred). v3.6 reuses Phase 7–10. Deploy (DEPLOY-01/02/03) is **NOT in v3.6** — deferred to v3.7.

### Brand Refresh

- [ ] **COLOR-01**: Brand palette swap — `brand` `#6C63FF` (indigo) → blue-500 `#3B82F6`; `accent` `#FF6B6B` (coral) → emerald-500 `#10B981`. Update `tailwind.config.js` color tokens (`brand.*`, `accent.*`), `index.css` light-mode overrides, all `backgroundImage` gradients (`hero-gradient`, `brand-gradient`, `card-gradient`), and `boxShadow.brand` rgba values. No component changes required if THEME-01 lands first.

### Theme Bug Fix (CRITICAL — Phase 5 false-positive)

- [ ] **THEME-01**: Refactor Tailwind config so `colors.ink.*`, `colors.brand.*`, `colors.accent.*`, `colors.text.*` reference CSS variables (e.g. `ink.900: 'var(--color-surface-deep)'`) instead of hardcoded hex. Define both `:root` (dark defaults) and `[data-theme="light"]` overrides in `index.css`. Result: existing Tailwind utility classes (`bg-ink-900`, `text-text-primary`, `border-brand`) actually flip when `dataset.theme` toggles. Phase 5 UAT 5/5 was visually unverified — this Phase delivers what Phase 5 claimed.

### Hero Integration

- [ ] **HERO-01**: Integrate `me.jpg` into Hero using Variant C (overlay full-bleed) — move `./me.jpg` → `public/me.jpg`, render as `<img>` background with `filter: grayscale(0.2) brightness(0.35)`, gradient overlay (`linear-gradient(180deg, rgba(13,13,26,0.4) 0%, rgba(13,13,26,0.95) 75%)`), and text-shadow on h1. Preserve existing badge + char-reveal headline + role line + dual CV CTAs + 4-stat grid. Layout responsive: foto cubre 100% width, min-height 80vh desktop, stack at mobile.

### AI / Claude Code Section

- [ ] **AI-01**: New AI section positioned between Projects and Contact in `App.js`. Variant 7 (engineer-for-hire sales pitch): centered pitch headline + sub-lead + dual CTAs (`#contact` primary, `#projects` ghost), 4 value-prop cards (Velocity, Discipline, Quality, Transfer), proof block (5 counters: 37 agents, 81 skills, 86 workflows, 15 guidelines, 4 apps), 4 services cards (Greenfield builds, AI workflow setup, MCP server development, Legacy refactor), stack-strip credentials (14 tech chips). Fully bilingual EN+ES via `translations.js`. `#claude-code` scroll-spy entry in `SECTION_IDS` + DesktopNav + MobileMenu. Lazy-loaded Suspense boundary, emits separate chunk. Mirrors Projects integration pattern from Phase 6.

## Out of Scope (for v3.6)

| Feature | Reason |
|---------|--------|
| DEPLOY-01: Vercel production deploy | Deferred to v3.7 — milestone v3.6 focuses on site improvements; deploy needs Vercel auth + DNS coordination |
| DEPLOY-02: Custom domain andresmontoyat.co | Deferred to v3.7 |
| DEPLOY-03: PR preview deploys with OG card validation | Deferred to v3.7 |
| VIS-02: Company logo SVGs in experience timeline | Defer — visual polish, not blocking |
| VIS-04: Testimonials section | Defer — content gathering required (need to ask former clients/managers) |
| ASEO-01: JSON-LD Person schema | Defer — SEO polish, do alongside deploy in v3.7 |
| ASEO-02: WebP image optimization pipeline | Defer — Lighthouse already 98 baseline |
| ASEO-03: Sitemap generation | Defer — single-page SPA, low priority |
| INTX-01: Contact form with backend | Out of scope (requires backend service decision) |
| INTX-02: Blog or articles section | Out of scope this milestone |
| INTX-03: GitHub activity integration | Out of scope |
| Test infrastructure (Vitest / Playwright e2e / RTL) | Locked deferred 7 consecutive milestones — revisit v3.7+ if regression cost climbs |
| BrowserStack / SauceLabs cross-device testing | Defer — DevTools responsive + manual UAT continues |
| Pricing / discovery-call CTA enrichment | Sales section keeps minimal CTA → #contact; pricing tier copy deferred (no scope creep) |
| Client logos / testimonials in AI section | Defer — content gathering required (linked to VIS-04 testimonial backlog) |

## Future Backlog

Tracked but not in current roadmap:

### Deployment (v3.7 candidate — carried from v3.5)

- **DEPLOY-01**: Vercel production deploy — auto-deploy from main, vite-react preset, build `npm run build`, output `dist/`
- **DEPLOY-02**: Custom domain andresmontoyat.co + DNS + HTTPS via Vercel auto-cert
- **DEPLOY-03**: PR preview deploys with OG card validation

### Visual Enhancements
- **VIS-02**: Company logo SVGs in experience timeline
- **VIS-04**: Testimonials or recommendations section (links to AI-section social proof)

### Advanced SEO
- **ASEO-01**: JSON-LD structured data for Person schema
- **ASEO-02**: WebP image optimization pipeline
- **ASEO-03**: Sitemap generation

### Interactivity
- **INTX-01**: Contact form with email delivery (requires backend/service)
- **INTX-02**: Blog or articles section
- **INTX-03**: GitHub activity integration

## Traceability Matrix

| REQ-ID | Phase | Status |
|--------|-------|--------|
| THEME-01 | Phase 7 | Pending |
| COLOR-01 | Phase 7 | Pending |
| HERO-01 | Phase 8 | Pending |
| AI-01 | Phase 9 | Pending |
| (UAT verification of all REQs) | Phase 10 | Pending |
