# M6 — World Editor → Career World adapter (design)

Date: 2026-08-05
Status: approved for planning

## Problem

The world-editor (separate repo, `codehunters/tools/world-editor`) has shipped five
milestones — bundle loader, map engine, persistence + export, productivity tools +
autotiling, object manipulation — and produces an engine-neutral map JSON. Nothing
consumes it. The Career World game in this repo builds its world procedurally in code:
`buildOverworld()` places company sites from `src/data/experience.json` around hardcoded
`ANCHORS`, `tileNameFor()` picks ground per tile from a deterministic hash, and
`buildRoads()` derives the road graph from where those sites landed. Every editor feature
is unrealized value until the loop closes.

Two independent gaps stand between the two sides:

- **Asset identity.** The editor references frames as `"<bundle path>#<col>,<row>"`
  (e.g. `Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png#3,2`). The game draws from
  `src/game/assets/atlas.json` — 235 hand-curated *named* frames baked into a single
  `atlas.png` by `scripts/pack-atlas.mjs`.
- **World semantics.** An authored map is static tiles + objects. The game's world carries
  gameplay meaning: site metadata, collision footprints, door points, dialog triggers.

## Goal

Terrain and decoration become authorable in the editor and render in the game, without the
editor learning anything about this game and without the generated world being torn out.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Scope | Terrain + decoration. Company sites keep generating from `experience.json` |
| Composition | **Hybrid layered** — procedural stays as the base, authored layers draw on top |
| Site placement | **Authored anchors** — markers painted in the editor become `ANCHORS` |
| Where conversion runs | Build-time script in this repo. Editor stays engine-neutral |
| Map delivery | Committed JSON artifacts, no runtime fetch |
| Path mapping | Strip `Cute_Fantasy/` prefix → serve from `/game/cute-fantasy/` |

**Why hybrid over full replacement:** covering the world means hand-painting
2140×1360 ÷ 32 = 67×43 ≈ **2881 cells**. Full replacement leaves the adapter written but
unverified until that painting is finished, and a bug then shows as an empty screen with no
way to tell whether the export, the bake, or the render failed. Hybrid ships in one
milestone, verifies each piece against a world that already works, and *contains* full
replacement: once everything is painted, the procedural base is covered everywhere, stops
contributing, and gets deleted in one commit. The reverse is not true.

The honest cost: a visual seam where painted meets generated — two terrain grammars
touching. Mitigated by painting inward from natural boundaries (water, cliff, tree canopy).

## What already exists

The object half is nearly built. `public/game/placer.html` (Asset Placer) writes
`src/data/placements.json` → `WorldRpg.jsx` imports it → `worldRpg.js` sets
`world.placements` → `scene2d.js` folds them into the depth-sorted pass as `{frame, x, y}`
at native size, bottom-anchored. The file is currently `[]`. The bottom-center anchor
matches the editor's exactly. Authored objects need no new runtime path — they need that
file populated.

The genuinely new work is the tile layer.

## Architecture

Four build-time stages. Nothing new runs at runtime.

```
world-editor                 portfolio (build-time)                 game (runtime)
────────────                 ──────────────────────                 ──────────────
Export map.json  ──copy──►   src/game/world/authored/career.map.json
                                          │
                                   scripts/import-map.mjs
                                          │
                             ┌────────────┼────────────────┐
                             ▼            ▼                ▼
              manifest.authored.js   career.tiles.json   placements.json
              (named frames)         (cells + anchors)   (objects)
                             │            │                │
                    manifest.js merge     │                │
                             │            │                │
                      npm run assets:pack │                │
                             ▼            ▼                ▼
                      atlas.png/json  ──► drawAuthoredTiles ──► depth-sorted pass
```

`import-map.mjs` is the only new component with logic. It performs three translations:

1. **Frames** — each `path#col,row` becomes a manifest entry
   `{img, x: col*tileSize, y: row*tileSize, w: tileSize, h: tileSize}` under a
   deterministic name. `pack-atlas.mjs` bakes it untouched — it already bakes exactly the
   frames `MANIFEST` references, and already dedupes by source rect, so pixels already in
   the atlas are not duplicated.
2. **Cells** — `type:'tiles'` layers become `career.tiles.json` with frame names resolved.
3. **Objects and anchors** — `type:'objects'` layers become `placements.json`, except
   anchor layers (below), which become the `anchors` block of `career.tiles.json`.

Two export blocks the adapter deliberately does not consume:

- **`terrains`** — the editor's autotile definitions. `exportMap` already runs `resolveCell`
  before writing, so every exported cell carries a concrete `frame`; the `terrain` field is
  provenance. Nothing to translate.
- **`animations`** — playback geometry for animated source sheets. The game has its own
  animation system keyed to hand-named frames. M6 renders an animated authored tile as its
  **single referenced cell** (a still). Animated authored terrain is a non-goal; see Scope.

