# Carlos Montoya Portfolio — Redesign

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

### Active

- [ ] Rethought section structure for About / Skills / Experience / Contact / Footer — Phase 3
- [ ] Rich scroll animations, parallax effects, hover states, and transitions across content sections — Phase 3
- [ ] Professional presentation of work history that tells a compelling story — Phase 3
- [ ] Working contact method (form or direct links) — Phase 3
- [ ] Fully responsive mobile-first design across remaining sections — Phase 3
- [ ] Fast performance despite rich animations (target Lighthouse 90+) — Phase 4
- [ ] SEO and Open Graph meta tags for link sharing (beyond html lang/title/description) — Phase 4

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
| Fresh content structure | Current sections feel generic — rethink from scratch | -- Pending Phase 3 |
| In-place component modify (D-01) | Lower diff, retain git history per file | Phase 2 |
| Native CSS scroll-behavior + custom IntersectionObserver (D-02/D-03) | Drop unused react-scroll dep; lighter bundle than lib | Phase 2 |
| React portal mobile menu (D-05) | Avoids z-index conflicts with sticky nav, body scroll-lock cleaner | Phase 2 |
| Manual browser-only testing (D-06) | Defer test infra to Phase 4 if quality gates require | Phase 2 |

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
*Last updated: 2026-05-05 after Phase 2 completion*
