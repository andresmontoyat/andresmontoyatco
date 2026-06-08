# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v3.6 — AI Practice & Brand Refresh

**Shipped:** 2026-05-20 (code shipped; production deploy deferred to v3.7)
**Phases:** 4 active (7, 8, 9, 10) + 1 de-scoped (11) | **Plans:** 4 (07-01, 07-02, 08-01, 09-01) | **Sessions:** ~9 days of work (2026-05-12 → 2026-05-20)

### What Was Built

- Tailwind CSS-var indirection layer: `:root` + `[data-theme="light"]` token system; Tailwind utilities now genuinely flip on theme toggle (closes v3.5 Phase 5 false-positive UAT debt) — Phase 7
- Brand palette swap to blue-500 (`#3B82F6`) + emerald-500 (`#10B981`); WCAG AA contrast verified in both modes; og-image regenerated — Phase 7
- Cinematic full-bleed hero photo via `<picture>` w/ 800w mobile + 1600w desktop WebP; theme-aware `--hero-photo-filter` / `--hero-overlay` / `--hero-h1-shadow` tokens; sharp pipeline (`npm run hero:process`); LCP preload (140 KB desktop / 49 KB mobile) — Phase 8
- Bilingual sales-pitch Claude Code section between Projects and Contact: PitchHero + 4 ValueCards + ProofBlock (7 counters: 37/81/86/15/47/15/5) + 5 ServiceCards + 3 FeaturedAppCards (GSD / spring-ai-qdrant-mcp / ci-templates) + StackStrip (17 chips); 9.95 KB lazy chunk; scroll-spy entry in Desktop + Mobile nav; CTAs route to #contact / #projects — Phase 9
- `soldife/ci-templates` surfaced as DevOps evidence: app card with badge + 10 tech chips, DevOps automation service, +2 proof counters (47 workflows / 15 templates) — Phase 9 sub-feature

### What Worked

- **Single-source `NAV_ITEMS` array** (Phase 9 review fix WR-07): collapsed `SECTION_IDS` + DesktopNav + MobileMenu into one array. Eliminated drift risk. Pattern carries forward as the canonical nav-entry add convention.
- **Theme-aware CSS vars beyond color tokens** (Phase 8): extending the Phase 7 token system into `--hero-photo-filter` / `--hero-overlay` / `--hero-h1-shadow` proved the system generalizes cleanly — image filters Tailwind can't tokenize via JIT still flip with `[data-theme]`.
- **Lazy-load + bilingual namespace + scroll-spy pattern** (Phase 9): mirrored the v3.5 Projects pattern verbatim. Reusable template for any future section addition. Bundle stayed lean.
- **Code review fix waves between Phase 9 and Phase 10** (commits 04d6c51 / 787644f / 1983bc0 / 5c906f7 / e1e9c2f): seven warnings caught + fixed atomically before UAT instead of after — easier to address while context was warm.
- **`gsd-integration-checker` agent at audit time**: 8/8 wiring checks verified in one pass; would have caught the AI-01 doc-drift before close if the audit had run earlier in the cycle.

### What Was Inefficient

- **Phase 11 (DIAGRAMS-01) never planned**: stayed in ROADMAP as planned-but-unscoped through entire milestone, finally de-scoped at close. Would have been cleaner to make the scope call when v3.6 started instead of carrying ambiguity for 9 days.
- **AI-01 doc-drift accumulated** (5 cards → 3 ships, 5 counters → 7 ships, 4 services → 5 ships): the AI section evolved during Phase 9 implementation but REQUIREMENTS.md + ROADMAP SC2 didn't get patched until milestone close. Doc-drift patches should run inline when scope changes, not at close.
- **Phase 10 UAT was over-specified for the closure decision**: 11-test grid drafted before we knew which tests would actually fit the v3.6 timeline. Many tests duplicated work that would naturally re-run as a v3.7 pre-deploy gate against the production build.
- **Manual UAT cost** (8th consecutive milestone without test infra): each milestone deferral compounds — every visual regression risk now requires manual browser sweeps. Cost wasn't acute in v3.6 but the muscle is getting expensive.

### Patterns Established

