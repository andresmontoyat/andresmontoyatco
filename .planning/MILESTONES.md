# Milestones

## v3.6 AI Practice & Brand Refresh (Closed: 2026-05-20 — code shipped, deploy + UAT closure deferred to v3.7)

**Status:** ✅ Code shipped — production deploy still pending v3.7
**Phases delivered:** 4 of 5 (Phase 7, 8, 9 ✓ code-verified; Phase 10 UAT closed partial 2/11; Phase 11 de-scoped)
**Plans completed:** 4 plans across 64 commits (+5670/-180 LOC, 51 files, 9-day timeline)
**Requirements satisfied:** 5 of 5 active (THEME-01, COLOR-01, HERO-01, AI-01, AI-01-CICD); DIAGRAMS-01 deferred
**Audit:** `milestones/v3.6-MILESTONE-AUDIT.md` — verdict `tech_debt` (no blockers; verification debt explicitly carried to v3.7 pre-deploy gate)

**Key accomplishments:**

- **THEME-01 (Phase 7)** — Tailwind config refactored to CSS-var indirection (`:root` + `[data-theme="light"]`); theme toggle functionally flips all 8 sections — Phase 5 false-positive UAT debt closed
- **COLOR-01 (Phase 7)** — Brand palette swap to blue-500 (`#3B82F6`) + emerald-500 (`#10B981`); WCAG AA contrast in both modes; legacy hex sweep clean; og-image regenerated
- **HERO-01 (Phase 8)** — Cinematic full-bleed hero photo via `<picture>` with 800w/1600w WebP sources; theme-aware `--hero-*` CSS vars; sharp pipeline + LCP preload (140 KB desktop / 49 KB mobile)
- **AI-01 + AI-01-CICD (Phase 9)** — Bilingual sales-pitch Claude Code section between Projects and Contact; lazy-loaded 9.95 KB chunk; 7-counter proof + 5 services + 3 featured apps (GSD, spring-ai-qdrant-mcp, ci-templates); scroll-spy in Desktop + Mobile nav; CTAs route to #contact / #projects
- **Cross-phase integration verified** — 8/8 wiring checks WIRED (gsd-integration-checker); zero gaps, zero broken E2E flows

**Known deferred items at close:** 14 (see STATE.md Deferred Items)

- Phase 8/9 `human_verified: pending` (11 visual + Lighthouse items) → v3.7 Phase 1 pre-deploy gate
- Phase 10 UAT Tests 3-11 (9 tests skipped; Test #11 Lighthouse mobile is HARD gate before Vercel deploy)
- DIAGRAMS-01 (Phase 11 de-scoped) — re-roadmap in future milestone
- VIS-05 (backlog) — claude-kanban + caveman featured-app cards (AI-01 shipped 3 of original 5)
- Test infrastructure (7th consecutive milestone deferred)
- DEPLOY-01/02/03 still pending (carries forward from v3.5 → v3.7)

**Decision:** Closed v3.6 without git tag — consistent with v3.5; tag deferred until production site is live (v3.7).

---

## v3.5 Themes, Projects & Production (Closed: 2026-05-12 — partial)

**Status:** ⚠ Partially shipped — themes + projects delivered; deploy phase deferred to v3.6
**Phases delivered:** 2 of 3 (Phase 5, Phase 6 ✓ | Phase 7 not executed)
**Plans completed:** 6 plans, 8 tasks
**Requirements satisfied:** 5 of 8 (VIS-01, VIS-03, DEBT-01, DEBT-02, DEBT-03)
**Audit:** `milestones/v3.5-MILESTONE-AUDIT.md` — verdict `gaps_found`

**Key accomplishments:**

- Dark/light theme toggle (VIS-01): ThemeContext + CSS variable swap, `[data-theme="light"]` overrides, sun/moon ThemeToggle in nav (Desktop + Mobile), persistence via `cam-theme` localStorage, Lighthouse a11y 100
- v3.4 tech debt cleared (DEBT-01/02/03): orphaned i18n keys removed (cta2, contact.loc), `og-template.html` self-hosts Inter via `@fontsource/inter`, GA `<script>` moved into `<head>`
- Projects showcase section (VIS-03): bilingual `src/data/projects.js` with 4 entries, responsive `Projects.js` card grid with brand-gradient screenshot fallback, scroll-spy in DesktopNav + MobileMenu, lazy-loaded `Projects-DucOh_hO.js` chunk between Experience and Contact
- Human UAT: 5/5 pass on Phase 5 and 5/5 pass on Phase 6 (2026-05-08)

**Known gaps / deferred to v3.6:**

- **DEPLOY-01** — Vercel production deploy from main (never set up)
- **DEPLOY-02** — andresmontoyat.co domain + HTTPS (DNS never configured)
- **DEPLOY-03** — PR preview deploys + OG card validation (no Vercel project exists)
- Site is **not yet live** at https://andresmontoyat.co. `dist/` build artifacts are production-ready but not deployed.

**Decision:** Closed v3.5 without git tag — premature without live production site. Tag will be created on v3.6 close when deploy completes.

---
