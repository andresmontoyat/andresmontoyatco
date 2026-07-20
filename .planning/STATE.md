---
gsd_state_version: 1.0
milestone: v5
milestone_name: Astro Migration
status: executing
stopped_at: Completed 24-04-PLAN.md
last_updated: "2026-07-20T00:33:05.702Z"
last_activity: 2026-07-20
progress:
  total_phases: 22
  completed_phases: 3
  total_plans: 25
  completed_plans: 22
  percent: 14
---

# Project State

## v5 Astro Migration (ROADMAPPED — Phases 21-27, not yet planned)

**Focus:** React CSR (Vite) → Astro SSG with React islands, to clear the Lighthouse mobile hard gate (Performance ≥0.95, Accessibility/Best Practices/SEO = 1.0) blocked since v4.2 Phase 11. Separate branch from `main`; does not touch v4.2 Content Polish in progress there.

**Roadmap:** 17/17 v1 requirements mapped across 7 phases (21-27) — see `.planning/ROADMAP.md` § Phase Details (v5). Source: `docs/superpowers/specs/2026-07-19-astro-migration-design.md` (commit `6a3bf4a`); research: `.planning/research/SUMMARY.md` (4 independent passes, confidence HIGH).

**Phase sequence:**

| Phase | Name | Requirements |
|-------|------|--------------|
| 21 | Foundation — Astro scaffold, i18n routing & layout shell | ROUTE-01..04, ISLAND-04, DEPLOY-01..03 |
| 22 | Nav island | ISLAND-01, ROUTE-05, TEST-02 |
| 23 | Static content sections | STATIC-01, TEST-01 |
| 24 | Hero | STATIC-02 (Hero half) |
| 25 | SectionPager | ISLAND-02 |
| 26 | Experience | ISLAND-03, STATIC-02 (Experience half) |
| 27 | Lighthouse gate + cleanup | DEPLOY-04 |

**Locked decision carried from research:** Root `/` redirect uses Vercel-native Edge Middleware (`middleware.ts`, platform feature, no npm package) — NOT Astro's own middleware (confirmed inert under `output: 'static'`) and NOT `@astrojs/vercel`. This is the single highest-severity risk item, independently flagged by 3 of 4 research passes; must be validated against a real Vercel preview deploy in Phase 21, not just `astro dev`.

**Phase 21 progress:**

