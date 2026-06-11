---
gsd_state_version: 1.0
milestone: v3.11
milestone_name: Mario-World Experience Map
status: milestone_local_done_pending_uat
stopped_at: Phase 24 closed; awaiting operator UAT + tag v3.11.0 + push to main
last_updated: 2026-06-11T00:58:00.000Z
last_activity: 2026-06-11 -- v3.11 Mario-World implementation complete (32 commits ahead of main); 150/150 GREEN; Lighthouse mobile PASS (Perf 97/A11y 100/BP 100/SEO 100); branch unpushed, tag pending UAT sign-off
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 33
  completed_plans: 33
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-10 — v3.10 SHIPPED with DEPTH-01).

**Core value:** Recruiter-facing portfolio. Stop-the-scroll Hero, dual-view game/dev experience, bilingual (EN/ES), Lighthouse mobile HARD gate intact.
**Current focus:** v3.11 Mario-World Experience Map — local-done; awaiting operator real-browser UAT before tag + push.
**Last shipped:** v3.10 3D Constellation (2026-06-10) — tag candidate queued.
**Local-done (unpushed):** v3.11 Mario-World — branch `v3.11-mario-world`, 32 commits ahead of `main`.

## Current Position

Branch: `v3.11-mario-world` (NOT pushed; NOT tagged)
Milestone: v3.11 Mario-World Experience Map
Phases: 21, 22, 23, 24 — ALL LOCKED
Status: `milestone_local_done_pending_uat`
Last activity: 2026-06-11 00:58
Progress: `[██████████] 33/33 tasks across 4 phases`

## v3.11 Milestone Scope

Replace 3D skill-constellation (v3.8–v3.10) with Mario-Bros-inspired world-map landing experience. Decisions Q1–Q19 locked in `docs/superpowers/specs/2026-06-10-mario-world-experience-map-design.md`. Full plan at `docs/superpowers/plans/2026-06-10-mario-world-experience-map.md` (canonical — not in `.planning/phases/`).

- Worlds = companies; levels = roles per company; section/secret worlds for non-experience content.
- 5 biomes (era × stack): Pradera 2007–2012 Java/JEE, Desierto 2013–2017 SOA, Selva 2018–2021 µservices, Cyber 2022–2024 Cloud/K8s, Castillo 2025–2026 Claude/AI.
- Adaptive renderer: WebGL (three.js) desktop / SvgWorldMap fallback for SVG-tier + RM users.
- Pixel-art Carlos avatar; arrow keys + drag pan; click world → 600 ms cinematic zoom → overlay; Esc → 400 ms zoom-out.
- Terminal-style typed commands unlock hidden worlds (dynamic catalog).
- Hero gate at first paint routes Game vs Dev (classic CV scroll).

## v3.11 Phase Structure (all SHIPPED locally)

- **Phase 21 — Foundation** (Tasks 21.01–21.13) — biomes + worlds derive + sections data + ViewMode null-state + HeroGameGate + DevView + MarioWorld orchestrator + App.js wire-in
- **Phase 22 — Renderers** (Tasks 22.01–22.09) — WorldErrorBoundary port + SvgWorldMap + WorldDetailOverlay + sprite placeholders + WebGLWorldMap (three.js) + WorldMap capability wrapper + bundle-gate re-baseline
- **Phase 23 — Feel** (Tasks 23.01–23.05) — useWorldNav + useCinematicZoom + rAF tick wiring (camera lerp + zoom transitions + avatar follow)
- **Phase 24 — Secrets + Cleanup + Gates** (Tasks 24.01–24.06) — secret-worlds.js + useSecretCommand + SecretCommandHint + legacy src/game/ deletion + orphan component cleanup + Lighthouse PASS + UAT scaffold

## v3.11 Automated Gates (all PASS)

- **Tests:** 150/150 GREEN (`npm test -- --run`); -229 vs Phase 22 peak (legacy `src/game/*.test.js` removed alongside impl)
- **Bundle gate:** `node scripts/check-bundle-gate.mjs` exit 0
  - `index-*.js` = 66.49 kB gz (WARN band 50–90 kB; under Phase 22 re-baselined 90 kB HARD)
  - `WebGLWorldMap-*.js` = 116.50 kB gz (INFO band; under 125 soft / 130 HARD)
- **Lighthouse mobile HARD gate:** PASS
  - Performance 0.97 (≥ 0.95)
  - Accessibility 1.00 (= 1.00)
  - Best Practices 1.00 (= 1.00)
  - SEO 1.00 (= 1.00)
  - Target-size audit 1 (= 1)

## v3.11 Decisions Logged (during implementation)

