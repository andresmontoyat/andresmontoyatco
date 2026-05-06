# Roadmap: Carlos Montoya Portfolio Redesign

## Overview

A brownfield redesign of an existing React + Tailwind portfolio site. The work moves in four phases: first the foundation (toolchain migration and design system), then the structural shell with the hero section (the critical path that validates design direction), then the full content body with scroll animations, and finally a performance and polish pass to hit Lighthouse 90+ on mobile. Every phase ends with something demonstrably working and visually verifiable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Toolchain migration (CRA → Vite), React 18, Tailwind v3.4, design tokens, and self-hosted fonts (completed 2026-04-22)
- [x] **Phase 2: Shell & Hero** - Navigation, scroll behavior, bilingual support, and the bold hero section that validates design direction (completed 2026-05-05)
- [ ] **Phase 3: Content & Animations** - About, Skills, Experience timeline, Contact, Footer, and all scroll-triggered animations
- [ ] **Phase 4: Polish & Performance** - Lighthouse 90+ on mobile, responsive QA, touch targets, and animation smoothness audit

## Phase Details

### Phase 1: Foundation
**Goal**: The app builds and runs on a modern toolchain with a new design system ready for building on top of
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, DSGN-01, DSGN-02, DSGN-03, DSGN-04
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts the Vite dev server with hot reload and `npm run build` produces a production bundle with no errors
  2. The app renders in the browser using the new bold color palette — dated neon cyan/purple is gone
  3. Self-hosted fonts load from the local bundle — no requests to Google Fonts CDN appear in DevTools Network tab
  4. `npm run lint` completes with no ESLint errors or missing-plugin warnings
  5. Animations are fully suppressed when the OS "Reduce motion" setting is enabled
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Vite 6 migration + React 18 upgrade + dead dep removal (INFRA-01, INFRA-02, INFRA-04)
- [x] 01-02-PLAN.md — Tailwind v3.4 upgrade + new bold color palette + CSS custom properties (INFRA-03, DSGN-01, DSGN-02, DSGN-04)
- [x] 01-03-PLAN.md — ESLint config fix for Vite + react-hooks plugin (INFRA-06) [parallel with 01-02]
- [x] 01-04-PLAN.md — Self-hosted @fontsource + prefers-reduced-motion CSS rule (INFRA-05, DSGN-03)

### Phase 2: Shell & Hero
**Goal**: A recruiter landing on the site sees a bold, animated hero and a functional bilingual navigation — the design direction is locked
**Depends on**: Phase 1
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, I18N-01, I18N-02, I18N-03, SEO-04
**Success Criteria** (what must be TRUE):
  1. The hero section is visible on first load with name, role, tagline, and CTA buttons — staggered entrance animations play automatically
  2. On a phone, tapping the hamburger icon opens a full-screen menu overlay; body does not scroll behind it; ESC or close tap dismisses it
  3. Clicking a nav link smooth-scrolls to the target section and the nav highlights the active section as the user scrolls
  4. Switching from EN to ES (or back) via the language switcher updates all visible text instantly and the choice persists after page reload
  5. CV download buttons offer both the EN and ES Word documents for download
**Plans**: 5 plans
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md — Add nav.menuOpen/menuClose + meta.title/description bilingual translation keys (I18N-01, SEO-04)
- [x] 02-02-PLAN.md — Synchronous LanguageContext init + html lang/title/meta sync (I18N-02, SEO-04) [parallel with 02-01]
- [x] 02-03-PLAN.md — Nav shell: sticky header, logomark, desktop links, language pill, scroll progress bar (NAV-02, NAV-04, I18N-01, I18N-02)
- [x] 02-04-PLAN.md — Mobile menu portal + useActiveSection hook + scroll-spy active link styling (NAV-01, NAV-03, I18N-01)
- [x] 02-05-PLAN.md — Hero rebuild: status badge, char-reveal headline, dual EN/ES CV CTAs, stats grid, 7-step entrance stagger (HERO-01..05, I18N-03) [parallel with 02-03]

### Phase 3: Content & Animations
**Goal**: The full portfolio story is told — About, Skills, Experience, Contact, and Footer are complete and animated
**Depends on**: Phase 2
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, ANIM-01, ANIM-02, ANIM-03, SEO-01, SEO-02
**Success Criteria** (what must be TRUE):
  1. Scrolling past each section triggers a visible fade/slide entrance animation for that section's content
  2. The experience timeline shows all 12 job entries as staggered cards; each card can be expanded and collapsed to show or hide details; tech chips are visible on each entry
  3. Sharing the site URL in a messaging app or on social media renders a rich link preview with title, description, and image (Open Graph tags working)
  4. The contact section prominently shows the email address and clicking "Copy" writes it to clipboard with visible confirmation
  5. Google Analytics fires page-view events to measurement ID G-4TZJGR3MXR (verified via GA DebugView or browser network tab)
**Plans**: 7 plans
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md — Translation keys (t.skills.categories, t.exp.expand/collapse) + tech:[] field on 12 EXPERIENCE entries (CONT-02, CONT-04, CONT-05)
- [x] 03-02-PLAN.md — Animation primitives: useInView hook + .animate-on-scroll CSS + shared SectionLabel (ANIM-01, ANIM-02, ANIM-03) [parallel with 03-01]
- [ ] 03-03-PLAN.md — About + Skills sections: useInView entrance animation, 4 categories with chip cloud + year badges (CONT-01, CONT-02)
- [ ] 03-04-PLAN.md — Experience vertical timeline + tech chips + per-card expand/collapse, all 12 visible (CONT-03, CONT-04, CONT-05) [parallel with 03-03]
- [ ] 03-05-PLAN.md — Contact email-hero card with copy-to-clipboard + 3 secondary cards; Footer trim (CONT-06, CONT-07, CONT-08) [parallel with 03-03/03-04]
- [x] 03-06-PLAN.md — Open Graph + Twitter card meta tags + LanguageContext og:* sync; verify GA G-4TZJGR3MXR intact (SEO-01, SEO-02) [parallel with 03-01/03-02/03-07]
- [x] 03-07-PLAN.md — OG image generation toolchain (Playwright template + script) + public/og-image.png (SEO-01) [parallel with 03-01/03-02/03-06]

### Phase 4: Polish & Performance
**Goal**: The site earns Lighthouse 90+ on mobile and feels flawless on every real device
**Depends on**: Phase 3
**Requirements**: SEO-03, RESP-01, RESP-02, RESP-03
**Success Criteria** (what must be TRUE):
  1. Lighthouse Performance score is 90 or above when run on mobile with throttling enabled
  2. All interactive elements (buttons, nav links, hamburger, expand/collapse, copy) have a minimum tap target of 44px verified in DevTools
  3. Scrolling through the full page on a mid-range Android phone shows no dropped frames or janky animations
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete   | 2026-04-22 |
| 2. Shell & Hero | 5/5 | Complete   | 2026-05-05 |
| 3. Content & Animations | 4/7 | In Progress|  |
| 4. Polish & Performance | 0/TBD | Not started | - |
