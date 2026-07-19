# Phase 23: Static content sections - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning
**Mode:** [--auto] all gray areas auto-resolved with recommended defaults, single pass, logged below.

<domain>
## Phase Boundary

Migrate 5 components to zero-client-JS `.astro`: About, Skill, Footer, Projects, Claude. Each reads its existing bilingual data source directly (no shape changes) and renders build-time per locale. Each gets an Astro Container API test replacing its RTL test.

**In scope:** `src/components/About.jsx` → `About.astro`, `Skill.jsx` → `Skill.astro`, `Footer.jsx` → `Footer.astro`, `Projects.jsx` → `Projects.astro`, `Claude.jsx` → `Claude.astro`. Mount all 5 on `src/pages/en/index.astro` and `src/pages/es/index.astro` (after Nav).
**Out of scope:** Hero (Phase 24), SectionPager (Phase 25), Experience (Phase 26) — all remain React/pending.

</domain>

<decisions>
## Implementation Decisions

### Data sources (per component)
- **D-01 [auto]:** About, Skill, Projects, Claude import their existing `src/data/{about,skills,projects,claude}.json` directly in `.astro` frontmatter — same `{en, es}` field shape, zero restructuring, same `pick(field, locale)`-style resolution pattern already used per-component.
- **D-02 [auto]:** Footer has NO dedicated JSON file — its copy comes from `translations.js`'s `t.footer` subtree (via the old `useLanguage()`), and its social links (`GitHub`, `LinkedIn`) are a hardcoded module-level array in `Footer.jsx`. Both port as-is: `translations[locale].footer` resolved in `.astro` frontmatter, `social` array copied verbatim as a module-level const in `Footer.astro`.
- **D-03 [auto]:** Footer's `new Date().getFullYear()` (currently a runtime read) becomes a build-time read in `.astro` frontmatter — correct and sufficient (the site rebuilds at least yearly via any future deploy; no need for client-side freshness).

### About's count-up animation (the one non-static piece among these 5)
- **D-04 [auto]:** `About.jsx`'s `useCountUp()` hook (client `useState`/`useEffect`, animates quick-facts numbers on mount) is DROPPED in this phase — `About.astro` renders the final static numbers directly, no animation. ROADMAP.md's Phase 24 already explicitly owns "consolidate duplicated count-up animation (Hero + About) into one shared vanilla script" — re-introducing it here would preempt that phase's stated scope and risk a second divergent implementation. This is an intentional, documented deferral, not a silent drop: Phase 24 must re-add it as a shared vanilla `<script>` enhancer for both Hero and About.

### Mounting & page structure
- **D-05 [auto, corrected against actual current file]:** `src/pages/en/index.astro` and `es/index.astro` currently contain ONLY `<BaseLayout><Nav client:load .../><main><h1>Carlos Montoya</h1></main></BaseLayout>` — there is no old React app tree mounted on these pages (they were built fresh in Phase 21/22, not ported from `App.jsx`). This phase replaces the placeholder `<h1>` with the 5 new static components in the target final order: About → Skill → Projects → Claude → Footer (matching current `App.jsx`'s section order for these 5, minus the not-yet-migrated Hero/Experience/Contact/SectionPager slots, which stay absent — not stubbed — until their own phases land). Original `App.jsx`'s full order for reference: Nav → Hero → About → Skill → Experience → Projects → Claude → Contact → Footer → SectionPager.

### Testing
- **D-06 [auto]:** Each of the 5 gets an Astro Container API test (`{Component}.test.ts`) mirroring `404.test.ts`'s pattern from Phase 21 (per-file `// @vitest-environment node` override — required per Phase 21's PATTERNS.md finding that Container API compilation fails under the default jsdom environment). Assertions: bilingual content presence (both `en`/`es` renders), ARIA landmarks/labels preserved from the original RTL spec, no regression in assertion count vs. the original `.test.jsx` file being replaced.
- **D-07 [auto]:** Spot-check coverage parity for at least one component (recommend `About` — has the most content variety: paragraphs + quick-facts) against its original RTL spec before treating the Container API pattern as validated for the remaining four, per Phase 21 research's flagged risk (Container API is still experimental, coverage parity unconfirmed).

### Claude's Discretion
- Exact `.astro` component internal structure (single frontmatter block vs multiple, helper function extraction) — organizational detail.
- Whether the 5 new Container API test files replace the old `.test.jsx` files in-place (same filename, `.test.ts` extension) or coexist temporarily — implementation detail, as long as the old RTL test for a component is removed once its Astro replacement's Container API test passes with equivalent assertions (no duplicate/stale test files left behind).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & requirements
- `.planning/REQUIREMENTS.md` — STATIC-01, TEST-01 (this phase's REQ-IDs)
- `.planning/ROADMAP.md` — Phase 23 goal/success criteria, Phase 24's ownership of count-up consolidation (referenced by D-04)

### Research & prior-phase patterns
- `.planning/research/ARCHITECTURE.md` — data-layer migration plan (confirms zero data-shape changes needed), Claude section's omission from the original design spec's island table (already corrected)
- `.planning/phases/21-foundation-astro-scaffold-i18n-routing-layout-shell/21-PATTERNS.md` — Astro Container API `@vitest-environment node` requirement (D-06)
- `.planning/phases/21-foundation-astro-scaffold-i18n-routing-layout-shell/21-04-SUMMARY.md` — first Container API test in the repo (`404.test.ts`), the pattern this phase scales

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/{About,Skill,Footer,Projects,Claude}.jsx` — direct ports, no hooks except About's `useCountUp` (dropped, D-04)
- `src/data/{about,skills,projects,claude}.json` — import as-is
- `src/i18n/translations.js`'s `t.footer` subtree — Footer's only content source besides its hardcoded `social` array

### Established Patterns
- `src/pages/404.astro` + `src/pages/_404.test.ts` (Phase 21) — the exact static-component + Container-API-test pattern to replicate 5x
- `src/layouts/BaseLayout.astro`'s `translations[locale]?.meta` idiom — same pattern for Footer's `translations[locale].footer`

### Integration Points
- All 5 mount inside `src/pages/en/index.astro` / `es/index.astro` (created Phase 21, Nav mounted Phase 22) — planner must read current state of these two files before writing mounting tasks, since they're being incrementally built up phase by phase

</code_context>

<specifics>
## Specific Ideas

No new visual/copy requirements — pure structural port, same content, same rendered output, same Tailwind classes.

</specifics>

<deferred>
## Deferred Ideas

- About's count-up animation — explicitly deferred to Phase 24 (D-04), not lost.

</deferred>

---

*Phase: 23-static-content-sections*
*Context gathered: 2026-07-19 (--auto)*
