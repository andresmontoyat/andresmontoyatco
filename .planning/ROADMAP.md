# Roadmap: Carlos Montoya Portfolio Redesign

## Shipped Milestones

- **v3.4** — Brownfield redesign: Vite 6 + React 18 + Tailwind v3.4, sticky bilingual nav, char-reveal hero, vertical experience timeline, email-hero contact, Open Graph, Lighthouse 98/100/100/100. (Shipped 2026-05-07 — see [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md))

## Active Milestone

_None — v3.4 just shipped. Run `/gsd-new-milestone` to start v3.5._

## Backlog

Items deferred from v3.4 — candidates for v3.5+ scoping:

### Visual Enhancements (VIS-*)
- Dark/light theme toggle
- Company logo SVGs in experience timeline
- Projects/portfolio showcase section with screenshots
- Testimonials or recommendations section

### Advanced SEO (ASEO-*)
- JSON-LD structured data for Person schema
- WebP image optimization pipeline
- Sitemap generation

### Interactivity (INTX-*)
- Contact form with email delivery (requires backend/service)
- Blog or articles section
- GitHub activity integration

### v3.4 Tech Debt
- `t.hero.cta2` orphaned i18n key — Hero CV buttons hardcode bilingual strings
- `t.contact.loc` orphaned i18n key — no Location card by design
- `scripts/og-template.html` uses Google Fonts CDN — should self-host
- GA `<script>` outside `<body>` in index.html — should move to `<head>`
- Test infrastructure decision (deferred 4 consecutive phases)

### Operational
- Deploy target choice (Vercel / Netlify / GitHub Pages)
- Domain registration (carlosmontoya.dev or similar)
- Cross-device cloud testing (BrowserStack/SauceLabs)
