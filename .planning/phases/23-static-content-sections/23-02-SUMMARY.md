---
phase: 23-static-content-sections
plan: 02
subsystem: frontend
tags: [astro, container-api, i18n, testing, skill, footer]

# Dependency graph
requires: ["23-01"]
provides:
  - "src/components/astro/Skill.astro — zero-client-JS bilingual Skill section, build-time render from skills.json (STATIC-01)"
  - "src/components/astro/Skill.test.ts — Astro Container API parity test, ports all 9 it-blocks from Skill.test.jsx"
  - "src/components/astro/Footer.astro — zero-client-JS Footer, build-time render from translations[locale].footer + verbatim social array + build-time year"
  - "src/components/astro/Footer.test.ts — fresh Astro Container API test (no RTL baseline existed)"
affects: ["23-03/23-04 (remaining static components — Projects, Claude — same Container API pattern)", "later plan mounting all 5 astro components on the page tree"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React sub-components with no reusable logic beyond markup (MeterRow, Category) inlined directly into the Astro template's .map() blocks instead of extracted as separate .astro partials — Astro components cannot be invoked as plain JS functions the way React sub-components were"
    - "Astro auto-escapes text content as HTML entities (& becomes &amp;, apostrophe becomes &#39;) in Container API renderToString() output — test assertions written against the raw escaped string must match this, not the pre-escape source string"
    - "Footer has no dedicated JSON data file — sources copy directly from translations[locale].footer using BaseLayout.astro's established resolution idiom (translations[locale]?.footer), diverging from the JSON-per-section pattern used by About/Skill"

key-files:
  created: [src/components/astro/Skill.astro, src/components/astro/Skill.test.ts, src/components/astro/Footer.astro, src/components/astro/Footer.test.ts]
  modified: []
  deleted: [src/components/Skill.test.jsx]

key-decisions:
  - "D-01 honored: Skill.astro imports skills.json directly with the same {en,es} field shape and the same pick(field, lang) resolver — zero data-shape changes."
  - "D-02 honored: Footer.astro reads translations[locale].footer for rights+tagline and copies the hardcoded social array (GitHub, LinkedIn) verbatim from Footer.jsx — no dedicated JSON file, no pick() resolver needed since footer strings are already flat per-locale."
  - "D-03 honored: Footer.astro reads new Date().getFullYear() in frontmatter (build-time) instead of at React runtime — same logic, different execution timing."
  - "Test assertions authored against Astro's actual auto-escaped HTML output (&amp;, &#39;) rather than the pre-escape JS string literal, confirmed empirically via a first failing test run before finalizing assertions."

requirements-completed: [STATIC-01, TEST-01]

# Metrics
duration: ~20min
completed: 2026-07-19
---

# Phase 23 Plan 2: Skill.astro + Footer.astro ports Summary

**Skill.jsx and Footer.jsx ported to zero-client-JS Astro components — Skill consumes skills.json unchanged with parity Container API tests; Footer sources copy from translations[locale].footer plus a verbatim hardcoded social array and a build-time copyright year read, with fresh Container API assertions (no prior RTL baseline existed).**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files created:** 4 (Skill.astro, Skill.test.ts, Footer.astro, Footer.test.ts)
- **Files deleted:** 1 (Skill.test.jsx)

## Accomplishments

- `src/components/astro/Skill.astro` — imports `src/data/skills.json` unchanged, ports `pick(field, lang)` and `maxYears()` verbatim. The React `MeterRow`/`Category` sub-components (which had no logic beyond markup composition) are inlined directly into the template's `.map()` blocks rather than ported to separate `.astro` partials — Astro components cannot be called as plain JS functions the way React function components were. Preserves `data-core="true"/"false"` on every chip tile and the `style="width: N%"` inline meter fill byte-for-byte.
- `src/components/astro/Skill.test.ts` — Container API test, `// @vitest-environment node` as literal line 1, ports all 9 `it` blocks from the former `Skill.test.jsx` (section id, EN label/heading/intro, EN category titles, all 30 chip labels, Kotlin 8-years/core assertion, 6 `data-core="true"` tiles, ES translation, year-suffix regex, `skills.json` schema sanity). One assertion required using the HTML-entity-escaped form (`Cloud &amp; Infrastructure` instead of `Cloud & Infrastructure`) since Astro's `renderToString()` auto-escapes text content — confirmed by running the test and observing the actual escaped output before finalizing the assertion.
- `src/components/Skill.test.jsx` removed — no stale duplicate test file left behind.
- `src/components/astro/Footer.astro` — imports `translations.js`, resolves `footerCopy = translations[locale]?.footer` (BaseLayout's established idiom), copies the `social` array (GitHub, LinkedIn) verbatim as a frontmatter const, reads `year = new Date().getFullYear()` at build time. No `pick()` resolver needed — footer strings are already flat per-locale (unlike About/Skill's `{en,es}` field objects). Preserves `target="_blank" rel="noreferrer" aria-label={s.name}` on each social anchor.
- `src/components/astro/Footer.test.ts` — 5 fresh Container API assertions authored directly from `Footer.jsx` source (footer landmark + brand link, both social hrefs/aria-labels/visible labels, EN tagline+rights, ES tagline+rights, current year in copyright line). The EN tagline assertion needed the HTML-entity-escaped apostrophe form (`Let&#39;s`) to match Astro's auto-escaped output.
- `npm run build` produces a clean build (4 pages: `en/index.html`, `es/index.html`, `404.html`, `index.html`) — neither component is mounted on a page yet (out of scope for this plan; mounting happens once all 5 static components exist, per 23-PATTERNS.md's target mounting pattern).
- Full test suite: **115/115 GREEN** (110 baseline − 9 removed `Skill.test.jsx` specs + 9 new `Skill.test.ts` specs + 5 new `Footer.test.ts` specs — net +5, zero regressions).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Skill.astro and Skill.test.ts (Container API parity), remove old RTL test** - `ff357bb` (feat)
2. **Task 2: Create Footer.astro and Footer.test.ts (fresh assertions)** - `f177bb7` (feat)

## Files Created/Modified/Deleted

- `src/components/astro/Skill.astro` - new: zero-client-JS bilingual Skill section
- `src/components/astro/Skill.test.ts` - new: Container API parity test (9 assertions)
- `src/components/Skill.test.jsx` - deleted: superseded by Skill.test.ts
- `src/components/astro/Footer.astro` - new: zero-client-JS Footer (translations + social array + build-time year)
- `src/components/astro/Footer.test.ts` - new: fresh Container API test (5 assertions)

## Decisions Made

- **D-01 (Skill data shape unchanged):** `skills.json` imported directly, `pick()` ported verbatim — zero data-contract changes.
- **D-02 (Footer has no JSON file):** Footer sources copy from `translations[locale].footer` and copies the `social` array verbatim as a frontmatter const — deliberately does not follow the JSON-per-section pattern used by About/Skill, per the plan's explicit interface spec.
- **D-03 (build-time year):** `new Date().getFullYear()` moved from React render-time to Astro frontmatter (build-time) — same logic, computed once at build instead of on every client render.
- **Sub-component inlining:** `MeterRow`/`Category` inlined into `.map()` blocks rather than extracted as separate `.astro` files, matching the plan's explicit guidance that Astro components cannot be invoked as plain JS functions.

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched their `<action>` and `<acceptance_criteria>` blocks. The only adjustment was empirical: two test assertions needed HTML-entity-escaped strings (`&amp;`, `&#39;`) instead of the raw characters to match Astro's `renderToString()` auto-escaping behavior — this is a correct-by-construction detail of porting to the Container API, not a plan deviation, and was caught by running the test suite before finalizing (RED before GREEN).

## Verification Results

- `npm run build` — clean build, 4 pages emitted, no errors.
- `rg -c "useState|useEffect|client:|set:html" src/components/astro/Skill.astro` — 0 hits.
- `rg -c "useState|useEffect|client:|useLanguage|set:html" src/components/astro/Footer.astro` — 0 hits.
- `rg -c "getFullYear" src/components/astro/Footer.astro` — 1 hit (build-time year read present, D-03).
- `npx vitest run src/components/astro/Skill.test.ts` — 9/9 passing.
- `npx vitest run src/components/astro/Footer.test.ts` — 5/5 passing.
- `npx vitest run` (full suite) — 115/115 passing, zero regressions.
- `test ! -f src/components/Skill.test.jsx` — confirmed removed.
- Both test files' line 1 confirmed as exactly `// @vitest-environment node`.

## Known Stubs

None. Both components are fully data-driven from unchanged data sources (`skills.json` for Skill, `translations.js` for Footer); no placeholder/empty-value rendering paths introduced.

## Threat Flags

None. Both new interpolation surfaces (`skills.json` into Skill.astro, `translations.js` + hardcoded social array into Footer.astro) were already identified and dispositioned `mitigate` in the plan's own threat model (T-23-02-01 XSS via auto-escaping, T-23-02-02 reverse-tabnabbing via `rel="noreferrer"`), both confirmed present in the shipped code.

## Issues Encountered

None.

## Next Phase Readiness

- Skill and Footer join About in `src/components/astro/` — 3 of 5 target static components complete (Projects and Claude remain, per ROADMAP.md phase scope note if applicable, or a later plan within this phase).
- The Container API test pattern has now been exercised across three different content shapes: paragraph/list content (About), nested/computed chip-meter content (Skill), and no-JSON flat-translation content (Footer) — all three confirm the pattern generalizes cleanly.
- Neither Skill.astro nor Footer.astro is yet mounted on `src/pages/en/index.astro` / `es/index.astro` — mounting is expected once all static components in this phase exist.

---
*Phase: 23-static-content-sections*
*Completed: 2026-07-19*

## Self-Check: PASSED

`src/components/astro/Skill.astro`, `src/components/astro/Skill.test.ts`, `src/components/astro/Footer.astro`, `src/components/astro/Footer.test.ts` verified present on disk; `src/components/Skill.test.jsx` verified absent; both task commits (`ff357bb`, `f177bb7`) verified present in `git log`; full suite 115/115 GREEN re-confirmed after both commits.
