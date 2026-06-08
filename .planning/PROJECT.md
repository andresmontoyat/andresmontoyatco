# Carlos Montoya Portfolio — Redesign

## Current State

**Shipped:** v3.9 Game Mode Polish (closed 2026-06-08) — Micro-milestone, same-day delivery. Two UX polish fixes parity-tighten v3.8 Game Mode: (1) above-the-fold layout — SkillFilters → fixed `bottom-0 z-30` bar, compact H1, sub-copy → sr-only, renderer slot `flex-1 min-h-0 pb-20/24` — constellation visible without scroll on desktop ≥1024px / tablet ~768px / mobile ~390px (POLISH-01); (2) never-static constellation — SVG ambient twinkle (`motion-safe:animate-svg-twinkle`, 4s ease-in-out infinite opacity 1.0→0.7→1.0, GPU-composited, deterministic per-node phase offset `-(sortIndex * 137) % 4000`ms; `prefers-reduced-motion: reduce` users keep fully static a11y path) (POLISH-02). 261/261 tests GREEN. GameMode bundle 8.87 kB gz (under v3.8 ceiling). Zero new deps. Tag `v3.9` on commit `4e9c2b3`. 2/2 REQs delivered. See [`milestones/v3.9-ROADMAP.md`](milestones/v3.9-ROADMAP.md), [`milestones/v3.9-REQUIREMENTS.md`](milestones/v3.9-REQUIREMENTS.md).

**Previously shipped:**
- v3.8 Game Mode (closed 2026-06-06) — Interactive skill-constellation landing replaces the static-timeline-only experience. Node = skill, edges = tech co-occurrence. Adaptive renderer: full WebGL on desktop (three.js raw via `React.lazy`, ~117 kB gz lazy chunk, ambient drift + glow pulse + halo brighten); lightweight SVG/DOM on mobile (8.91 kB gz, **stays under Lighthouse mobile HARD gate** Perf ≥95 / A11y 100 / BP 100 / SEO 100 — re-verified 2026-06-06). Filters: multi-skill (AND intersection), year-range dual-thumb slider 2007–2026 (WAI-ARIA APG), 8 category chips, reset. Floating bilingual ExperienceCard on skill-select: role=dialog + focus trap + tech chips + lang-aware CV CTA download; desktop = node-anchored popover, mobile = bottom-sheet. Persisted game/dev toggle (`cam-viewmode` localStorage + `?mode=` deep-link). Vitest + RTL test infrastructure introduced (test-infra debt deferred since v3.0 — 253 tests GREEN across 19 files). 8/8 v3.8 requirements delivered (GAME-01..07 + TEST-01). UAT 9/9 pass on Phase 17 close. See [`milestones/v3.8-ROADMAP.md`](milestones/v3.8-ROADMAP.md), [`milestones/v3.8-REQUIREMENTS.md`](milestones/v3.8-REQUIREMENTS.md).
- v3.6 (closed 2026-05-20 — **code shipped; production deploy still deferred**): brand palette refresh (blue-500 + emerald-500), Tailwind CSS-var refactor, cinematic full-bleed hero photo, bilingual sales-pitch Claude Code section. 5/5 active requirements satisfied. Phase 10 UAT closed partial; Phase 11 (DIAGRAMS-01) de-scoped. See [`milestones/v3.6-ROADMAP.md`](milestones/v3.6-ROADMAP.md), [`milestones/v3.6-MILESTONE-AUDIT.md`](milestones/v3.6-MILESTONE-AUDIT.md).
- v3.5 (2026-05-12 — **partial**): Themes & Projects delivered, deploy deferred. See [`milestones/v3.5-ROADMAP.md`](milestones/v3.5-ROADMAP.md).
- v3.4 (2026-05-07): Brownfield redesign baseline — Vite 6 + React 18 + Tailwind v3.4, bilingual nav, char-reveal Hero, vertical Experience timeline, email-hero Contact, branded Open Graph, Lighthouse 98/100/100/100 mobile. See [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md).

## Current Milestone: v3.10 3D Constellation

**Goal:** Convert flat 2D-in-3D WebGL constellation to a genuine 3D experience with drag-to-rotate, differentiating desktop wow from SVG mobile path. Activates SEED-3D-CONSTELLATION (planted 2026-06-08 during v3.9). Stops recruiter mid-scroll via interactive depth — the desktop lazy chunk's 117 kB gz of three.js finally earns its bundle cost.