- **Single-source nav-entry pattern**: `NAV_ITEMS` array in `Nav.js` is the only place to add a new section ID. `SECTION_IDS`, DesktopNav links, MobileMenu links all derive from it. Adopt this for any new nav surface.
- **Theme-aware CSS-var tokens for non-color properties**: `--hero-*` shows the pattern generalizes beyond color. Use for image filters, gradient overlays, drop-shadows, anything Tailwind can't tokenize natively.
- **`<picture>` + sharp pipeline + LCP preload**: reference pattern for any future imagery. `npm run hero:process` is re-runnable and deterministic; LCP preload link in `index.html` matches the consumer paths.
- **Lazy section addition checklist**: data module → translations namespace → component file → App.js Suspense boundary → `NAV_ITEMS` entry. Five touchpoints, verified by integration check.
- **Inline doc-drift patches before close**: when scope shifts during execution, patch REQUIREMENTS.md + ROADMAP SC inline. Don't batch to milestone close — drift compounds.

### Key Lessons

1. **De-scope decisions belong at milestone start, not close.** Phase 11 ambiguity wasted planning context for 9 days. If a phase isn't ready to plan when the milestone opens, leave it out of the milestone — don't carry "planned" placeholders.
2. **Test infrastructure deferral now has visible cost.** 8 consecutive milestones is no longer "explicit decision, not drift" — it's becoming drift. v3.7 should include an explicit risk assessment: how much manual UAT cost did v3.6 absorb that automation would have absorbed?
3. **The audit phase saved scope.** Running `gsd-integration-checker` at milestone close caught wiring assumptions before they propagated into v3.7 planning. Running it once at audit time was high-ROI; consider running mid-milestone for long-running ones.
4. **Conscious deferral ≠ scope failure.** Phase 10 UAT 9/11 skip was the right call — same Lighthouse audit needs to run against production build in v3.7 anyway. Re-purposing the UAT tests as a v3.7 pre-deploy gate is better than running them twice.
5. **Visual UAT for animation + photo work cannot be code-verified.** Phase 8 (`human_verified: pending` on 5 items) and Phase 9 (`pending` on 6 items) shipped passing code verification but the visual sweep is irreducible. Plan for the human-time cost up front; don't sandbox it to a UAT phase that becomes the choke point.

### Cost Observations

- Model mix: predominantly Opus (planning + review) + Sonnet (execution); no Haiku usage tracked
- Sessions: ~9 sessions across 9 calendar days
- Notable: code review fix waves (Phase 9 → 10 closing) ran efficiently because the warnings were caught + addressed atomically. Slow-context tasks (milestone audit doc, archive prep) benefited from running close-to-close while file state was fresh.

---

## Milestone: v3.9 — Game Mode Polish

**Shipped:** 2026-06-08 (same-day micro-milestone)
**Phases:** 2 (18, 19) | **Plans:** 1 PLAN.md (Phase 18-01) + 1 inline feat (Phase 19) | **Sessions:** 1 calendar day

### What Was Built

- **POLISH-01 (Phase 18)** — Above-the-fold layout restructure. Compact H1, sub-copy → sr-only, SkillFilters → fixed `bottom-0 z-30` bar, renderer slot `flex-1 min-h-0 pb-20/24`. Constellation visible without scroll on desktop ≥1024px / tablet ~768px / mobile ~390px. 259/259 tests GREEN.
- **POLISH-02 (Phase 19)** — SVG ambient twinkle animation. `motion-safe:animate-svg-twinkle` 4s ease-in-out infinite opacity 1.0→0.7→1.0 (GPU-composited). Deterministic per-node phase offset via `-(sortIndex * 137) % 4000`ms (golden-ratio spacing prevents synchronized pulsing). `prefers-reduced-motion: reduce` users keep fully static a11y path. 261/261 tests GREEN.

### What Worked

- **Real-session-driven scoping** — both REQs surfaced from first post-v3.8 usage session. Specific, observable, not speculative. Same-day delivery possible because scope was tight.
- **Zero new deps** — pure tailwind keyframe + JSX class string change. No npm install, no bundle bloat, no audit churn.
- **Phase 19 as inline feat commit** — formal PLAN.md unwarranted for single-keyframe + 2-test feature; commit message + ROADMAP carried the trace. Kept overhead proportional to scope.
- **Deterministic phase offset reused existing `sortIndex`** — no new state, no new computation cost, perceptually organic spacing.
- **Bundle gate held** — 8.87 kB gz GameMode (under v3.8 ceiling 38.82 kB); polish work added zero perf cost.

### What Was Inefficient

