# Carlos Montoya Portfolio — Redesign

## Current State

**Shipped:** v3.4 (2026-05-07) — Full brownfield redesign delivered. Site is production-ready: Vite 6 + React 18 + Tailwind v3.4 toolchain, sticky bilingual navigation, bold animated Hero with char-reveal headline, redesigned About / Skills (4 categories) / Experience (vertical timeline, 12 entries, tech chips, expand/collapse) / Contact (email-hero with copy-to-clipboard) / Footer, useInView entrance animations, branded Open Graph rich link preview, Lighthouse Performance **98** / Accessibility **100** / Best Practices **100** / SEO **100** on mobile. See [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md) for full archive and [`v3.4-MILESTONE-AUDIT.md`](v3.4-MILESTONE-AUDIT.md) for audit report.

## Next Milestone Goals (v3.5 candidates)

- **Deploy** — pick hosting target (Vercel / Netlify / GitHub Pages) and domain (carlosmontoyatco.dev or similar)
- **Tech debt cleanup** — orphaned i18n keys (t.hero.cta2, t.contact.loc), self-host fonts in og-template.html, fix GA `<script>` placement
- **Optional polish** — JSON-LD Person schema (ASEO-01), sitemap (ASEO-03), test infrastructure decision (deferred 4 phases)
- **Possible features** — dark/light theme toggle (VIS-01), company logo SVGs in timeline (VIS-02), projects showcase (VIS-03)

## What This Is

A bold, creative personal portfolio website for Carlos Andres Montoya, a senior backend engineer. The site targets recruiters and employers, designed to make a powerful first impression with rich animations, dynamic layouts, and a distinctive visual identity. Fully bilingual (English/Spanish) with flawless mobile experience.

## Core Value

The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos.

## Requirements

### Validated

- [x] Bilingual support (EN/ES) with language switcher and localStorage persistence
- [x] Experience data for 12 job entries with detailed descriptions
- [x] CV download functionality (EN/ES Word documents) — Phase 2 (dual EN/ES buttons in Hero)
- [x] Google Analytics integration (G-4TZJGR3MXR)
- [x] Modern build toolchain (Vite 6 + React 18 + Tailwind v3.4) — Phase 1
- [x] Bold design token system (indigo/coral palette, CSS custom properties) — Phase 1
- [x] Self-hosted fonts (Inter + JetBrains Mono via @fontsource) — Phase 1
- [x] Accessibility: prefers-reduced-motion support — Phase 1
- [x] Clean ESLint config with react-hooks enforcement — Phase 1
- [x] Hero section with bold first impression (status badge, char-reveal h1b, 7-step entrance stagger, dual CV CTAs, 4-stat grid) — Phase 2
- [x] Functional bilingual navigation (sticky shell, hamburger overlay via createPortal, scroll-spy active link, scroll progress bar, EN/ES LangPill) — Phase 2
- [x] SEO-04: synchronous lazy lang init eliminates first-paint flash; html lang + per-language title/meta description sync — Phase 2
- [x] About / Skills / Experience / Contact / Footer redesigned (4-category skills chip cloud, vertical experience timeline with 12 entries + tech chips + per-card expand, email-hero with copy-to-clipboard, minimal footer) — Phase 3
- [x] Scroll-triggered entrance animations via useInView IntersectionObserver hook + CSS classes (no JS animation library); 100ms stagger; prefers-reduced-motion suppression — Phase 3
- [x] Open Graph + Twitter card meta tags with branded 1200x630 og-image.png; per-language og:title/og:description sync — Phase 3 (SEO-01)
- [x] GA G-4TZJGR3MXR page-view events firing — Phase 3 (SEO-02)
- [x] Professional presentation of work history (12 entries timeline) — Phase 3
- [x] Working contact method (mailto: + email copy-to-clipboard, 3 secondary cards) — Phase 3