**Target features:**
- **DEPTH-01** Constelación 3D genuina en WebGL desktop — `PerspectiveCamera` (fov=60), per-node `z` via category-z clusters (backend/frontend/cloud/etc. layered along z-axis to visually communicate architecture stack), `OrbitControls` drag-to-rotate + auto-rotate idle, click-vs-drag threshold (≥5px before suppressing click-to-select node). Mobile SVG path UNCHANGED — Lighthouse mobile gate stays cleared. `prefers-reduced-motion` users keep static path. GAME-01 SVG↔WebGL divergence accepted as adaptive-fidelity feature.

**Scope discipline:**
- Single REQ (DEPTH-01) / 1 phase (Phase 20) / 3 plans / 3-5 days
- Activates seed SEED-3D-CONSTELLATION
- Pure desktop WebGL enhancement — mobile/SVG path untouched
- Carry-forward deferred (v3.7 deploy, VIS-05, DIAGRAMS-01, manual UAT debt v3.9) stays deferred — NOT in v3.10.

**Decisions to revisit at planning:**
- **D-14-01-LAYOUT** (deterministic 2D radial, zero d3-force) — extend to 3D with category-z; reject d3-force-3d to keep zero new deps
- **D-17-VISUAL** (flat 2D-in-3D ortho) — replace with genuine 3D contract via PerspectiveCamera
- **D-17-PRIMITIVES** — shader needs size-attenuation by depth update
- **GAME-01** "identical props contract" SVG ↔ WebGL — visually diverges with 3D; reframe as adaptive-fidelity feature or add caveat to contract

## Deferred (carried from prior milestones)

- **Resume v3.7 deploy work** — Plan 11-05 (Lighthouse against deployed `*.vercel.app`), Phase 12 (custom domain `andresmontoyat.co` + DNS), Phase 13 (PR preview deploys). Site auto-deploys from `main` to `*.vercel.app`; missing custom domain + formal production-URL Lighthouse verdict.
- **VIS-05** — claude-kanban + caveman cards back into AI section (3 of original 5 featured-app cards present). Carries from v3.6.
- **DIAGRAMS-01** — cross-repo architecture diagrams. Carries from v3.6.

<details>
<summary>v3.8 Game Mode — original milestone goal (for historical reference)</summary>

## v3.8 Game Mode (SHIPPED)

**Goal:** Add an interactive "game mode" — a skill constellation as the default landing (node = skill, edges = tech co-occurrence) with floating bilingual experience cards, multi-skill/year/category filters, and a persisted one-click toggle to the current ("dev") view. Adaptive render (full WebGL on desktop, lightweight SVG/DOM on mobile) keeps the Lighthouse mobile HARD gate, WCAG 2.1 AA, and SEO. Introduces Vitest + RTL test infrastructure.

**Source of truth:** `docs/superpowers/specs/2026-05-29-game-mode-design.md` (full decision log + architecture — read before planning).

**Target features:**
- **GAME-01** Adaptive constellation render — full WebGL on desktop, lightweight SVG/DOM static path on mobile (same data, two intensities; capability + viewport + reduced-motion detection)
- **GAME-02** Skill graph — nodes = skills, edges = co-occurrence in the same job, clustering by skill category (derived from `experience.js` tech[] + new `skills.js` category map)
- **GAME-03** Navigation/filters — multi-skill select + year/timeline (2007–2026) + category chips + reset (pure selectors)
- **GAME-04** Floating bilingual `ExperienceCard` on skill select — title/company/date/location/bullets/tech chips + CV CTA
- **GAME-05** Game/dev toggle — default landing = game; one-click to dev view; persisted in localStorage (`cam-viewmode`); `?mode=` deep-link
- **GAME-06** Accessibility + SEO — keyboard-navigable nodes, dialog/popover semantics for cards, sr-only full-experience fallback list, reduced-motion path
- **GAME-07** Hold the Lighthouse mobile HARD gate (Perf ≥95 / A11y 100 / BP 100 / SEO 100) + perf budget (three.js only in lazy desktop chunk; baked layout positions; < ~30KB gz added on mobile path)
- **TEST-01** Introduce Vitest + React Testing Library test infrastructure (unit-test pure graph/filter logic near-100%; component tests for toggle/card/filters)

**Locked decisions:**
- Feature lives in the existing portfolio repo; this is a new milestone, not a new project (`/gsd:new-project` blocked — project exists)
- Metaphor = skill constellation; **node = skill** (job is secondary; click skill → its experiences as cards)
- Playable interactive visualization — explorable/playful, **no objective, no win/lose**
- Game is the **default landing**; perf/SEO risk mitigated by the adaptive render (D7 in spec)
- **Adaptive render** resolves the conflict between "game default" and the HARD Lighthouse mobile gate — WebGL desktop / SVG mobile; DOM fallback doubles as SEO + a11y
- v3.8 introduces **Vitest + RTL** — pays down test-infra debt deferred across 9 milestones
- Phase numbering continues → v3.8 starts at **Phase 14** (v3.7 reserved 11–13 for deploy)
- v3.7 deploy work (11-05 Lighthouse gate verdict, DEPLOY-02 custom domain, DEPLOY-03 PR preview) **carried as deferred** — site remains live on `*.vercel.app`; deploy/domain resumed in a future milestone

