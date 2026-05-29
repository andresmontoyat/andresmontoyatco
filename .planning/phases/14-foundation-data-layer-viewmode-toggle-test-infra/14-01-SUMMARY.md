---
phase: 14-foundation-data-layer-viewmode-toggle-test-infra
plan: "01"
subsystem: game-mode-data
tags: [vitest, rtl, skill-graph, constellation, tdd, game-mode]
dependency_graph:
  requires: []
  provides:
    - "Vitest 2.1.9 + RTL test runner (jsdom, globals, setupFiles inside vite.config.js)"
    - "SKILL_CATEGORIES (8 categories + colors) + SKILLS canonical catalog + resolveCanonical()"
    - "numeric period on all 12 EXPERIENCE entries (start/end years)"
    - "buildConstellationGraph(experience, skills) — pure nodes + weighted edges"
    - "computeLayout(nodes) — deterministic radial category-clustered positions"
  affects:
    - src/data/experience.js
    - vite.config.js
    - package.json
tech_stack:
  added:
    - "vitest@2.1.9"
    - "@testing-library/react@16.3.0"
    - "@testing-library/jest-dom@6.6.3"
    - "@testing-library/user-event@14.6.1"
    - "jsdom@25.0.1"
    - "@vitest/coverage-v8@2.1.9"
  patterns:
    - "TDD: RED commit (tests) → GREEN commit (implementation)"
    - "Pure data modules in src/data/ and src/game/ — zero React/DOM imports"
    - "Vitest test block colocated inside vite.config.js (preserves .js-as-JSX esbuild loader)"
    - "Deterministic radial layout: no d3-force, no RNG — category centroids on ring, nodes on sub-rings"
key_files:
  created:
    - src/test/setup.js
    - src/test/setup.test.js
    - src/data/skills.js
    - src/data/skills.test.js
    - src/game/constellation.graph.js
    - src/game/constellation.graph.test.js
    - src/game/constellation.layout.js
    - src/game/constellation.layout.test.js
  modified:
    - package.json
    - vite.config.js
    - src/data/experience.js
decisions:
  - "Vitest pinned to 2.1.9 (latest stable 2.x — 2.2.x is pre-release only as of 2026-05-29)"
  - "Vitest test block inside vite.config.js (NOT separate vitest.config) to preserve esbuild.loader:jsx for .js test files"
  - "resolveCanonical() exported separately from SKILLS for testability; reverse alias map built at module init"
  - "CURRENT_YEAR=2026 constant in constellation.graph.js (no new Date()) — keeps graph output deterministic"
  - "Radial layout chosen over d3-force: zero new dependencies, trivially deterministic, satisfies clustering test"
metrics:
  duration: "6 minutes"
  completed_date: "2026-05-29"
  tasks_completed: 3
  tasks_total: 3
  files_created: 8
  files_modified: 3
---

# Phase 14 Plan 01: Data Layer + Test Infrastructure Summary

**One-liner:** Vitest 2.1.9 + RTL scaffolded inside vite.config.js; 8-category skill catalog with GCP→Google Cloud alias normalization; 12 experience entries extended with numeric periods; pure skill graph (nodes/edges) + deterministic radial layout — 36 tests, 100% graph coverage.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Scaffold Vitest + RTL test infrastructure | `9f5566d` | package.json, vite.config.js, src/test/setup.js, src/test/setup.test.js |
| 2 | Skill catalog + numeric experience periods | `9ccbc77` | src/data/skills.js, src/data/skills.test.js, src/data/experience.js |
| 3 | Pure skill-graph derivation + deterministic baked layout | `7d71af3` | src/game/constellation.graph.js, src/game/constellation.layout.js, tests |

## Test Results

```
Test Files  4 passed (4)
     Tests  36 passed (36)
```

Coverage on game modules:
- `constellation.graph.js`: 100% statements, 100% functions, 100% lines
- `constellation.layout.js`: 97.82% statements, 100% functions, 97.82% lines
- `experience.js` (data): 100% (period field exercised by test suite)

## Deviations from Plan

**1. [Rule 1 - Bug] Vitest 2.2.5 not published; pinned to 2.1.9**
- **Found during:** Task 1 npm install
- **Issue:** `@vitest/coverage-v8@2.2.5` returned ETARGET (no such version); the plan specified 2.2.5
- **Fix:** Pinned all Vitest packages to `2.1.9` — the latest stable 2.x as of 2026-05-29
- **Impact:** None; 2.1.9 fully satisfies all Vite 6 + React 18 compatibility requirements

None of the other plan tasks required deviations — executed exactly as written.

## Verification

- `npm run test:run` exits 0, 36 tests green under jsdom
- `npm run build` exits 0 (Vitest block does not break production build)
- `rg -c "period:" src/data/experience.js` → 12
- `rg -n "loader: 'jsx'" vite.config.js` → line 21 (esbuild block intact)
- `fd vitest.config` → no results (no separate vitest.config created)
- `rg "from 'react'|document\.|window\." src/game/constellation.graph.js src/game/constellation.layout.js` → no matches

## Known Stubs

None — all plan artifacts are fully implemented pure data/logic modules. No rendering in this plan.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. All outputs are pure JS data modules.

## Self-Check: PASSED

Files exist:
- src/test/setup.js: FOUND
- src/test/setup.test.js: FOUND
- src/data/skills.js: FOUND
- src/data/skills.test.js: FOUND
- src/game/constellation.graph.js: FOUND
- src/game/constellation.layout.js: FOUND
- src/game/constellation.graph.test.js: FOUND
- src/game/constellation.layout.test.js: FOUND

Commits exist:
- 9f5566d (chore: scaffold Vitest): FOUND
- 9ccbc77 (feat: skill catalog + periods): FOUND
- 7d71af3 (feat: constellation graph + layout): FOUND

Note for Plan 14-02: The Vitest config (jsdom + setupFiles) is now in vite.config.js — the ViewMode toggle component test reuses it, no re-scaffolding needed.