`manifest.authored.js`, `career.tiles.json` and `placements.json` are generated **and
committed**, like `atlas.png`/`atlas.json` today. `manifest.js` imports the generated frame
module and merges it into `MANIFEST.frames`.

The script runs on a machine that has the paid pack unpacked; it emits committable
artifacts; the game learns nothing about the editor's format. This is the same constraint
`assets:pack` already lives under.

## Data formats and conventions

### Frame naming

```
"Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png#3,2"  →  am_Tiles_Grass_Grass_1_Middle_3_2
```

Strip the `Cute_Fantasy/` prefix, drop the extension, replace every non-alphanumeric run
with `_`, append `_<col>_<row>`. The `am_` prefix isolates the authored namespace from the
235 hand-curated names (`ground_farm`, `house`, `path_center`) — collision is impossible.

### Layer names carry the semantics

Custom per-object properties do not exist in the editor. Layer names do, and are free-form.
They are the only convention this design invents.

| Layer name | Meaning |
|---|---|
| `anchor:<biome>` (`anchor:pradera`, `anchor:cyber`, …) | Objects layer holding **exactly one** object. Its position becomes `ANCHORS[<biome>]`. Biome must be one of the six known ones |
| any other `objects` layer | Entries in `placements.json` |
| `tiles` layers | Authored terrain, drawn in order |

### `career.tiles.json` — palette + triples

```json
{
  "version": 1, "tileSize": 32, "cols": 67, "rows": 43,
  "frames": ["am_Tiles_Grass_Grass_1_Middle_0_0", "am_Tiles_Path_Path_Tile_1_1"],
  "layers": [{ "name": "suelo", "cells": [[12,8,0],[13,8,0],[14,8,1]] }],
  "anchors": { "pradera": { "x": 380, "y": 700 } }
}
```

`cols`/`rows` above are the authored map's own dimensions, not a required match to the
game world. Cell `(x,y)` maps 1:1 onto the game's tile grid with origin at world `(0,0)`;
cells beyond the world bounds are kept and simply never enter the visible range. Note the
game world is 2140×1360 px, which is **not** a whole number of 32 px tiles (66.875 × 42.5) —
the right edge and bottom row are partial. Authoring a map of 67×43 covers it with a sliver
of overhang, which is correct and needs no special case.

`frames` is ordered by frame name, ascending, so the palette indices are stable across
re-imports.

Sizing drives the encoding: 2881 cells as `{x,y,frame}` objects is ~144 KB of text; as a
palette plus triples it is ~35 KB. This JSON **ships to the client** (the game island
imports it) and the site is under a hard Lighthouse mobile gate (Performance ≥0.95).

The cost is indirection — reading a diff, `[14,8,1]` requires looking up what `1` is. Taken
because the diff that matters ("moved the town") touches hundreds of cells anyway, where no
encoding is readable.

The game is loaded via dynamic `import()` from `WorldRpg.jsx`, so the map lands in the
game chunk, not the initial bundle — the bundle gate (WARN 60 / HARD 68 kB) is unaffected.

### Validations that abort the import

Failing loudly at build time is cheap; a corrupt map at runtime is a broken screen.

- Map `tileSize` ≠ 32 → error. The renderer hardcodes `TILE = 32`.
- A frame path that does not resolve to a real PNG under `public/game/cute-fantasy/` →
  error naming the path.
- An `anchor:*` layer with an unknown biome, zero objects, or more than one → error.
- A cell whose `col,row` falls outside the source PNG's real pixel dimensions → error.

## Render integration

One new function, `drawAuthoredTiles`, between procedural ground and the depth-sorted pass:

```
drawGround (procedural)        ← unchanged
drawAuthoredTiles              ← NEW
depthSortedDrawables           ← buildings, decor, critters, npcs, placements, windmill, avatar
overlays (night, particles, HUD, dialog)
```

It reuses `visibleTileRange(cam, vw, vh, TILE)` — the same culling `drawGround` already
does, so draw cost tracks the viewport, not how much has been painted. To avoid scanning
2881 cells per frame, the game builds a per-layer `Map` keyed `"x,y"` **once** at init;
the visible-tile loop does O(1) lookups. Layers draw in order, later ones overwrite.

**Era tint applies to authored tiles too.** `drawGround` washes every `cyber`/`castillo`
tile with `ERA_TINTS[bi]`. Exempting authored tiles turns the painted/generated seam into a
visible colour border — exactly what the hybrid must hide. Stated plainly: this **breaks
WYSIWYG in those two biomes** — the editor shows a clean tile, the game shows a washed one.
The other four biomes have no tint and paint what you see.