- 21-01 (build toolchain): Astro 7.1.1 + @astrojs/react installed, astro:i18n configured, Vitest migrated to `getViteConfig()`. 102/102 tests GREEN.
- 21-02 (BaseLayout + /en /es route tree): `src/layouts/BaseLayout.astro` ships build-time `<html lang>`, per-locale title/description (D-07), canonical + hreflang (en/es/x-default) resolved from `PUBLIC_SITE_URL` (D-05/D-06), JSON-LD Person + GA verbatim (D-08/D-09), blocking `cam-theme` pre-paint script (ISLAND-04). `/en`, `/es`, bare `/` fallback all build-verified. **Decision:** `astro:i18n`'s `getAbsoluteLocaleUrl` has no `{ base }` option in astro@7.1.1 (confirmed via `node_modules/astro/dist/i18n/index.d.ts`) — use `getRelativeLocaleUrl(locale, path)` + `new URL(..., siteUrl)` instead; resolves 21-RESEARCH.md's Open Question 2. `PUBLIC_SITE_URL` still needs configuring in Vercel Project Settings (user_setup, not yet done) — a gitignored local `.env` unblocks builds on this machine meanwhile. 102/102 tests still GREEN.
- 21-03 (vercel.json + middleware.ts): `vercel.json` rewritten for Astro static output — `rewrites` block removed entirely, `framework: "astro"`, cache headers scoped to single `/_astro/(.*)` rule (DEPLOY-02). `middleware.ts` authored at repo root — 302-redirects `/` to `/en`/`/es` (cam-lang cookie first, else Accept-Language substring heuristic, D-01/D-02/D-03), `isKnownLocale()` allowlist gate before the `Location` header (T-21-03-01 open-redirect mitigation), `cam-lang` cookie refresh on `/en/*`/`/es/*` (D-04). **Decision:** matcher uses a negative-lookahead excluding `/_astro/` + static-asset extensions instead of RESEARCH.md's literal `'/(.*)'` — narrows D-04's "every route" to "every page route"; flagged in 21-03-SUMMARY.md for user sign-off, not silently applied. Bare-200 pass-through (Assumption A2) implemented per spec but **not yet validated** — deferred to Plan 21-05's real Vercel preview deploy, no `@vercel/functions` added. Source-level verification assertions pass for both files; no live-deploy testing performed in this plan.
- 21-04 (404.astro + Container API harness): `src/pages/404.astro` authored as a **standalone** `<html lang>` doc — deliberately NOT wrapped in `BaseLayout` (locale copy/CTA is inferred from `Astro.url.pathname`'s `/en`/`/es` prefix, but `BaseLayout`'s `Astro.currentLocale` is always `'en'` on this unprefixed catch-all route, and its canonical/hreflang/OG machinery assumes real indexable content). Real dark-palette tokens only (`bg-ink-900`, `text-text-primary`/`text-text-secondary`, `text-brand`, `border-ink-400`, `bg-brand-gradient`) — zero `text-neon`/`bg-grad-neon`/`shadow-neon` (DEPLOY-02). `astro build` verified: emits `dist/404.html`. `src/pages/404.test.ts` stands up the Astro Container API harness (first `.astro` component test in the repo) — `experimental_AstroContainer` + `renderToString()`. **Decision:** esbuild's startup invariant fails under the repo's default jsdom test environment when compiling `.astro` files, so `404.test.ts` forces `// @vitest-environment node` per-file (no change to `vitest.config.ts`'s repo-wide jsdom default) — this is the pattern Phase 23 should reuse for its own Container API tests. 104/104 tests GREEN (102 + 2 new).

**Next step:** Plan 21-05 validates `middleware.ts` against a real Vercel preview deploy (bare-200 pass-through + live redirect behavior) — the only remaining Phase 21 scope.

**Phase 22 progress:**

- 22-01 (Nav island): `src/components/react/Nav.jsx` ported into a single `client:load` React island (D-01), `NAV_ITEMS`/`SECTION_IDS` unchanged module-level (D-07). `locale`/`hrefEn`/`hrefEs` arrive as props — `translations[locale]` replaces `useLanguage()`/`LanguageContext` entirely (D-02). `src/components/react/ThemeToggle.jsx` nested (not top-level) — local `useState` seeded from `document.documentElement.dataset.theme` (already correct pre-paint via Phase 21's blocking script, zero flicker), persists to `cam-theme` (D-03). `LangPill` EN/ES buttons rewritten as `<a>` links: `href` seeds from `hrefEn`/`hrefEs` props then syncs `window.location.hash` via `useEffect` + `hashchange` listener (ROUTE-05, D-04); `onClick` writes the `cam-lang` cookie with a hardcoded locale literal, never derived from input (D-05, open-redirect guard mirrors `middleware.ts`'s `isKnownLocale`). `ProgressBar`/`MobileMenu`/`useActiveSection` carried over with zero logic changes (D-06). `src/pages/en/index.astro` and `src/pages/es/index.astro` mount `<Nav client:load locale hrefEn hrefEs />`, computing hrefs via `getRelativeLocaleUrl(locale, path)` in frontmatter (server-only helper, not importable in island code). `astro build` verified: both `dist/en/index.html`/`dist/es/index.html` carry server-rendered Nav markup (locale-correct `Language`/`Idioma` labels) plus an `astro-island` element with `client="load"`. 104/104 tests still GREEN, zero regressions.
- 22-02 (Nav island tests, TEST-02): `src/test/setup.jsx` gained a guarded no-op `IntersectionObserver` stub (mirrors the existing `HTMLCanvasElement` stub style) so `useActiveSection` mounts cleanly under jsdom. `src/components/react/Nav.test.jsx` — new 6-spec RTL suite rendering the island directly (`renderNav(locale)`, props-only, zero `LanguageProvider`): bilingual nav links (EN/ES), LangPill anchors (`role="group"` `Language`, ES href `/^\/es\//`, `aria-pressed` on active locale), active-section `border-brand` highlight (via `vi.mock('../../hooks/useActiveSection', () => ({ default: () => 'about' }))`), theme toggle `dataset.theme` flip, and `cam-lang` cookie write on LangPill click. `getAllByText`/`getAllByRole` used throughout since `MobileMenu` is always mounted (opacity-toggled, not conditionally rendered) — every interactive element exists twice in the DOM. 110/110 tests GREEN (104 baseline + 6 new), zero regressions.

**Phase 22 complete.** Next step: Phase 23 (static content sections, STATIC-01/TEST-01).

**Phase 23 progress:**

- 23-01 (About.astro): `src/components/astro/` directory established (mirrors `src/components/react/` from Phase 22). `About.astro` imports `about.json` unchanged, ports `pick(field, lang)` verbatim, renders zero React/hooks/`client:` directives. `useCountUp`/`AnimatedValue` deliberately NOT ported (D-04) — static value strings render verbatim; count-up re-introduction deferred to Phase 24's shared vanilla enhancer. `About.test.ts` — first Astro Container API coverage-parity spot-check (D-07), ports all 7 `it` blocks from the former RTL spec via `renderToString()` + string assertions. `src/components/About.test.jsx` removed. 110/110 tests GREEN.
- 23-02 (Skill.astro + Footer.astro): `Skill.astro` imports `skills.json` unchanged, ports `pick()`/`maxYears()` verbatim; the React `MeterRow`/`Category` sub-components (no logic beyond markup) are inlined into the template's `.map()` blocks rather than extracted as separate `.astro` partials — Astro components cannot be invoked as plain JS functions the way React sub-components were. `Skill.test.ts` ports all 9 `it` blocks from `Skill.test.jsx`; two assertions required matching Astro's auto-escaped HTML output (`&amp;`, not `&`) rather than the raw source string. `Footer.astro` has no dedicated JSON file (D-02) — sources `footerCopy = translations[locale]?.footer` (BaseLayout's established idiom) and copies the hardcoded `social` array verbatim; reads `new Date().getFullYear()` at build time instead of React runtime (D-03). `Footer.test.ts` authors 5 fresh Container API assertions (no prior RTL baseline existed for Footer). `src/components/Skill.test.jsx` removed. 115/115 tests GREEN (110 baseline − 9 removed + 9 + 5 new).
- 23-03 (Projects.astro + Claude.astro): `Projects.astro` imports `projects.json` unchanged, ports `pick()`/featured-rest filter split verbatim; `FeaturedProjectCard`/`ProjectCard`/`TechTags` inlined into `featured.map()`/`rest.map()` template blocks, preserving `data-featured="true"/"false"`, the conditional CTA short-circuit, and `aria-hidden` decorative spans. `Projects.test.ts` ports all 8 `it` blocks from `Projects.test.jsx`. `Claude.astro` imports `claude.json` unchanged, ports `pick()` verbatim; `PitchHero`/`ValueCard`/`OfferingCard` inlined into the template and `data.values.map()`/`data.offerings.map()` blocks, preserving the split `h2Part1`/`h2Part2` heading structure. `Claude.test.ts` ports all 6 `it` blocks from `Claude.test.jsx`; two assertions adjusted for Astro's auto-escaped output (`&#39;`, `&amp;`). `src/components/Projects.test.jsx` and `src/components/Claude.test.jsx` removed. 115/115 tests GREEN (net zero change — 14 RTL specs removed, 14 Container API specs added). None of the 5 static components are mounted on any page yet — mounting (STATIC-01/TEST-01 completion gate) is Plan 23-04's scope.

**Next step:** Plan 23-04 (mount all 5 static components into `en/index.astro` / `es/index.astro`).

**Phase 24 progress:**

- 24-01 (shared Hero enhancers): `src/scripts/count-up.js` — shared vanilla count-up enhancer (D-02), consolidating the old per-component `useCountUp`/`Stat` logic; IntersectionObserver-gated, `prefers-reduced-motion`-aware, cubic ease-out curve ported verbatim, exports `{ animate }` for testability. `src/scripts/details-dismiss.js` — generic Escape/outside-click enhancer for native `<details>` (D-06), zero section-specific identifiers, exports `{ initDismiss }`, reusable unmodified by Phase 26 (Experience). 7 new jsdom unit tests, 122/122 total suite GREEN.
- 24-02 (Hero.astro): `src/components/astro/Hero.astro` — zero-island static port of `Hero.jsx`; char-reveal H1 middle line converted to a pure CSS `steps()` + `ch`-unit width animation (D-01, `.hero-reveal`/`--reveal-chars`, gated to full-text-immediately under `prefers-reduced-motion: reduce` via the existing global override, no cursor element, no JS); CV dropdown converted to native `<details class="details-dismiss relative group">`/`<summary>` with the ARIA menu/menuitem roles deliberately dropped (D-05, flagged inline) and wired to `details-dismiss.js` (D-06); hero photo ports directly as the server-rendered LCP element, no duplicate-DOM workaround (D-08); 4 stat spans carry `data-count-up`/`data-count-up-template` wired to `count-up.js` (D-02). `src/index.css` gained `.hero-reveal` + `hero-typewriter` keyframes + `summary` marker-removal rules. **Decision:** Astro Container API's `renderToString()` rewrites local `<script src>` references to dev-server virtual module URLs, losing the literal filename — `Hero.test.ts` asserts script-src wiring against the raw component source (`fs.readFileSync`) instead, a pattern future Container API tests asserting on `<script src="relative/path">` should reuse. `Hero.test.ts` — 14 Container API specs (coverage-parity port of `Hero.test.jsx` + new count-up/script-wiring/dropped-role/no-duplicate-photo regression guards). `npm run build` succeeds; 136/136 tests GREEN (122 baseline + 14 new). Not yet mounted into `en/index.astro`/`es/index.astro` (later plan's scope); STATIC-02 not marked complete in REQUIREMENTS.md — needs Hero's dropdown AND Experience's (Phase 26) both done.
- 24-03 (About.astro count-up retrofit, D-03): `src/components/astro/About.astro` gained a local `statParts(value)` helper (identical regex shape to `Hero.astro`'s own copy) — the facts `.map()` loop computes the picked value once per fact and conditionally attaches `data-count-up`/`data-count-up-template` to the value `<span>` only when a digit is present (in practice, only the "Experience" fact — `"18+ years"`/`"+18 años"`); Location/Current role/Languages/Work mode render unchanged. One `<script src="../../scripts/count-up.js">` tag added, mirroring `Hero.astro`'s reference to the same shared module — **closes Phase 23's D-04 deferral and proves D-02's count-up consolidation works identically across two independent `.astro` components**. `About.test.ts` corrected its now-stale "no count-up on mount per D-04" comment and gained 4 new specs (count-up attrs present/absent, script referenced once in raw source, exactly 1 deferred module script rendered) — confirms Hero's raw-source script-src assertion technique (24-02) generalizes to a second component. `npm run build` succeeds; 140/140 tests GREEN (136 baseline + 4 new).
- 24-04 (mount Hero.astro + delete deprecated React Hero): `src/pages/en/index.astro`/`src/pages/es/index.astro` now import and mount `<Hero locale={locale} />` as the first `<main>` child, before `<About>` — STATIC-02 (Hero half) is live on both routes. `src/components/Hero.jsx`/`src/components/Hero.test.jsx` deleted (fully replaced by `Hero.astro`/`Hero.test.ts`, 24-02). **Deviation (Rule 3 - blocking):** the legacy `src/App.jsx` (pre-Astro CRA/Vite-CSR entry point, whole-app removal deferred to Phase 27 per ROADMAP "CRA/Vite-CSR leftovers removed") still imported the deleted `Hero.jsx` — removed the dangling import + `<Hero />` usage from `App.jsx` and corrected `App.test.jsx`'s stale description so `npx vitest run` stays GREEN; the rest of the legacy React app (Nav/About/Skill/Experience/Projects/Claude/Contact/Footer .jsx + tests) is untouched, still Phase 27's scope. Also reworded `Hero.astro`'s header comment to drop the literal `components/Hero.jsx` substring (was tripping the plan's own no-dangling-import grep against a comment, not a real import — same technique 24-01/24-02 used). Production build verified: `dist/en`/`dist/es` each carry the `me-800.webp` LCP img, zero Hero-scoped `astro-island` (Nav's legitimate island unaffected), and `count-up.js`/`details-dismiss.js` render as deferred `type="module"` scripts well after `</head>` (not render-blocking, not `is:inline`). `npm run build` succeeds; 130/130 tests GREEN (140 baseline − 10 removed with the old RTL `Hero.test.jsx` suite).

**Phase 24 progress: 4/5 plans complete.** Next step: Plan 24-05 (manual cross-browser QA gate — Escape/outside-click dismiss, `steps()` glyph alignment).

## v4.2 Content Polish (IN PROGRESS — on main, no tag)

**Focus:** Recruiter-facing content quality — experience copy rewrite + projects section redesign. No infra/perf scope.

**Shipped to main (PR order):**

| PR | Commit | Description |
|----|--------|-------------|
| #36 | 9684201 | Experience rewrite — apply tNic template (Fase 1); 12 entries, JSON-driven |
| #37 | 8ec5ed2 | Experience timeline UI polish (interactive states) |
| #38 | 57be81d | Projects 3-card redesign (🎫 Mr. Yoker / 🏥 Mutual SER / 📞 Hexadialer) — emoji glyphs + gradient overlay + centered flexbox (fixed card width, replaces grid); contact reorder (GitHub before LinkedIn) |
| #39 | 7e3c27e | npm audit fix — non-breaking security bumps (25→23 vulns) |

**Direct-to-main since PR #41 (no PR, content/type passes):**

| Commit | Description |
|--------|-------------|
| aca26be | type: retro pixel display font (Press Start 2P) on titles + accents |
| 9ce6817 | type: pixel font on short lead/intro texts |
| a01bc08 · 70df9ad · 3dad919 | interactive states — about quick-facts, hero count-up stats bar, skills+footer hover |
| 26481cc | skills: GitHub Actions 4→5 years |
| c191dd0 | projects: add Llevape warehouse system |
| 10fbc78 | projects: feature Mr. Yoker as highlighted lead (2-tier featured/regular card system) |
| 333bcd2 | cv: remove dead public docx CVs (superseded by generated PDFs) |
| 392316f | planning: fill v4.2 experience fase-2 questionnaire (ES rewrites + visibility flags) |

**Earlier direct-to-main (pre-pixel-font):**

| Commit | Description |
|--------|-------------|
| 177392f | claude: remove secondary 'See projects' CTA from PitchHero |
| d737353 | claude: value card 'Hexagonal' → 'Architecture without shortcuts' |
| eb35856 | claude: remove featured-apps grid after services (incl VIS-05 cards) |
| 817a2f0 | claude: merge AI capabilities + services → single 6-card offerings grid |
| 6bb9ef3 | claude: remove stack chips strip from section end |
| a97b435 | experience: per-entry `visible` flag (show/hide roles) |
| 57a05c8 | experience: questionnaire — visibility field + Coderio/Linked role blocks |
| 743400b | cv: `scripts/generate-cv.mjs` — ATS PDF CV (EN/ES) from site data |
| f406d41 | cv: commit generated `cv/CarlosMontoya_CV_{EN,ES}.pdf` |
| 6cf7c8b | **PR #41** deps: vite 6→8, vitest 2→4, plugin-react 4→6, esbuild dropped + `.js`→`.jsx` migration (23 files) for oxc JSX parsing. Vulns 23→17 (2 critical + 1 high CLEARED, 17 moderate remain — all devDep). 56/56 GREEN, Vercel PASS |

**Repo cleanup (2026-06-30):** Removed strays — `website-new/` (old standalone HTML), root `CV_Carlos_Montoya_{EN,ES}.docx` (byte-identical dupes of tracked `public/` copies). Kept: `.planning/projects-input.md` (active intake), `Diagnostico_LinkedIn_*.docx` (input scratch), `14-PATTERNS.md` (GSD artifact).

**Dependency hygiene (2026-06-22):** Closed 16 obsolete dependabot PRs (#5–#24) — all targeted the removed CRA/craco toolchain (craco, react-scripts, axios, lodash + transitives no longer in package.json post-Vite migration). Inmergeable + no-op.

**Carried concerns:**

- ~~**23 vulns**~~ — CLOSED via PR #41 (2026-07-01). Toolchain upgraded (vite 8 / vitest 4 / plugin-react 6); required `.js`→`.jsx` migration (oxc replaced esbuild, parses JSX only in `.jsx`). **17 moderate vulns remain** — all still devDep (vite/vitest/lighthouse chain); 2 critical + 1 high eliminated. No prod-bundle exposure.
- **No v4.2 tag** — content work unbounded (no fixed slice count). Tag when content passes converge.
- **projects-input.md** (`.planning/`) holds the raw project intake (Mr. Yoker filled; Atenea + others blank) — source for future projects expansion.

**v4.2 backlog:**

- ~~**VIS-05**~~ — RETIRED. Cards added (260625-dvq) then the entire featured-apps grid was removed (eb35856) during Claude offerings consolidation. No longer applicable.
- **Projects expansion** — fill `.planning/projects-input.md` (Mr. Yoker filled; Atenea + others blank), then surface in Projects section.
- **DIAGRAMS-01** — cross-repo architecture diagrams.
- Custom domain `andresmontoyat.co` (carried from v4.1).

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260625-dvq | VIS-05 caveman + claude-kanban featured-app cards (apps 3→5) | 2026-06-25 | fddca76 | [260625-dvq-vis-05-add-caveman-claude-kanban-feature](./quick/260625-dvq-vis-05-add-caveman-claude-kanban-feature/) |
| 260625-etd | Claude section: replace Track record counters with 4 AI-capability cards | 2026-06-25 | e94a377 | [260625-etd-claude-section-replace-track-record-with](./quick/260625-etd-claude-section-replace-track-record-with/) |
| 260701-v6a | 999.6 ASEO-01: static schema.org Person JSON-LD in index.html `<head>` + vitest regression test (63/63 GREEN) | 2026-07-01 | 3480bda | [260701-v6a-aseo-jsonld-person](./quick/260701-v6a-aseo-jsonld-person/) |

## Project Reference

See: .planning/PROJECT.md (refreshed 2026-07-19 — v5 Astro Migration milestone started)

**Core value:** Hero + first impression must stop recruiters mid-scroll and convert visits into engineering conversations.
**Current focus:** Phase 24 — Hero
**Last shipped:** v4.1 tag (2026-06-16). v4.2 Content Polish continues in parallel on `main`, untouched by v5.

## Current Position

Phase: 24 (Hero) — EXECUTING
Plan: 5 of 5
Status: Ready to execute
Last activity: 2026-07-20

Progress: [█████████░] 88%

## Shipped Slices (v4.0, on main, in chronological + PR order)

| Slice | Section | PR | Squash commit | Description |
|-------|---------|-----|---------------|-------------|
| 1 | Game Purge + Base Palette | #26 | a623ede | Strips game-mode + Mario-world + ViewMode + WebGL constellation; lands dark palette tokens (#0B1020 / #00E5A8 / #00C2FF); bundle-gate re-baselined (no WebGL chunk; index-*.js WARN 60 / HARD 68) |
| 2 | Contact | #27 → via #26 | 79cb0eb | 5-card grid from contact.json; v4 JSON-driven pattern established |
| 3 | About | #28 → via #26 | 99c39e1 | 3 paragraphs + 5 quick-facts; killed `dangerouslySetInnerHTML` |
| 4 | Skills | #29 → via #26 | f44fdc1 | 4 categories × 29 chips; bilingual category titles + years suffix |
| 5 | Experience | #30 | 5e973ec | 12-entry vertical timeline; expand/collapse useState preserved (rekeyed by stable entry.id); ARIA labels from JSON |
| 6 | Projects | #31 | 3a9e434 | 4-project "Selected work" grid; CTA labels from JSON |
| 7 | Claude Code | #32 | e8abb1b | AI-Engineering pitch — 4 values + 7 counters + 5 services + 3 featured apps + 17 stackChips; consolidated claude.json |

**Final section order:** Nav → Hero → About → Skill → Experience → Projects → Claude → Contact → Footer.

**Final metrics:**

- 57/57 tests GREEN on main
- Build 60.93 kB gz (bundle-gate WARN — over soft 60, under HARD 68 — Claude section content +1 kB above soft ceiling acceptable for closing slice)
- All 7 sections JSON-driven; uniform `pick(field, lang)` helper inlined per component
- Zero `dangerouslySetInnerHTML` in rendered output
- Zero `useInView` / `animate-on-scroll` survivors
- `_shared/SectionLabel` retired (each section inlines mono-accent label)

## v4.0 Decisions (final, on main)

- **D-v4.0-PURGE** — Game mode + Mario-world + WebGL constellation + ViewMode lineage REMOVED.
- **D-v4.0-PALETTE** — Dark palette (#0B1020 bg / #00E5A8 accent / #00C2FF secondary) via CSS vars + Tailwind tokens. Theme toggle deferred.
- **D-v4.0-JSON-PER-SECTION** — Every section reads from `src/data/<section>.json`. Bilingual `{en, es}` shape + universal `pick()` helper inlined per component.
- **D-v4.0-NO-HTML-IN-DATA** — JSON contains plain text only.
- **D-v4.0-NO-SCROLL-REVEAL** — `useInView` + `animate-on-scroll` dropped.
- **D-v4.0-NO-SHARED-SECTIONLABEL** — `_shared/SectionLabel` dropped.
- **D-v4.0-STACKED-PR-INTEGRATION** — Slices 1+2+3+4 stacked onto `v4.0-slice-1-purge` integration branch and squashed via PR #26; Slices 5+6+7 based directly on main.

## Blockers / Concerns

- **v5 root-redirect risk** — `middleware.ts` code now written (21-03: cookie/`Accept-Language` parsing + `isKnownLocale()` allowlist + 302 redirect + cookie refresh, source-verified). Still UNVALIDATED against a real deploy — the bare-200 pass-through assumption (Assumption A2) must be confirmed via a real Vercel preview before any later phase assumes it works (3 of 4 research passes flagged this independently; validation is Plan 21-05's job, not yet run).
- **v5 Tailwind + Astro PostCSS pickup** — MEDIUM confidence combination per research STACK.md; validate with a build spike at the very start of Phase 21.
- **v5 Astro Container API coverage parity** — harness stood up and proven working (21-04: `experimental_AstroContainer` + `renderToString()` against `404.astro`, forced to `@vitest-environment node` per-file to work around an esbuild/jsdom incompatibility). Full coverage-parity comparison against an original RTL spec still unresolved until a real content component is migrated (Phase 23); experimental API, breaking-change risk remains.
- **Real-device UAT pending (v4.0/v4.1 lineage)** — Operator UAT (Chrome stable + Safari iOS + Android real device) not yet formally re-executed since v4.1 LCP fix; carries as background item, not a v5 blocker.
- **18 stale dependabot PRs** open — None blocking; sweep opportunistically.
- **Vercel production URL** — Site lives on `*.vercel.app`; custom domain `andresmontoyat.co` still deferred (carries through v4.1/v4.2, unrelated to v5).
- **v5 `PUBLIC_SITE_URL` env var not yet configured on Vercel** — `src/layouts/BaseLayout.astro` (21-02) reads it at build time for canonical/hreflang/og:url; must be set in Vercel Project → Settings → Environment Variables (value: `https://andresmontoyat.co`) before any production/preview deploy of the v5 branch. Local dev/CI builds on this machine use a gitignored `.env` fallback.

## v4.1 SHIPPED (2026-06-13 → 2026-06-16)

| PR | Commit | Status | Description |
|---|---|---|---|
| #33 | 7891e2f | MERGED 2026-06-13 | OG image refresh + responsive me-400.webp variant (orthogonal to actual LCP bottleneck) |
| #34 | a0051b2 | MERGED 2026-06-16 | Static hero LCP fix — move `<img>` to index.html (kill React hydration LCP delay) |
| #35 | 7e2c34c | MERGED 2026-06-16 | LCP eligibility fix — remove aria-hidden + add alt so photo qualifies as LCP candidate |

**Tags placed:** `v4.0`, `v4.1`.

## v4.1 Final Metrics (prod, andresmontoyatco.vercel.app, Lighthouse mobile simulated throttling)

| Metric | Before v4.1 | After v4.1 |
|---|---|---|
| Performance | 0.84 | **0.99** |
| LCP | ~4.0s | **2.1s** |
| FCP | — | 1.1s |
| TBT | — | 0 ms |
| CLS | — | 0.014 |
| SI | — | 2.5s |
| Accessibility | 1.0 | 1.0 |
| Best Practices | 1.0 | 1.0 |
| SEO | 1.0 | 1.0 |

Root cause closed: React SPA hydration was blocking the LCP critical path. Hero `<img>` now lives in `index.html` as a static absolute-positioned layer behind `#root`, paints with FCP, and qualifies as LCP candidate (alt + no aria-hidden). **v5 supersedes this architecture entirely** — the LCP fix pattern (static `<img>` outside React) is subsumed by the whole-page static-by-default Astro approach.

## Session Continuity

Last session: 2026-07-20T00:33:05.697Z
Stopped at: Completed 24-04-PLAN.md
Resume file: None
Untracked (intentional-keep): .planning/projects-input.md, Diagnostico_LinkedIn_*.docx, 14-PATTERNS.md
Open PR: #2 junie-init only (foreign JetBrains scaffold — close if unused)

## v4.2 Roadmap Candidates (separate track, on main)

1. **Custom domain** — `andresmontoyat.co` DNS + Vercel binding (currently `*.vercel.app` only; root domain returns 000)
2. **Dependabot sweep** — Triage open PRs #19-#24 (5 stale npm bumps); merge security fixes, close stale
3. **PR preview deploys** — Configure Vercel preview deploys (currently SSO-gated; consider bypass token for external Lighthouse runs)
4. **OG image refresh** — When custom domain lives, point `og:url` + `og:image` at it (currently hardcoded to `andresmontoyat.co`)

## v3.x Closure Reference (historical only)

v3.4 → v3.10 milestone lineage (brownfield redesign baseline through 3D WebGL constellation) entirely retired from main by v4.0 Slice 1 purge (PR #26 a623ede, 2026-06-12). All `D-20-*` / `D-17-*` / `D-14-16-*` game-mode decisions no longer load-bearing. Historical milestone docs preserved under `.planning/milestones/v3.*-ROADMAP.md` for reverse lookup.
