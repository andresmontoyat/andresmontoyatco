# Roadmap: Carlos Montoya Portfolio Redesign

## Shipped Milestones

- **v3.4** — Brownfield redesign: Vite 6 + React 18 + Tailwind v3.4, sticky bilingual nav, char-reveal hero, vertical experience timeline, email-hero contact, Open Graph, Lighthouse 98/100/100/100. (Shipped 2026-05-07 — see [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md))

---

## Active Milestone: v3.5 — Themes, Projects & Production

**Goal:** Ship the redesigned portfolio to production at andresmontoyat.co with a dark/light theme toggle, a curated projects showcase section, and v3.4 tech debt cleared.

**Requirements:** 8 total (VIS-01, VIS-03, DEPLOY-01..03, DEBT-01..03)
**Phases:** 5–7 (continues from v3.4 Phase 4)

## Phases

- [ ] **Phase 5: Theme & Tech Debt** — Theme toggle infrastructure + v3.4 cleanup wave
- [x] **Phase 6: Projects Showcase** — Projects data module + section component + nav integration (completed 2026-05-08)
- [ ] **Phase 7: Production Deploy** — Vercel configuration + custom domain + preview deploys verified

## Phase Details

### Phase 5: Theme & Tech Debt
**Goal**: Users can switch between dark and light modes from the nav, preference persists across sessions, and v3.4 tech debt is cleared
**Depends on**: Phase 4 (v3.4)
**Requirements**: VIS-01, DEBT-01, DEBT-02, DEBT-03
**Success Criteria** (what must be TRUE):
  1. A sun/moon icon button appears in the nav next to LangPill on all viewport sizes; clicking it toggles the site between dark (default) and light mode visually
  2. Theme choice survives a browser tab close and reopen (localStorage key `cam-theme`)
  3. Light mode provides sufficient contrast on all text, surface, and chip elements so no WCAG AA failures are introduced
  4. `t.hero.cta2` and `t.contact.loc` keys are absent from translations.js EN and ES branches; no runtime errors result
  5. `npm run og:gen` completes successfully producing an identical og-image.png with no Google Fonts CDN request; GA `<script>` block is inside `<head>` with no HTML spec violations
**Plans**: 4 plans
  - [x] 05-01-PLAN.md — Tech debt cleanup (DEBT-01/02/03): prune orphaned translation keys, replace Google Fonts CDN with self-hosted Inter in og-template, move GA script into `<head>`
  - [x] 05-02-PLAN.md — Theme tokens + ThemeContext (VIS-01 foundation): `:root` + `[data-theme="light"]` CSS variables, ThemeContext mirroring LanguageContext, App.js provider wiring
  - [x] 05-03-PLAN.md — ThemeToggle + Nav integration (VIS-01 UI): bilingual aria-labels, accessible sun/moon button, render in DesktopNav and MobileMenu next to LangPill
  - [x] 05-04-PLAN.md — Light mode contrast verification (VIS-01 a11y gate): Lighthouse audit, token tweaks if needed, visual sweep at iPhone 14 / iPad / 1440px
**UI hint**: yes

### Phase 6: Projects Showcase
**Goal**: Visitors can browse 3-5 of Carlos's curated projects in a dedicated section that flows naturally between Experience and Contact
**Depends on**: Phase 5
**Requirements**: VIS-03
**Success Criteria** (what must be TRUE):
  1. A Projects section is reachable via the nav (scroll-spy highlights it; `#projects` anchor scrolls correctly on both desktop and mobile)
  2. Each project card displays title, bilingual description, tech chips, a screenshot image, and at least one of live URL or GitHub URL as a working external link
  3. Cards are legible and correctly laid out in both dark and light modes at iPhone 14, iPad, and 1440px breakpoints
  4. Screenshots load from `public/projects/` without layout shift; missing screenshots degrade gracefully (no broken-image icon visible)
  5. Cards animate in on scroll using the existing `useInView` / `.animate-on-scroll` pattern — no new animation library introduced
**Plans**: 2 plans
  - [x] 06-01-PLAN.md — Projects data + section component + translations: `src/data/projects.js`, `src/components/Projects.js`, EN/ES `projects` block + `nav.projects`
  - [x] 06-02-PLAN.md — Nav integration + App.js lazy-load: SECTION_IDS update, DesktopNav/MobileMenu Projects link, lazy-loaded Suspense between Experience and Contact
**UI hint**: yes

### Phase 7: Production Deploy
**Goal**: The live site is reachable at https://andresmontoyat.co, auto-deploys from main, and preview deploys fire on every PR
**Depends on**: Phase 6
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03
**Success Criteria** (what must be TRUE):
  1. Navigating to https://andresmontoyat.co in a browser loads the portfolio over HTTPS with a valid certificate (no warnings)
  2. Pushing a commit to main triggers a Vercel production deploy automatically; the deployed build reflects the commit within 3 minutes
  3. Opening a PR against main generates a unique Vercel preview URL; visiting that URL renders the OG card (title + og-image visible via Open Graph debugger)
  4. The production Lighthouse mobile score meets or exceeds v3.4 baseline: Performance >= 95, A11y 100, Best Practices 100, SEO 100
**Plans**: TBD
**UI hint**: no

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Theme & Tech Debt | 3/4 | In Progress|  |
| 6. Projects Showcase | 2/2 | Complete   | 2026-05-08 |
| 7. Production Deploy | 0/TBD | Not started | - |
