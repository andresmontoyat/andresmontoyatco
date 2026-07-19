---
phase: 23-static-content-sections
plan: 03
subsystem: frontend
tags: [astro, container-api, i18n, testing, projects, claude]

# Dependency graph
requires: ["23-01"]
provides:
  - "src/components/astro/Projects.astro — zero-client-JS bilingual Projects section, build-time render from projects.json, featured/rest split preserved (STATIC-01)"
  - "src/components/astro/Claude.astro — zero-client-JS bilingual Claude section, build-time render from claude.json, 4 values + 6 offerings (STATIC-01)"
  - "src/components/astro/Projects.test.ts + Claude.test.ts — Container API parity tests (TEST-01)"
affects: ["23-04 (mounting all 5 static components into en/index.astro and es/index.astro)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-variant card port (Projects): FeaturedProjectCard/ProjectCard/TechTags sub-components inlined directly into featured.map()/rest.map() template blocks — same pattern established in 23-01/23-02 for single-variant components, extended here to multiple card shapes in one file"
    - "Split-heading port (Claude): h2Part1/h2Part2 with embedded <span> preserved verbatim in template, not decomposed"
    - "Astro HTML entity auto-escaping surfaced in test assertions: apostrophes render as &#39;, ampersands as &amp; — Container API tests must assert against the escaped string, not the raw source string (same class of adjustment as 23-02's Skill.test.ts)"

key-files:
  created: [src/components/astro/Projects.astro, src/components/astro/Projects.test.ts, src/components/astro/Claude.astro, src/components/astro/Claude.test.ts]
  modified: []
  deleted: [src/components/Projects.test.jsx, src/components/Claude.test.jsx]

key-decisions:
  - "D-01 honored: both components import their JSON directly in frontmatter with the pick(field, lang) resolver copied verbatim — zero data-shape changes to projects.json/claude.json."
  - "FeaturedProjectCard/ProjectCard/TechTags (Projects) and PitchHero/ValueCard/OfferingCard (Claude) inlined into template .map() blocks rather than extracted as separate .astro partials — consistent with 23-01/23-02's established approach for pure-markup sub-components with no reusable logic beyond composition."
  - "Test assertions adjusted for Astro's auto-escaping (&#39; for apostrophes, &amp; for ampersands) rather than matching the raw JSON source strings — required for the tests to pass against renderToString() output, no behavior change."

requirements-completed: []

# Metrics
duration: ~12min
completed: 2026-07-19
---

# Phase 23 Plan 3: Projects.astro + Claude.astro port + Container API parity tests Summary

**Projects.jsx (two card variants + tech tags) and Claude.jsx (three sub-components) ported to zero-client-JS `.astro` components, each consuming its existing JSON unchanged, each with a full parity Astro Container API test replacing its former RTL spec — completing the two content-heavy static sections of Phase 23.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 2
- **Files created:** 4 (Projects.astro, Projects.test.ts, Claude.astro, Claude.test.ts)
- **Files deleted:** 2 (Projects.test.jsx, Claude.test.jsx)

## Accomplishments

- `src/components/astro/Projects.astro` — imports `src/data/projects.json` unchanged, ports the `pick(field, lang)` resolver and the `featured`/`rest` filter split verbatim. `FeaturedProjectCard`, `ProjectCard`, and `TechTags` (three React sub-components in the source) are inlined directly into the `featured.map()` and `rest.map()` template blocks. Preserves `data-featured="true"`/`"false"` attributes, the `aria-hidden="true"` decorative accent bar and icon spans, the `{(project.liveUrl || project.githubUrl) && (...)}` conditional CTA short-circuit, and every Tailwind class byte-identical to the source. Zero React import, zero hooks, zero `client:` directive.
- `src/components/astro/Projects.test.ts` — Astro Container API test, `// @vitest-environment node` as the literal first line, ports all 8 `it` blocks from the former `Projects.test.jsx`: section id, EN label/heading/intro, article-count-equals-project-count + EN titles, emoji icon + tech chip presence, ES translation, no-CTA-when-URLs-null guard, featured-first-highlighted-variant (Mr. Yoker, exactly one `data-featured="true"`), and `projects.json` schema sanity.
- `src/components/astro/Claude.astro` — imports `src/data/claude.json` unchanged, ports `pick(field, lang)` verbatim. `PitchHero`, `ValueCard`, and `OfferingCard` inlined into the template and the `data.values.map()`/`data.offerings.map()` blocks. Preserves the split `{pick(data.h2Part1, locale)}{' '}<span>{pick(data.h2Part2, locale)}</span>` heading structure and every Tailwind class byte-identical. Zero React import, zero hooks, zero `client:` directive.
- `src/components/astro/Claude.test.ts` — Container API test, `// @vitest-environment node` first line, ports all 6 `it` blocks from `Claude.test.jsx`: section id, EN pitch hero (label/h2 parts/subLead/CTA), all 4 value cards, all 6 offerings, ES translation, and `claude.json` schema sanity. Two assertions adjusted for Astro's auto-escaped HTML output (`Let&#39;s talk about your project`, `RAG &amp; MCP servers` / `LLM evals &amp; guardrails`) rather than the raw apostrophe/ampersand source strings.
- `src/components/Projects.test.jsx` and `src/components/Claude.test.jsx` removed — no stale duplicate test files left behind.
- `npm run build` produces a clean build (4 pages: `dist/en/index.html`, `dist/es/index.html`, `dist/404.html`, `dist/index.html`). Neither Projects.astro nor Claude.astro is mounted on any page yet — mounting all 5 static components together is Plan 23-04's scope.
- Full test suite: **115/115 GREEN** (115 pre-plan baseline − 14 removed `.test.jsx` specs + 8 new `Projects.test.ts` + 6 new `Claude.test.ts` — net zero change in count, zero regressions).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Projects.astro and Projects.test.ts (parity), remove old RTL test** - `2dc9439` (feat)
2. **Task 2: Create Claude.astro and Claude.test.ts (parity), remove old RTL test** - `145142f` (feat)

## Files Created/Modified/Deleted

- `src/components/astro/Projects.astro` - new: zero-client-JS bilingual Projects section
- `src/components/astro/Projects.test.ts` - new: Container API parity test (8 assertions)
- `src/components/Projects.test.jsx` - deleted: superseded by Projects.test.ts
- `src/components/astro/Claude.astro` - new: zero-client-JS bilingual Claude section
- `src/components/astro/Claude.test.ts` - new: Container API parity test (6 assertions)
- `src/components/Claude.test.jsx` - deleted: superseded by Claude.test.ts

## Decisions Made

- **D-01 honored exactly as specified:** both components read their respective JSON files unchanged, with the `pick(field, lang)` resolver duplicated verbatim per-file (matches the established per-component duplication pattern from 23-01/23-02 — no shared util module).
- **Sub-components inlined rather than extracted as separate `.astro` partials:** `FeaturedProjectCard`/`ProjectCard`/`TechTags` (Projects) and `PitchHero`/`ValueCard`/`OfferingCard` (Claude) had no reusable logic beyond markup composition, so inlining kept each component to a single file — consistent with 23-01's `Row` and 23-02's `MeterRow`/`Category` inlining precedent.
- **Test assertions adjusted for Astro's HTML auto-escaping:** apostrophes render as `&#39;` and ampersands as `&amp;` in `renderToString()` output. Assertions were updated to match the escaped string rather than the raw JSON source string — no behavior change, purely a test-authoring adjustment required for the Container API pattern (same class of fix as 23-02's `Skill.test.ts`).

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched their `<action>` and `<acceptance_criteria>` blocks. The only adjustments were within the `<action>`'s own scope: two test assertions needed escaping-aware string matching to pass against Astro's actual `renderToString()` output, discovered and fixed during the RED→GREEN verification step of each task (not a deviation from the plan's intent, since the plan's `<action>` for Task 2 explicitly directed porting assertions "as `expect(result).toContain(...)`" against the rendered string, not the raw source).

