---
status: passed
phase: 20-3d-constellation
source: [20-VERIFICATION.md, 20-UAT.md]
started: 2026-06-10T18:35:00.000Z
updated: 2026-06-10T18:40:00.000Z
approved_by: operator
approved_at: 2026-06-10T18:40:00.000Z
---

## Current Test

[approved — all 12 items signed off]

## Tests

> **Single source of truth:** `.planning/phases/20-3d-constellation/20-UAT.md` (8-item test matrix + Lighthouse mobile row + v3.9 carried deferred section). This file is a discovery shim for `/gsd:progress` and `/gsd:audit-uat`.

### 1. Genuine 3D perspective foreshortening read (SC #1)
expected: Recruiter on capable desktop sees front nodes larger than back nodes; visibly different from prior flat 2D-in-3D ortho aesthetic.
result: PASS — operator approved 2026-06-10

### 2. OrbitControls drag feel (SC #2)
expected: Drag-rotates with `dampingFactor=0.06` smoothness, polar-angle clamp holds at extremes, cursor flips grab→grabbing, no snap-back on release.
result: PASS — operator approved 2026-06-10

### 3. Auto-rotate cadence + permanent pause (SC #3)
expected: ~30 s/orbit idle spin telegraphs interactivity on first paint; pauses on first drag PERMANENTLY (no resume on hover-out).
result: PASS — operator approved 2026-06-10

### 4. Click-vs-drag on mouse + touch (SC #4)
expected: Click within 5px+250ms (mouse) or 8px+250ms (touch) opens ExperienceCard; drag past threshold suppresses click.
result: PASS — operator approved 2026-06-10

### 5. prefers-reduced-motion → SVG fallback (SC #5)
expected: RM users see static SVG constellation, no WebGL mount, no OnboardingHint pill; Lighthouse a11y = 100.
result: PASS — operator approved 2026-06-10

### 6. Lighthouse mobile HARD gate (SC #6 — MILESTONE BLOCKER)
expected: `npm run lighthouse:mobile && npm run lighthouse:check` exits 0; Perf ≥95, A11y 100, BP 100, SEO 100.
result: PASS — operator approved 2026-06-10

### 7. Mobile SVG path UNCHANGED (SC #6)
expected: Mobile viewport renders SVG identical to v3.9; mobile chunk 9.46 kB gz (under 38.82 HARD ceiling); no three.js leak.
result: PASS — operator approved 2026-06-10

### 8. WebGL context-loss → silent SVG swap
expected: Forcing context loss (DevTools or alt-tab thrash) swaps to SVG without error overlay; `forceSvgFallback` flips `effectiveCapability`.
result: PASS — operator approved 2026-06-10

### 9. Planets-tier visual hierarchy (D-20-PLANETS-TIER)
expected: Top-K=6 skills render as larger orbs with always-on halo in BOTH WebGL and SVG renderers; deterministic tiebreak by id ascending.
result: PASS — operator approved 2026-06-10

### 10. OnboardingHint bilingual pill (D-20-CONTEXT-HINT)
expected: Pill appears 800ms after first GameMode mount, fades after 5s, dismissable by click, EN/ES toggle works, suppressed on second visit (localStorage `cam-3d-hint-seen`).
result: PASS — operator approved 2026-06-10

### 11. v3.9 carried debt — above-fold layout real-device confirm
expected: iPhone 14 / Pixel 7 above-fold layout intact at v3.9 baseline.
result: PASS — operator approved 2026-06-10

### 12. v3.9 carried debt — SVG ambient twinkle real-device confirm
expected: Twinkle animation visible on real device at expected cadence.
result: PASS — operator approved 2026-06-10

## Summary

total: 12
passed: 12
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
