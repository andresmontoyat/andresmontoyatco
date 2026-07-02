---
phase: 260625-etd
plan: 01
subsystem: claude-section
tags: [ui, data, bilingual, ai-capabilities]
dependency_graph:
  requires: []
  provides: [AI-capabilities block in Claude section]
  affects: [src/data/claude.json, src/components/Claude.js, src/components/Claude.test.js]
tech_stack:
  added: []
  patterns: [CapabilityCard component, bilingual {en,es} JSON shape]
key_files:
  modified:
    - src/data/claude.json
    - src/components/Claude.js
    - src/components/Claude.test.js
decisions:
  - Placed aiLabel immediately after ctaSecondary and before servicesLabel for logical grouping with other section labels
  - CapabilityCard placed directly after ValueCard definition for proximity to its sibling card pattern
metrics:
  duration: ~5m
  completed: 2026-06-25
---

# Phase 260625-etd Plan 01: Claude Section — Replace Track Record with AI Capabilities

**One-liner:** Swapped self-referential toolkit counters for a 4-card AI-engineering capabilities block (agentic, RAG, evals, delivery) using the existing pick()/ValueCard patterns.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update claude.json data | e94a377 | src/data/claude.json |
| 2 | Swap ProofBlock for AI-capabilities block | e94a377 | src/components/Claude.js |
| 3 | Update Claude.test.js assertions | e94a377 | src/components/Claude.test.js |

## What Changed

**claude.json:** Removed `proofLabel`, `proofHeading`, and `counters` (7-item array). Added `aiLabel: {en,es}` and `aiCapabilities` array with 4 bilingual `{id, title:{en,es}, desc:{en,es}}` objects in order: agentic → rag → evals → delivery.

**Claude.js:** Deleted `ProofBlock` function component entirely. Added `CapabilityCard({ capability, lang })` after `ValueCard` using the same container className. Replaced `<ProofBlock lang={lang} />` render call with a label `<p>` (matching servicesLabel className) + a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` mapping `data.aiCapabilities` to `CapabilityCard`. Section order preserved: PitchHero → values → AI capabilities → services → apps → StackStrip.

**Claude.test.js:** Replaced "renders proof block with 7 counters" with "renders all 4 AI capability cards (EN)". Renamed ES translation test and swapped `subagents propios` counter assertion for `Flujos agénticos` capability assertion. Replaced `for (const c of data.counters)` loop in schema sanity test with `for (const cap of data.aiCapabilities)` loop checking bilingual string shape.

## Verification

`npx vitest run` — 57/57 tests passed (9 test files).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — purely client-side static data change, no new network endpoints or auth paths.

## Self-Check: PASSED

- src/data/claude.json: present, proofLabel/proofHeading/counters absent, aiCapabilities[4] present
- src/components/Claude.js: CapabilityCard defined, data.aiCapabilities mapped, ProofBlock absent
- src/components/Claude.test.js: aiCapabilities assertions present, counters/proof assertions absent
- Commit e94a377: confirmed in git log
- vitest: 57 passed (9 files)