</details>

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

- [x] **THEME-01** Tailwind CSS-var refactor — `colors.{ink,brand,accent,text}.*` reference `var(--color-*)` instead of hardcoded hex; `:root` (dark defaults) + `[data-theme="light"]` overrides in `index.css`; theme toggle functionally flips all 8 sections — v3.6 Phase 7
- [x] **COLOR-01** Brand palette swap — `brand` `#6C63FF` → blue-500 `#3B82F6`; `accent` `#FF6B6B` → emerald-500 `#10B981`; WCAG AA contrast verified in both modes (light: `#2563EB` 4.97:1 / `#047857` 5.05:1 on white); og-image regenerated — v3.6 Phase 7
- [x] **HERO-01** Cinematic full-bleed hero photo via `<picture>` w/ 800w mobile + 1600w desktop WebP; theme-aware `--hero-photo-filter` / `--hero-overlay` / `--hero-h1-shadow` CSS vars; sharp pipeline (`npm run hero:process`); LCP preload — v3.6 Phase 8 (visual UAT deferred to v3.7 pre-deploy gate)
- [x] **AI-01** Bilingual sales-pitch Claude Code section between Projects and Contact — 9.95 KB lazy chunk; PitchHero + 4 ValueCard + ProofBlock (7 counters) + 5 ServiceCard + 3 FeaturedAppCard (GSD, spring-ai-qdrant-mcp, ci-templates) + StackStrip (17 chips); scroll-spy in Desktop + Mobile nav; CTAs → #contact / #projects — v3.6 Phase 9 (note: shipped with 3 of original 5 featured-app cards; claude-kanban + caveman moved to backlog as VIS-05)
- [x] **AI-01-CICD** `soldife/ci-templates` surfaced as DevOps evidence in AI section — app card with `OPEN SOURCE / DEVOPS` badge + 10 tech chips, DevOps automation service card, +2 proof counters (47 workflows / 15 templates), bilingual EN+ES — v3.6 Phase 9

- [x] **GAME-01** Adaptive constellation render — WebGL desktop / SVG-DOM mobile — v3.8
- [x] **GAME-02** Skill graph — nodes=skill, edges=co-occurrence, category clustering — v3.8
- [x] **GAME-03** Filters — multi-skill + year/timeline + categories + reset — v3.8 Phase 16
- [x] **GAME-04** Floating bilingual ExperienceCard on skill select + CV CTA — v3.8 Phase 16
- [x] **GAME-05** Game/dev toggle — default game, persisted localStorage + `?mode=` — v3.8 Phase 14
- [x] **GAME-06** A11y (keyboard nodes, dialog cards, sr-only fallback, reduced-motion) + SEO — v3.8 Phase 15
- [x] **GAME-07** Hold Lighthouse mobile HARD gate + perf budget — v3.8 Phase 17
- [x] **TEST-01** Vitest + RTL test infrastructure (test-infra debt paid down after 9 deferred milestones) — v3.8 Phase 14

- [x] **POLISH-01** Constellation visible above the fold without scroll on desktop/tablet/mobile — v3.9 Phase 18 (SkillFilters → fixed bottom-0 z-30; H1 compact; renderer slot flex-1)
- [x] **POLISH-02** Never-static constellation — SVG ambient twinkle on every render path; prefers-reduced-motion preserved — v3.9 Phase 19 (motion-safe:animate-svg-twinkle, deterministic per-node phase offset)

### Active

(None — awaiting v3.10 scoping. See "Next Milestone" section above.)

### Deferred (carried from v3.7 — site live on `*.vercel.app`, auto-deploy verified)

- [ ] **DEPLOY-01 (gate)** Lighthouse mobile gate verdict (Plan 11-05) — deferred 2026-05-29; site auto-deploys from main, formal gate run still pending. Remains HARD gate before custom-domain cutover.
- [ ] **DEPLOY-02** Custom domain andresmontoyat.co + DNS (CNAME/A) → Vercel; HTTPS auto-cert; OG card on canonical domain
- [ ] **DEPLOY-03** Auto-preview deploys per PR with OG card validation

### Backlog

