# Milestones

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