- **STATE.md drift** — state header still said "Phase 18 executing" after both phases shipped; not refreshed until milestone close session resumed. Suggests need for auto-sync hook on phase completion.
- **REQUIREMENTS.md traceability stale** — POLISH-01/02 stayed `Pending` after delivery; corrected only at archive time. Same root cause as STATE.md drift — manual mark needed on commit-complete.
- **Manual UAT deferred** — visual confirm (real device + deployed URL) never ran; conflated with deferred DEPLOY work. Risk: regression in above-fold layout on untested viewport could ship undetected until next session.
- **No v3.8 retro entry** — pre-existing gap. v3.8 closed without RETROSPECTIVE.md append; v3.9 fills only the v3.9 slot.

### Patterns Established

- **Micro-milestone shape** — 2 REQs, 1–2 phases, same-day delivery, single tag. Pattern reusable for parity/polish fixes surfacing in v3.10+ usage.
- **Inline-feat phase** — when scope is single-file + 2 tests, skip PLAN.md/SUMMARY.md; commit message + ROADMAP carry the trace. Caveat: only safe when REQ coverage is unambiguous.
- **SVG-only animation in motion-safe gate** — opacity-only animations via tailwind motion-safe: prefix are the cheap parity-tightener for renderer-divergent ambient motion.

### Key Lessons

- **Drift between living docs and reality compounds when sessions skip ceremony.** Phase 18 shipped, Phase 19 shipped, milestone tagged — but STATE.md, REQUIREMENTS.md, and missing v3.8 retro all surfaced as gaps at v3.9 archive time. Cheaper to mark-complete on phase ship than to reconcile at milestone close.
- **Polish milestones don't need audit overhead.** Skipping `/gsd:audit-milestone` here was safe because REQ coverage was 1:1 with phases and verifiable via commit + ROADMAP. Audit pays off when phases drift from REQs, not when they map straight.
- **Real-device UAT deferral is recurring debt.** v3.6 (Phase 10 partial), v3.7 (deferred), v3.9 (deferred again). v3.10 should bundle deploy + UAT to break the pattern.

### Cost Observations

- Model mix: Opus 4.7 — single session for archival ceremony; Phase 19 implementation likely ran on Opus during prior session
- Sessions: 1 day of feature work + 1 session for milestone close
- Notable: 261/261 tests GREEN throughout — no test churn. Zero npm install — zero CVE/audit cost. Cheapest milestone close in project history.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v3.4 | unknown | 4 | Greenfield brownfield rewrite — baseline |
| v3.5 | unknown | 3 (1 deferred) | Themes + Projects shipped; deploy slipped → introduced "shipped partial" pattern |
| v3.6 | ~9 | 4 (1 de-scoped) | Doc-drift patches inline at close; integration-checker agent at audit; visual UAT debt explicitly carried, not lost |
| v3.8 | (retro not appended) | 4 | Game Mode feature milestone — Vitest+RTL infra debt paid down; adaptive renderer pattern; Lighthouse HARD gate held |
| v3.9 | 1+1 | 2 | First micro-milestone — same-day delivery; inline-feat phase pattern (no PLAN.md when scope is single keyframe + 2 tests) |

### Cumulative Quality

| Milestone | Test Infra | Lighthouse Mobile | Manual UAT Cost |
|-----------|-----------|-------------------|-----------------|
| v3.4 | None | 98/100/100/100 (baseline) | Low (smaller surface) |
| v3.5 | None (deferred 6) | unmeasured post-shipping | Medium (theme + projects) |
| v3.6 | None (deferred 7) | deferred to v3.7 | High (5 hero + 6 AI + 9 UAT items) |
| v3.8 | Vitest+RTL (NEW; 253 GREEN) | ≥95/100/100/100 cleared (Phase 17 close) | Medium (Phase 17 UAT 9/9) |
| v3.9 | 261 GREEN (+8 from v3.8) | not re-run (no perf-impacting change) | Deferred (manual visual UAT → v3.10 deploy) |

### Top Lessons (Verified Across Milestones)

1. **"Shipped partial" with explicit deferred items is healthier than carrying scope.** v3.5 and v3.6 both closed partial with debt tracked; both are recoverable. Compare to a hypothetical "carry everything to next" which loses momentum.
2. **Doc-drift patches must run inline.** v3.6 made this lesson concrete: AI-01 evolved but REQUIREMENTS lagged 7 days. v3.7 should patch within the implementation phase, not at milestone close.
3. **Cross-phase wiring assumptions hide in mid-milestone work.** Integration-checker agent at audit time caught all 8 wiring checks WIRED in v3.6 — high-ROI verification step. Adopt mid-milestone runs for milestones >2 weeks.
