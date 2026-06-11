---
seed_id: SEED-DESTINY-DIRECTOR-AESTHETIC
planted: 2026-06-10
planted_during: v3.10.1 hot-fix iteration
status: backlog
candidate_for: v3.11
relates_to: DEPTH-01 (v3.10 — genuine 3D)
---

# SEED-DESTINY-DIRECTOR-AESTHETIC

## Context

Planted during v3.10.1 iteration. Operator feedback (literal): *"devemos tener algo parecido a destiny el juego de bungie"*. Current state of the v3.10 constellation post-hotfix:

- WebGL renders genuine 3D + OrbitControls + planets-tier (curated featured skills)
- Background: solid dark, no depth cue beyond constellation itself
- Planets: hard-edged orbs with halo bloom (basic glow filter)
- No labels (recruiters can't tell what each planet is without hovering)
- No ambient world-building — feels like a graph viz, not a place

The Destiny-2 Director (Bungie's solar-system map) feels like a destination — soft atmospheric glow on each celestial body, deep-space backdrop with nebula, labels that telegraph identity, cinematic camera motion. Aspiration: walking the deck of the Tower, panning across planets.

## Proposed scope (milestone-sized, ~5 elements)

### 1. Atmospheric halo bloom (per-planet)
- Replace current `haloFilter` hard edge with soft radial gradient bleed.
- Implement via custom fragment shader on planet Points OR billboard quads behind each planet.
- Recruiter outcome: planets feel atmospheric, glow into surrounding space.

### 2. Floating planet labels (HTML overlay)
- Project planet world position to screen each frame (`Vector3.project(camera)`).
- Render absolute-positioned `<div>` per featured skill with the skill label.
- Hide labels during drag-rotate (gesture mode); show after release.
- Recruiter outcome: instant readability — "ah, that big orb is Java, that's React, that's AWS".

### 3. Starfield background layer
- New `THREE.Points` layer with 500–800 deterministic stars.
- Ambient drift very slow (~60s full cycle); no interactivity.
- Behind constellation; renderOrder/depthTest tuned so stars never occlude planets.
- Recruiter outcome: depth cue — constellation sits IN space, not against a flat black wall.

### 4. Nebula sky sphere
- `MeshBasicMaterial` gradient sphere (radius ~1500, BackSide).
- Custom shader: dark-blue → black radial gradient + subtle volumetric noise (curl noise or simplex).
- Replaces current solid black backdrop.
- Recruiter outcome: cinematic horizon, no "black void" feeling.

### 5. Cinematic intro pan
- First paint: camera starts higher + further (e.g. y=+200, z=+800).
- Animate to default tilted angle over ~2s with ease-out cubic.
- Cede control to OrbitControls after intro completes.
- Suppress when `prefers-reduced-motion: reduce`.
- Recruiter outcome: "wow" moment on first paint — telegraphs interactivity AND polish.

## Costs / risks

- **Bundle:** estimated +15–25 kB gz (extra shaders + starfield Points + sky sphere). Plan 20-01 widened bundle-gate to 130 kB gz HARD; current WebGL ~125 kB → risk hitting WARN. Mitigation: pack labels as HTML overlay (no Three.js dep) keeps shader add small.
- **Mobile:** SVG path unchanged (mobile HARD gate intact). Director vibe is desktop-only.
- **Perf:** starfield = 500–800 extra Points → one extra draw call; well within 60 fps budget on capable desktop.
- **A11y:** labels MUST be `aria-hidden="true"` (decorative); SVG fallback for screen readers.
- **Reduced-motion:** intro pan + starfield drift suppressed; sky sphere + labels stay (static, decorative).

## Decisions to lock during discuss-phase

- Label strategy: HTML overlay (cheap, no shader) vs three-mesh-line (heavier, more cohesive)?
- Labels permanent vs hover-only vs ambient-visible-then-fade?
- Touch gesture for pinch-zoom — add (Director feel) or defer (scope creep)?
- Nebula color palette: stay in current ink-900 family or introduce blue/purple gradient?
- Intro pan: fixed 2s or scroll-triggered (only fire when section enters viewport)?

## Sibling considerations

- **D-20-PLANETS-TIER** stays — 10 featured skills define which orbs get labels + bigger halos.
- **D-17-FRAMELOOP single rAF** must be preserved — starfield drift + intro pan tick inside existing `tick()`.
- **D-17-LIGHTHOUSE-FLOW** mobile HARD gate stays — none of the new layers ship on mobile.

## Activation trigger

Resume work via `/gsd-new-milestone` → v3.11 ROADMAP creation → DEPTH-02 requirement (Destiny-Director vibe). Recommended sequence:
1. `/gsd-sketch` quick HTML mockup of nebula + labels concept (fast feedback loop)
2. `/gsd-new-milestone v3.11` to formalize requirements
3. `/gsd-ui-phase 21` to lock UI-SPEC for the 5 elements
4. `/gsd-plan-phase 21` to wave-execute

## Out of scope (carry to backlog / v3.12+)

- Free-look first-person camera (Director uses pinned-orbit, no FPV).
- Scroll-to-zoom (changes information density mid-scroll — UX risk).
- Per-planet ambient sound on hover (audio policy + a11y conflict).
- Real-time particle systems for "energy flow" between planets (perf cliff).
