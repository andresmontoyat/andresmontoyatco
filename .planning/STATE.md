---
gsd_state_version: 1.0
milestone: v3.10
milestone_name: 3D Constellation
status: executing
stopped_at: Plan 20-02a Task 1 complete (renderer + GameMode shipped); Task 2 human visual checkpoint pending
last_updated: "2026-06-10T15:15:00.000Z"
last_activity: 2026-06-10 -- Plan 20-02a Task 1 GREEN, 271/271 tests, mobile 9.01 kB gz / WebGL 122.33 kB gz
progress:
  total_phases: 15
  completed_phases: 0
  total_plans: 9
  completed_plans: 6
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-08 — v3.9 SHIPPED, v3.10 OPENED)

**Core value:** The hero section and overall first impression must stop recruiters mid-scroll and make them want to learn more about Carlos — and convert visits into engineering conversations.
**Current focus:** Phase 20 — 3d-constellation
**Last shipped:** v3.9 Game Mode Polish (2026-06-08) — above-the-fold layout + SVG ambient twinkle; 261/261 tests GREEN; tag v3.9 on 4e9c2b3

## Current Position

Phase: 20 (3d-constellation) — EXECUTING
Plan: 3 of 4 (Plan 20-02b OnboardingHint + i18n — next up)
Status: Plan 20-02a Task 1 COMPLETE — renderer + GameMode shipped; Task 2 (human visual checkpoint) pending real-GPU operator
Last activity: 2026-06-10 -- Plan 20-02a Task 1 closed (271/271 tests, mobile 9.01 kB gz PASS, WebGL 122.33 kB gz WARN)
Progress bar: `[██████░░░░] 2/3 plans`

## v3.10 Milestone Scope

1 REQ — single-phase milestone activating SEED-3D-CONSTELLATION (planted 2026-06-08 during v3.9 Phase 18 between Phase 18 GREEN and Phase 19 discuss).

- **DEPTH-01** — Genuine 3D constellation on WebGL desktop renderer: `PerspectiveCamera(fov=55, aspect, near=10, far=2000)` (reconciled from research SUMMARY.md §Conflicts — fov 60 → 55 to avoid widescreen fisheye), per-node `z` via deterministic `CATEGORY_Z` constants in `src/game/constellation.layout.js` (8 categories mapped front-to-back as architecture stack, z ∈ [−150, +150]), `OrbitControls` drag-to-rotate with damping + polar clamp + autoRotate=0.5 (~30 s/orbit) pause-on-interaction, click-vs-drag threshold (5 px + 250 ms; 8 px on touch), VERTEX_SHADER size-attenuation by depth, `webglcontextlost`/`restored` handlers swap to SVG. Mobile SVG path UNCHANGED — Lighthouse mobile HARD gate intact. `prefers-reduced-motion` users continue on static SVG path.

## v3.10 Phase Structure

Single phase / 3 sequential plans / 3–5 days (coarse granularity — single REQ, do NOT split).

- **Phase 20 — 3D Constellation** → DEPTH-01
  - **Plan 20-01** Data layer (layout + tests + bundle-gate regex fix) — ~1 day
  - **Plan 20-02** WebGL renderer (PerspectiveCamera + OrbitControls + shader size-attenuation) — ~2 days
  - **Plan 20-03** useClickVsDrag hook + UAT + bundle gate close — ~1 day

## v3.10 Decisions to Log During Phase 20

Per research SUMMARY.md, Phase 20 must log 4 new decisions:

