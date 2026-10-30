# 3. The map can paint its own water

- Status: accepted
- Date: 2026-10-30
- Deciders: Carlos Andres Montoya
- Amends: [0002](0002-the-map-can-lay-its-own-roads.md) — "Pond life stays, because the ponds are still the game's"

## Context

After 0002 the map owns the houses, the town anchors, the roads and the land decor. Water is the last
piece of geography the game still invents. Two ponds live in `CONFIG.pond.ponds` (`src/game/config.js`)
as a centre and a radius, and five places read them:

- `drawGround` picks the water autotile with `pondAt` and `resolveWaterFrame` (`render/scene2d.js`);
- `groundOwnsCell` keeps authored tiles off those cells;
- `pondSolids` turns each one into a collision circle (`worldRpg.js`);
- `buildPondLife` puts lilypads, cattails, a kapybara and a frog on them (`world/decor.js`);
- `drawPondWaves` animates rings over them (`render/ambient.js`).

The editor knows none of this. Re-authoring the whole map by hand through the editor on 2026-10-29
showed what that costs:

- **Blind authoring.** The scatter placed a tree inside a pond, because the author cannot see where
  the water goes until the game runs.
- **The pond's outline is not the author's.** It is drawn by the game, on top of whatever the map
  painted around it, so it reads as a hard blue shape on top of the map's grass.
- **Moving a pond means editing code.** The author has to edit `config.js` and estimate a radius in
  pixels.

This is the same gap 0002 closed for roads. Water placement is a composition decision; the code
should not make it.

## Decision drivers

- The editor must show the world the way the game will draw it. No hidden geography may decide
  where decor can go.
- Water must keep its behaviour: the player cannot walk on it, it carries life, and it moves.
- Same contract as 0002: one layer name, and a map without that layer behaves exactly as today.
- The pack already ships the art: `Tiles/Water/Water_Tile_1.png` is the same 9-cell island set the
  editor already autotiles for the road.

## Considered options

1. **The game keeps the ponds; the editor imports them as no-go zones.** This is the cheapest. But the
   outline still belongs to the code, a pond still moves only through `config.js`, and the editor
   needs a read-only layer it cannot edit.
2. **The map paints water on a `water` layer; the game derives behaviour from the painted cells.**
   - The author draws the water with a brush, like the road.
   - The game reads the painted cells and turns them into collision, pond life and waves.
3. **The map paints the water and also places every lilypad and frog by hand.** This is the purest
   version, but it loses the seeded variety and adds manual work for something nobody needs to
   decide.

## Decision

**Option 2. A map may paint water on a tiles layer named `water`. When it does, the map owns the
water, and the game derives water behaviour from the painted cells.**

**The procedural ponds step aside.** This happens only when the map has a `water` layer.
- `drawGround` and `groundOwnsCell` stop calling `pondAt` on `CONFIG.pond.ponds`.
- The authored cells are drawn like any other tile layer.
- Water cells are exempt from the era tint, as procedural water is today.

**Each body of water is found from the cells.** A body is a 4-connected component of painted
`water` cells.
- Each body becomes a record `{ x, y, r, cells }`, where `x, y` is the centroid and `r` is
  `sqrt(area / π)`.
- `world.ponds` keeps its shape, so `buildPondLife` and `drawPondWaves` work unchanged.
- The game no longer reads positions from `CONFIG.pond.ponds`. The `config.js` entry stays only as
  the fallback for a map without water.

**Collision follows the cells, not a circle.**
- Every water cell is solid. Each horizontal run of cells in a row merges into one AABB, so a pond is
  a handful of rectangles, not one per tile.
- `collisionFactor` becomes an inset in pixels on each run. This keeps the shore walkable.

**In the editor, water is ordinary terrain.**
- `agua` is made from `Water_Tile_1.png` with the terrain wizard.
- The scatter always treats `water` cells as blocked. Today its dialog can avoid only one tile layer
  (`#sc-avoid-layer`, through `dilateCells`), which is already used for `road`. The `water` layer
  is therefore blocked automatically, on top of the layer chosen in the dialog.

**The import checks the water layer.** It is a tiles layer and must use only the water terrain's
frames. A body smaller than 2×2 cells fails the import. The 9-cell set has no frame for a smaller
body, and the game already trims such tips to grass.

## Consequences

Good:

- The author sees the final shoreline in the editor. The scatter cannot drop a tree in a pond.
- Ponds can take any shape: a river, a lake, or a moat around the castle. The code does not change.
- The last piece of geography in `config.js` is gone. Every geographic element of the world now lives
  in the map.

Bad, and accepted:

- **The layer name is the contract.** If `water` is renamed, the procedural ponds come back.
- **Pond life is an approximation for irregular bodies.** It is placed around the centroid and
  radius, so on a long river or an L-shaped lake a lilypad can land on the shore. If that shows, the
  fix is to sample random cells of the body instead of a circle. The record shape stays the same.
- **More collision boxes.** A long river can have dozens of runs. The solids are already culled
  near the player, so this is cheap, but it is no longer two circles.
- **Two water sources in the code** until the fallback is removed. The same was accepted for
  roads in 0002.

## Confirmation

- `scene2d.test.js`: with a `water` layer, no procedural pond tile is drawn, and `groundOwnsCell`
  ignores `CONFIG.pond.ponds`. Without the layer, rendering is unchanged.
- A unit test of the body extraction: two separate bodies are found. An L-shaped body is one body,
  with the expected centroid and `r`. Diagonal cells do not join.
- A collision test: a 3×2 body gives 2 merged AABBs, and the player cannot enter a water cell.
- The import test fails on a body smaller than 2×2 and passes on the 2026-10-29 acceptance map once
  it paints water.
- Editor: `scatter.test.js` checks that no position lands on a `water` cell.