**Object transforms.** `placements` draws flat today. The editor emits
`flipX/flipY/rot/scale`, so a `drawTransformed` helper is needed
(`ctx.save/translate/rotate/scale`); the existing `drawFlipped` covers flipX only. An
object with no transform fields must draw **exactly** as today — that identity case is the
non-regression guarantee.

**Anchors.** `buildOverworld(json, biomeForYear, sideProjects)` gains authored anchors,
falling back to the current constants when absent. `ringPos`, `buildRoads` and
`nearestBiome` then work untouched: move the `cyber` marker in the editor and the town, its
roads, and the biome boundary all recompute.

`anchor:farm` carries more weight than the other five: `ANCHORS.farm` also fixes the player
spawn, the barn landmark and the windmill (all derived from it in `buildOverworld`). Moving
that marker moves the whole opening scene — intended, but worth knowing before dragging it.

**Unchanged:** `tileNameFor`, `hashTile`, `pathTileName`/`waterTileName`, ponds, procedural
decor, building collisions, dialogs, `experience.json` as the source of companies.

**Known hole, and an explicit non-goal:** authored objects **do not collide**. Paint a house
and the player walks through it. Only generated sites produce solids today. Collision would
require marking which object is solid — per-object properties the editor does not have.
Deferred, but stated before anyone paints a village of ghost houses.

## Testing

M6 lives entirely in this repo. The editor is not touched — a property of the design, not
an accident: needing to touch the editor would mean the adapter leaked to the wrong side.

Pure logic lives in `src/game/world/authored/convert.js` with vitest coverage;
`scripts/import-map.mjs` is an I/O shell (read json, write files). This matches the existing
pattern (`manifest.js` + `manifest.test.js`, `atlas.js` + `atlas.test.js`).

`convert.js` takes an injected `dimsOf(path) → {w,h}`. Production implements it with
`sharp`; tests pass an object literal. The fixture is a 3×3 map with two objects and one
anchor, and the suite needs zero bytes of the paid pack.

| Unit | Covered |
|---|---|
| `frameNameFor` | canonical case, odd characters, idempotency |
| layer classification | `anchor:pradera` → anchor; other `objects` → placements; `tiles` → terrain |
| palette + triples | frame dedupe, stable indices, deterministic order |
| validations | each of the four errors aborts, naming the offending path/layer |
| transforms | an object with no transform fields produces output identical to today's placement |
| `drawAuthoredTiles` | fake ctx + sprites (the `scene2d.test.js` pattern): draws only the visible range, respects layer order, skips empty cells |

**Determinism is non-negotiable:** same `map.json` + same pack → same bytes in atlas, tiles
and placements. `pack-atlas.mjs` was built this way ("No Date.now/Math.random"); the import
must hold the line, or every re-import dirties the diff without anything having changed.

**Before merge:** run `/verify` (the repo skill that drives the production build under
Playwright + Lighthouse). The map ships to the client and the mobile gate is ≥0.95;
verifying under `astro dev` proves nothing.

## Scope

**In:** `convert.js` + `import-map.mjs`; authored-frame merge into `manifest.js`;
`drawAuthoredTiles`; transforms for placements; authored anchors in `buildOverworld`; a
small seed map demonstrating the pipeline end to end.

**Out:**

- Collision for authored objects — needs per-object properties in the editor.
- Removing the procedural ground — the end of the hybrid road, not this milestone.
- Authored company sites — they keep coming from `experience.json`.
- Ponds, procedural decor, critters, NPCs.
- Animated authored tiles — the export's `animations` block is ignored; an animated source
  renders as a still. **Deferred to a later milestone by explicit decision**, not an
  oversight: the block survives in the committed `career.map.json`, so wiring it up later
  needs no re-authoring and no re-export.
- Running the import in CI — impossible, the pack is gitignored.

## Assumption to verify first

Bundle paths are assumed to be full ZIP entry names including the pack root, i.e.
`Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png`. Reading `src/bundle/import.js` in the editor
supports this (`images.push({ path: f.name, … })`, and `unzip -l Cute_Fantasy.zip` shows
entries under a `Cute_Fantasy/` root), but it has not been confirmed against a real export.
The first task of the plan should produce one real export and check the shape before any
conversion code is written — the whole path-mapping rule rests on it. If the root segment
turns out to be absent or different, the rule becomes "strip the first segment when it
matches the pack root directory", and the PNG-resolution validation catches the rest.

## Open questions (deliberately unresolved)

1. **Retire `placer.html` + `dump-world.mjs` + `pack:index`?** The editor supersedes them.
   Recommended: mark deprecated in M6, delete once the seed map demonstrates parity.
   Deleting first and discovering a gap later is worse.
2. **`.nvmrc` with `22`.** The repo needs Node ≥22.12 and does not declare it — found when
   `astro dev` refused to start under the shell's default v20.20.2. Fits as M6's first
   commit.
