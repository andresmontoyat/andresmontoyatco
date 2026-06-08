---
seed_id: SEED-3D-CONSTELLATION
planted: 2026-06-08
planted_during: v3.9 Phase 18 execute (between Phase 18 GREEN and Phase 19 discuss)
planted_by: user question "qué necesitamos para que la constelación sea 3D?"
trigger_when:
  - User starts a milestone whose theme is "wow upgrade", "interactive depth", "recruiter conversion improvements", or "visual polish v2"
  - Lighthouse mobile gate is no longer the binding constraint (e.g. game-mode lazy chunk grows comfortably under 200 kB gz on desktop without affecting mobile)
  - Recruiter UAT feedback shows the current 2D WebGL constellation does not differentiate enough from competitor portfolios
  - User explicitly asks to "make the constellation 3D" or "add depth" or "rotate the constellation"
related_phases: 14 (D-14-01-LAYOUT 2D baked), 17 (D-17-VISUAL flat 2D-in-3D ortho, D-17-LIB three.js raw)
related_decisions_to_revisit: D-14-01-LAYOUT, D-17-VISUAL, D-17-PRIMITIVES (Points may need z-attribute), GAME-01 (SVG ↔ WebGL identical-contract spirit)
---

# SEED: 3D Constellation (genuine perspective + rotation)

## Idea

Convert the current flat 2D-in-3D WebGL constellation to a genuine 3D experience: `PerspectiveCamera` instead of `OrthographicCamera`, per-node `z` coordinate (depth), and either auto-rotation or drag-to-rotate via `OrbitControls`. Mobile + reduced-motion + Save-Data users continue on the 2D SVG path unchanged — accept visual divergence between renderers in exchange for desktop "wow" lift.

## Why This Matters

Current state (post-v3.9 Phase 17): WebGL constellation looks identical to SVG fallback because `OrthographicCamera` flattens the scene. Recruiter on a capable desktop sees no real differentiation vs the SVG path — the WebGL adapter ships 117 kB gz of three.js + custom shaders for ambient drift / glow pulse / chip-flash, but the **shape** is 2D. 3D adds the visual differentiation the lazy chunk's bundle cost was supposed to buy.

Carlos's core value (PROJECT.md): "stop recruiters mid-scroll." A constellation you can rotate / explore in depth stops scrolls more than a static 2D star field.

## What's Needed (technical breakdown)

### Data layer
- Extend `computeLayout` (`src/game/constellation.layout.js`) to return `{x, y, z}` per node, NOT `{x, y}`. Options:
  - **Category-z clusters** (recommended): assign `z` per category — backend layer at z=-100, frontend at z=+100, etc. Visually communicates the architecture stack.
  - Procedural deterministic: `z = -150 + Math.sin(node.idx) * 100`. Zero deps, cheap.
  - `d3-force-3d` (~15 kB gz) — violates D-14-01-LAYOUT "zero d3-force in client". Reject unless that decision is explicitly reopened.
- Update Phase 14 tests (constellation.layout.test.js, constellation.graph.test.js) for new shape.

### Renderer
- `OrthographicCamera` → `PerspectiveCamera(fov=60, aspect, near=1, far=1000)`. ~5 LOC in `WebGLConstellation.js`.
- Camera position `(0, 0, 500)` looking at origin.
- `OrbitControls` (from `three/examples/jsm/controls/OrbitControls.js`, ~5 kB gz lazy) for drag-to-rotate. Optional alternative: auto-rotate via rAF uniform.
- Existing Points + LineSegments + ShaderMaterial geometry just needs the new z-coord — shaders barely change.

### Decisions to revisit when this seed activates
- **D-14-01-LAYOUT** (deterministic 2D radial, zero d3-force) — extend to 3D; if d3-force-3d is chosen, decision is overridden.
- **D-17-VISUAL** (flat 2D-in-3D ortho aesthetic) — replace with genuine 3D contract.
- **D-17-PRIMITIVES** Points + ShaderMaterial — shader needs minor update for size attenuation by depth.
- **GAME-01** "identical props contract" between SVG + WebGL renderers — visually they will diverge (SVG cannot render perspective 3D without huge SVG transform complexity). Accept the divergence OR add caveat to contract.

### What does NOT change
- Mobile path (SVG) — unchanged, still flat 2D. **Lighthouse mobile gate stays cleared.**
- A11y — `prefers-reduced-motion` users get SVG (no rotation), policy preserved.
- ConstellationFallback sr-only DOM list — unchanged.
- Bundle: three.js already shipped (~117 kB gz lazy desktop). +5 kB for OrbitControls. +0 mobile.

## Risks / Concerns

1. **SVG ↔ WebGL visual divergence** — breaks the spirit of GAME-01 "single props contract" even if the props are still identical. Recruiter using mobile sees a different feeling than one on desktop. Frame as feature (adaptive fidelity) not bug.
2. **Drag-to-rotate may interfere with click-to-select node** — needs careful event-handler ordering (drag-threshold ≥5px before suppressing click, etc.).
3. **Z-clustering choice = design decision** — category-by-z communicates architecture layers, but recruiters may read it as "more skills = depth". Validate with a 1-day UAT before committing.
4. **Mobile users get LESS** than desktop — increases the gap. May want a "switch to 3D" toggle for capable mobile in v3.11+ (likely won't work — three.js mobile-Safari WebGL perf cliff).

## Estimated Scope

- 1 phase (likely Phase 22 or 23 depending on roadmap state at activation)
- ~2-3 plans: (1) extend layout to 3D + update Phase 14 tests, (2) WebGLConstellation perspective + OrbitControls, (3) UAT + tuning
- ~3-5 days
- Mostly inside `src/game/constellation.layout.js` + `src/game/renderers/WebGLConstellation.js` + their tests. Zero new files unless category-z values live in `src/data/skills.js`.

## Cross-references

- `.planning/phases/14-foundation-data-layer-viewmode-toggle-test-infra/14-CONTEXT.md` (D-14-01-LAYOUT)
- `.planning/phases/17-webgl-desktop-renderer-lighthouse-gate/17-CONTEXT.md` (D-17-VISUAL, D-17-LIB, D-17-PRIMITIVES)
- `.planning/milestones/v3.8-REQUIREMENTS.md` (GAME-01 adaptive contract — must be re-read to decide if 3D divergence is acceptable)
