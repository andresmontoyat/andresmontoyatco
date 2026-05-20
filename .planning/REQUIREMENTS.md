# Requirements: Carlos Montoya Portfolio — v3.7

**Defined:** 2026-05-20
**Milestone:** v3.7 Production Deploy
**Core Value:** The hero section and overall first impression must stop recruiters mid-scroll, make them want to learn more about Carlos, and convert visits into engineering conversations — **on the live public domain andresmontoyat.co**.

## v3.7 Requirements

Requirements for the v3.7 release. Phase numbering continues from v3.6 (which ended at Phase 10; Phase 11 slot reused since DIAGRAMS-01 stayed backlog). Sequence: **Vercel deploy first → DNS / custom domain → PR previews** per user decision 2026-05-20.

### Production Deploy

- [ ] **DEPLOY-01** *(v3.7 Phase 11)* Vercel auto-deploy from `main` — vite-react preset, build `npm run build`, output `dist/`. Project linked via `vercel link`; every push to `main` triggers production deploy at a stable `*.vercel.app` URL. Includes:
  - `vercel.json` (or Vercel UI equivalent) configures vite-react preset, output dir `dist`, framework `vite`
  - SPA fallback: all routes serve `index.html` (no 404 on direct deep-link hits, even though portfolio is single-page)
  - Cache headers respected (Vercel default + verify static assets get long max-age + immutable for hashed bundles)
  - **UAT-GATE folded in (Tests 3-11 from v3.6 Phase 10):** Before merging deploy config to main, run Tests 3-10 against local `npx serve dist` (theme prod build / localStorage persistence / hero photo at 4 viewports / hero photo light mode / reduced-motion / nav scroll-spy click / AI section CTAs + EN/ES / WCAG AA contrast light mode). After first Vercel deploy succeeds, run Test #11 Lighthouse mobile audit against the deployed `*.vercel.app` URL — **HARD gate**: Perf ≥ 95 / A11y 100 / BP 100 / SEO 100, matching v3.4 baseline 98/100/100/100. Lighthouse fail blocks Phase 12.

- [ ] **DEPLOY-02** *(v3.7 Phase 12)* Custom domain `andresmontoyat.co` + DNS records → Vercel; HTTPS via Vercel auto-cert. Includes:
  - Add custom domain in Vercel project settings
  - DNS records configured at registrar: apex `A 76.76.21.21` (Vercel anycast) + `www` CNAME `cname.vercel-dns.com` (or apex CNAME flattening if registrar supports — confirm registrar choice during phase)
  - HTTPS certificate auto-provisioned via Let's Encrypt; verify TLS handshake on both `andresmontoyat.co` and `www.andresmontoyat.co`
  - Canonical domain redirect: `www.` → apex (or apex → `www.` — confirm preference during phase)
  - OG card meta tags resolve correctly on canonical domain (LinkedIn/Twitter/Facebook share-debugger validates)
  - `og:url` + `<link rel="canonical">` updated in `index.html` if needed (currently may be relative or hardcoded to `localhost`)

- [ ] **DEPLOY-03** *(v3.7 Phase 13)* PR preview deploys with OG card validation. Includes:
  - Vercel git integration auto-deploys every PR against `main` to a unique `*-pr-*.vercel.app` URL
  - Preview URL surfaced in GitHub PR comments (Vercel bot)
  - OG card meta tags work on preview URLs (no hard-coded `https://andresmontoyat.co` that breaks on preview hosts) — verify via Vercel preview URL's open-graph share-debugger
  - Optional: GitHub Action that runs Lighthouse against the preview URL on each PR (mark as out-of-scope-this-phase if scope-creep risk; can backlog as v3.8)

## Out of Scope (for v3.7)

| Feature | Reason |
|---------|--------|
| DIAGRAMS-01: Cross-repo architecture diagrams | Backlog 999.13 — re-roadmap when bandwidth permits; not blocking deploy |
| VIS-02: Company logo SVGs in experience timeline | Defer — visual polish, not blocking |
| VIS-04: Testimonials section | Defer — content gathering required |
| VIS-05: claude-kanban + caveman featured-app cards in AI section | Backlog 999.14 — AI-01 shipped 3 of original 5 cards; deferred |
| ASEO-01: JSON-LD Person schema | Defer — SEO polish, do in v3.8 alongside any further SEO work |
| ASEO-02: WebP image optimization pipeline | Defer — `sharp` pipeline already exists for hero (Phase 8); generalize later |
| ASEO-03: Sitemap generation | Defer — single-page SPA, low priority |
| INTX-01: Contact form with backend | Out of scope (requires backend service decision; mailto: still works) |
| INTX-02: Blog or articles section | Out of scope this milestone |
| INTX-03: GitHub activity integration | Out of scope |
| Test infrastructure (Vitest / Playwright e2e / RTL) | 9th consecutive milestone deferred — **flag for explicit review post-v3.7-deploy**; manual UAT still catching regressions at acceptable cost |
| Cloudflare / non-Vercel CDN | Vercel locked as host per D-v3.6 + D-v3.7 — no override |
| GitHub Actions Lighthouse CI on every PR | Risk of scope creep; consider for v3.8 if PR-preview Lighthouse becomes a felt need |
| Custom OG image per page | Single-page SPA — one og-image.png already covers it; no per-page variants needed |
| `robots.txt` directives beyond default | Vercel default allows crawl; explicit `robots.txt` deferred |

## Future Backlog

Tracked but not in current roadmap:

### Architecture
- **DIAGRAMS-01**: Cross-repo architecture diagrams (gradle PlantUML + Structurizr for `spring-ai-qdrant-mcp`; Mermaid `.mmd` for GSD/claude-kanban/ci-templates/caveman; clickable AI app cards open modal) — backlog 999.13

### Visual Enhancements
- **VIS-02**: Company logo SVGs in experience timeline — backlog 999.4
- **VIS-04**: Testimonials section — backlog 999.5
- **VIS-05**: Add claude-kanban + caveman featured-app cards back into AI section — backlog 999.14

### Advanced SEO
- **ASEO-01**: JSON-LD Person schema — backlog 999.6
- **ASEO-02**: WebP image optimization pipeline (generalized beyond hero) — backlog 999.7
- **ASEO-03**: Sitemap generation — backlog 999.8

### Interactivity
- **INTX-01**: Contact form with backend / forwarder — backlog 999.9
- **INTX-02**: Blog or articles section — backlog 999.10
- **INTX-03**: GitHub activity integration — backlog 999.11

### Testing
- **TEST-INFRA**: Vitest + Playwright + RTL — backlog 999.12 (9 consecutive milestones deferred; flag for post-v3.7 review)

## Traceability Matrix

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DEPLOY-01 | Phase 11 | Pending (UAT-GATE folded in) |
| DEPLOY-02 | Phase 12 | Pending (depends on Phase 11 deploy URL stable) |
| DEPLOY-03 | Phase 13 | Pending (depends on Phase 11 Vercel project + Phase 12 canonical domain) |
