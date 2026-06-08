# Requirements: Carlos Montoya Portfolio — v3.10

**Defined:** 2026-06-08
**Milestone:** v3.10 3D Constellation
**Core Value:** The hero section and overall first impression must stop recruiters mid-scroll, make them want to learn more about Carlos, and convert visits into engineering conversations.

## v3.10 Requirements

Single-REQ milestone activating `SEED-3D-CONSTELLATION` (planted 2026-06-08 during v3.9 Phase 18). Phase numbering continues from v3.9 → **starts at Phase 20**.

### 3D Constellation Upgrade

- [ ] **DEPTH-01** Genuine 3D constellation on WebGL desktop renderer:
  - `OrthographicCamera` → `PerspectiveCamera(fov=55, aspect, near=10, far=2000)` — fov=55 chosen over 60 to avoid widescreen fisheye risk per research SUMMARY.md §Conflicts
  - Per-node `z` coordinate via deterministic `CATEGORY_Z` constants in `src/game/constellation.layout.js` (NOT in `src/data/skills.js`); 8 categories mapped front-to-back as architecture stack, z ∈ [−150, +150]
  - `OrbitControls` (from `three/addons/controls/OrbitControls.js`) drag-to-rotate with `enableDamping=true`, `dampingFactor=0.06`, `rotateSpeed=0.6`, `enableZoom=false`, `enablePan=false`, `enableKeys=false`, polar-angle clamp (`minPolarAngle ≈ π × 0.15`, `maxPolarAngle ≈ π × 0.85`)
  - `autoRotate=true` + `autoRotateSpeed=0.5` (~30 s/orbit) with pause-on-`'start'` + pause-on-hover/select + defensive `prefers-reduced-motion` gate
  - Click-vs-drag threshold (5 px screen-space + 250 ms time; 8 px on `pointerType === 'touch'`) — preserves GAME-04 click-to-select under OrbitControls gesture state
  - VERTEX_SHADER size-attenuation by depth: `gl_PointSize *= perspectiveScale / -mvPosition.z`, clamp ∈ [1, 64]
  - Cursor `grab`/`grabbing` CSS feedback during drag
  - `webglcontextlost`/`restored` handlers swap to SVG via existing capability hook (D-20-CONTEXT-LOSS)
  - Layout props contract `{x, y, z}` consumed by both renderers — SVG ignores `z` silently, WebGL projects; **props contract identical, visual rendering EXPLICITLY DIVERGES** (D-20-PROPS-CONTRACT — GAME-01 reframed as "single props contract, adaptive visual fidelity")
  - Mobile SVG path UNCHANGED — Lighthouse mobile HARD gate intact
  - `prefers-reduced-motion: reduce` users continue on static SVG path (no rotation injected; a11y contract preserved)

## Constraints (carried from v3.8/v3.9 — still active)

- **Lighthouse mobile HARD gate** Perf ≥95 / A11y 100 / BP 100 / SEO 100 — MUST NOT REGRESS. Re-verify on milestone close. Mobile is SVG path; not expected to change since lazy boundary in `GameMode.js` already isolates three.js to desktop.
- **Mobile chunk gz budget** ≤ 38.82 kB (current 8.91 kB). DEPTH-01 cannot leak three.js code to mobile chunk.
- **Desktop WebGL lazy chunk soft ceiling** ~125 kB gz (current ~117 kB + measured 6.85 kB gz OrbitControls = ~123 kB). WARN at 130 kB.
- **WCAG 2.1 AA** contrast + a11y preserved across both render paths.
- **Bilingual EN/ES** — no new translation keys expected (3D is renderer-level, not copy).
- **No new heavy deps** — zero `npm install` (research confirms `three@0.169.0` already ships `PerspectiveCamera` + `OrbitControls`).
- **three.js stays pinned at 0.169.0** — DO NOT bump to 0.184.0 during v3.10 (Phase 17 Lighthouse gate cleared against current pin).
- **D-14-01-LAYOUT deterministic** — layout stays pure function, NO `d3-force-3d`, NO physics simulation, NO non-deterministic z.
- **D-17-LIB three.js raw** — NO `@react-three/fiber`, NO `@react-three/drei`.
- **D-17-FRAMELOOP single rAF** — DO NOT add `controls.addEventListener('change', renderer.render)`. Only `controls.update()` as first line of existing `tick()`.

## Out of Scope (for v3.10)

