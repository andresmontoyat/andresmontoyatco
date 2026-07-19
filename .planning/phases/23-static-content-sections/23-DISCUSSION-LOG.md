# Phase 23: Static content sections - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 23-static-content-sections
**Mode:** `--auto` — all decisions auto-selected (recommended default), single pass, no interactive questions.

---

## Auto-resolved decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D-01 | About/Skill/Projects/Claude import their `data/*.json` directly | Zero data-shape changes, existing pattern |
| D-02 | Footer copy from `translations.js` `t.footer`, `social` array ported verbatim | No dedicated Footer JSON exists today |
| D-03 | `new Date().getFullYear()` becomes build-time in `.astro` frontmatter | Sufficient freshness for a static rebuild-on-deploy site |
| D-04 | About's `useCountUp` dropped this phase, static final numbers rendered | ROADMAP Phase 24 explicitly owns consolidating Hero+About count-up into one shared vanilla script — avoids preempting/duplicating that work |
| D-05 | 5 components replace the placeholder `<h1>` in `en/es index.astro`, in `App.jsx`'s existing order (minus not-yet-migrated Hero/Experience/Contact/SectionPager) | Verified against actual current file content — no old React tree exists on these pages to preserve |
| D-06 | Astro Container API test per component, `@vitest-environment node` override | Mirrors Phase 21's `404.test.ts` pattern exactly |
| D-07 | Spot-check coverage parity on About (most content variety) before trusting pattern for the other 4 | Container API still experimental per Phase 21 research flag |

## Claude's Discretion

- Internal `.astro` component structuring
- Old `.test.jsx` → new `.test.ts` file coexistence/removal timing

## Deferred Ideas

- About's count-up animation → Phase 24 (not lost, explicitly tracked)
