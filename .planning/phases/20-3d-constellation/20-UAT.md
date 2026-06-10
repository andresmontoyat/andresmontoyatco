---
phase: 20-3d-constellation
status: pending
created: 2026-06-10
source: 20-01-SUMMARY.md, 20-02a-SUMMARY.md, 20-02b-SUMMARY.md, 20-03-SUMMARY.md
---

# Phase 20 — 3D Constellation Manual UAT

## Scope

Manual visual + interaction verification of v3.10 DEPTH-01 across capable-desktop browsers,
prefers-reduced-motion emulation, mobile viewport, and v3.9 carried deferred items
(above-fold layout + SVG ambient twinkle real-device confirm per CONTEXT §deferred).

Closes the milestone HARD gates:
- Lighthouse mobile: Perf ≥95 / A11y 100 / BP 100 / SEO 100.
- Bundle gate: WebGL chunk 3-tier ladder (silent ≤60 / INFO 60-125 / WARN 125-130 / HARD FAIL >130).
- All 4 D-20-* decisions backed by code + tests + UAT verdict.

## Environment

| Surface | Configuration |
|---------|---------------|
| Browser (primary) | Chrome stable on macOS 14+ |
| Browser (secondary) | Safari 17+, Firefox stable |
| Viewport (desktop) | 1440x900 (default), 1920x1080 (widescreen) |
| Viewport (mobile) | 375x667 (iPhone SE), 768x1024 (iPad portrait) |
| Theme | dark default + light via toggle |
| Language | en default + es via toggle |
| Reduced motion | system default + DevTools "Emulate prefers-reduced-motion: reduce" |
| Build | `npm run build` then `npm run preview` (vite preview, production bundle) |

## Test Matrix

### 1. Tilted 3D obvious at frame 0
expected:
- [ ] Load page on capable desktop browser, wait for game-mode renderer slot to mount.
- [ ] Verify perspective foreshortening is visible WITHOUT requiring drag.
- [ ] Pass criterion: take a screenshot at first paint; perspective depth is unambiguous.

result: pending

### 2. Drag-rotate with damping + polar clamp
expected:
- [ ] Mouse-down on canvas; verify cursor flips `grab` → `grabbing`.
- [ ] Drag horizontally; verify constellation rotates around vertical axis with damping inertia.
- [ ] Release mid-drag; verify damping coasts to stop (<1s settle).
- [ ] Drag UP past polar clamp boundary; verify camera halts at clamp angle (no snap-back).
- [ ] Release at any angle within clamp; verify constellation stays at release angle.

result: pending

### 3. Auto-rotate idle spin + permanent pause-on-first-drag (D-20-CONTEXT-AUTOROTATE-RESUME)
expected:
- [ ] On fresh page load, verify auto-rotate begins at ~30s/orbit (CCW around vertical axis).
- [ ] Verify auto-rotate pauses on hover/select.
- [ ] Drag canvas once; verify auto-rotate STOPS PERMANENTLY for the session (no resume).
- [ ] Reload page; verify auto-rotate restarts (new session).

result: pending

### 4. Click selects, drag does not — GAME-04 preserved + D-20-CLICK-DRAG-THRESHOLD
expected:
- [ ] Quick click on a node (no movement, <250ms) → ExperienceCard opens.
- [ ] Click + drag ≥10px → ExperienceCard does NOT open; constellation rotates only.
- [ ] On Chrome DevTools touch emulation, tap a node within 7px movement → ExperienceCard opens (8px touch threshold).
- [ ] On Chrome DevTools touch emulation, swipe 9px+ → no spurious selection.
- [ ] On Surface / touch-iMac / real touchscreen if available, real-touch tap → ExperienceCard opens.

result: pending

### 5. prefers-reduced-motion path preserved (WCAG 2.1 AA + Lighthouse a11y 100)
expected:
- [ ] DevTools → Rendering → Emulate prefers-reduced-motion: reduce → reload page.
- [ ] Verify: SVG path renders, NO WebGL canvas mounts.
- [ ] Verify: NO OnboardingHint pill visible (Plan 20-02b D-20-CONTEXT-HINT).
- [ ] Verify: SVG ambient twinkle (Phase 19) is suppressed under reduced-motion.
- [ ] Run `npm run lighthouse:mobile` → verify accessibility score = 100.

result: pending

### 6. Mobile SVG path UNCHANGED + Lighthouse mobile HARD gate
expected:
- [ ] At 375x667 viewport (iPhone SE), load page → SVG path renders, no WebGL.
- [ ] At 768x1024 viewport (iPad portrait) with touch input, load page → document capability tier verdict.
- [ ] Verify mobile chunk gz size unchanged at ~9.46 kB (Plan 20-03 production build).
- [ ] Run `npm run lighthouse:mobile && npm run lighthouse:check`.
- [ ] HARD gate scores (record below):
  - Performance: ____ (≥0.95 required)
  - Accessibility: ____ (=1.00 required)
  - Best Practices: ____ (=1.00 required)
  - SEO: ____ (=1.00 required)
