# Carlos Montoya Portfolio — Redesign

## Current State

**Shipped:** v3.5 (closed 2026-05-12 — **partial**) — Themes and projects showcase delivered on top of v3.4 baseline. Dark/light theme toggle (`[data-theme="light"]` CSS variable swap, `cam-theme` localStorage persistence, sun/moon nav button in Desktop + Mobile, Lighthouse a11y 100), bilingual Projects section between Experience and Contact (4-entry `PROJECTS` data module, responsive `Projects.js` card grid with brand-gradient fallback, lazy-loaded `Projects-DucOh_hO.js` chunk, scroll-spy wired), and v3.4 tech debt cleared (orphaned i18n keys removed, og-template self-hosts Inter, GA `<script>` in `<head>`). **Deploy phase (Phase 7) deferred to v3.6** — site is NOT yet live at andresmontoyat.co; `dist/` build artifacts are production-ready but never pushed to Vercel. Closed without git tag — see [`milestones/v3.5-ROADMAP.md`](milestones/v3.5-ROADMAP.md), [`milestones/v3.5-MILESTONE-AUDIT.md`](milestones/v3.5-MILESTONE-AUDIT.md).

**Previously shipped:** v3.4 (2026-05-07) — Full brownfield redesign baseline: Vite 6 + React 18 + Tailwind v3.4, bilingual nav, char-reveal Hero, vertical Experience timeline, email-hero Contact, branded Open Graph, Lighthouse 98/100/100/100 mobile. See [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md).

## Current Milestone: v3.6 AI Practice & Brand Refresh

**Goal:** Refresh brand palette (blue + emerald), fix theme toggle root bug, integrate hero photo, and ship a sales-focused AI/Claude Code section positioning Carlos as engineer-for-hire.

**Target features:**
- THEME-01 — Refactor Tailwind config so colors reference CSS variables (fix Phase 5 theme-toggle false-positive — currently only `<body>` bg flips because Tailwind tokens are hardcoded hex, not var references)
- COLOR-01 — Brand palette swap: `#6C63FF` (indigo) → blue-500 `#3B82F6`; `#FF6B6B` (coral) → emerald-500 `#10B981`
- HERO-01 — Integrate `me.jpg` in Hero as overlay full-bleed (Variant C from sketch): desaturated bg photo + gradient overlay + text-shadow on headline
- AI-01 — New AI / Claude Code section between Projects and Contact: sales pitch (engineer-for-hire) with 4 value props + proof counters + services + stack strip; bilingual EN+ES; lazy-loaded chunk; nav scroll-spy entry

**Locked decisions:**
- v3.6 = site improvements only — **deploy stays deferred to v3.7** (DEPLOY-01/02/03)
- Phase numbering continues 7–10 (Phase 7 slot reused since v3.5 deploy work moved to v3.7)
- Sketch file: `.planning/sketches/v3.6-variants.html` — Hero C + AI V7 locked
- Brand palette swap touches `tailwind.config.js` + `index.css` only; component changes scoped to Hero (Phase 8) and new AI section (Phase 9)
- No git tag at v3.6 close — consistent with v3.5; tag deferred until production site is live (v3.7)
- Test infrastructure: still deferred (7 consecutive milestones now — explicit decision, not drift)
- AI section copy is final per V7 sketch — no pricing tier copy, no client logos (deferred)

**Phase numbering:** v3.6 starts at Phase 7 (continues from v3.5).

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

- [x] **VIS-01** Dark/light theme toggle — ThemeContext + ThemeToggle + CSS variable swap + `cam-theme` localStorage; sun/moon button in Desktop + Mobile nav; Lighthouse a11y 100 — v3.5 Phase 5
- [x] **VIS-03** Projects showcase section — 4 bilingual entries in `src/data/projects.js`; responsive `Projects.js` card grid with brand-gradient fallback; lazy-loaded `Projects-DucOh_hO.js` chunk between Experience and Contact; scroll-spy wired — v3.5 Phase 6
- [x] **DEBT-01** Orphaned i18n keys removed (`t.hero.cta2`, `t.contact.loc` cleaned from EN+ES) — v3.5 Phase 5
- [x] **DEBT-02** `scripts/og-template.html` self-hosts Inter via `@fontsource/inter` (5 `@font-face` blocks, 0 Google Fonts CDN refs); `npm run og:gen` reproducible — v3.5 Phase 5
- [x] **DEBT-03** GA `<script>` moved into `<head>` (HTML spec compliant; SEO-02 firing preserved) — v3.5 Phase 5

