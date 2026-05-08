# Requirements: Carlos Montoya Portfolio — v3.5

**Defined:** 2026-05-07
**Milestone:** v3.5 Themes, Projects & Production
**Core Value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos.

## v3.5 Requirements

Requirements for the v3.5 release. Each maps to roadmap phases (continuing from Phase 4 → Phase 5+).

### Visual Enhancements (now in scope)

- [x] **VIS-01**: Dark/light theme toggle — Dark (default, current ink palette) + Light variant; icon button (sun/moon) in nav next to LangPill; persisted in localStorage; tailwind.config.js extended with light token variants
- [x] **VIS-03**: Projects showcase section — 3-5 hand-picked projects in `src/data/projects.js` (mirror experience.js bilingual pattern); card grid with title/desc/tech chips/screenshot/live URL/GitHub URL; screenshots in `public/projects/`; new section ID added to Nav scroll-spy

### Deployment

- [ ] **DEPLOY-01**: Vercel production deploy — auto-deploy from main branch, vite-react preset, build command `npm run build`, output `dist/`
- [ ] **DEPLOY-02**: Custom domain andresmontoyat.co configured with DNS records pointing to Vercel; HTTPS via Vercel auto-cert
- [ ] **DEPLOY-03**: Auto-preview deploys per PR/branch on Vercel — verify preview URL renders OG card correctly

### v3.4 Tech Debt Cleanup

- [x] **DEBT-01**: Remove orphaned i18n keys — `t.hero.cta2` (Hero CV buttons hardcode bilingual strings) + `t.contact.loc` (no Location card by design) — clean removal from translations.js EN+ES
- [x] **DEBT-02**: Self-host fonts in `scripts/og-template.html` — replace fonts.googleapis.com link with @fontsource Inter woff2; verify `npm run og:gen` still produces identical og-image.png
- [x] **DEBT-03**: Move GA `<script>` from between `</body>`/`</html>` to `<head>` in index.html — preserves SEO-02 firing, fixes HTML spec violation

## Out of Scope (for v3.5)

| Feature | Reason |
|---------|--------|
| VIS-02: Company logo SVGs in experience timeline | Defer to v3.6 — visual polish |
| VIS-04: Testimonials section | Defer to v3.6 — content gathering required |
| ASEO-01: JSON-LD Person schema | Defer to v3.6 — SEO polish, not blocking deploy |
| ASEO-02: WebP image optimization pipeline | Defer to v3.6 — Lighthouse already 98 |
| ASEO-03: Sitemap generation | Defer to v3.6 — single-page SPA, low priority |
| INTX-01: Contact form | Out of scope (requires backend) |
| INTX-02: Blog or articles section | Out of scope this milestone |
| INTX-03: GitHub activity integration | Out of scope (would extend VIS-03 in v3.6+) |
| Test infrastructure (Vitest / Playwright e2e / RTL) | Locked deferred 5 consecutive phases — revisit v3.6+ if scope justifies |
| BrowserStack / SauceLabs cross-device testing | Defer — DevTools responsive + production deploy will catch issues |

## Future Backlog

Tracked but not in current roadmap:

### Visual Enhancements
- **VIS-02**: Company logo SVGs in experience timeline
- **VIS-04**: Testimonials or recommendations section

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
| VIS-01 | Phase 5 | Complete |
| DEBT-01 | Phase 5 | Complete |
| DEBT-02 | Phase 5 | Complete |
| DEBT-03 | Phase 5 | Complete |
| VIS-03 | Phase 6 | Complete |
| DEPLOY-01 | Phase 7 | Pending |
| DEPLOY-02 | Phase 7 | Pending |
| DEPLOY-03 | Phase 7 | Pending |
