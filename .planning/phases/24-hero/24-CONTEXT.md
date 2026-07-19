# Phase 24: Hero - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning
**Mode:** [--auto] all gray areas auto-resolved with recommended defaults, single pass, logged below. Preceded by targeted phase research (24-RESEARCH.md) given this phase's flagged technical risk (native `<details>` cross-browser behavior).

<domain>
## Phase Boundary

Migrate `Hero.jsx` to `Hero.astro` — zero React island, zero LCP-blocking JS. Three interactive pieces convert to CSS-only or minimal vanilla-JS equivalents: char-reveal H1 (CSS `steps()`), count-up stats (shared vanilla enhancer, also touches `About.astro`), CV dropdown (native `<details>`/`<summary>` + small dismiss enhancer).

**In scope:** `src/components/Hero.jsx` → `src/components/astro/Hero.astro`. `src/scripts/count-up.js` (new, shared). `src/scripts/details-dismiss.js` (new, small). `src/components/astro/About.astro` gets a follow-up edit to re-add count-up via the shared script (closes Phase 23's D-04 deferral).
**Out of scope:** Any other section. SectionPager (Phase 25). Experience (Phase 26) — has its own separate `<details>` use case, don't conflate.

</domain>

<decisions>
## Implementation Decisions

### Char-reveal H1
- **D-01 [auto]:** Convert `useCharReveal` to a pure CSS `steps()` + `ch`-unit width animation (`@keyframes` typewriter effect on the middle H1 line), gated by `@media (prefers-reduced-motion: reduce)` to show full text immediately (no animation) — matches the current hook's reduced-motion behavior. Reliable because `.font-pixel` (Press Start 2P) is genuinely monospace, making `ch`-unit stepping predictable. Zero JS, zero island.

### Count-up stats (shared, touches both Hero and About)
- **D-02 [auto]:** One shared vanilla module `src/scripts/count-up.js` — queries `[data-count-up]` elements, reads `data-target` attribute, animates via `requestAnimationFrame` with the same cubic ease-out curve as today's `useCountUp`, gated by `prefers-reduced-motion`. Triggered via `IntersectionObserver` (same primitive Astro's own `client:visible` uses internally, per research) rather than unconditional page-load — keeps behavior consistent whether the stat block is above or below the fold.
- **D-03 [auto]:** This phase ALSO edits `src/components/astro/About.astro` (built in Phase 23) to add `data-count-up`/`data-target` attributes to its quick-facts numbers and reference the same `count-up.js` script — closes Phase 23's D-04 deferral ("Phase 24 must re-add it as a shared vanilla script"). This is the one place Phase 24 touches a file outside Hero itself.
- **D-04 [auto]:** IntersectionObserver threshold/rootMargin tuned so the count-up animation doesn't visually start before Hero's existing CSS entrance animation (850ms delay on the stats block) finishes fading in — avoid a jarring "numbers moving during fade-in" look. Exact values are implementation detail (Claude's discretion), but the constraint is locked.

### CV dropdown
- **D-05 [auto]:** Base mechanic converts to native `<details>`/`<summary>` — zero JS for open/close/keyboard-focus. Drop `role="menu"`/`role="menuitem"` (per research: native disclosure semantics are already correct; the roles implied arrow-key nav that was never actually implemented in the React version either).
- **D-06 [auto]:** A small additive `src/scripts/details-dismiss.js` (~10-15 lines) handles Escape-key close and outside-click close — native `<details>` does NOT reliably do either across current browsers (per research, flagged as an assumption, not zero-risk). This script is generic (works on any `<details>` element, not Hero-specific) so it can be reused by Phase 26's Experience `<details>` if useful there too.
- **D-07 [auto]:** ROADMAP's stated success criterion ("Escape-key close cross-browser verified") requires REAL manual cross-browser QA (Chrome, Firefox, Safari) during this phase's execution — not just code review or automated test assertions, since the underlying browser behavior itself was only assumed/flagged by research, not confirmed from one authoritative source. Plan this as an explicit checkpoint task, not skip it.

### Hero photo / LCP
- **D-08 [auto]:** Hero's `<img>` markup ports directly into `Hero.astro` — it becomes the actual LCP element via server-rendered HTML (no hydration delay in Astro), making the old `#hero-static` duplicate-DOM workaround (used in the CRA/React era to fake a pre-hydration paint) unnecessary. Confirmed: `BaseLayout.astro` (Phase 21) already only carries the `<link rel="preload">` hint, not a duplicate `#hero-static` element — no cleanup needed there, just don't reintroduce the duplication pattern in `Hero.astro`.

### Claude's Discretion
- Exact CSS `steps()` timing/duration values (should visually approximate the original's 40ms-per-char cadence, not be pixel-identical).
- Exact IntersectionObserver rootMargin/threshold tuning (D-04's constraint, not its implementation).
- Whether `details-dismiss.js` is inlined per-page or loaded as a shared asset — organizational detail.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & requirements
- `.planning/REQUIREMENTS.md` — STATIC-02 (Hero's CV-dropdown half; Experience's expand/collapse half is Phase 26)
- `.planning/ROADMAP.md` — Phase 24 goal/success criteria (LCP baseline: v4.1's 2.1s, per `.planning/STATE.md`'s v4.1 Final Metrics table)
- `.planning/phases/24-hero/24-RESEARCH.md` — phase-level research: CSS steps() pattern, count-up IntersectionObserver approach, `<details>` cross-browser assumptions log (A1/A2)

### Prior phase artifacts
- `.planning/phases/23-static-content-sections/23-01-SUMMARY.md` — About.astro's current state (count-up dropped, D-04 deferral this phase closes)
- `.planning/phases/21-foundation-astro-scaffold-i18n-routing-layout-shell/21-02-SUMMARY.md` — BaseLayout.astro's hero preload hint (confirms no duplicate `#hero-static` element to clean up)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/Hero.jsx` — full markup/Tailwind classes port near-verbatim; only the 3 interactive pieces change mechanism
- Hero's existing CSS entrance-animation classes (`animate-fade-in`, `animate-slide-up`, staggered `animationDelay`) — already CSS-only, carry over unchanged

### Established Patterns
- `src/components/astro/About.astro` (Phase 23) — will receive the count-up follow-up edit (D-03)
- `src/pages/404.astro` — Astro `.astro` component structure precedent

### Integration Points
- Both `count-up.js` and `details-dismiss.js` are new shared assets under `src/scripts/` (new directory) — first use of non-component vanilla scripts in the migration
- `Hero.astro` mounts in `src/pages/en/index.astro` / `es/index.astro`, replacing the current `<h1>Carlos Montoya</h1>` placeholder — first section, before About

</code_context>

<specifics>
## Specific Ideas

No new visual requirements — Hero's look/animation timing should read as equivalent to today's site, not identical to the pixel. LCP performance improvement is the point, not a redesign.

</specifics>

<deferred>
## Deferred Ideas

None — count-up consolidation (the one cross-phase item) is explicitly in scope this phase (D-02/D-03), not deferred further.

</deferred>

---

*Phase: 24-hero*
*Context gathered: 2026-07-19 (--auto, preceded by phase research)*