- [x] Lighthouse Performance 98 / Accessibility 100 / Best Practices 100 / SEO 100 on mobile preset — Phase 4 (SEO-03)
- [x] All interactive elements meet 44px tap target minimum (target-size audit 1.0) — Phase 4 (RESP-03)
- [x] Responsive sweep verified at 4 breakpoints (iPhone 14, Pixel 7, iPad, 4K) — Phase 4 (RESP-01)
- [x] Scroll perf verified jank-free via Chrome DevTools Performance profile — Phase 4 (RESP-02)
- [x] A11y baseline: skip-to-content link, jsx-a11y promoted to error, ARIA landmarks, single h1 hierarchy — Phase 4
- [x] Bundle: 168 KB main + 11/3/1 KB lazy chunks (Experience/Contact/Footer); CSS gzip 12.6 KB — Phase 4
- [x] Test infrastructure decision: locked as manual UAT only for v3.4 (revisit v3.5+) — Phase 4 D-04

### Active

- [ ] Deploy target choice (Vercel / Netlify / GitHub Pages) — milestone-level
- [ ] Domain registration (carlosmontoya.dev or similar) — milestone-level
- [ ] REQUIREMENTS.md traceability sync (10 unmapped REQ-IDs: VIS-01..04, ASEO-01..03, INTX-01..03) — milestone audit task

### Out of Scope

- Backend/API development — this is a static frontend site
- Blog or CMS functionality — not needed for a portfolio
- Authentication or user accounts — no login required
- E-commerce or payments — not a commercial site
- React Router / multi-page SPA — single-page is sufficient

## Context

- Existing codebase is a React + Tailwind CSS single-page app built with Create React App (via CRACO)
- Current dark neon theme (cyan/purple gradients) looks dated — redesign should feel fresh and modern while being bold
- i18n already implemented with react-i18next, translation files in `src/i18n/locales/`
- Experience data structured in `src/data/experience.js` with 12 entries
- There's a duplicate `website-new/` directory with a standalone HTML version that should be cleaned up
- Unused dependencies exist (react-router-dom, react-hook-form) that should be removed
- No tests exist currently — testing infrastructure should be considered
- ESLint config has issues (references missing plugins) that need cleanup

## Constraints

- **Stack**: React + Tailwind CSS (keep existing stack, modernize usage)
- **Bilingual**: Must maintain EN/ES support with i18n
- **Performance**: Rich animations must not degrade mobile performance — target Lighthouse 90+
- **Accessibility**: Must meet WCAG 2.1 AA basics (contrast, keyboard nav, screen reader)
- **Hosting**: Static site — must build to static assets for deployment

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep React + Tailwind | User preference, existing codebase familiarity | Validated — Phase 1 |
| Bold & creative direction | User wants personality, not corporate minimal | Validated — Phase 2 hero delivers bold first impression |
| Rich animations | Site should feel alive and impressive | Validated — Phase 2 (CSS-first stagger + char-reveal); extends in Phase 3 |
| Mobile-critical | Recruiters browse on phones | Validated — Phase 2 hamburger portal + responsive nav |
| Fresh content structure | Current sections feel generic — rethink from scratch | Validated — Phase 3 (4-category skills, vertical timeline, email-hero) |
| In-place component modify (D-01) | Lower diff, retain git history per file | Phase 2, Phase 3 |
| Native CSS scroll-behavior + custom IntersectionObserver (D-02/D-03) | Drop unused react-scroll dep; lighter bundle than lib | Phase 2, Phase 3 (useInView hook reused pattern) |
| React portal mobile menu (D-05) | Avoids z-index conflicts with sticky nav, body scroll-lock cleaner | Phase 2 |
| Manual browser-only testing (D-06) | Defer test infra to Phase 4 if quality gates require | Phase 2, Phase 3 |
| Tech chips from explicit `tech:[]` field per entry | Easier to maintain, grep-friendly | Phase 3 |
| Independent expand/collapse per experience card | More flexible than accordion | Phase 3 |
| All 12 experience entries visible from first load | Recruiters scan full career arc at-a-glance | Phase 3 |
| 1200x630 branded OG image generated via Playwright | Reproducible toolchain (`npm run og:gen`) for future regen | Phase 3 (SEO-01) |
| Animation threshold 25% / stagger 100ms | Standard cadence — neither rushed nor laggy | Phase 3 (ANIM-01/03) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-07 — milestone v3.4 SHIPPED (archived to milestones/v3.4-ROADMAP.md, tagged v3.4)*