## Verification Results

- `npm run build` — clean build, 4 pages emitted, no errors.
- `rg -c "useState|useEffect|client:|set:html" src/components/astro/Projects.astro` — 0 hits.
- `rg -c "useState|useEffect|client:|set:html" src/components/astro/Claude.astro` — 0 hits.
- `npx vitest run src/components/astro/Projects.test.ts` — 8/8 passing.
- `npx vitest run src/components/astro/Claude.test.ts` — 6/6 passing.
- `npx vitest run` (full suite) — 115/115 passing, zero regressions.
- `test ! -f src/components/Projects.test.jsx` and `test ! -f src/components/Claude.test.jsx` — confirmed removed.

## Known Stubs

None. Both components are fully data-driven from their unchanged JSON sources; no placeholder/empty-value rendering paths introduced. `rg` scan for stub patterns (`coming soon`, `placeholder`, `TODO`, `FIXME`, `not available`) across both new `.astro` files returned zero matches.

## Threat Flags

None. The only new surface (`{...}` interpolation of `projects.json`/`claude.json` into HTML, and the CTA `<a href>` from `project.liveUrl`/`project.githubUrl`) was already identified and dispositioned `mitigate` in the plan's own threat model (T-23-03-01, T-23-03-02); Astro's default auto-escaping (confirmed via the `set:html` grep-gate above) and the preserved `rel="noopener noreferrer"` satisfy both mitigations. CTA links are currently null in the data, so no live outbound link renders yet.

## Issues Encountered

None beyond the two test-assertion escaping fixes documented above under Deviations, resolved within the same task's RED→GREEN cycle.

## Next Phase Readiness

- All 5 static content components (`About`, `Skill`, `Footer`, `Projects`, `Claude`) now exist in `src/components/astro/`, each with a Container API test achieving full or (for Footer) fresh coverage.
- None of the 5 are yet mounted on `src/pages/en/index.astro` / `src/pages/es/index.astro` — per `23-PATTERNS.md`'s target mounting pattern, this is Plan 23-04's scope (STATIC-01/TEST-01 are NOT marked complete in REQUIREMENTS.md by this plan — mounting is the remaining gate).
- `23-PATTERNS.md`'s target mounting order (About → Skill → Projects → Claude → Footer) is ready to apply directly against the current `en/index.astro`/`es/index.astro` (both still show the `<h1>Carlos Montoya</h1>` placeholder from Phase 21/22).

---
*Phase: 23-static-content-sections*
*Completed: 2026-07-19*

## Self-Check: PASSED

`src/components/astro/Projects.astro`, `src/components/astro/Projects.test.ts`, `src/components/astro/Claude.astro`, `src/components/astro/Claude.test.ts` verified present on disk; `src/components/Projects.test.jsx` and `src/components/Claude.test.jsx` verified absent; both task commits (`2dc9439`, `145142f`) verified present in `git log`; full suite 115/115 GREEN re-confirmed after both commits.
