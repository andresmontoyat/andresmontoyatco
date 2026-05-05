---
phase: 02-shell-hero
plan: 01
subsystem: i18n
tags: [translations, dependencies, cleanup, bilingual]
dependency_graph:
  requires: []
  provides:
    - t.nav.menuOpen / t.nav.menuClose — mobile menu aria-labels consumed by Plan 02-04 Nav.js
    - translations[lang].meta.title / meta.description — consumed by Plan 02-02 LanguageContext useEffect
    - D-04 satisfied — react-scroll and react-router-dom confirmed absent from manifest
  affects:
    - src/i18n/translations.js
tech_stack:
  added: []
  patterns:
    - Additive-only translation key extension (no existing keys removed or renamed)
key_files:
  created: []
  modified:
    - src/i18n/translations.js
decisions:
  - "EN meta.title / meta.description strings mirror index.html exactly — no first-paint churn for English users"
  - "react-scroll and react-router-dom were already removed in Phase 1 Vite migration — D-04 confirmed satisfied by verification"
metrics:
  duration: 91s
  completed: "2026-05-05T22:40:29Z"
  tasks: 2
  files: 1
---

# Phase 2 Plan 1: Translation Keys and Dependency Cleanup Summary

8 new bilingual string values added to translations.js (nav.menuOpen, nav.menuClose × 2 languages + meta.title, meta.description × 2 languages); D-04 dependency cleanup confirmed satisfied from Phase 1.

## What Changed

### Task 1 — Add nav.menuOpen, nav.menuClose, and meta namespace to translations.js

Added 8 new string values across 4 new keys in `src/i18n/translations.js`:

**EN additions:**
- `en.nav.menuOpen: 'Open menu'` — hamburger button aria-label (consumed by Plan 02-04)
- `en.nav.menuClose: 'Close'` — overlay close button aria-label (consumed by Plan 02-04)
- `en.meta.title: 'Carlos Andrés Montoya Tobón · Solutions Architect & Senior Backend Engineer'` — matches index.html exactly
- `en.meta.description: 'Carlos Andrés Montoya Tobón — Solutions Architect and Senior Backend Engineer with 18+ years of experience in Java, Spring, microservices and cloud.'`

**ES additions:**
- `es.nav.menuOpen: 'Abrir menú'` — mobile menu aria-label
- `es.nav.menuClose: 'Cerrar'` — overlay close button aria-label
- `es.meta.title: 'Carlos Andrés Montoya Tobón · Arquitecto de Soluciones e Ingeniero Backend Senior'`
- `es.meta.description: 'Carlos Andrés Montoya Tobón — Arquitecto de Soluciones e Ingeniero Backend Senior con +18 años de experiencia en Java, Spring, microservicios y cloud.'`

All existing keys preserved unchanged. `hero.cta2` left intact for Plan 02-05 to retire surgically.

### Task 2 — Remove unused dependencies (react-scroll, react-router-dom)

Both packages were already absent from `package.json` and `package-lock.json` — removed during Phase 1 Vite migration. No `npm uninstall` needed. Zero src/ imports confirmed. D-04 satisfied.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 — Translation keys | 41a9cf8 | src/i18n/translations.js, src/i18n/LanguageContext.js |
| 2 — Dep cleanup | (no-op — already clean) | — |

## Acceptance Criteria Results

| Criterion | Result |
|-----------|--------|
| `grep -c "menuOpen" src/i18n/translations.js` = 2 | PASS |
| `grep -c "menuClose" src/i18n/translations.js` = 2 | PASS |
| EN menuOpen exact match | PASS |
| ES menuOpen exact match | PASS |
| EN menuClose exact match | PASS |
| ES menuClose exact match | PASS |
| `grep -c "meta: {" src/i18n/translations.js` = 2 | PASS |
| EN Solutions Architect & Senior Backend Engineer | PASS |
| ES Arquitecto de Soluciones e Ingeniero Backend Senior | PASS |
| EN 18+ years of experience in Java | PASS |
| ES +18 años de experiencia en Java | PASS |
| Existing nav keys preserved (about ≥ 2) | PASS |
| cta2 EN preserved | PASS |
| cta2 ES preserved | PASS |
| react-scroll absent from package.json | PASS |
| react-router-dom absent from package.json | PASS |
| react-scroll absent from src/ imports | PASS |
| react-router-dom absent from src/ imports | PASS |
| react-scroll absent from package-lock.json | PASS |
| react-router-dom absent from package-lock.json | PASS |
| npm run build exits 0 | PASS |
| npm run lint exits 0 (0 errors, 6 pre-existing warnings) | PASS |

## Deviations from Plan

### Auto-noted (no fix needed)

**[Observation] react-scroll and react-router-dom already absent**
- **Found during:** Task 2 verification
- **Status:** Pre-existing — Phase 1 Vite migration already removed these packages
- **Action:** Ran verification checks; all passed with zero counts; no npm uninstall needed
- **D-04:** Confirmed satisfied

## Known Stubs

None — this plan contains no UI components, no data rendering, and no placeholder values. All 8 string values are final production copy.

## Self-Check: PASSED
