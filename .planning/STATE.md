---
gsd_state_version: 1.0
milestone: v4.2
milestone_name: Content polish — experience rewrite + projects redesign
status: in-progress
stopped_at: v4.2 content work on main (no tag yet) — experience rewrite (#36) + timeline polish (#37) + projects 3-card redesign + contact reorder (#38) + audit fix (#39) + claude offerings consolidation + experience visibility flag + CV PDF generator. 56/56 tests GREEN. main in sync with origin.
last_updated: 2026-06-30T10:57:00-05:00
last_activity: 2026-07-01 - PR #41 vite8/vitest4 + .jsx migration merged; PR #2 closed; quick 260701-v6a JSON-LD Person (999.6/ASEO-01) shipped
progress:
  shipped_to_main: 5
  remaining: open  # projects expansion + content passes; no fixed slice count yet
  percent: null
---

# Project State

## v4.2 Content Polish (IN PROGRESS — on main, no tag)

**Focus:** Recruiter-facing content quality — experience copy rewrite + projects section redesign. No infra/perf scope.

**Shipped to main (PR order):**

| PR | Commit | Description |
|----|--------|-------------|
| #36 | 9684201 | Experience rewrite — apply tNic template (Fase 1); 12 entries, JSON-driven |
| #37 | 8ec5ed2 | Experience timeline UI polish (interactive states) |
| #38 | 57be81d | Projects 3-card redesign (🎫 Mr. Yoker / 🏥 Mutual SER / 📞 Hexadialer) — emoji glyphs + gradient overlay + centered flexbox (fixed card width, replaces grid); contact reorder (GitHub before LinkedIn) |
| #39 | 7e3c27e | npm audit fix — non-breaking security bumps (25→23 vulns) |

**Direct-to-main since #39 (no PR, content/tooling passes):**

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

See: .planning/PROJECT.md (refreshed 2026-06-13 — v4.0 milestone documented; v3.10/9/8 demoted to "previously shipped")

**Core value:** Hero + first impression must stop recruiters mid-scroll and convert visits into engineering conversations.
**Current focus:** v4.0 milestone close — real-device UAT + tag `v4.0`.
**Last shipped:** v4.0 Slice 7 Claude Code on main 2026-06-13 (PR #32 squash e8abb1b).

## Current Position

Slice: 7 of 7 shipped ✅
Status: Ready to close v4.0 (awaiting UAT + tag)
Last activity: 2026-06-13T23:55Z
Progress bar: `[██████████████] 7/7 slices on main — v4.0 complete`

## Shipped Slices (on main, in chronological + PR order)

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

## Blockers / Concerns (carried into v4.0 close + v4.1)

- **Real-device UAT pending** — All 7 sections live on `*.vercel.app` (auto-deploy from main). Operator UAT (Chrome stable + Safari iOS + Android real device) and Lighthouse mobile run not yet executed.
- **Bundle WARN tier** — Index chunk 60.93 kB gz crossed soft ceiling 60 kB after Slice 7. Under HARD 68 so non-blocking; flag at v4.1 if Claude section grows further.
- **Theme toggle parked** — `ThemeContext` still wired but no UI toggle. Defer to post-v4.0 OR drop entirely.
- **18 stale dependabot PRs** open — None blocking; sweep at v4.0 tag close.
- **Vercel production URL** — Site lives on `*.vercel.app`; custom domain `andresmontoyat.co` still deferred (carries to v4.1).

## v4.0 Close Checklist (next operator actions)

1. **Real-device UAT** — Browse production on Chrome stable + Safari iOS + Android real device. All 7 sections render bilingual EN/ES; nav anchors scroll; Contact + Claude CTAs work; Hero CV download buttons download EN/ES Word docs.
2. **Lighthouse mobile run** — `npm run lighthouse:mobile && npm run lighthouse:check` (or against production URL). Target ≥ v3.10 baseline (Perf ≥95 / A11y 100 / BP 100 / SEO 100). Note: bundle WARN tier may shave a few perf points — acceptable if A11y/BP/SEO hold.
3. **Tag `v4.0`** on the v4.0-closing commit (e8abb1b or HEAD after UAT fixes).
4. **Dependabot sweep** — Triage open dependabot PRs #5-#24; merge security fixes, close stale.
5. **(optional) PROJECT.md final pass** — Update Current State to "v4.0 SHIPPED" with metrics + tag.

## v4.1 Roadmap Candidates (post-tag)

- **v4.1 Production polish + custom domain** — DEPLOY-02 (custom domain `andresmontoyat.co` + DNS), DEPLOY-03 (PR preview deploys), production-URL Lighthouse verdict, Open Graph image refresh.
- **v4.2 backlog activation** — VIS-05 claude-kanban + caveman cards (extra featured-app cards in Claude section), DIAGRAMS-01 cross-repo architecture diagrams.
- **v4.3 theme toggle decision** — Either ship light theme + toggle UI OR formally retire `ThemeContext`.

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

Root cause closed: React SPA hydration was blocking the LCP critical path. Hero `<img>` now lives in `index.html` as a static absolute-positioned layer behind `#root`, paints with FCP, and qualifies as LCP candidate (alt + no aria-hidden).

## Session Continuity

Last session: 2026-06-30T10:57:00-05:00 (resumed; pushed CV PDF work, cleaned strays, refreshed STATE.md)
Stopped at: main in sync with origin (pushed 743400b CV generator + f406d41 generated PDFs). Strays removed (website-new/, root docx dupes). 56/56 vitest GREEN. Claude section converged to 6-card offerings grid (featured-apps grid + stack chips removed). Experience now has per-entry `visible` flag. Next candidates: projects expansion (fill projects-input.md), DIAGRAMS-01, custom domain, or v4.2 tag.
Resume file: none — clean checkpoint
Untracked (intentional-keep): .planning/projects-input.md, Diagnostico_LinkedIn_*.docx, 14-PATTERNS.md
Open PR: #2 junie-init only (foreign JetBrains scaffold — close if unused)

## v4.2 Roadmap Candidates (next milestone)

1. **Custom domain** — `andresmontoyat.co` DNS + Vercel binding (currently `*.vercel.app` only; root domain returns 000)
2. **Dependabot sweep** — Triage open PRs #19-#24 (5 stale npm bumps); merge security fixes, close stale
3. **PR preview deploys** — Configure Vercel preview deploys (currently SSO-gated; consider bypass token for external Lighthouse runs)
4. **Theme toggle decision** — Ship light theme + toggle UI OR formally retire `ThemeContext`
5. **OG image refresh** — When custom domain lives, point `og:url` + `og:image` at it (currently hardcoded to `andresmontoyat.co`)

## v3.x Closure Reference (historical only)

v3.4 → v3.10 milestone lineage (brownfield redesign baseline through 3D WebGL constellation) entirely retired from main by v4.0 Slice 1 purge (PR #26 a623ede, 2026-06-12). All `D-20-*` / `D-17-*` / `D-14-16-*` game-mode decisions no longer load-bearing. Historical milestone docs preserved under `.planning/milestones/v3.*-ROADMAP.md` for reverse lookup.
