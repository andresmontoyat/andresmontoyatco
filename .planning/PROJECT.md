# Carlos Montoya Portfolio — Redesign

## What This Is

A bold, creative personal portfolio website for Carlos Andres Montoya, a senior backend engineer. The site targets recruiters and employers, designed to make a powerful first impression with rich animations, dynamic layouts, and a distinctive visual identity. Fully bilingual (English/Spanish) with flawless mobile experience.

## Core Value

The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos.

## Requirements

### Validated

- [x] Bilingual support (EN/ES) with language switcher and localStorage persistence
- [x] Experience data for 12 job entries with detailed descriptions
- [x] CV download functionality (EN/ES Word documents)
- [x] Google Analytics integration (G-4TZJGR3MXR)

### Active

- [ ] Bold, creative visual redesign — completely fresh content structure and layout
- [ ] Hero section that creates an unforgettable first impression
- [ ] Rich scroll animations, parallax effects, hover states, and transitions
- [ ] Fully responsive mobile-first design with working mobile navigation
- [ ] Rethought section structure (not bound to current Nav/Hero/About/Skills/Experience/Contact/Footer)
- [ ] Professional presentation of work history that tells a compelling story
- [ ] Smooth bilingual experience maintained across new design
- [ ] Fast performance despite rich animations
- [ ] SEO and Open Graph meta tags for link sharing
- [ ] Working contact method (form or direct links)

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
| Keep React + Tailwind | User preference, existing codebase familiarity | -- Pending |
| Bold & creative direction | User wants personality, not corporate minimal | -- Pending |
| Rich animations | Site should feel alive and impressive | -- Pending |
| Mobile-critical | Recruiters browse on phones | -- Pending |
| Fresh content structure | Current sections feel generic — rethink from scratch | -- Pending |

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
*Last updated: 2026-04-21 after initialization*