- [ ] WebGL context-loss handler: in DevTools console run `canvas.getContext('webgl').getExtension('WEBGL_lose_context').loseContext()` (capable desktop only); verify silent SVG swap (per CONTEXT §threat).

result: pending

### 7. Planets-tier visual hierarchy on BOTH renderers (D-20-PLANETS-TIER)
expected:
- [ ] On capable desktop (WebGL path): verify top-K=6 highest-count nodes render with halos + larger radii by default (no selection state required).
- [ ] On mobile / reduced-motion (SVG path): verify the SAME top-K=6 nodes render with halos + larger radii.
- [ ] Confirm `isPlanet` flag is per-node (not shader-side) so the two renderers stay in lockstep.
- [ ] Verify regular "star" nodes (non-planets) keep idle halo=0 until hover/select.

result: pending

### 8. OnboardingHint bilingual pill (D-20-CONTEXT-HINT, Plan 20-02b)
expected:
- [ ] Fresh session (clear `cam-3d-hint-seen` localStorage key): GameMode mounts on capable desktop → bilingual pill appears.
- [ ] Switch language toggle EN ↔ ES → pill copy reflows correctly (uses `t.game.hint.drag` nested key).
- [ ] Drag canvas once → pill dismisses; `cam-3d-hint-seen=true` written.
- [ ] Reload → pill does NOT reappear (gating by localStorage).
- [ ] Under prefers-reduced-motion (SVG fallback) → pill is NEVER shown.

result: pending

## v3.9 Carried Deferred Items (bundled per CONTEXT §deferred)

### v3.9 above-fold real-device confirm
expected:
- [ ] Open production build on real iPhone 14 / Pixel 7: above-the-fold layout reads — SkillFilters fixed at `bottom-0 z-30`, H1 compact, renderer slot fills `flex-1`. Document any layout shift.

result: pending

### v3.9 SVG ambient twinkle real-device confirm
expected:
- [ ] Open production build on real desktop browser without prefers-reduced-motion: ambient twinkle visible on SVG path. Confirm twinkle motion-safe.

result: pending

## Lighthouse Mobile (HARD gate — captured for the milestone close record)

| Score | Value | Threshold | Pass |
|-------|-------|-----------|------|
| Performance      | ____ | ≥0.95 | ____ |
| Accessibility    | ____ | =1.00 | ____ |
| Best Practices   | ____ | =1.00 | ____ |
| SEO              | ____ | =1.00 | ____ |
| Target-size audit | ____ | =1   | ____ |

Run `npm run lighthouse:mobile && npm run lighthouse:check` and paste verdict here.

## Bundle Gate Verification (Plan 20-03 3-tier ladder)

expected:
- [ ] `node scripts/check-bundle-gate.mjs` exits 0 against the v3.10 production build.
- [ ] Mobile chunk (`GameMode-*.js`) does NOT contain any `three/...` import string (Plan 20-01 regex defense holds).
- [ ] WebGL chunk reported with size: which tier? (≤60 silent / 60-125 INFO baseline / 125-130 WARN / >130 HARD FAIL).
- [ ] Regression fixture test (`src/scripts/check-bundle-gate.test.mjs`) confirms `three/addons/*` import string still triggers HARD-FAIL semantics.
- [ ] Confirm `WEBGL_SOFT_CEIL_KB = 125` present in scripts/check-bundle-gate.mjs.
- [ ] Confirm `WEBGL_WARN_KB = 130` present in scripts/check-bundle-gate.mjs.
- [ ] Run `rg "WEBGL_SOFT_CEIL_KB = 125" scripts/check-bundle-gate.mjs` → 1 hit.
- [ ] Run `rg "WEBGL_WARN_KB = 130" scripts/check-bundle-gate.mjs` → 1 hit.
- [ ] Synthetic HARD FAIL test (locally only, NOT committed): temporarily set `WEBGL_HARD_KB = 10` and re-run gate → exit non-zero. Revert immediately. Validates the HARD FAIL exit-non-zero path.

result: pending

## Pass Criteria

UAT 8/8 PASS + Lighthouse mobile HARD gate intact + bundle-gate exit 0 + v3.9 carried debt resolved (or operator-pending documented) required for milestone v3.10 close. Any FAIL routes to follow-up plan (v3.10.1 micro-milestone or Phase 20 Plan 04).

## Summary

total: 8 (test matrix) + 2 (v3.9 carried) + 1 (Lighthouse mobile) + 1 (bundle gate) = 12 verification rows
passed: 0
issues: 0
pending: 12
skipped: 0
blocked: 0

## Notes / Findings

<!-- Operator fills in during sweep:
- Date + browser + macOS versions.
- Per-item PASS/FAIL + brief observation.
- Lighthouse scores: Perf X / A11y X / BP X / SEO X.
- Bundle chunk sizes (mobile, WebGL) + tier classification.
- Final test count.
- Any FAIL items + remediation path (v3.10.1 / new plan / open issue).
- v3.9 above-fold + twinkle status (PASS / operator-pending).
-->

## Gaps

<!-- APPENDED as user reports issues -->