- [ ] **DIAGRAMS-01** Cross-repo architecture diagrams (deferred from v3.6 Phase 11 de-scope) — gradle PlantUML + Structurizr for `spring-ai-qdrant-mcp`; Mermaid `.mmd` for GSD/claude-kanban/ci-templates/caveman; `scripts/sync-diagrams.sh`; clickable AI app cards open Mermaid/SVG modal
- [ ] **VIS-05** Add claude-kanban + caveman featured-app cards back into AI section (currently 3 of original 5)
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
| Deploy infrastructure (Vercel + andresmontoyat.co) | Auto-preview + custom domain per locked decision | ⚠ Still deferred — now → v3.7 (carries from v3.5/v3.6) |
| Test infrastructure deferred again (7 consecutive milestones through v3.6) | Manual UAT continues to catch regressions at acceptable cost | — Pending — revisit if v3.7 reveals regression debt |
| Tailwind config references CSS variables (v3.6 Phase 7 / THEME-01) | Fix Phase 5 false-positive: existing utility classes flip on `[data-theme]` swap | ✓ Good — every section visually flips per integration check |
| Brand palette: blue-500 (#3B82F6) + emerald-500 (#10B981) (v3.6 Phase 7 / COLOR-01) | Modernize identity vs original indigo/coral; preserve WCAG AA contrast in light | ✓ Good — contrast holds 4.97:1 + 5.05:1 in light |
| Hero photo as `<picture>` + WebP (v3.6 Phase 8 / HERO-01) | Cinematic first impression; LCP preload keeps Performance budget | ✓ Good (code); visual UAT deferred to v3.7 pre-deploy gate |
| Theme-aware `--hero-photo-filter` / `--hero-overlay` / `--hero-h1-shadow` CSS vars (v3.6 Phase 8) | Theme system from Phase 7 extends to image filters Tailwind cannot tokenize | ✓ Good — cross-phase integration WIRED |
| Bilingual sales-pitch Claude Code section, lazy-loaded chunk (v3.6 Phase 9 / AI-01) | Recruiter-funnel via section between Projects and Contact; bundle stays lean | ✓ Good — 9.95 KB chunk, scroll-spy wired |
| AI-01 doc-drift: 3 featured-app cards instead of 5 (v3.6 Phase 9 close) | Scope discipline — claude-kanban + caveman not ready for sales-grade card spec | ✓ Accepted — VIS-05 in backlog |
| Phase 11 (DIAGRAMS-01) de-scoped from v3.6 | Bandwidth focus on closure — diagrams are nice-to-have, not blocker | ⚠ Re-roadmap in future milestone |
| Phase 10 UAT closed early (9/11 skip → v3.7 pre-deploy gate) | Same Lighthouse / visual sweep needed for v3.7 deploy anyway; better executed against production build | ⚠ Conscious deferral — tracked in audit + STATE.md |
| No git tag at v3.6 close | Consistent with v3.5; tag deferred until production site is live (v3.7) | — Pending v3.7 deploy |
| v3.9 micro-milestone scope (POLISH-01/02 only, no feature expansion) | Pure parity tightening of v3.8 surfaced in first real session; not a feature line | ✓ Good — same-day delivery, zero regression |
| Phase 19 shipped inline as single feat commit (no PLAN.md/SUMMARY.md) | Micro-feature (single tailwind keyframe + 2 tests); formal plan overhead unwarranted | ✓ Accepted — REQ coverage verified via commit + ROADMAP |
| SVG opacity-only animation over scale/translate (v3.9 Phase 19) | GPU-composited, no layout thrash, sidesteps SVG transform-origin quirks on path circles | ✓ Good — 8.87 kB gz unchanged |
| Deterministic per-node phase offset via `-(sortIndex * 137) % 4000`ms (v3.9 Phase 19) | Golden-ratio-inspired spacing prevents synchronized pulsing (mechanical read); reuses existing sortIndex | ✓ Good — perceptually organic, zero new state |
| v3.9 tagged inline during Phase 19 close (vs at milestone ceremony) | Single-day micro-milestone; tagging at code-complete kept ROADMAP and git history aligned | ✓ Accepted — tag v3.9 on 4e9c2b3 |
| Manual UAT deferred at v3.9 close (pending v3.10 deploy verify) | Visual confirm needs real devices + deployed URL; conflates with deferred DEPLOY work | ⚠ Tracked in STATE.md Deferred Items |

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
*Last updated: 2026-06-08 — milestone v3.9 SHIPPED (Game Mode Polish: POLISH-01 above-the-fold + POLISH-02 SVG twinkle; 2/2 REQs delivered, 261/261 tests GREEN, tagged v3.9 on commit 4e9c2b3). v3.7 deploy work (Plan 11-05, DEPLOY-02/03), VIS-05, DIAGRAMS-01, SEED-3D-CONSTELLATION, manual UAT verification carried as deferred — candidates for v3.10.*
