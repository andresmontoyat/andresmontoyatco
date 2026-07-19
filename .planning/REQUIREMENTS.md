# Requirements: Carlos Montoya Portfolio — v5 Astro Migration

**Defined:** 2026-07-19
**Milestone:** v5 Astro Migration
**Core Value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos.
**Milestone Goal:** Migrate from React CSR (Vite) to Astro SSG with React islands to clear the Lighthouse mobile hard gate (Performance ≥0.95, Accessibility/Best Practices/SEO = 1.0) blocked since v4.2 Phase 11.

## v1 Requirements

Requirements for this milestone. Each maps to a v5 roadmap phase. All are required for the milestone to close — the Lighthouse gate (DEPLOY-04) needs every other requirement shipped first; there is no partial-migration shippable state.

### ROUTE — i18n routing & SEO

- [x] **ROUTE-01**: Site serves fully static content at `/en` and `/es` via `astro:i18n`, symmetric locale trees
- [ ] **ROUTE-02**: Visitor hitting `/` is redirected (302) to `/en` or `/es` — `cam-lang` cookie first, else `Accept-Language` header — via Vercel Edge Middleware (`middleware.ts`, platform-native, no Astro adapter)
- [ ] **ROUTE-03**: Each locale page carries correct `hreflang` + canonical tags in `<head>`
- [ ] **ROUTE-04**: `html lang` attribute set correctly per locale at build time (no runtime JS mutation)
- [ ] **ROUTE-05**: Language switcher navigates `/en` ↔ `/es` preserving the current section hash

### ISLAND — React islands

- [ ] **ISLAND-01**: Nav (with nested ThemeToggle) hydrates as `client:load`; scroll-spy and theme flip behave identically to the current site
- [ ] **ISLAND-02**: SectionPager hydrates as `client:visible`, unchanged behavior
- [ ] **ISLAND-03**: Experience tech-chip filter implemented as a narrowly-scoped `client:visible` island or vanilla script — not `client:load`
- [ ] **ISLAND-04**: Theme flips before first paint via a blocking inline `<head>` script — zero FOUC on load or refresh

### STATIC — zero-JS components

- [ ] **STATIC-01**: About, Skill, Footer, Projects, Claude render as zero-client-JS `.astro` components, consuming existing `data/*.json` unchanged
- [ ] **STATIC-02**: Experience expand/collapse and Hero's CV dropdown use native `<details>`/`<summary>`, zero JS

### TEST — coverage gate

- [ ] **TEST-01**: Every static `.astro` component has an Astro Container API test replacing its former RTL test (bilingual content + ARIA assertions preserved)
- [ ] **TEST-02**: Every React island keeps its Vitest + React Testing Library coverage unchanged

### DEPLOY — cleanup & gate

- [x] **DEPLOY-01**: `three` (unused dependency) removed from `package.json`
- [ ] **DEPLOY-02**: `vercel.json` SPA-fallback rewrite removed; explicit `404.astro` authored; cache headers scoped to `/_astro/*` only
- [x] **DEPLOY-03**: `engines.node >=22.12.0` pinned in `package.json`; Vercel project Node version updated to match
- [ ] **DEPLOY-04**: Lighthouse mobile hard gate (Performance ≥0.95, Accessibility/Best Practices/SEO = 1.0) passes on all 3 target URLs (`/`, `/en`, `/es`) before merge to `main`

## v2 Requirements

Deferred to a future release. Tracked but not in the v5 roadmap.

### Polish

- **POLISH-01**: Astro View Transitions (`<ClientRouter />`) for SPA-like locale switching
- **POLISH-02**: `client:media` viewport-conditional hydration split for desktop/mobile Nav variants (only if post-migration bundle numbers justify it)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Contact form logic / validation | Contact is confirmed fully static — `react-hook-form` isn't even installed; no live form exists to migrate |
| Visual/content redesign | This milestone is architecture-only; v4.2 (in progress on `main`) owns content changes |
| Custom domain (`andresmontoyat.co`) | Separate backlog item carried from v4.1/v4.2, unrelated to this migration |
| `@astrojs/vercel` adapter for the whole site | Root-redirect solved via Vercel-native Edge Middleware instead — keeps the non-goal of a fully static, adapter-free build for every route except the redirect |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROUTE-01 | Phase 21 | Complete |
| ROUTE-02 | Phase 21 | Pending |
| ROUTE-03 | Phase 21 | Pending |
| ROUTE-04 | Phase 21 | Pending |
| ROUTE-05 | Phase 22 | Pending |
| ISLAND-01 | Phase 22 | Pending |
| ISLAND-02 | Phase 25 | Pending |
| ISLAND-03 | Phase 26 | Pending |
| ISLAND-04 | Phase 21 | Pending |
| STATIC-01 | Phase 23 | Pending |
| STATIC-02 | Phase 24 / Phase 26 | Pending |
| TEST-01 | Phase 23 | Pending |
| TEST-02 | Phase 22 | Pending |
| DEPLOY-01 | Phase 21 | Complete |
| DEPLOY-02 | Phase 21 | Pending |
| DEPLOY-03 | Phase 21 | Complete |
| DEPLOY-04 | Phase 27 | Pending |

**Note on STATIC-02:** Requirement bundles two independent native-`<details>` conversions — Hero's CV dropdown (delivered Phase 24) and Experience's expand/collapse (delivered Phase 26). Traceability anchored at Phase 24 per "assign to the first phase that could deliver it"; Phase 26 completes the requirement's second half and is called out explicitly in its own Requirements line for full-coverage clarity.

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17 (Phases 21–27)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-19*
*Last updated: 2026-07-19 after roadmap creation (v5 Astro Migration) — 17/17 requirements mapped to Phases 21-27*