### Active (v3.6)

- [ ] **THEME-01** *(v3.6 Phase 7)* Refactor Tailwind config to CSS-var color references — fix theme toggle root cause (Phase 5 false-positive: vars exist but Tailwind utilities use hardcoded hex)
- [ ] **COLOR-01** *(v3.6 Phase 7)* Brand palette swap — `brand` `#6C63FF` → blue-500 `#3B82F6`; `accent` `#FF6B6B` → emerald-500 `#10B981`
- [ ] **HERO-01** *(v3.6 Phase 8)* Integrate `me.jpg` in Hero as overlay full-bleed (Variant C sketch) — bg photo + gradient overlay + text-shadow
- [ ] **AI-01** *(v3.6 Phase 9)* AI / Claude Code section between Projects and Contact — sales pitch (Variant 7 sketch); bilingual; lazy-loaded chunk; nav scroll-spy entry

### Deferred to v3.7

- [ ] **DEPLOY-01** *(deferred from v3.5)* Vercel production deploy — auto-deploy from main, vite-react preset, build `npm run build`, output `dist/`
- [ ] **DEPLOY-02** *(deferred from v3.5)* Custom domain andresmontoyat.co + DNS records → Vercel; HTTPS via auto-cert
- [ ] **DEPLOY-03** *(deferred from v3.5)* Auto-preview deploys per PR with OG card validation

### Backlog

- [ ] REQUIREMENTS.md traceability sync (remaining unmapped: VIS-02, VIS-04, ASEO-01..03, INTX-01..03) — milestone audit task

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
| Theme: Dark (default) + Light only — no system mode | Bold dark identity is brand; light mode is accessibility/preference, not auto-switching | Validated — v3.5 Phase 5 |
| Theme UI: icon button in nav next to LangPill | Mirrors LangPill pattern; predictable location across viewports | Validated — v3.5 Phase 5 |
| ThemeContext mirrors LanguageContext pattern | Consistent React Context shape (provider + hook + localStorage key); no new state lib | Validated — v3.5 Phase 5 |
| `[data-theme="light"]` CSS variable overrides on `:root` | Theme swap without re-rendering components; CSS transitions handled in media query (reduced-motion safe) | Validated — v3.5 Phase 5 |
| Projects data: `src/data/projects.js` mirroring `experience.js` bilingual pattern | Consistent shape for bilingual content; trivial to extend with new entries | Validated — v3.5 Phase 6 |
| Projects screenshots in `public/projects/`; brand-gradient fallback when null | Zero CLS via `aspect-video` reservation; missing assets degrade gracefully | Validated — v3.5 Phase 6 |
| Projects chunk lazy-loaded between Experience and Contact | Keeps main bundle lean; separate `Projects-DucOh_hO.js` chunk | Validated — v3.5 Phase 6 |
| og-template fonts self-hosted via `@fontsource/inter` | Reproducible builds, no CDN dependency, identical og-image.png output | Validated — v3.5 Phase 5 (DEBT-02) |
| Deploy infrastructure (Vercel + andresmontoyat.co) | Auto-preview + custom domain per locked decision | ⚠ Deferred to v3.6 — Phase 7 never executed |
| Test infrastructure deferred again (6 consecutive milestones) | Manual UAT continues to catch regressions at acceptable cost | — Pending — revisit if v3.6 reveals regression debt |

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
*Last updated: 2026-05-12 — milestone v3.6 STARTED (AI Practice & Brand Refresh: 4 REQs, Phases 7–10; deploy stays deferred to v3.7)*
