---
phase: quick-260625-dvq
plan: 01
subsystem: claude-section
tags: [vis-05, claude-json, featured-apps, bilingual, vitest]
requirements: [VIS-05]
dependency_graph:
  requires: []
  provides: [5-app-claude-section]
  affects: [src/data/claude.json, src/components/Claude.test.js]
tech_stack:
  added: []
  patterns: [json-driven-bilingual, pick-helper]
key_files:
  modified:
    - src/data/claude.json
    - src/components/Claude.test.js
decisions:
  - "Appended caveman + claude-kanban at end of apps[] to preserve existing card order"
  - "Matched existing object shape exactly: id, name{en,es}, tag{en,es}, desc{en,es}, stack[]"
  - "Claude.js not touched — generic data.apps.map already handles N cards"
metrics:
  duration: "< 5 min"
  completed: 2026-06-25
  tasks_completed: 3
  tasks_total: 3
  files_modified: 2
---

# Phase quick-260625-dvq Plan 01: Add caveman + claude-kanban to Claude section (VIS-05) Summary

## One-liner

Appended caveman (terse-output skill) and claude-kanban (visual kanban plugin) to claude.json apps[], expanding the Claude section from 3 to 5 featured-app cards with full bilingual EN/ES content.

## What Was Built

- `src/data/claude.json` — 2 new entries appended to `apps[]` (was 3, now 5): `caveman` and `claude-kanban`, each with bilingual `name`/`tag`/`desc` and a `stack[]` array. Plain text only, 2-space indent, no trailing comma.
- `src/components/Claude.test.js` — Bumped `it(...)` description "3 featured apps" to "5 featured apps" and `toHaveLength(3)` to `toHaveLength(5)`. No other assertions touched.

## Commits

| Hash | Message | Files |
|------|---------|-------|
| fddca76 | feat(quick-260625-dvq): add caveman + claude-kanban to Claude section apps (VIS-05) | src/data/claude.json, src/components/Claude.test.js |

## Vitest Result

57/57 tests GREEN (9 test files). Claude.test.js 8/8 passing, including updated 5-app count assertion and bilingual ES rendering.

## Deviations from Plan

None — plan executed exactly as written. Claude.js verified untouched (generic data.apps.map handles N cards).

## Known Stubs

None. Both new entries have complete bilingual content wired directly to the existing pick() renderer.

## Self-Check: PASSED

- src/data/claude.json: apps[] has 5 entries, caveman + claude-kanban present, all shapes valid (node -e parse check OK)
- src/components/Claude.test.js: toHaveLength(5) present, no toHaveLength(3) or "3 featured" remains
- Commit fddca76 exists on worktree-agent-a27561a5f817efa0b
- 57/57 vitest GREEN