- **D-20-VISUAL-3D** — supersedes D-17-VISUAL (flat 2D-in-3D ortho). PerspectiveCamera(fov=55) + OrbitControls + category-z layout.
- **D-20-CLICK-DRAG-THRESHOLD** — NEW. 5 px screen-space + 250 ms time; 8 px on `pointerType === 'touch'`. Preserves GAME-04 click-to-select under OrbitControls gesture state.
- **D-20-PROPS-CONTRACT** — reframes GAME-01 (not broken). Layout `{x, y, z}` consumed by both renderers — SVG ignores `z` silently; WebGL projects. Props identical, pixels diverge by design.
- **D-20-CONTEXT-LOSS** — NEW defensive. `webglcontextlost`/`restored` handlers swap to SVG via existing capability hook. Phase 17 didn't address this.
- **D-20-PLANETS-TIER** — NEW (Destiny-2 Director vibe). Top-K=6 skills by `count` get `isPlanet: true` in `buildConstellationGraph` final pass; planets render LARGER (computeRadius floor 24 / ceil 40 vs star floor 10 / ceil 23) AND always-on halo in BOTH WebGL and SVG renderers. Deterministic tiebreak by id ascending. GAME-01 props-contract preserved. K is UAT-tunable. Bundled into Plan 20-02b wave (alongside OnboardingHint).

## v3.10 Standing Alerts (carry into plan-PR reviews)

