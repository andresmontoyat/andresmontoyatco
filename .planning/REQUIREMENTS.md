# Requirements: Carlos Montoya Portfolio Redesign

**Defined:** 2026-04-22
**Core Value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Build system migrated from CRA/CRACO to Vite 6 with working dev server and production build
- [x] **INFRA-02**: React upgraded from v17 to v18 with concurrent features available
- [x] **INFRA-03**: Tailwind CSS upgraded from v2 (postcss7-compat) to v3.4 with JIT mode
- [x] **INFRA-04**: Dead dependencies removed (react-router-dom, react-hook-form, axios, all FontAwesome packages, web-vitals)
- [ ] **INFRA-05**: Self-hosted fonts via @fontsource replacing Google Fonts CDN
- [x] **INFRA-06**: ESLint config fixed with correct plugins and working lint command

### Design System

- [x] **DSGN-01**: New bold color palette defined as Tailwind design tokens replacing dated neon theme
- [x] **DSGN-02**: Typography scale established with self-hosted font pairing (display + mono)
- [ ] **DSGN-03**: Global `prefers-reduced-motion` CSS rules disabling all animations when OS setting is on
- [x] **DSGN-04**: CSS custom properties bridging Tailwind tokens for runtime flexibility

### Navigation

- [ ] **NAV-01**: Mobile hamburger menu with full-screen overlay, body scroll lock, and keyboard accessibility
- [ ] **NAV-02**: Smooth scroll to anchor sections on nav link click
- [ ] **NAV-03**: Scroll spy highlighting active section in navigation
- [ ] **NAV-04**: Scroll progress bar at top of page showing scroll position

### Hero

- [ ] **HERO-01**: Bold hero section with name, role, and professional tagline in both languages
- [ ] **HERO-02**: Staggered CSS entrance animation sequence (badge, headline, lead text, CTAs, stats)
- [ ] **HERO-03**: Ambient animated background effect (gradient, particles, or geometric shapes)
- [ ] **HERO-04**: Character-by-character text reveal animation for name or title
- [ ] **HERO-05**: Call-to-action buttons (CV download, contact) prominently placed

### Content Sections

- [ ] **CONT-01**: About section with professional summary and key highlights
- [ ] **CONT-02**: Skills section with technology grouping by category and visual icons
- [ ] **CONT-03**: Experience section as visual timeline with scroll-triggered staggered entries
- [ ] **CONT-04**: Tech chips displayed per experience entry showing technologies used
- [ ] **CONT-05**: Expand/collapse functionality for experience entry details
- [ ] **CONT-06**: Contact section with dominant email CTA and copy-to-clipboard
- [ ] **CONT-07**: Social links (GitHub, LinkedIn) in contact section
- [ ] **CONT-08**: Footer with bilingual copyright and minimal branding

### Animations

- [ ] **ANIM-01**: Scroll-triggered entrance animations for each content section (fade/slide in)
- [ ] **ANIM-02**: Animation primitives built with IntersectionObserver + CSS classes (not JS animation library)
- [ ] **ANIM-03**: Stagger support for lists and groups (experience entries, skill items)

### SEO & Performance

- [ ] **SEO-01**: Open Graph meta tags for rich link previews on social media and messaging apps
- [ ] **SEO-02**: Correct GA measurement ID (G-4TZJGR3MXR) replacing wrong current ID
- [ ] **SEO-03**: Lighthouse Performance score 90+ on mobile with throttling
- [ ] **SEO-04**: i18n language flash fixed via synchronous localStorage read (lazy useState init)

### Bilingual

- [ ] **I18N-01**: Full bilingual EN/ES support maintained across all redesigned sections
- [ ] **I18N-02**: Language switcher in navigation with localStorage persistence
- [ ] **I18N-03**: CV download available in both languages (existing .docx files)

### Responsive

- [ ] **RESP-01**: Mobile-first responsive design working flawlessly on phones, tablets, and desktop
- [ ] **RESP-02**: All animations perform smoothly on mobile devices without jank
- [ ] **RESP-03**: Touch-friendly tap targets (minimum 44px) on all interactive elements

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Visual Enhancements

- **VIS-01**: Dark/light theme toggle
- **VIS-02**: Company logo SVGs in experience timeline
- **VIS-03**: Project/portfolio showcase section with screenshots
- **VIS-04**: Testimonials or recommendations section

### Advanced SEO

- **ASEO-01**: JSON-LD structured data for Person schema
- **ASEO-02**: WebP image optimization pipeline
- **ASEO-03**: Sitemap generation

### Interactivity

- **INTX-01**: Contact form with email delivery (requires backend/service)
- **INTX-02**: Blog or articles section
- **INTX-03**: GitHub activity integration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/API | Static frontend site only |
| Authentication | No login needed for a portfolio |
| React Router / multi-page | Single-page scroll is sufficient |
| CMS or blog | Not needed for a portfolio — defer to v2 |
| Three.js / WebGL | Overkill for portfolio; kills mobile performance |
| Framer Motion (as primary) | CSS-first animation achieves 80% of impact at 0% bundle cost |
| Tailwind v4 | Plugin ecosystem still catching up — v3.4 is stable target |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Complete |
| DSGN-01 | Phase 1 | Complete |
| DSGN-02 | Phase 1 | Complete |
| DSGN-03 | Phase 1 | Pending |
| DSGN-04 | Phase 1 | Complete |
| NAV-01 | Phase 2 | Pending |
| NAV-02 | Phase 2 | Pending |
| NAV-03 | Phase 2 | Pending |
| NAV-04 | Phase 2 | Pending |
| HERO-01 | Phase 2 | Pending |
| HERO-02 | Phase 2 | Pending |
| HERO-03 | Phase 2 | Pending |
| HERO-04 | Phase 2 | Pending |
| HERO-05 | Phase 2 | Pending |
| I18N-01 | Phase 2 | Pending |
| I18N-02 | Phase 2 | Pending |
| I18N-03 | Phase 2 | Pending |
| SEO-04 | Phase 2 | Pending |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-03 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| CONT-05 | Phase 3 | Pending |
| CONT-06 | Phase 3 | Pending |
| CONT-07 | Phase 3 | Pending |
| CONT-08 | Phase 3 | Pending |
| ANIM-01 | Phase 3 | Pending |
| ANIM-02 | Phase 3 | Pending |
| ANIM-03 | Phase 3 | Pending |
| SEO-01 | Phase 3 | Pending |
| SEO-02 | Phase 3 | Pending |
| SEO-03 | Phase 4 | Pending |
| RESP-01 | Phase 4 | Pending |
| RESP-02 | Phase 4 | Pending |
| RESP-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-04-22*
*Last updated: 2026-04-22 after roadmap creation — all 40 v1 requirements mapped*
