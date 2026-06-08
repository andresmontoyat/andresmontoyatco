# Feature Research — v3.10 3D Constellation

**Domain:** Interactive 3D skill-constellation upgrade for a recruiter-facing portfolio (WebGL desktop only; SVG mobile path untouched).
**Researched:** 2026-06-08
**Confidence:** HIGH on camera/control patterns and shader primitives (three.js docs + multiple corroborating sources); MEDIUM on recruiter-conversion specifics (industry rules of thumb, not Carlos's audience data).

> **Scope reminder (DO NOT re-research):** SVG ambient twinkle, prefers-reduced-motion path, focus trap, ExperienceCard dialog, filters (multi-skill AND / year slider / category chips), 8-category clustering, keyboard nav, FpsCounter, RendererErrorBoundary — all SHIPPED in v3.8/v3.9. This file scopes only the **3D + drag-to-rotate** delta on top of `WebGLConstellation.js`.

---

## Feature Landscape

### Table Stakes (Users Expect These for a Credible 3D Scene)

If any of these is missing, the constellation either stops feeling "3D" or feels broken. Recruiter intuition is calibrated by every other 3D web experience they've ever touched (Google Earth, Sketchfab, product configurators).

| Feature | Why Expected | Complexity | v3.8 Dependency | Notes |
|---------|--------------|------------|-----------------|-------|
| **PerspectiveCamera (fov 50–60)** | Without perspective foreshortening, "3D" looks like 2D ortho. Existing `OrthographicCamera` is the bug this milestone fixes. | LOW | Replaces camera in `WebGLConstellation.js` only. | fov=50–60 is the safe portfolio-scale range. fov ≥75 induces fisheye distortion and motion sickness; ≤40 feels telephoto / flat. **Recommend fov=55** as middle ground; many three.js examples default 50, R3F default 75. Document the choice in a D-20 decision. |
| **Drag-to-rotate (orbit gesture)** | Every 3D web product accepts left-mouse-drag = orbit. Anything else fails the "obvious 3D" test. | LOW | New: `OrbitControls` from `three/examples/jsm/controls/OrbitControls.js` (~5 kB gz). | Default `enableDamping: true`, `dampingFactor: 0.05`, `rotateSpeed: 0.5–0.7` (default 1.0 feels twitchy on trackpad). Must call `controls.update(deltaTime)` in rAF loop. |
| **Click-vs-drag disambiguation (≥5 px threshold)** | If pointerdown→pointerup with movement triggers `onSelectSkill`, recruiters cannot rotate without accidentally opening ExperienceCard. | MEDIUM | Wraps existing `onSelectSkill` handler in `WebGLConstellation.js`. | Industry-standard threshold: **5 px movement** OR **>250 ms held** before treating pointerup as drag-end-not-click. Track pointerdown coords + timestamp; on pointerup compare. Mobile tap tolerance can be slightly higher (8 px) per Apple HIG. |
| **Visible depth cue (size attenuation)** | Without it, rotating a 3D point cloud looks like 2D points flickering — no depth read. | LOW | `Points` shader already uses custom `ShaderMaterial`; add `gl_PointSize *= (300.0 / -mvPosition.z)` in vertex shader. | three.js `PointsMaterial.sizeAttenuation` exists but doesn't consider FOV. Custom shader is already in place — minor edit. ~3 LOC. |
| **Keep existing keyboard nav + focus trap functional** | WCAG 2.1 AA + GAME-06 a11y commitment is non-negotiable; keyboard users cannot rotate but must still navigate nodes. | LOW | Reuses `spatialNav.js` + existing node focus ring. | Keyboard arrows = spatial nav (existing). No keyboard rotation gesture — out of scope, would require a "perspective unlock" mental model. Document: "keyboard users see the constellation from the auto-rotate angle at moment of focus." |
| **`prefers-reduced-motion` → freeze rotation** | A11y baseline; v3.9 POLISH-02 preserved this for SVG. Must extend to 3D: disable auto-rotate AND disable damping inertia. | LOW | Existing `useRendererCapability.js` already reads media query. | Drag-to-rotate can stay enabled (user-initiated motion is intentional per WCAG 2.3.3). Only suppress auto-spin + inertia. |
| **Restore camera-state across viewmode toggle** | If recruiter toggles game→dev→game, expect the constellation in the same orientation, not reset. Standard 3D viewer behavior. | LOW | Persist `{phi, theta}` to existing `cam-viewmode` localStorage namespace. | Optional v3.10.1 if cut for scope; not blocking. |

### Differentiators (Stop the Mid-Scroll)

These are where v3.10 earns the 117 kB gz lazy chunk that v3.8 paid for. Each maps to a "wow → engage" beat.

| Feature | Value Proposition | Complexity | v3.8 Dependency | Notes |
|---------|-------------------|------------|-----------------|-------|
| **Auto-rotate idle spin (slow, ~30 s/orbit)** | First-render answer to "is this interactive?" — the motion telegraphs depth before the recruiter touches anything. Same trick Sketchfab, Google Earth on first load, and every product configurator uses. | LOW | `OrbitControls.autoRotate = true; autoRotateSpeed ≈ 0.5` (≈ 30 s/full revolution at 60fps default). | **Must pause on user interaction** (`addEventListener('start', ...)` on controls). Auto-rotate axis = world Y (vertical) — never X or Z, which induces nausea fast. Suppress under `prefers-reduced-motion`. |
| **Category-z architecture clusters** | The depth axis *means* something: backend layer at z=−100, frontend at z=+100, cloud at z=0, etc. Recruiter rotates → sees Carlos's stack literally stratified. Self-documenting differentiation vs generic "random 3D blob". | MEDIUM | Extends `constellation.layout.js` `computeLayout` to return `{x, y, z}`. Adds category→z map (probably in `src/data/skills.js` next to the existing category color map). | Tests in `constellation.layout.test.js` need new shape assertions. Reject `d3-force-3d` (~15 kB) per D-14-01-LAYOUT — deterministic z assignment is enough. |
| **First-render onboarding hint ("drag to rotate")** | First ~3 s of auto-spin + a fading text/icon overlay = recruiter understands the gesture without reading docs. Vanishes on first interaction. Mirrors POLISH-02 SVG twinkle's "tell the visitor this is alive" goal. | LOW | New small overlay component near `GameMode.js`; bilingual via existing i18n. Auto-dismiss on first pointerdown OR after 5 s. | Persist "seen" flag in localStorage (`cam-3d-hint-seen`) to avoid spam on repeat visits. Mobile (SVG path) does NOT show the hint — gesture doesn't apply. |
| **Cursor change to `grab` / `grabbing`** | Tiny affordance, huge clarity. Modern 3D viewers all do this; absence reads "unprofessional". | LOW | CSS-only on the `<canvas>` element. | `cursor: grab` default, `cursor: grabbing` while pointer is down. Set via React state during pointer events. |
| **Damping inertia on release** | Letting go mid-drag and watching the constellation glide to a stop feels like a real object with mass — *that* is the "wow". `OrbitControls.enableDamping = true` does this for ~free. | LOW | Single flag on OrbitControls; rAF loop already running. | `dampingFactor: 0.05–0.08` is the documented sweet spot. <0.04 = feels weightless/jittery; >0.12 = perceptibly slow stop (anti-feature, see below). |
| **Size-attenuated stars (perspective scaling)** | Distant skills render smaller, near skills render larger — primal depth cue, ~zero cost. | LOW | ~3 LOC in existing vertex shader. | Already listed as table stakes; double-listed here because it is *also* the highest visual lift per LOC. |
| **Fog / fade-far falloff** | `THREE.Fog` or per-vertex opacity falloff at far z — distant clusters dim out, creating "deep space" feel. Cheap and recruiter-pleasing. | LOW | `scene.fog = new Fog(bg, near, far)` — but `Points` with custom `ShaderMaterial` does NOT auto-pick up scene.fog. Must add `fogColor` + `fogDensity` uniforms + multiply in fragment. | ~10 LOC shader edit. Optional for v1; high impact-per-LOC if shipped. |

### Anti-Features (Sound Cool, Hurt Recruiter Conversion)

These are the traps. Each one has a recorded failure mode in the 3D-web ecosystem. Reject by default, revisit only if explicit data demands.

| Feature | Why Tempting | Why Problematic | Alternative |
|---------|--------------|-----------------|-------------|
| **Free-look first-person camera / no `up` constraint** | Feels "more 3D"; lets recruiter "fly through". | Motion sickness is well-documented for fov-mismatched / unconstrained-roll cameras (MDN WebXR, A List Apart vestibular guide). Recruiter loses orientation in 3 s, bounces. | Lock `up = Y` axis via `OrbitControls` (default). Constrain `minPolarAngle ≈ Math.PI * 0.15` / `maxPolarAngle ≈ Math.PI * 0.85` to prevent upside-down. |
| **Pinch-to-zoom / scroll-to-zoom enabled** | "Why wouldn't we let them zoom?" | Scroll-zoom hijacks page scroll → recruiter trying to scroll past the constellation gets zoomed in instead → rage-bounce. Mobile is on SVG anyway, so pinch is N/A. | `controls.enableZoom = false`. Camera distance is fixed. If zoom is ever desired, gate behind a discoverable button — never on scroll. |
| **`controls.enablePan = true`** | OrbitControls ships pan on by default. | Pan moves the *target*, drifting the constellation off-center; recruiter never recovers the original framing → frustration. | `controls.enablePan = false`. Rotate-only. |
| **Accelerometer / device-tilt parallax** | "Cool factor" on mobile. | Mobile path is SVG (zero three.js). Adding accelerometer reintroduces the perf cliff v3.8 explicitly avoided. Also `prefers-reduced-motion` + iOS permission prompt UX cost. | Stay on SVG mobile. If "fancy mobile" ever matters, it is a new milestone (see SEED in v3.11+). |
| **Slow damping (`dampingFactor < 0.04`)** | "Feels premium / cinematic." | Perceived as laggy / unresponsive on Mac trackpads. GitHub issue #9577 documents the trap. | `0.05–0.08` range. Test on trackpad before locking. |
| **OrbitControls `rotateSpeed = 1.0` (default)** | Out-of-the-box ship-it. | Twitchy on high-DPI trackpads; recruiter overshoots target, bounces. | `rotateSpeed: 0.5–0.7`. Single line. |
| **Complex shader effects (volumetric glow, post-processing bloom, ambient occlusion fake)** | "Looks like a Three.js demo." | Adds 30–80 kB gz (postprocessing pass + UnrealBloomPass), risks the Phase 17 perf budget headroom, and visually overpowers the skill labels — recruiter loses the SIGNAL (skills) under the NOISE (bloom). | Stick to `Points` + `LineSegments` + size-attenuation + optional fog. v3.8 already ships glow pulse + halo brighten — enough. |
| **VR / WebXR mode** | "Future-proof / brag-worthy." | Zero recruiters have headsets at their desk. Adds permission prompts, polyfills, ~50 kB bundle. Pure scope-creep. | Reject. Document in Out of Scope. If user explicitly asks, point at SEED. |
| **OrbitControls damping at perceptibly slow speeds (8+ second glide)** | "Cinematic." | Recruiter waits for the constellation to stop before clicking → friction. The wait is in the conversion path. | Damping should settle in <1 s after release. |
| **Auto-rotate at recruiter-detectable speed (too fast OR too slow)** | "Visible motion = wow." | Too fast (>15 deg/s) = nauseating, especially on widescreen. Too slow (<1 deg/s) = looks broken / stuck. | ~12 deg/s ≈ 30 s/orbit. (`autoRotateSpeed ≈ 0.5` in OrbitControls' unit system.) |
| **Lock-on / "fly to clicked node" camera animations** | "Like a slick configurator." | Hijacks the camera while recruiter is mid-explore → orientation loss → bounce. Also requires tween library (~5 kB). | Click = open ExperienceCard (existing v3.8 behavior). Camera stays where the user left it. |
| **Background star particles / parallax space dust** | "Sets the constellation in a cosmos." | Visually competes with the actual skill nodes. Recruiter cannot tell signal from chrome. Bundle + GPU cost not free. | Solid `ink-900` background (existing). Maybe `THREE.Fog` for depth (above). |
| **Touch-to-rotate on mobile WebGL (i.e., abandoning adaptive render for mobile)** | "Symmetry between desktop + mobile." | Re-introduces the mobile-Safari WebGL perf cliff that the v3.8 adaptive render was specifically designed to dodge. Kills Lighthouse mobile gate. | Mobile stays on SVG. Document the divergence as adaptive-fidelity feature (per SEED Risk #1). |

---

## Feature Dependencies

```
PerspectiveCamera (camera swap)
    └── enables ──> Drag-to-rotate (OrbitControls)
                        ├── requires ──> Click-vs-drag threshold (≥5 px / 250 ms)
                        ├── enhances ──> Damping inertia on release
                        ├── enhances ──> Cursor change (grab/grabbing)
                        └── enables ──> Auto-rotate idle spin
                                            ├── requires ──> Pause-on-user-interaction
                                            └── enhances ──> First-render onboarding hint

PerspectiveCamera
    └── enables ──> Size-attenuated stars (perspective shader edit)
                        └── enhances ──> Fog / fade-far falloff

Category-z layout (data layer)
    ├── requires ──> computeLayout returns {x, y, z}
    ├── conflicts ──> GAME-01 "identical render contract" (visual divergence — reframe as adaptive-fidelity)
    └── informs ──> SVG mobile path stays 2D (untouched)

prefers-reduced-motion
    ├── disables ──> Auto-rotate idle spin
    ├── disables ──> Damping inertia
    └── preserves ──> Drag-to-rotate (user-initiated, WCAG 2.3.3 exempt)
```

### Dependency Notes

- **Drag-to-rotate requires click-vs-drag threshold:** Without the threshold, every drag-end fires the existing `onSelectSkill` → ExperienceCard opens unexpectedly. This is the single most likely v3.10 UAT regression.
- **Auto-rotate requires pause-on-interaction:** Without it, the camera keeps drifting while the user tries to rotate → frustration. `controls.addEventListener('start', () => controls.autoRotate = false)` is the one-liner fix.
- **Category-z conflicts with GAME-01:** The v3.8 spec promised "identical props contract" between SVG and WebGL. 3D z-axis breaks visual identity (SVG cannot do perspective). Roadmap must explicitly reframe GAME-01 as "identical *data* contract; adaptive *visual fidelity*" — already flagged in SEED.
- **First-render hint enhances auto-rotate, doesn't require it:** If auto-rotate is cut, the hint still works (text says "drag to rotate"). If hint is cut, auto-rotate still telegraphs interactivity. They compound but are independent.
- **Size-attenuation + fog compound:** Both communicate depth via the same channel (apparent brightness/size with distance). Either alone gives 80% of the read; together gives 95%. Ship at least one.

---

## MVP Definition (for v3.10 DEPTH-01)

### Launch With (v3.10.0) — Single REQ Scope

The bar is "credible 3D + recruiter cannot break it accidentally."

- [ ] **PerspectiveCamera** (fov=55) — without this, nothing else is 3D.
- [ ] **3D layout: category-z** — without depth-per-node, the camera swap shows nothing.
- [ ] **OrbitControls drag-to-rotate** — `enableDamping=true`, `dampingFactor=0.06`, `rotateSpeed=0.6`, `enableZoom=false`, `enablePan=false`, polar-angle clamped.
- [ ] **Click-vs-drag threshold** — 5 px / 250 ms guard around existing `onSelectSkill`.
- [ ] **Size-attenuated points** — 3-LOC vertex shader edit.
- [ ] **Cursor grab/grabbing** — CSS-only.
- [ ] **`prefers-reduced-motion` path: drag stays, auto-rotate + damping suppressed.**
- [ ] **Keep all v3.8/v3.9 a11y + filter + ExperienceCard behavior functional after camera swap.**

### Add After Validation (v3.10.1, if quick UAT shows engagement)

Trigger: post-deploy session-replay or visit-duration shows recruiters interact with the canvas (mousemove + pointer events) but bounce before opening an ExperienceCard.

- [ ] **Auto-rotate idle spin** (`autoRotateSpeed ≈ 0.5`) with pause-on-interaction — telegraphs interactivity for the recruiters who *don't* mousemove first.
- [ ] **First-render onboarding hint** ("drag to rotate" / "arrastra para rotar") — bilingual, 5-second auto-dismiss, localStorage seen-flag.
- [ ] **Fog falloff** — soft fade at far z, ~10 LOC.

### Future Consideration (v3.11+, only if a new milestone is opened)

- [ ] **Camera state persistence** across viewmode toggle.
- [ ] **"Reset view" button** if UAT shows users get lost (likely no — polar clamp prevents disorientation).
- [ ] **Per-category depth color shift** — subtle blue→amber gradient with z.
- [ ] **Reject permanently:** WebXR/VR, accelerometer parallax, post-processing bloom, mobile WebGL.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | v3.8 Dependency |
|---------|------------|---------------------|----------|-----------------|
| PerspectiveCamera (fov=55) | HIGH | LOW | **P1** | Camera swap in `WebGLConstellation.js` |
| 3D layout: category-z | HIGH | MEDIUM | **P1** | Extends `constellation.layout.js` + tests |
| OrbitControls drag-to-rotate | HIGH | LOW | **P1** | New import; configure flags |
| Click-vs-drag threshold | HIGH | MEDIUM | **P1** | Wraps existing `onSelectSkill` |
| Size-attenuated points (shader) | HIGH | LOW | **P1** | Existing shader edit |
| `prefers-reduced-motion` path preserved | HIGH | LOW | **P1** | Existing `useRendererCapability.js` |
| Cursor grab/grabbing | MEDIUM | LOW | **P1** | CSS only |
| Damping inertia | MEDIUM | LOW | **P1** | One flag on OrbitControls |
| Polar-angle clamp | HIGH | LOW | **P1** | Two numbers on OrbitControls |
| Auto-rotate idle spin | HIGH | LOW | **P2** | One flag + pause-on-start listener |
| First-render onboarding hint | MEDIUM | LOW | **P2** | New small bilingual component |
| Fog falloff | MEDIUM | LOW | **P2** | Shader uniforms |
| Camera-state persistence | LOW | MEDIUM | **P3** | Extends localStorage layer |
| Per-category depth color shift | LOW | MEDIUM | **P3** | Shader + skills.js extension |
| "Reset view" button | LOW | LOW | **P3** | UI button calling `controls.reset()` |

**Priority key:**
- **P1** Must ship for v3.10.0 — bar for "credible 3D."
- **P2** Ship if scope allows in v3.10.0; otherwise v3.10.1 micro-milestone.
- **P3** Backlog / future seed.

---

## Competitor / Pattern Reference

| Pattern | Sketchfab | Google Earth | Generic Three.js Demo | Carlos v3.10 Approach |
|---------|-----------|--------------|------------------------|------------------------|
| Default camera | Perspective ~45 fov | Perspective ~35 fov | R3F default 75 fov | **Perspective fov=55** (mid-range; avoids fisheye + flat) |
| Drag-to-rotate | Yes, primary gesture | Yes | Yes via OrbitControls | **Yes** (OrbitControls, `rotateSpeed=0.6`) |
| Auto-rotate on first load | Yes (on model viewer pages) | No | Often (demo flex) | **Yes, P2** — slow ~30 s/orbit, pause-on-interaction |
| Scroll-to-zoom | Yes | Yes | Default ON | **Disabled** — protects page scroll |
| Pan | Yes (right-drag) | Yes | Default ON | **Disabled** — prevents off-center drift |
| Click-vs-drag handling | Threshold-based | Threshold-based | Often broken in demos | **5 px / 250 ms threshold** |
| Damping | Yes | Yes | Often missing | **Yes, `dampingFactor=0.06`** |
| Size attenuation | N/A (meshes) | N/A | Sometimes on Points | **Yes, custom shader (already present)** |
| First-visit hint | Subtle "drag to rotate" icon | None (assumes familiarity) | None | **Yes, P2** — bilingual, auto-dismiss |
| Reduced-motion handling | Partial | Partial | Almost never | **Yes** — auto-rotate + damping suppressed |
| VR mode | Yes (cost: bundle + permission) | Yes (Earth VR) | Often demo-only | **No** — rejected as anti-feature |

---

## Quality Gate Self-Check

- [x] **Categories clear:** Table stakes (7) / Differentiators (7) / Anti-features (13).
- [x] **Complexity tagged per feature:** LOW / MEDIUM / HIGH in every row.
- [x] **v3.8 dependency identified per feature:** Every row in table stakes + differentiators names the existing file or hook the change touches.
- [x] **Single REQ discipline preserved:** DEPTH-01 maps to the P1 set; auto-rotate + hint flagged P2 (cuttable without breaking the credible-3D bar).
- [x] **Adaptive-fidelity divergence (GAME-01 reframe) surfaced** as a dependency note.
- [x] **Mobile path (SVG) untouched commitment honored** in anti-features.

## Sources

- [OrbitControls — three.js docs](https://threejs.org/docs/pages/OrbitControls.html)
- [OrbitControls.autoRotateSpeed reference](https://threejs.org/docs/#examples/en/controls/OrbitControls.autoRotateSpeed)
- [OrbitControls: Speed and sensitivity is too high — Issue #9577](https://github.com/mrdoob/three.js/issues/9577)
- [Camera Controls — Wawa Sensei React Three Fiber course](https://wawasensei.dev/courses/react-three-fiber/lessons/camera-controls)
- [3D Data Visualization with React and Three.js — Peter Beshai (Cortico)](https://medium.com/cortico/3d-data-visualization-with-react-and-three-js-7272fb6de432)
- [PointsMaterial size attenuation doesn't consider FOV — Issue #12150](https://github.com/mrdoob/three.js/issues/12150)
- [PointsMaterial's sizeAttenuation default — Issue #10385](https://github.com/mrdoob/three.js/issues/10385)
- [WebXR Perspective Retrospective — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Perspective)
- [Game Accessibility Guidelines — Default FOV](https://gameaccessibilityguidelines.com/if-the-game-uses-field-of-view-3d-engine-only-set-an-appropriate-default-for-the-expected-viewing-environment/)
- [Designing Safer Web Animation for Motion Sensitivity — A List Apart](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/)
- [Discover three.js — Extend with a Camera Controls Plugin](https://discoverthreejs.com/book/first-steps/camera-controls/)
- [3D Force Graph — vasturiano/3d-force-graph](https://github.com/vasturiano/3d-force-graph)
- [3D Artist Portfolio Guide for 2026 — Fast.io](https://fast.io/resources/3d-artist-portfolio/)
- [Controls Zoom & Pan Bug on Touch Devices — Issue #27073](https://github.com/mrdoob/three.js/issues/27073)
- [camera-controls (yomotsu) — alternative ref](https://github.com/yomotsu/camera-controls)
- Internal SEED: `.planning/seeds/SEED-3D-CONSTELLATION.md`
- Internal: `.planning/milestones/v3.8-REQUIREMENTS.md` (GAME-01 contract reframe context)

---
*Feature research for: v3.10 3D Constellation — adaptive-fidelity desktop WebGL upgrade*
*Researched: 2026-06-08*
