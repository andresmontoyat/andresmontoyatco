# Roadmap: Carlos Montoya Portfolio Redesign

## Milestones

- ✅ **v3.4** — Brownfield redesign baseline: Vite 6 + React 18 + Tailwind v3.4, sticky bilingual nav, char-reveal hero, vertical experience timeline, email-hero contact, Open Graph, Lighthouse 98/100/100/100 (shipped 2026-05-07 — see [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md))
- ⚠ **v3.5 — Themes, Projects & Production** — Themes & Projects shipped (VIS-01, VIS-03, DEBT-01/02/03); deploy deferred to v3.7 (closed 2026-05-12 — see [`milestones/v3.5-ROADMAP.md`](milestones/v3.5-ROADMAP.md) and [`milestones/v3.5-MILESTONE-AUDIT.md`](milestones/v3.5-MILESTONE-AUDIT.md))
- ✅ **v3.6 — AI Practice & Brand Refresh** — Code shipped: brand palette swap, theme toggle root-cause fix, hero photo, sales-pitch Claude Code section. 5/5 active REQs satisfied. UAT visual+Lighthouse + DEPLOY-01/02/03 + DIAGRAMS-01 carry to v3.7. Closed without git tag (production not yet live). See [`milestones/v3.6-ROADMAP.md`](milestones/v3.6-ROADMAP.md) and [`milestones/v3.6-MILESTONE-AUDIT.md`](milestones/v3.6-MILESTONE-AUDIT.md).
- ⏸ **v3.7 — Production Deploy** *(PAUSED, opened 2026-05-20 — deferred 2026-05-29)* — Vercel auto-deploy done (site live on `*.vercel.app`); Phase 11 Plan 11-05 Lighthouse mobile gate verdict, custom domain (Phase 12), and PR previews (Phase 13) **carried as deferred**. Resumes in a future milestone. Phases 11–13 reserved — NOT renumbered.
- ✅ **v3.8 — Game Mode** *(SHIPPED 2026-06-06)* — Interactive skill-constellation landing (node=skill, edges=co-occurrence), floating bilingual experience cards, multi-skill/year/category filters, persisted game/dev toggle. Adaptive render (WebGL desktop / SVG-DOM mobile) holds the Lighthouse mobile HARD gate (cleared Perf ≥95 / A11y 100 / BP 100 / SEO 100). Vitest + RTL test infra introduced (253 tests GREEN). 8/8 REQs delivered (GAME-01..07 + TEST-01). Phases 14–17. See [`milestones/v3.8-ROADMAP.md`](milestones/v3.8-ROADMAP.md).
- ✅ **v3.9 — Game Mode Polish** *(SHIPPED 2026-06-08)* — Micro-milestone. Two UX fixes shipped same-day: above-the-fold layout (SkillFilters → fixed bottom-0 z-30; H1 compact; renderer slot flex-1) and never-static constellation (SVG ambient twinkle, prefers-reduced-motion gated). 2/2 REQs delivered (POLISH-01, POLISH-02). 261/261 tests GREEN. Phases 18–19.
- ✅ **v3.10 — 3D Constellation** *(SHIPPED 2026-06-10, tag `v3.10`/`v3.10.1`)* — Genuine 3D upgrade on desktop WebGL renderer: PerspectiveCamera(fov=55) + OrbitControls drag-to-rotate + category-z layout. 1 REQ (DEPTH-01) / Phase 20 / 4 plans. Mobile SVG path UNCHANGED. 293/293 tests GREEN. **Entire game-mode/WebGL lineage (v3.8–v3.10) superseded by v4.0 purge.** See [`milestones/v3.10-ROADMAP.md`](milestones/v3.10-ROADMAP.md).
- ✅ **v4.0 — Portfolio Redesign (JSON-Driven Refactor)** *(SHIPPED 2026-06-13, tag `v4.0`)* — Purged game-mode/Mario-world/WebGL/ViewMode lineage; dark palette tokens (#0B1020/#00E5A8/#00C2FF); 7 sections refactored to `src/data/<section>.json` bilingual contracts + 7-spec test files (PRs #26–#32). Killed `dangerouslySetInnerHTML`. 57/57 tests GREEN.
- ✅ **v4.1 — Deploy Polish (OG + LCP perf)** *(SHIPPED 2026-06-16, tag `v4.1`)* — Static hero `<img>` moved to index.html (kill React-hydration LCP delay) + LCP eligibility fix + OG refresh (PRs #33–#35). Prod Lighthouse mobile: Perf 0.84→**0.99**, LCP 4.0s→**2.1s**; A11y/BP/SEO 1.0.
- 🟢 **v4.2 — Content Polish** *(IN PROGRESS, no tag, on `main`)* — Recruiter-facing content quality. Experience copy rewrite (tNic template, 12 entries) + timeline UI polish (PRs #36–#37); projects 3-card redesign (emoji glyphs + gradient overlay + flexbox) + contact reorder (PR #38); npm audit fix (PR #39). 16 obsolete dependabot PRs closed (dead CRA toolchain). 57/57 tests GREEN. Backlog: VIS-05, DIAGRAMS-01, custom domain. **Untouched by v5** — separate branch.
- 🟢 **v5 — Astro Migration** *(IN PROGRESS, opened 2026-07-19)* — Migrate from React CSR (Vite) to Astro SSG with React islands to clear the Lighthouse mobile hard gate (Performance ≥0.95, Accessibility/Best Practices/SEO = 1.0) blocked since v4.2 Phase 11. 17 REQs (ROUTE/ISLAND/STATIC/TEST/DEPLOY) across Phases 21–27. Root `/` redirect via Vercel-native Edge Middleware (`middleware.ts`) — not Astro's own middleware, not `@astrojs/vercel`. Separate branch; merges to `main` only when the Lighthouse gate is green. Source: `docs/superpowers/specs/2026-07-19-astro-migration-design.md` (commit `6a3bf4a`); research: `.planning/research/SUMMARY.md`.

---

## Phases

### v5 Astro Migration (Phases 21-27) — 🟢 ACTIVE

> React CSR (Vite) → Astro SSG with React islands. Every v1 requirement is required to close the milestone — there is no partial-migration shippable state (DEPLOY-04 needs everything else shipped first). Separate branch from `main`; does not touch v4.2 Content Polish in progress there. Derived from 4 independent research passes (`.planning/research/SUMMARY.md`), confidence HIGH.

- [ ] **Phase 21: Foundation — Astro scaffold, i18n routing & layout shell** - Working `/en`/`/es` static route tree, root `/` redirect via Vercel Edge Middleware, `BaseLayout.astro` with hreflang/canonical, deploy cleanup (three removed, `vercel.json` SPA-rewrite removed, `engines.node` pinned)
- [ ] **Phase 22: Nav island** - Nav + nested ThemeToggle hydrate as `client:load`; scroll-spy + hash-preserving locale switcher proven working; islands testing pattern established
- [ ] **Phase 23: Static content sections** - About, Skill, Footer, Projects, Claude ship as zero-client-JS `.astro` components consuming existing `data/*.json` unchanged, each with an Astro Container API test
- [ ] **Phase 24: Hero** - LCP-critical hero renders static HTML/CSS; CV dropdown converted to native `<details>`/`<summary>`; count-up animation consolidated
- [ ] **Phase 25: SectionPager** - `client:visible` island, unchanged below-the-fold section-jump behavior
- [ ] **Phase 26: Experience** - Native `<details>` expand/collapse (zero JS) + narrowly-scoped tech-chip filter island (`client:visible`, not `client:load`)
- [ ] **Phase 27: Lighthouse gate + cleanup** - Mobile hard gate (Perf ≥0.95, A11y/BP/SEO = 1.0) green on `/`, `/en`, AND `/es`; CRA/Vite-CSR leftovers removed; merge to `main`

### v4.2 Content Polish — 🟢 ACTIVE (slice-based, on main)

> Content-quality milestone, no fixed phase count. Slices ship directly to main as PRs; no v4.2 tag until passes converge.

- [x] **Experience rewrite** — tNic template, 12 entries, JSON-driven (PR #36 `9684201`)
- [x] **Experience timeline UI polish** — interactive states (PR #37 `8ec5ed2`)
- [x] **Projects 3-card redesign + contact reorder** — emoji glyphs + gradient overlay + flexbox; GitHub before LinkedIn (PR #38 `57be81d`)
- [x] **Dependency hygiene** — npm audit fix non-breaking (PR #39); 16 obsolete dependabot PRs closed (dead CRA toolchain)
- [ ] **VIS-05** — claude-kanban + caveman cards into Claude section (3 of 5 featured-app cards present)
- [ ] **DIAGRAMS-01** — cross-repo architecture diagrams
- [ ] **Custom domain** `andresmontoyat.co` + DNS (carried from v4.1)

### v3.10 3D Constellation (Phase 20) — ✅ SHIPPED (superseded by v4.0 purge)

- [x] **Phase 20: 3D Constellation** (DEPTH-01) — genuine 3D + drag-to-rotate on desktop WebGL; SVG mobile path untouched. Entire WebGL lineage stripped from main by v4.0.

### v3.7 Production Deploy (Phases 11–13) — ⏸ DEFERRED

> **DEFERRED 2026-05-29.** v3.7 deploy work is paused, not done. The site **is live and auto-deploys from `main` on `*.vercel.app`**. Phases 11–13 remain reserved (NOT renumbered, NOT deleted): Plan 11-05 Lighthouse mobile gate verdict was never formally run, the custom domain (Phase 12) and PR previews (Phase 13) are carried as deferred. They resume in a future milestone. Resume file: `.planning/phases/11-vercel-deploy-uat-gate/11-05-PLAN.md`.

- [~] **Phase 11: Vercel auto-deploy + UAT pre-deploy gate** (DEPLOY-01) — auto-deploy live; Plan 11-05 Lighthouse gate verdict deferred
- [ ] **Phase 12: Custom domain andresmontoyat.co + DNS** (DEPLOY-02) — deferred
- [ ] **Phase 13: PR preview deploys + OG card validation** (DEPLOY-03) — deferred

---

## Phase Details (v5 — 🟢 ACTIVE)

### Phase 21: Foundation — Astro scaffold, i18n routing & layout shell
**Goal**: Visitor's request to any locale URL, or to the bare root, resolves to fully static, correctly-tagged bilingual HTML — and the deploy config matches the new static-first architecture. Every subsequent phase depends on this working two-locale route tree, base layout, and a resolved root-redirect strategy.
**Depends on**: Nothing (first phase of milestone)
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, ISLAND-04, DEPLOY-01, DEPLOY-02, DEPLOY-03
**Success Criteria** (what must be TRUE):
  1. Visiting `/en` or `/es` in a production build serves fully static HTML with symmetric route trees (`astro:i18n`, `prefixDefaultLocale: true`).
  2. Visiting `/` returns a redirect to `/en` or `/es` — `cam-lang` cookie first, else `Accept-Language` — executed via Vercel-native Edge Middleware (`middleware.ts`, no Astro adapter), verified against a real Vercel preview deploy, not just `astro dev`.
  3. View-source on `/en` and `/es` shows correct `hreflang` alternate tags, a canonical `<link>`, and `<html lang="en">` / `<html lang="es">` set at build time (no runtime `document.documentElement.lang` mutation).
  4. Theme flips before first paint via a blocking inline `<script is:inline>` in `BaseLayout.astro`'s `<head>` — zero FOUC on load or refresh, independent of React hydration timing.
  5. `vercel.json` no longer contains an SPA-fallback rewrite (a direct hit on a nonexistent path serves the authored `404.astro`, cache headers scoped to `/_astro/*` only); `package.json` has no `three` dependency and pins `engines.node >=22.12.0` matching the Vercel project's configured Node version.
**Plans**: 5 plans
  - [x] 21-01-PLAN.md — Astro scaffold & build tooling: install astro/@astrojs/react, remove three, pin engines.node, swap scripts, astro:i18n config, vitest.config.ts (ROUTE-01, DEPLOY-01, DEPLOY-03)
  - [x] 21-02-PLAN.md — BaseLayout.astro (head/meta/OG/JSON-LD/GA + hreflang/canonical + html lang + blocking cam-theme theme-flip script) + /en//es//  route tree (ROUTE-01, ROUTE-03, ROUTE-04, ISLAND-04)
  - [x] 21-03-PLAN.md — vercel.json cleanup (no rewrites, framework astro, /_astro/* cache) + middleware.ts / redirect + cam-lang cookie refresh + open-redirect guard (ROUTE-02, DEPLOY-02)
  - [x] 21-04-PLAN.md — 404.astro (bilingual, real dark-palette tokens, locale-inferred) + Astro Container API test harness proof-of-life (DEPLOY-02)
  - [ ] 21-05-PLAN.md — Vercel preview deploy validation gate: live / redirect + /en//es pass-through + 404, @vercel/functions next() fallback if needed (ROUTE-02)
**UI hint**: yes

### Phase 22: Nav island — shell navigability
**Goal**: Every page has a working, testable navigation shell — proving the islands-architecture pattern (prop-serialization, no cross-island Context) before any content phase depends on it.
**Depends on**: Phase 21
**Requirements**: ISLAND-01, ROUTE-05, TEST-02
**Success Criteria** (what must be TRUE):
  1. Nav (with nested ThemeToggle, not a separate island) hydrates on `client:load` and is interactive immediately: scroll-spy highlights the active section, hamburger overlay opens/closes, exactly as on the current site.
  2. Clicking the language switcher on `/en#experience` navigates to `/es#experience` (or the reverse) — the current section hash is preserved across the locale switch, not reset to top.
  3. Nav's Vitest + React Testing Library suite passes with coverage equivalent to the pre-migration component — same assertions now targeting the island.
**Plans**: 2 plans
  - [x] 22-01-PLAN.md — Nav island port (ThemeToggle local-state + Context→props + LangPill hash-preserving links) mounted client:load on /en//es (ISLAND-01, ROUTE-05)
  - [x] 22-02-PLAN.md — jsdom IntersectionObserver stub + Nav island RTL suite (bilingual, langpill hrefs, active highlight, theme toggle, cam-lang cookie) (TEST-02)
**UI hint**: yes

### Phase 23: Static content sections
**Goal**: The bulk of the page's content ships as zero-client-JS HTML, consuming the existing bilingual JSON data unchanged. No cross-dependencies among these five sections — lowest-risk phase, validates the Container API testing pattern before the remaining stateful islands.
**Depends on**: Phase 21 (layout shell); Phase 22 (Nav shell provides in-page navigation context for manual verification)
**Requirements**: STATIC-01, TEST-01
**Success Criteria** (what must be TRUE):
  1. About, Skill, Footer, Projects, and Claude sections render correct bilingual content on `/en` and `/es` with zero client-side JS shipped for these components (verified in the browser network/JS panel) — including Claude, which the original design spec's island table omitted.
  2. Each of these five components reads directly from its existing `src/data/*.json` file with no data-shape changes.
  3. Each of these five components has an Astro Container API test (bilingual content + ARIA assertions preserved) replacing its former RTL test — assertions ported, not diluted; coverage parity spot-checked against the original RTL spec for at least one component.
**Plans**: 4 plans
  - [x] 23-01-PLAN.md — About.astro + Container API parity test (D-07 spot-check); count-up dropped per D-04 (STATIC-01, TEST-01)
  - [x] 23-02-PLAN.md — Skill.astro + Footer.astro (translations + build-time year) + Container API tests; Footer authored fresh (STATIC-01, TEST-01)
  - [ ] 23-03-PLAN.md — Projects.astro + Claude.astro + Container API parity tests (STATIC-01, TEST-01)
  - [ ] 23-04-PLAN.md — Mount all 5 in /en//es pages (D-05 order), build zero-JS verify + browser human-verify (STATIC-01)
**UI hint**: yes

### Phase 24: Hero
**Goal**: The hero section — per PROJECT.md's Core Value, the single most important recruiter-facing moment — renders instantly as static HTML/CSS with zero LCP-blocking JS, and its one remaining stateful control (CV format dropdown) works with zero JavaScript. Isolated from the bulk static-content phase because it's LCP-critical and the source design spec under-scoped its hidden complexity (duplicated count-up logic, CV dropdown).
**Depends on**: Phase 21 (layout shell, LCP preload patterns)
**Requirements**: STATIC-02 (Hero CV-dropdown half; Experience expand/collapse half completes in Phase 26)
**Success Criteria** (what must be TRUE):
  1. Hero's char-reveal H1 and entrance treatment render without waiting on React hydration; the hero photo remains the LCP candidate (LCP timing at or better than v4.1's 2.1s baseline).
  2. The CV download control uses native `<details>`/`<summary>` (zero JS) and works identically on `/en` and `/es`, keyboard-operable (Escape-key close cross-browser verified) and screen-reader-navigable.
  3. Any duplicated count-up animation logic (Hero + About) is consolidated into a single shared vanilla-script enhancer, not left duplicated per component.
**Plans**: TBD
**UI hint**: yes

### Phase 25: SectionPager
**Goal**: The below-the-fold section-jump control works exactly as before, hydrated no earlier than necessary. Depends on `useActiveSection` logic already proven working in Phase 22; low risk, isolated component.
**Depends on**: Phase 22 (Nav's `useActiveSection` logic proven working)
**Requirements**: ISLAND-02
**Success Criteria** (what must be TRUE):
  1. SectionPager hydrates as `client:visible` — confirmed in the network panel it does not download/execute until scrolled near, not `client:load`.
  2. Clicking a SectionPager control jumps to the correct section with unchanged active-state highlighting behavior.
**Plans**: TBD
**UI hint**: yes

### Phase 26: Experience
**Goal**: Recruiters can scan the full career timeline and expand any entry for detail, and can filter by tech chip — with expand/collapse costing zero JS and the filter scoped to the smallest possible island. The design spec under-scoped this component as having one stateful concern (expand/collapse); it actually has two (expand/collapse AND a tech-chip filter that dims non-matching cards).
**Depends on**: Phase 23 (static-content Container API pattern); Phase 24 (native `<details>` pattern established on Hero's CV dropdown)
**Requirements**: ISLAND-03, STATIC-02 (Experience expand/collapse half; Hero CV-dropdown half delivered Phase 24)
**Success Criteria** (what must be TRUE):
  1. Each experience entry expands/collapses via native `<details>`/`<summary>` with zero JavaScript, reusing the pattern proven in Phase 24.
  2. Clicking a tech-chip filter dims non-matching experience cards; this behavior ships as a narrowly-scoped `client:visible` island or vanilla script — confirmed NOT `client:load` in the network panel.
  3. The tech-filter interaction keeps behavior-equivalent Vitest + RTL (or DOM-script) test coverage for the filtering logic.
**Plans**: TBD
**UI hint**: yes

### Phase 27: Lighthouse gate + cleanup
**Goal**: The migration is verified complete against the exact metric that defined the milestone, on every meaningfully distinct URL a recruiter could land on. This is the milestone's true exit criterion — per REQUIREMENTS.md, there is no partial-migration shippable state.
**Depends on**: Phases 21–26 (every other v5 requirement shipped first)
**Requirements**: DEPLOY-04
**Success Criteria** (what must be TRUE):
  1. Lighthouse mobile audit passes the hard gate — Performance ≥0.95, Accessibility/Best Practices/SEO = 1.0 — on all three target URLs: `/`, `/en`, and `/es` (the redirect hop itself has a measurable performance cost invisible if only `/en`/`/es` are audited).
  2. No remaining CRA/Vite-CSR leftovers (dead entry points, unused config, orphaned `LanguageContext`/`ThemeContext` providers) remain in the repo.
  3. The v5 branch merges to `main` only after this gate is green — merge is the observable completion signal of the milestone.
**Plans**: TBD
**UI hint**: no

---

## Phase Details (v3.10 — 🟢 ACTIVE)

### Phase 20: 3D Constellation
**Goal**: Recruiter on a capable desktop sees a genuine 3D skill constellation with drag-to-rotate that they cannot get from any other personal portfolio — the existing 117 kB gz three.js lazy chunk finally earns its bundle cost, while mobile SVG path stays untouched and Lighthouse mobile HARD gate stays cleared.
**Depends on**: v3.9 milestone close (✓ shipped 2026-06-08); Phase 17 WebGL renderer architecture (`GameMode → useConstellation → adaptive renderer`) — LOCKED, not modified.
**Requirements**: DEPTH-01
**Status**: Planning (4 plans queued — split from original 3 per checker Blocker #2 to fit per-plan context budget: 20-01 data layer, 20-02a WebGL renderer core, 20-02b OnboardingHint + i18n, 20-03 useClickVsDrag hook + bundle-gate ladder + UAT close)
**Success Criteria** (what must be TRUE):
  1. Recruiter on a capable desktop (≥ Phase 17 capability tier) sees a genuine 3D constellation with visible perspective foreshortening — front nodes larger, back nodes smaller — clearly different from the prior flat 2D-in-3D ortho aesthetic; SVG mobile path renders identical pixels to v3.9.
  2. Drag-rotates with damping (`dampingFactor=0.06`) and polar-angle clamp (`minPolarAngle ≈ π × 0.15`, `maxPolarAngle ≈ π × 0.85`); cursor flips `grab` → `grabbing` during drag; releases at any angle within the clamp without snap-back.
  3. Auto-rotate idle spin (`autoRotateSpeed=0.5`, ~30 s/orbit) telegraphs interactivity on first paint; pauses on `controls 'start'` (first user interaction); pauses while hovering or with an ExperienceCard open; defensive in-renderer `prefers-reduced-motion` gate is wired even though `useRendererCapability` already routes RM users to SVG.
  4. Click on a node still opens the ExperienceCard (GAME-04 preserved); drag does NOT trigger selection. Threshold = 5 px screen-space + 250 ms time on mouse/pen; bumps to 8 px when `pointerType === 'touch'`. Implementation lives in NEW `useClickVsDrag` hook with 5–8 pure jsdom unit tests.
  5. `prefers-reduced-motion: reduce` users continue to see the static SVG constellation (no rotation injected, no WebGL mount); WCAG 2.1 AA contrast preserved; Lighthouse a11y = 100 unchanged.
  6. Mobile SVG renderer is UNCHANGED — Lighthouse mobile HARD gate cleared at v3.10 close (Performance ≥ 95 / Accessibility 100 / Best Practices 100 / SEO 100), at or above Phase 17 baseline. Mobile chunk gz stays at 8.91 kB (no three.js leak); desktop WebGL lazy chunk stays under ~130 kB gz WARN ceiling (Phase 17 117 kB + measured 6.85 kB gz OrbitControls = ~123 kB projected).
  7. All 261 existing tests stay GREEN; ≥ 8 new tests added (3 layout `z` tests in `constellation.layout.test.js` for z-present + clustered + deterministic + range; 5–8 `useClickVsDrag.test.js` jsdom tests for threshold math + touch branch). Bundle-gate regex bug at `scripts/check-bundle-gate.mjs:12` is fixed in Plan 20-01 BEFORE the OrbitControls import lands in Plan 20-02a — so "no three.js leak to mobile chunk" stays a continuously enforced invariant.
**Plans**: 4 plans
  - [x] 20-01-PLAN.md — Data layer + bundle-gate regex widening — ~1 day. Extend `computeLayout()` in `src/game/constellation.layout.js` to return `{x, y, z}` with deterministic `CATEGORY_Z` constants (8 categories mapped front-to-back as architecture stack, z ∈ [−150, +150]); add ≥3 layout tests (z present + clustered + deterministic + range); widen `THREE_JS_PATTERN` regex in `scripts/check-bundle-gate.mjs:12` to catch `three/addons/*` and `three/examples/jsm/*` imports BEFORE OrbitControls import lands in Plan 20-02a; regression fixture lives at `src/scripts/check-bundle-gate.test.mjs` (under `src/` so Vitest default discovery picks it up — checker Warning #5 mitigation). GATE: 261 existing tests stay GREEN + ≥5 new bundle-gate tests + ≥3 new z-tests + dev server SVG path unchanged.
  - [x] 20-02a-PLAN.md — WebGL renderer core (PerspectiveCamera + OrbitControls + shader + pick + context-loss + GameMode forceSvgFallback) — ~1.5 days. In `src/game/renderers/WebGLConstellation.js`: swap `OrthographicCamera` → `PerspectiveCamera(fov=55, aspect, near=10, far=2000)` at tilted ~15°/~10° initial angle (D-20-CONTEXT-INITIAL-ANGLE); `positions[i*3+2] = pos.z ?? 0` (Alert A2); `OrbitControls` from `three/addons/controls/OrbitControls.js` with full LOCKED config (enableDamping/dampingFactor=0.06/rotateSpeed=0.6/enableZoom=false/enablePan=false/enableKeys=false/polar clamp); `autoRotateSpeed=0.5` + permanent pause-on-`'start'` + pause-on-hover/select; defensive RM gate inside renderer (Alert A9 / CRIT-06); VERTEX_SHADER size-attenuation by depth with `uCanvasHeight`+`uFovRad` uniforms and `clamp(1.0, 64.0)` (Alert A5 / CRIT-05); per-vertex edge alpha falloff (MOD-04 Option A — NO Line2); `Vector3.project(camera)` + depth-scaled pick radius (Alert A12 / MOD-08); `webglcontextlost`/`restored` silent SVG swap via new `forceSvgFallback` useState in `GameMode.js` (Alert A10 / D-20-CONTEXT-LOSS); `controls.update()` as FIRST line of `tick()` (Alert A3 / CRIT-01); `controls.dispose()` FIRST in cleanup (Alert A4 / MOD-05); `touch-action: none` on canvas; `onFirstDrag` callback wired to write `cam-3d-hint-seen` localStorage flag (defense-in-depth for Plan 20-02b). GATE: dev-server manual visual smoke 10/10 PASS (checkpoint:human-verify).
  - [x] 20-02b-PLAN.md — OnboardingHint bilingual pill + nested i18n + GameMode slot — ~0.5 day. NEW `src/game/OnboardingHint.js` (~50 LOC `<button>` with 800ms fade-in delay + 5s auto-dismiss + click-to-dismiss + defensive `usePrefersReducedMotion` copy from `useConstellation.js` + localStorage `cam-3d-hint-seen` lazy initializer + 44x44 touch target + `motion-safe:animate-fade-in`); NEW `src/game/OnboardingHint.test.js` (≥6 Vitest + RTL fake-timer tests: not visible <800ms, visible after 800ms, suppressed when flag set, RM no pill, click dismiss writes flag, auto-dismiss writes flag); add NESTED `t.game.hint.drag` keys EN "drag to rotate" / ES "arrastra para rotar" to `src/i18n/translations.js` (Alert A13 — NOT flat `hintDrag`); in `src/game/GameMode.js` import + render `{effectiveCapability === 'webgl' && <OnboardingHint t={t} />}` inside the renderer-slot wrapper; verify `tailwind.config.js` diff is empty (Alert A7 — consume existing `animate-fade-in` + `animate-hint-fade-out`, NOT redefine). GATE: dev-server manual hint UAT 10/10 PASS (checkpoint:human-verify).
  - [x] 20-03-PLAN.md — useClickVsDrag hook + 3-tier bundle-gate ladder + UAT execution — ~1 day. Task 1 (autonomous): NEW `src/game/useClickVsDrag.js` (~30 LOC) exposing `{ onPointerDown, onPointerUp, isDragRef }` with locked thresholds `DIST_THRESHOLD_MOUSE=5` / `DIST_THRESHOLD_TOUCH=8` / `TIME_THRESHOLD_MS=250`; NEW `src/game/useClickVsDrag.test.js` with ≥6 jsdom unit tests (mouse-within, mouse-drag-past, touch-bump-within, touch-drag-past, long-press, no-op safety); integrate into `WebGLConstellation.js` (OrbitControls FIRST, hook handlers SECOND). Task 2a (autonomous): implement 3-tier bundle-gate ladder per checker Warning #4 — `WEBGL_SOFT_CEIL_KB = 125` + `WEBGL_WARN_KB = 130` + `WEBGL_HARD_KB = 130` (HARD FAIL >130 with `process.exit(1)`); silent ≤60 / INFO log 60-125 / WARN 125-130 / HARD FAIL >130; create `.planning/phases/20-3d-constellation/20-UAT.md` 8-item scaffold + v3.9 carried deferred section. Task 2b (checkpoint:human-verify): execute the 8-item UAT sweep + `npm run lighthouse:mobile && npm run lighthouse:check` (HARD gate Perf ≥95 / A11y 100 / BP 100 / SEO 100) + v3.9 carried real-device confirm + populate 20-UAT.md ## Notes. GATE: UAT 8/8 PASS + Lighthouse exit 0 + tag candidate `v3.10` queued.
**UI hint**: yes — Phase 20 ships visible interactive 3D in the existing constellation renderer; recruiter UAT validates rotation feel + click reliability + perspective depth read. `/gsd:ui-phase` suggested between Plan 20-01 (data-only) and Plan 20-02a (renderer changes) to confirm UI-SPEC for the perspective swap, OrbitControls gesture behavior, autorotate cadence, and click-vs-drag threshold UX before code lands.
**Decisions to log during Phase 20**:
  - **D-20-VISUAL-3D** (PerspectiveCamera fov=55, OrbitControls, category-z layout) — supersedes D-17-VISUAL (flat 2D-in-3D ortho); genuine 3D + drag-to-rotate is the milestone goal.
  - **D-20-CLICK-DRAG-THRESHOLD** (5 px + 250 ms; 8 px on `pointerType === 'touch'`) — NEW; preserves GAME-04 under OrbitControls gesture state.
  - **D-20-PROPS-CONTRACT** (layout `{x, y, z}` consumed by both renderers — SVG ignores `z` silently; WebGL projects) — reframes GAME-01 as "single props contract, adaptive visual fidelity"; pixels diverge by design, props identical.
  - **D-20-CONTEXT-LOSS** (`webglcontextlost`/`restored` handlers swap to SVG via existing capability hook) — NEW defensive; Phase 17 did not address tab-return black-box failure mode.
**Standing alerts (carry into Phase 20 plan-PR reviews)**:
  - Re-read `PITFALLS.md §"Decision Violations to Flag"` before approving any Plan 20-0X PR — 9 pre-rejected decisions (`use r3f`, `use d3-force-3d`, `use Line2`, `show WebGL to RM users with autoRotate off`, `add 2D/3D user preference toggle`, `move WebGL out of lazy chunk`, `perspective swap only (no layout z)`, `add Stats.js / dat.gui`, `introduce headless-gl test infra for one phase`).
  - Bundle-gate regex fix at `scripts/check-bundle-gate.mjs:12` MUST land in Plan 20-01, NOT Plan 20-02a (must precede the first `three/addons/*` import so "no leak to mobile chunk" stays continuously enforced).
  - three.js stays pinned at `0.169.0` — DO NOT bump to `0.184.0` during v3.10 (Phase 17 Lighthouse gate cleared against current pin).
  - Manual UAT debt from v3.9 (above-fold + twinkle real-device confirm) bundles with the Phase 20 UAT checklist — single real-device sweep covers both.

---

## Phase Details (v3.7 — ⏸ DEFERRED, reserved)

> Carried as deferred 2026-05-29. Site is live + auto-deploys from `main` on `*.vercel.app`. Full detail retained for resume; not in v3.8/v3.9/v3.10 scope.

### Phase 11: Vercel auto-deploy + UAT pre-deploy gate
**Goal**: Portfolio is live at a stable `*.vercel.app` URL, auto-deploys on every push to `main`, and the v3.6 UAT visual+Lighthouse debt is paid (Phase 10 Tests 3-11) before the deploy config merges.
**Depends on**: v3.6 milestone close (✓ done 2026-05-20)
**Requirements**: DEPLOY-01 (folds UAT-GATE)
**Status**: Auto-deploy live (Plans 11-01..11-04 done); Plan 11-05 Lighthouse mobile gate verdict DEFERRED — still a HARD gate before custom-domain cutover.
**Success Criteria** (what must be TRUE):
  1. Vercel project linked to repo (`vercel link`); pushing to `main` triggers a production deploy that completes successfully; deployed URL renders the portfolio identically to local `npx serve dist`
  2. Phase 10 UAT Tests 3-10 all PASS against local `npx serve dist` build (theme prod build, localStorage persistence, hero photo at iPhone 14 / Pixel 7 / iPad / 1440px, hero photo light mode, reduced-motion, nav scroll-spy click, AI section CTAs + EN/ES, WCAG AA contrast light mode)
  3. Phase 10 Test #11 Lighthouse mobile audit run against the deployed `*.vercel.app` URL passes the HARD gate: Performance ≥ 95 / Accessibility 100 / Best Practices 100 / SEO 100 — matching v3.4 baseline 98/100/100/100. Lighthouse fail blocks Phase 12. *(DEFERRED — formal run pending.)*
  4. SPA fallback verified: direct hit on `*.vercel.app/#contact` (or any anchor) serves `index.html` and scroll-jumps correctly; no 404 page from Vercel for deep-link anchors
  5. Cache headers respected: static assets (hashed bundles in `dist/assets/*`) have long max-age + immutable; `index.html` is no-cache or short-cache so deploys propagate
**Plans**: 5 plans
  - [x] 11-01-PLAN.md — vercel.json + .gitignore (.vercel/) + index.html og:url typo fix (Wave 1, autonomous)
  - [x] 11-02-PLAN.md — adapt lighthouse:mobile for deployed URL + tighten lighthouse:check thresholds to Phase 11 HARD gate (Wave 1, autonomous, parallel with 11-01)
  - [x] 11-03-PLAN.md — local UAT Tests 3-10 against `npx serve dist` (Wave 2, non-autonomous, human browser-driven)
  - [x] 11-04-PLAN.md — vercel login + vercel link + first production deploy + curl-verify SPA fallback + cache headers (Wave 3, non-autonomous, interactive CLI auth)
  - [ ] 11-05-PLAN.md — Lighthouse mobile audit against deployed *.vercel.app URL + HARD gate verdict (Wave 4, mixed; Phase 12 unblock signal) — **DEFERRED**
**UI hint**: no (infra phase)

### Phase 12: Custom domain andresmontoyat.co + DNS
**Goal**: The portfolio resolves at `https://andresmontoyat.co` with valid HTTPS; OG card validates on the canonical domain.
**Depends on**: Phase 11 (Vercel deploy URL stable + Lighthouse gate passed)
**Requirements**: DEPLOY-02
**Status**: DEFERRED 2026-05-29.
**Success Criteria** (what must be TRUE):
  1. `andresmontoyat.co` is registered as a custom domain on the Vercel project; DNS records configured at the registrar (apex `A 76.76.21.21` + `www` CNAME `cname.vercel-dns.com`, or apex CNAME flattening if registrar supports it)
  2. HTTPS certificate auto-provisioned by Vercel (Let's Encrypt); TLS handshake valid on both `andresmontoyat.co` and `www.andresmontoyat.co` (verify via `curl -vI https://andresmontoyat.co` or `openssl s_client`)
  3. Canonical redirect chosen and implemented: either `www.andresmontoyat.co` → `andresmontoyat.co` (apex canonical) or reverse. One stable canonical URL; no redirect loops.
  4. OG meta tags work on the canonical domain: `og:url` + `<link rel="canonical">` updated in `index.html` if they were relative or hardcoded to dev URL; LinkedIn / Twitter / Facebook share-debugger renders the og-image.png correctly with title/description
  5. After cutover, the deployed Vercel URL (`*.vercel.app`) either keeps working or redirects to canonical — no broken bookmarks for anyone who hit Phase 11 URL during deploy validation
**Plans**: TBD
**UI hint**: no

### Phase 13: PR preview deploys + OG card validation
**Goal**: Every PR against `main` gets an auto-deployed preview URL with working OG meta tags, so reviewers and recruiters can validate visual changes pre-merge.
**Depends on**: Phase 11 (Vercel project) + Phase 12 (canonical OG meta tags)
**Requirements**: DEPLOY-03
**Status**: DEFERRED 2026-05-29.
**Success Criteria** (what must be TRUE):
  1. Opening a PR against `main` triggers a Vercel preview deploy to a unique URL (`*-pr-<num>.vercel.app` or branch-derived); Vercel GitHub bot posts the URL as a PR comment within ~2 minutes of push
  2. The preview URL renders the portfolio identically to production (theme toggle, hero photo, AI section, bilingual EN/ES) — no environment drift between preview and production
  3. OG meta tags work on preview URLs: no hard-coded `https://andresmontoyat.co` `og:url` causing share-debugger to reject preview hosts; share-debugger on a sample preview URL returns the og-image.png + title/description
  4. Closing or merging a PR cleans up the preview deploy (Vercel default behavior — verify it does not accumulate stale previews)
  5. Branch protection on `main` updated to require Vercel deploy check (optional but recommended) — preview deploy success becomes a merge gate
**Plans**: TBD
**UI hint**: no

---

## Past Phases (collapsed)

<details>
<summary>✅ v3.4 Brownfield Redesign (Phases 1-4) — SHIPPED 2026-05-07</summary>

See [`milestones/v3.4-ROADMAP.md`](milestones/v3.4-ROADMAP.md) for full phase details.

</details>

<details>
<summary>⚠ v3.5 Themes, Projects & Production (Phases 5-7) — CLOSED 2026-05-12 (Phase 7 deploy deferred)</summary>

- [x] Phase 5: Theme & Tech Debt (4/4 plans) — completed 2026-05-08
- [x] Phase 6: Projects Showcase (2/2 plans) — completed 2026-05-08
- [ ] Phase 7: Production Deploy — **not delivered**, deferred to v3.7

See [`milestones/v3.5-ROADMAP.md`](milestones/v3.5-ROADMAP.md).

</details>

<details>
<summary>✅ v3.6 AI Practice & Brand Refresh (Phases 7-10) — CLOSED 2026-05-20 (Phase 11 de-scoped)</summary>

- [x] Phase 7: Tailwind CSS-var refactor + Brand palette (2/2 plans) — completed 2026-05-12 (THEME-01, COLOR-01)
- [x] Phase 8: Hero photo integration (1/1 plan) — completed 2026-05-12 (HERO-01) — visual UAT deferred to v3.7 pre-deploy gate
- [x] Phase 9: AI / Claude Code section (1/1 plan) — completed 2026-05-12 (AI-01, AI-01-CICD) — visual UAT deferred to v3.7 pre-deploy gate
- [◐] Phase 10: Real-browser UAT + a11y sweep — closed partial 2026-05-20 (2/11 pass + 9 skip → v3.7 pre-deploy gate)
- [ ] Phase 11: Architecture diagrams (cross-repo) — **de-scoped** from v3.6 (DIAGRAMS-01 re-roadmap in future milestone)

See [`milestones/v3.6-ROADMAP.md`](milestones/v3.6-ROADMAP.md) and [`milestones/v3.6-MILESTONE-AUDIT.md`](milestones/v3.6-MILESTONE-AUDIT.md).

</details>

<details>
<summary>✅ v3.8 Game Mode (Phases 14-17) — SHIPPED 2026-06-06</summary>

- [x] Phase 14: Foundation — Data Layer, ViewMode Toggle & Test Infra (2/2 plans) — completed 2026-05-30 (GAME-02, GAME-05, TEST-01)
- [x] Phase 15: Accessible Constellation & SEO Fallback (3/3 plans) — completed 2026-06-01 (GAME-01 SVG/DOM contract, GAME-02 render, GAME-06) — UAT 6/7 pass
- [x] Phase 16: Filters & Floating ExperienceCard (6/6 plans) — completed 2026-06-03 (GAME-03, GAME-04) — UAT 9/9 pass; 183 tests GREEN
- [x] Phase 17: WebGL Desktop Renderer & Lighthouse Gate (5/5 plans) — completed 2026-06-06 (GAME-01 WebGL adapter, GAME-07) — UAT 9/9 pass; 253 tests GREEN; Lighthouse mobile HARD gate cleared

See [`milestones/v3.8-ROADMAP.md`](milestones/v3.8-ROADMAP.md) and [`milestones/v3.8-REQUIREMENTS.md`](milestones/v3.8-REQUIREMENTS.md).

</details>

<details>
<summary>✅ v3.9 Game Mode Polish (Phases 18-19) — SHIPPED 2026-06-08</summary>

- [x] Phase 18: Above-the-fold layout (1/1 plan) — completed 2026-06-08 (POLISH-01) — 259/259 tests GREEN; SkillFilters → fixed bottom-0 z-30; H1 compact; renderer slot flex-1
- [x] Phase 19: Never-static constellation (inline single-feat commit) — completed 2026-06-08 (POLISH-02) — 261/261 tests GREEN; SVG ambient twinkle motion-safe gated; prefers-reduced-motion preserves static a11y path

Stats: 9 commits | 15 files | +920 / -20 LOC | same-day micro-milestone | tag v3.9 on 4e9c2b3 | 8.87 kB gz GameMode bundle (under v3.8 ceiling)

See [`milestones/v3.9-ROADMAP.md`](milestones/v3.9-ROADMAP.md) and [`milestones/v3.9-REQUIREMENTS.md`](milestones/v3.9-REQUIREMENTS.md).

</details>

---

## Progress Table (all milestones)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4 | v3.4 | All | ✓ Complete | 2026-05-07 |
| 5. Theme & Tech Debt | v3.5 | 4/4 | ✓ Complete | 2026-05-08 |
| 6. Projects Showcase | v3.5 | 2/2 | ✓ Complete | 2026-05-08 |
| 7. (v3.5 deploy) | v3.5 | 0 / not planned | ✗ Deferred → v3.7 | — |
| 7. Tailwind CSS-var + Brand | v3.6 | 2/2 | ✓ Complete | 2026-05-12 |
| 8. Hero photo integration | v3.6 | 1/1 | ✓ Complete (code) | 2026-05-12 |
| 9. AI / Claude Code section | v3.6 | 1/1 | ✓ Complete (code) | 2026-05-12 |
| 10. Real-browser UAT + a11y | v3.6 | UAT (no PLAN) | ◐ Closed Partial (2/11) | 2026-05-20 |
| 11. Architecture diagrams | v3.6 | 0 / not planned | ✗ De-scoped → 999.13 backlog | — |
| 11. Vercel deploy + UAT gate | v3.7 | 4/5 | ⏸ Deferred (11-05 pending) | — |
| 12. Custom domain + DNS | v3.7 | 0/TBD | ⏸ Deferred | — |
| 13. PR preview deploys | v3.7 | 0/TBD | ⏸ Deferred | — |
| 14. Foundation — Data, ViewMode & Test | v3.8 | 2/2 | ✓ Complete | 2026-05-30 |
| 15. Accessible Constellation & SEO | v3.8 | 3/3 | ✓ Complete | 2026-06-01 |
| 16. Filters & Floating ExperienceCard | v3.8 | 6/6 | ✓ Complete | 2026-06-03 |
| 17. WebGL Desktop + Lighthouse Gate | v3.8 | 5/5 | ✓ Complete | 2026-06-06 |
| 18. Above-the-fold layout | v3.9 | 1/1 | ✓ Complete | 2026-06-08 |
| 19. Never-static constellation | v3.9 | inline | ✓ Complete | 2026-06-08 |
| 20. 3D Constellation | v3.10 | 4/4 | Complete    | 2026-06-10 |
| 21. Foundation — Astro scaffold, routing & layout | v5 | 4/5 | In Progress|  |
| 22. Nav island | v5 | 2/2 | Complete    | 2026-07-19 |
| 23. Static content sections | v5 | 2/4 | In Progress|  |
| 24. Hero | v5 | 0/TBD | Not started | — |
| 25. SectionPager | v5 | 0/TBD | Not started | — |
| 26. Experience | v5 | 0/TBD | Not started | — |
| 27. Lighthouse gate + cleanup | v5 | 0/TBD | Not started | — |

---

## Backlog

Tracked but not yet scoped to a milestone. Each item lives as a `999.x-slug` phase directory under `.planning/phases/` and is reviewed via `/gsd-review-backlog`.

### Architecture diagrams (de-scoped from v3.6 Phase 11)

### Phase 999.13: diagrams-cross-repo (BACKLOG)

**Requirement:** DIAGRAMS-01
**Goal:** Cross-repo architecture diagrams (gradle PlantUML + Structurizr for `spring-ai-qdrant-mcp`; Mermaid `.mmd` for GSD/claude-kanban/ci-templates/caveman); sync to portfolio; clickable AI app cards open modal
**Directory:** *(to be created when re-roadmap'd)*

### Visual polish

### Phase 999.4: vis-company-logos (BACKLOG)

**Requirement:** VIS-02
**Goal:** Company logo SVGs in experience timeline entries
**Directory:** `.planning/phases/999.4-vis-company-logos/`

### Phase 999.5: vis-testimonials (BACKLOG)

**Requirement:** VIS-04
**Goal:** Testimonials section with rotating quote cards
**Directory:** `.planning/phases/999.5-vis-testimonials/`

### Phase 999.14: vis-claude-kanban-caveman-cards (BACKLOG)

**Requirement:** VIS-05
**Goal:** Add claude-kanban + caveman featured-app cards back into AI section (deferred from AI-01 — shipped with 3 of original 5)
**Directory:** *(to be created when re-roadmap'd)*

### SEO & performance

### Phase 999.6: aseo-jsonld-person (BACKLOG)

**Requirement:** ASEO-01
**Goal:** JSON-LD Person schema in `index.html` head
**Directory:** `.planning/phases/999.6-aseo-jsonld-person/`

### Phase 999.7: aseo-webp-pipeline (BACKLOG)

**Requirement:** ASEO-02
**Goal:** WebP image optimization pipeline (sharp + responsive sizes)
**Directory:** `.planning/phases/999.7-aseo-webp-pipeline/`

### Phase 999.8: aseo-sitemap (BACKLOG)

**Requirement:** ASEO-03
**Goal:** `sitemap.xml` generation at build time
**Directory:** `.planning/phases/999.8-aseo-sitemap/`

### Interaction & content

### Phase 999.9: intx-contact-form (BACKLOG)

**Requirement:** INTX-01
**Goal:** Functional contact form — **STATIC (decided 2026-07-01)**: no backend/forwarder; use a static solution (e.g. `mailto:` action or third-party static form endpoint like Formspree/Web3Forms). Keeps static-hosting constraint.
**Directory:** `.planning/phases/999.9-intx-contact-form/`

### Phase 999.10: intx-blog (BACKLOG)

**Requirement:** INTX-02
**Goal:** Blog / articles section with MDX or markdown source
**Directory:** `.planning/phases/999.10-intx-blog/`

### Phase 999.11: intx-github-activity (BACKLOG)

**Requirement:** INTX-03
**Goal:** GitHub activity integration (recent commits / PR / contribution graph)
**Directory:** `.planning/phases/999.11-intx-github-activity/`

### Testing

### Phase 999.12: test-infrastructure (BACKLOG)

**Requirement:** TEST-INFRA
**Goal:** Vitest + Playwright + RTL test infrastructure (8 milestones deferred through v3.6) — *(note: Vitest + RTL portion now active in v3.8 Phase 14 / TEST-01; Playwright E2E remains backlog)*
**Directory:** `.planning/phases/999.12-test-infrastructure/`
