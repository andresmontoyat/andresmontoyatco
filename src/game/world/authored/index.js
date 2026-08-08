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

export default buildAuthoredIndex