| Feature | Reason |
|---------|--------|
| Mobile WebGL / 3D on mobile | Mobile-Safari WebGL perf cliff + Lighthouse mobile gate risk; SVG mobile path stays untouched |
| WebXR / VR mode | Out of recruiter-conversion scope; vestibular risk; adds three.js addon weight |
| Camera-state persistence across viewmode toggle | Deferred to v3.11+ if recruiter UAT shows demand |
| "Reset view" button | Deferred — if added later, lift `resetViewToken` to `useConstellation` (camera state stays in renderer) |
| 2D/3D user preference toggle | Adaptive-fidelity-by-capability is the design; user-facing 2D/3D toggle adds UX surface without conversion lift |
| Free-look first-person camera | Out of constellation metaphor scope |
| Scroll-to-zoom / pinch-to-zoom | OrbitControls `enableZoom=false` — page scroll preserved |
| Post-processing bloom / fog | Custom ShaderMaterial doesn't auto-pick up `scene.fog`; defer to v3.10.1 micro-milestone if visible UAT need |
| Per-category depth color shift | Defer to v3.10.1 — out of MVP scope |
| Onboarding hint ("drag to rotate" pill) | P2 — ship if Plan 20-02 stays under 2 days; defer to v3.10.1 otherwise |
| Bundle-gate change to enforce desktop chunk HARD ceiling | Soft ceiling + WARN band sufficient for v3.10; HARD ceiling waits for empirical data |
| Custom domain andresmontoyat.co + DNS (DEPLOY-02) | Carried as deferred from v3.7 |
| Plan 11-05 deployed-URL Lighthouse verdict | Carried as deferred from v3.7 |
| VIS-05 claude-kanban + caveman cards | Carries from v3.6 |
| DIAGRAMS-01 cross-repo architecture diagrams | Carries from v3.6 |
| Manual UAT v3.9 (above-fold + twinkle real-device) | Carries from v3.9 close — bundle with v3.10 UAT |

## Decisions to Log During Phase 20

Per research SUMMARY.md, Phase 20 must log 4 new decisions:

| Decision | Supersedes | Rationale |
|----------|------------|-----------|
| **D-20-VISUAL-3D** | D-17-VISUAL (flat 2D-in-3D ortho) | Genuine 3D + drag-to-rotate via PerspectiveCamera(fov=55) + OrbitControls + category-z layout |
| **D-20-CLICK-DRAG-THRESHOLD** | — (new) | 5 px screen-space + 250 ms time; 8 px on `pointerType === 'touch'`; preserves GAME-04 click-to-select under OrbitControls gesture state |
| **D-20-PROPS-CONTRACT** | GAME-01 (reframed, not broken) | Layout `{x, y, z}` consumed by both renderers — SVG ignores `z`, WebGL projects; props identical, pixels diverge by design |
| **D-20-CONTEXT-LOSS** | — (defensive, new) | `webglcontextlost`/`restored` handlers swap to SVG via existing capability hook; Phase 17 didn't address this |

## Critical Pitfalls (must be addressed in Phase 20 — see `.planning/research/PITFALLS.md`)

6 ship-blockers identified by research, all mapped to Phase 20 plan structure:

1. **Bundle-gate regex BUG** (`scripts/check-bundle-gate.mjs:12`) — current `THREE_JS_PATTERN` won't catch `three/addons/*` imports. Fix lands in Plan 20-01 BEFORE OrbitControls import.
2. **`z=0` trap** — layout test asserts ≥2 distinct z + range ≥100.
3. **OrbitControls swallows click** — `useClickVsDrag` hook (5 px + 250 ms threshold).
4. **Size-attenuation missing** — VERTEX_SHADER uniform update with `* perspectiveScale / -mvPosition.z`.
5. **Double rAF** — D-17-FRAMELOOP preserved; only `controls.update()` added inside `tick()`.
6. **Auto-rotate vs RM** — defensive in-renderer gate + auto-pause on interaction.

Plus 9 moderate + 6 minor pitfalls (see PITFALLS.md), and 9 pre-rejected decision violations (re-read PITFALLS §"Decision Violations to Flag" at plan-PR review time).

## Deferred (carried from v3.7/v3.9 — not in v3.10)

Resume file: `.planning/phases/11-vercel-deploy-uat-gate/11-05-PLAN.md`

| ID | Carried item | Reason |
|----|--------------|--------|
| DEPLOY-01 (gate) | Lighthouse mobile gate verdict against deployed `*.vercel.app` URL (Plan 11-05) | Carried since v3.7 |
| DEPLOY-02 | Custom domain andresmontoyat.co + DNS + HTTPS | Carried since v3.7 |
| DEPLOY-03 | PR preview deploys + OG card validation | Carried since v3.7 |
| UAT-v3.9 | Real-device visual confirm above-fold + SVG twinkle | Carried from v3.9 close — bundle with v3.10 UAT |
| VIS-05 | claude-kanban + caveman cards in AI section | Carries from v3.6 |
| DIAGRAMS-01 | Cross-repo architecture diagrams | Carries from v3.6 |

## Traceability

| REQ-ID | Phase(s) | Status |
|--------|----------|--------|
| DEPTH-01 | Phase 20 | Pending |

**Coverage:** 1/1 v3.10 requirement mapped. Single REQ per phase. No orphans.
