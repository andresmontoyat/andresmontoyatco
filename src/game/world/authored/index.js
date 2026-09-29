import { WORLD_TILE } from './convert.js'

// Runtime side of the authored map. The tile JSON stores cells as [x, y, paletteIndex] to keep
// the shipped file small; the renderer needs O(1) "what is at this cell" during the visible-tile
// loop, so the triples are turned into one Map per layer, once, at world build time.
export function buildAuthoredIndex(tiles) {
  if (!tiles || !tiles.layers) return []
  return tiles.layers.map(l => ({
    name: l.name,
    cells: new Map(l.cells.map(([x, y, i]) => [`${x},${y}`, tiles.frames[i]])),
  }))
}

// worldSizeOf: the world's extent in game pixels, as the authored map defines it.
//
// The map owns the size (docs/adr/0001). WORLD_W/WORLD_H were hand-tuned constants, and 2140 is not
// even a whole number of 32px tiles — that mismatch is why 220px of the world carried no authored
// tiles: the carpet simply ended before the world did. Derived, the world ends where the map ends
// and the gap cannot exist.
//
// Measured in WORLD_TILE, not the artifact's own `tileSize`: the latter is the pack's source
// granularity (16) while the game draws each cell at 32, and measuring with the source number would
// halve the world.
export function worldSizeOf(tiles) {
  if (!tiles || !tiles.cols || !tiles.rows) return null
  return { w: tiles.cols * WORLD_TILE, h: tiles.rows * WORLD_TILE }
}

export default buildAuthoredIndex
