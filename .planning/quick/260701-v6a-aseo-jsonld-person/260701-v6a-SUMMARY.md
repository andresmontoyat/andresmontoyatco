---
phase: quick-260701-v6a-aseo-jsonld-person
plan: 01
subsystem: seo
tags: [seo, jsonld, structured-data, schema-org]
requires: []
provides: ["schema.org Person JSON-LD in index.html", "JSON-LD regression test"]
affects: [index.html]
tech-stack:
  added: []
  patterns: ["static crawler-readable structured data (mirrors OG/meta fallback)"]
key-files:
  created:
    - src/seo/jsonld.test.js
  modified:
    - index.html
decisions:
  - "Single JSON object (not array) for the Person block, pretty-printed with 2-space indent"
  - "Placed after <title>, before Critical CSS/GA — inside <head>, static, no JS injection"
metrics:
  duration: ~4m
  completed: 2026-07-01
requirements: [ASEO-01]
---

# Phase quick-260701-v6a Plan 01: schema.org Person JSON-LD Summary

Added a static, crawler-readable schema.org Person JSON-LD block to `index.html` `<head>` plus a vitest regression test that validates its presence, JSON validity, and canonical typing.

## What Was Built

- **Task 1 — index.html:** Inserted one `<script type="application/ld+json">` Person block after the `<title>` and before the Critical CSS `<style>`/Google Analytics scripts. Populated with canonical fields from the plan's `<interfaces>`: name, jobTitle, url, image, email, telephone, PostalAddress (Medellín/CO), sameAs (github + linkedin), knowsAbout array, and the verbatim meta description. No JS injection or build-time generator — pure static markup with literal UTF-8 accents.
  - Commit: `3480bda`
- **Task 2 — src/seo/jsonld.test.js:** Vitest test reading `index.html` from `process.cwd()` via `fs.readFileSync`, extracting the ld+json content with regex and `JSON.parse`. Seven focused assertions (block exists, valid JSON, @context, @type Person, name, sameAs github+linkedin, PostalAddress CO).
  - Commit: `958e3a7`

## Verification

- `npx vitest run src/seo/jsonld.test.js` → 7 passed.
- `npx vitest run` (full suite) → **63 passed (10 files)** — 56 pre-existing + 7 new, all GREEN.
- Task 1 node inline verifier → `ok`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: index.html (ld+json Person block, commit 3480bda)
- FOUND: src/seo/jsonld.test.js (commit 958e3a7)
- FOUND commit: 3480bda
- FOUND commit: 958e3a7
