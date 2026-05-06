---
phase: 03-content-animations
plan: 01
subsystem: ui
tags: [translations, i18n, experience, skills, categories, tech-chips]

requires:
  - phase: 02-shell-hero
    provides: LanguageContext, translations.js shape, EXPERIENCE data shape

provides:
  - t.skills.categories (4 category groups with chips+years) replacing t.skills.cards
  - t.exp.expand / t.exp.collapse keys in EN and ES
  - tech:[] field on all 12 EXPERIENCE entries (language-neutral strings)

affects:
  - 03-03 (Skill section — consumes t.skills.categories)
  - 03-04 (Experience section — consumes t.exp.expand/collapse and job.tech)
  - 03-06 (any plan reading translations or experience data)

tech-stack:
  added: []
  patterns:
    - "language-neutral arrays: tech[] and categories[] are identical in EN/ES blocks — avoids dual-maintenance of tech industry terms"
    - "chip shape: { label, years } per UI-SPEC D-04 — years badge drives visual weight without extra data source"

key-files:
  created: []
  modified:
    - src/i18n/translations.js
    - src/data/experience.js

key-decisions:
  - "t.skills.categories is identical between EN and ES blocks — tech industry terms are language-neutral per D-02"
  - "t.exp.expand/collapse replaces t.exp.more/less — per-card aria-label semantics match new chevron toggle (D-05)"
  - "tech:[] placed after bullets: block, before optional featured: flag — consistent ordering for all 12 entries"

patterns-established:
  - "categories shape: { symbol, title, chips: [{ label, years }] } — consumed by Skill component (03-03)"
  - "tech shape: string[] — consumed by Experience component (03-04) via job.tech.map()"

requirements-completed: [CONT-02, CONT-04, CONT-05]

duration: 2min
completed: 2026-05-05
---

# Phase 3 Plan 01: Data Layer Content Summary

**t.skills.categories (4 groups, 29 chips with year-badges) and tech:[] on all 12 EXPERIENCE entries — stable contracts for Plans 03-03 and 03-04**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-05T04:03:40Z
- **Completed:** 2026-05-05T04:05:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced 7-emoji t.skills.cards array with 4-category t.skills.categories structure (Backend / Cloud & Infrastructure / DevOps & Tools / AI & Productivity), each category carrying a symbol, title, and chips with year badges
- Added t.exp.expand / t.exp.collapse in EN and ES, removing obsolete t.exp.more / t.exp.less keys
- Added language-neutral tech:[] field to all 12 EXPERIENCE entries matching UI-SPEC-approved label sets derived from bullet text and CV

## Task Commits

1. **Task 1: Restructure t.skills (replace cards → categories) + add t.exp.expand/collapse + remove obsolete keys** — `0c6e664` (feat)
2. **Task 2: Add tech:[] array to all 12 entries in EXPERIENCE** — `3bc791b` (feat)

## Files Created/Modified

- `src/i18n/translations.js` — Removed t.skills.cards (7 cards) and t.exp.more/less; added t.skills.categories (4 categories, 29 chips, { label, years } shape) and t.exp.expand/collapse in both EN and ES blocks
- `src/data/experience.js` — Added tech:[] to each of the 12 EXPERIENCE entries; all existing fields (date, title, company, location, bullets, featured) preserved byte-for-byte

## Decisions Made

- Categories identical between EN/ES — tech industry terms are language-neutral (D-02); no translation needed and avoids dual-maintenance
- expand/collapse replaces more/less — per-card semantics for the new chevron toggle (D-05); old global "Show more experience" pattern removed
- tech:[] placement after bullets: block — consistent position before optional featured: flag across all 12 entries

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plans 03-03 (Skills) and 03-04 (Experience) can now import t.skills.categories and t.exp.expand/collapse without touching translations.js again
- Plan 03-04 can iterate job.tech.map(...) with no null checks — all 12 entries guaranteed to have tech:[]
- No blockers for remaining Phase 3 plans

---
*Phase: 03-content-animations*
*Completed: 2026-05-05*
