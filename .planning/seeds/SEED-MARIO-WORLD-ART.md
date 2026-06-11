# SEED-MARIO-WORLD-ART

**Status:** OPEN
**Marker:** OPEN-ART-1
**Created:** Phase 22, Task 22.6
**Owner:** unassigned

## Context

Phase 22 (Mario-World view) ships with **placeholder sprite assets** so the
WebGLWorldMap renderer can load textures and the integration tests pass.
High-fidelity pixel art is deferred to a future art pass.

## What is in place (placeholders)

Solid-color WebP swatches generated via `sharp` in
`scripts/_make-placeholders.mjs`:

| Path                                       | Size   | Color    | Role                |
|--------------------------------------------|--------|----------|---------------------|
| `public/sprites/biome-pradera.webp`        | 256×256| #5cb85c  | Pradera tile        |
| `public/sprites/biome-desierto.webp`       | 256×256| #d4a55b  | Desierto tile       |
| `public/sprites/biome-selva.webp`          | 256×256| #2e6b3f  | Selva tile          |
| `public/sprites/biome-cyber.webp`          | 256×256| #3b82f6  | Cyber tile          |
| `public/sprites/biome-castillo.webp`       | 256×256| #a855f7  | Castillo tile       |
| `public/sprites/avatar-carlos-walk.webp`   | 64×64  | #22d3ee  | Avatar walk-cycle   |
| `public/sprites/world-icons.webp`          | 64×64  | #facc15  | World icons atlas   |

## What is missing (OPEN-ART-1)

The following art is **deferred**:

- **Biome tiles** — Replace 256×256 solid swatches with tileable pixel art
  per biome (grass, sand, jungle canopy, cyber-grid, castle stone). Should
  tile seamlessly when repeated across the WebGL plane.
- **Avatar walk-cycle** — Replace 64×64 swatch with a true sprite sheet:
  16×64 px, 4 frames stacked horizontally (idle + 3 walk frames). Pixel
  art, 2-color palette per spec.
- **World icons atlas** — Replace 64×64 swatch with an atlas of the 5 world
  marker icons (one per biome) used by the world map overlay.

## Acceptance for closing OPEN-ART-1

- All 7 files above replaced with hand-authored art.
- Visual review against `.planning/phases/21*/UI-SPEC.md` (Mario-World
  pillar).
- Lighthouse + bundle-gate still pass (file sizes must stay under the
  Phase 22 art budget).
- This seed file marked `Status: CLOSED` and archived.

## How placeholders were generated

```bash
node scripts/_make-placeholders.mjs
```

Script uses the `sharp` dependency (already in `package.json`) to emit
solid-color WebPs. Safe to re-run — output is deterministic and overwrites
in place.