- **D-22-CHUNK-RENAME** — bundle-gate `MOBILE_CHUNK_PATTERN` rebaselined from `GameMode-*.js` → `index-*.js`; `WEBGL_CHUNK_PATTERN` rebaselined from `WebGLConstellation-*.js` → `WebGLWorldMap-*.js`. Variable names preserved; semantics shifted. HARD ceiling 38.82 kB → 90 kB (main bundle now carries App + orchestrator + DevView + Hero gate + SvgWorldMap + overlay + i18n).
- **D-22-POINTER-INIT** — jsdom 25 PointerEvent strips clientX/Y from init payload. Tests dispatch native `MouseEvent('pointerdown'/'pointerup', ...)` instead — React listens by event type, not class.
- **D-22-WEBGL-MATRIX** — `WebGLWorldMap` must call `camera.updateProjectionMatrix()` + `camera.updateMatrixWorld(true)` BEFORE first `Vector3.project()` (pick path) — `lookAt` alone doesn't update `matrixWorldInverse`.
- **D-23-LERP-FACTORS** — Avatar position + camera lerp factor 0.12 / camera-z lerp 0.10 — produces smooth chase + zoom without snap or sluggish drag.
- **D-23-OVERLAY-GATED** — Overlay mounts only when `zoom.state === 'inWorld'`; click → `zoom.start()` not direct `setOpenWorldId`; close → `zoom.stop()` (plays 400 ms zoom-out first).
- **D-24-LISTENER-STABLE** — `useSecretCommand` keeps `commands` + `onUnlock` in refs so identity churn from parent re-renders doesn't re-attach the listener (which would drop the rolling buffer mid-typing).
- **D-24-SHARED-HOOKS-RELOC** — `useRendererCapability` + `useClickVsDrag` + tests moved (git mv) from `src/game/` → `src/marioWorld/hooks/`. Survives Phase 24 deletion.

## Blockers / Concerns Entering v3.11 Close

- **Manual UAT not yet run.** 12-item operator sweep at `.planning/phases/v3.11-mario-world-UAT.md`. Branch must NOT merge until UAT signed off.
- **Tag v3.11.0 not cut.** Cut on signed-off commit after UAT closes.
- **Branch unpushed.** `v3.11-mario-world` lives only locally — single-point-of-failure for 32 commits of work.
- **Sprite art is placeholder.** Solid-color WebPs from `sharp`. High-fidelity art tracked under `.planning/seeds/SEED-MARIO-WORLD-ART.md` (OPEN-ART-1).
- **SECRET_WORLDS catalog empty.** Operator adds entries when underlying narratives are written.

## Carried Deferred (NOT in v3.11)

| Category | Item | Status |
|----------|------|--------|
| uat_gap | Phase 10 (10-UAT.md) | unknown — 0 pending scenarios (v3.6 carryover) |
| uat_gap | Phase 11 (11-UAT-LOCAL.md) | unknown — 0 pending scenarios (v3.7 carryover) |
| deploy | DEPLOY-01 Plan 11-05 Lighthouse against `*.vercel.app` | deferred (carries from v3.7) |
| deploy | DEPLOY-02 custom domain andresmontoyat.co + DNS | deferred (carries from v3.7) |
| deploy | DEPLOY-03 PR preview deploys | deferred (carries from v3.7) |
| backlog | VIS-05 claude-kanban + caveman cards | deferred (carries from v3.6) |
| backlog | DIAGRAMS-01 cross-repo architecture diagrams | deferred (carries from v3.6) |
| seed | SEED-3D-CONSTELLATION | ✅ activated + shipped in v3.10 |
| seed | SEED-DESTINY-DIRECTOR-AESTHETIC | ✅ activated + shipped in v3.11 |
| seed | SEED-MARIO-WORLD-ART | 🟢 ACTIVE — OPEN-ART-1; placeholders shipping |

## Operator Next Steps (recommended order)

1. **Push branch + open PR** — share work; protect against local loss.
2. **Run manual UAT sweep** — `.planning/phases/v3.11-mario-world-UAT.md` (12 items, real Chrome + iPhone/Android). Populate `Result` column inline.
3. **Tag + merge** — on UAT 12/12 PASS:
   ```bash
   git tag -a v3.11.0 -m "v3.11.0 Mario-World Experience Map"
   git push origin v3.11-mario-world v3.11.0
   ```
   Then squash-merge or fast-forward to `main`.
4. **Update ROADMAP.md + PROJECT.md** — mark v3.11 SHIPPED, open v3.12 slot (deploy resume? new feature? backlog activation?).
5. **Optional follow-ups:**
   - Add real `SECRET_WORLDS` entries when narratives ready.
   - Commission high-fidelity sprite art for OPEN-ART-1.

## Session Continuity

Last session: 2026-06-11T00:58:00.000Z (v3.11 Phase 24 close — Lighthouse PASS)
Stopped at: ALL CODE DONE. 32 commits on `v3.11-mario-world` ahead of `main`. Awaiting operator UAT + tag + push.
Resume file: `.planning/phases/v3.11-mario-world-UAT.md` (operator fills `Result` column per 12 items + sign-off section).
Next /gsd-resume-work should: ask operator whether UAT has been run; if yes → guide tag + push; if no → present option to push branch first (UAT can happen against deployed preview).