- **9 pre-rejected decision violations** (see `.planning/research/PITFALLS.md §"Decision Violations to Flag"`) — flag immediately if any appear in plan PR: `use r3f`, `use d3-force-3d`, `use Line2`, `show WebGL to RM users with autoRotate off`, `add 2D/3D user preference toggle`, `move WebGL out of lazy chunk`, `perspective swap only (no layout z)`, `add Stats.js / dat.gui`, `introduce headless-gl test infra for one phase`.
- **Bundle-gate regex bug** at `scripts/check-bundle-gate.mjs:12` (current `THREE_JS_PATTERN = /THREE\.|from\s*['"]three['"]/` doesn't catch `three/addons/*`) — fix MUST land in Plan 20-01, NOT Plan 20-02 (must precede the first OrbitControls import to keep "no leak to mobile chunk" continuously enforced).
- **three.js stays pinned at 0.169.0** — DO NOT bump to 0.184.0 during v3.10 (Phase 17 Lighthouse gate cleared against current pin).
- **D-17-FRAMELOOP single rAF** — do NOT add `controls.addEventListener('change', renderer.render)`; only `controls.update()` as first line of existing `tick()`.
- **Manual UAT debt from v3.9** (above-fold + twinkle real-device confirm) bundles with Phase 20 UAT — single real-device sweep covers both.

## v3.10 Critical Pitfalls (must be addressed in Phase 20 — see PITFALLS.md)

6 ship-blockers mapped to plan structure:

1. **Bundle-gate regex bug** → Plan 20-01 (before OrbitControls import lands).
2. **`z=0` trap** → Plan 20-01 layout test asserts ≥2 distinct z + range ≥100.
3. **OrbitControls swallows click** → Plan 20-03 `useClickVsDrag` hook + Plan 20-02 integration.
4. **Size-attenuation missing** → Plan 20-02 VERTEX_SHADER uniform update.
5. **Double rAF** → Plan 20-02 preserves D-17-FRAMELOOP; only `controls.update()` added inside `tick()`.
6. **Auto-rotate vs RM** → Plan 20-02 defensive in-renderer gate + auto-pause on interaction.

Plus 9 moderate + 6 minor pitfalls (see PITFALLS.md).

## Plan 17 Decisions (2026-06-03 — still constrains v3.10)

- **D-17-EXTRACT**: Slice 1 LIFTS `ConstellationErrorBoundary` (GameMode.js:46-67) + `detectCapabilities` (GameMode.js:29-44) to standalone files. Does NOT re-author from scratch. Cleans inline versions + `data-prefers-reduced-motion` attr.
- **D-17-HOVERED-PROP**: `hoveredSkillId` stays owned by `useConstellation` (already at lines 55, 73, 132). WebGL consumes via props (NOT internal useState). GameMode passes via shared `rendererProps` to BOTH SvgConstellation + WebGLConstellation — Phase 17 doesn't silently extend the contract for one renderer.
- **D-17-EDGE-RGBA**: Edge geometry uses `BufferAttribute(arr, 4)` + `material.transparent=true` for per-vertex alpha. Avoids light-theme parity failure where pre-multiplied RGB fades to black against light bg.
- **D-17-LIGHTHOUSE-FLOW**: Phase 17 close runs `npm run lighthouse:mobile` (self-contained, spins up vite preview on :4173) → `npm run lighthouse:check` (programmatic HARD gate, exit code IS verdict). Drops `npx serve dist` from initial plan. Phase 11-05 deployed-*.vercel.app gate stays deferred.
- **D-17-SC5-TEST**: `src/game/GameMode.test.js` REQUIRED for SC-5 ("capability-based-selection component test"). Slice 1 creates it.
- **D-17-FRAMELOOP**: single rAF loop — DO NOT add `controls.addEventListener('change', renderer.render)`; only `controls.update()` as first line of existing `tick()`.
- **D-17-LIB**: three.js raw — NO `@react-three/fiber`, NO `@react-three/drei`.
- **D-17-PRIMITIVES**: custom ShaderMaterial — `PointsMaterial.sizeAttenuation` does NOT apply; manual size-attenuation formula needed in VERTEX_SHADER.

## v3.9 Phase Structure (closed 2026-06-08 — historical)

- **Phase 18 — Above-the-fold layout** → POLISH-01 — completed 2026-06-08 (259/259 tests GREEN)
- **Phase 19 — Never-static constellation (SVG ambient twinkle)** → POLISH-02 — completed 2026-06-08 inline (261/261 tests GREEN)

Tag v3.9 on commit 4e9c2b3.

## v3.8 Phase Structure (closed 2026-06-06 — historical)

- **Phase 14 — Foundation: Data Layer, ViewMode Toggle & Test Infra** → GAME-02 (derivation), GAME-05, TEST-01
- **Phase 15 — Accessible Constellation & SEO Fallback** → GAME-01 (contract + SVG path), GAME-02 (render), GAME-06
- **Phase 16 — Filters & Floating ExperienceCard** → GAME-03, GAME-04
- **Phase 17 — WebGL Desktop Renderer & Lighthouse Gate** → GAME-01 (WebGL adapter), GAME-07

## Accumulated Decisions (historical, from v3.6/v3.7/v3.8 — still constrain the codebase)

- **D-v3.6-CSS-VAR**: Tailwind config references `var(--color-*)` — theme system token-driven.
- **D-v3.6-BRAND**: Blue-500 + emerald-500 palette in both modes; WCAG AA holds.
- **D-v3.6-HERO-VARIANT-C**: `<picture>` + WebP 800w/1600w + sharp pipeline + theme-aware `--hero-*` CSS vars.
- **D-v3.6-AI-SECTION**: Lazy-load + bilingual `t.*` namespace + scroll-spy pattern (reusable template).
- **D-theme/lang Context pattern**: ThemeContext/LanguageContext = provider + hook + localStorage key. ViewModeContext (v3.8) mirrors this.
- **D-14-01-LAYOUT**: Deterministic radial category-centroid layout chosen over d3-force — zero new dependencies, trivially deterministic, no d3-force in client bundle. v3.10 EXTENDS this to 3D with category-z; d3-force-3d REJECTED.
- **D-16-CARD-POSITION**: Desktop ExperienceCard = node-anchored popover (offset +24x/-60y from LAYOUT[skillId] center); mobile = bottom-sheet.
- **D-16-BUNDLE-GATE**: HARD FAIL > 16 kB, WARN 14–16 kB, PASS ≤ 14 kB on GameMode chunk.

## Blockers/Concerns Entering v3.10

- **Bundle-gate regex bug** at `scripts/check-bundle-gate.mjs:12` — fix MUST land in Plan 20-01 BEFORE OrbitControls import in Plan 20-02 to keep "no three.js leak to mobile chunk" continuously enforced. Already flagged in PITFALLS CRIT-03.
- **`z=0` trap** — if `WebGLConstellation.js:295` keeps `positions[i*3+2] = 0` after layout returns z, all nodes sit on one plane, perspective foreshortens nothing. Plan 20-01 layout test catches this.
- **OrbitControls swallows click** — needs `useClickVsDrag` hook (Plan 20-03) before pick handler. Existing GAME-04 click-to-select must keep working.
- **GAME-01 contract reframe** — props stay identical, pixels diverge. Logged as D-20-PROPS-CONTRACT to make the divergence explicit.
- **CATEGORY_Z design values** — proposals only; UAT-tunable. Plan 20-01 should comment-block "UAT-tunable; consult v3.10-UAT.md before adjusting after milestone close."
- **fov=55 vs PROJECT.md historical fov=60** — RECONCILED 2026-06-08 (PROJECT.md updated to fov=55 per research SUMMARY.md §Conflicts).

## Backlog / Out of Scope (for v3.10)

- Mobile WebGL / 3D on mobile (mobile-Safari WebGL perf cliff + Lighthouse mobile gate risk)
- WebXR / VR mode, scroll-to-zoom / pinch-to-zoom, free-look first-person camera
- Camera-state persistence across viewmode toggle, "Reset view" button, 2D/3D user preference toggle (defer v3.11+ if recruiter UAT demands)
- Post-processing bloom / fog, per-category depth color shift, onboarding hint pill (defer v3.10.1)
- Bundle-gate change to enforce desktop chunk HARD ceiling (soft + WARN sufficient)
- Carried deferred (NOT in v3.10): DEPLOY-01 (Plan 11-05), DEPLOY-02 (custom domain), DEPLOY-03 (PR previews), VIS-05, DIAGRAMS-01, manual UAT v3.9

## Session Continuity

Last session: 2026-06-10T15:15:00.000Z
Stopped at: Plan 20-02b scope bundled — OnboardingHint + planets-tier (D-20-PLANETS-TIER, Destiny-2 Director vibe) in one wave. Task 1 hint pill + Task 2 planets-tier (top-K=6 by count, isPlanet flag, larger size + always-on halo in both renderers) + Task 3 human UAT (14 items: 10 pill + 4 planet). Task 2 (20-02a human visual smoke checkpoint) still DEFERRED — needs real GPU.
Resume file: .planning/phases/20-3d-constellation/20-02b-PLAN.md

## Deferred Items

Items acknowledged and deferred at v3.9 close on 2026-06-08, carrying into v3.10:

| Category | Item | Status |
|----------|------|--------|
| uat_gap | Phase 10 (10-UAT.md) | unknown — 0 pending scenarios (v3.6 carryover) |
| uat_gap | Phase 11 (11-UAT-LOCAL.md) | unknown — 0 pending scenarios (v3.7 carryover) |
| uat_gap | Phase 15 (15-HUMAN-UAT.md) | passed — 0 pending scenarios (v3.8 carryover) |
| uat_gap | v3.9 above-fold + twinkle real-device confirm | deferred — bundle with v3.10 UAT |
| deploy | DEPLOY-01 Plan 11-05 Lighthouse against `*.vercel.app` | deferred (carries from v3.7) |
| deploy | DEPLOY-02 custom domain andresmontoyat.co + DNS | deferred (carries from v3.7) |
| deploy | DEPLOY-03 PR preview deploys | deferred (carries from v3.7) |
| backlog | VIS-05 claude-kanban + caveman cards | deferred (carries from v3.6) |
| backlog | DIAGRAMS-01 cross-repo architecture diagrams | deferred (carries from v3.6) |
| seed | SEED-3D-CONSTELLATION | 🟢 ACTIVE — DEPTH-01 / Phase 20 / v3.10 |

## Operator Next Steps

- Run `/gsd:plan-phase 20` to enter Phase 20 planning — research SUMMARY.md flags "Phase 20 does NOT need `--research-phase`" (STACK + FEATURES + ARCHITECTURE + PITFALLS already cover the integration surface).
- Consider `/gsd:ui-phase` between Plan 20-01 (data-only) and Plan 20-02 (renderer changes) to lock UI-SPEC for perspective swap, OrbitControls gesture behavior, autorotate cadence, and click-vs-drag UX before code lands.
- At Phase 20 close: re-verify Lighthouse mobile HARD gate ≥ Phase 17 baseline; bundle gate WARN band ≤ 130 kB gz on desktop chunk; tag candidate `v3.10` queued for milestone ceremony.
