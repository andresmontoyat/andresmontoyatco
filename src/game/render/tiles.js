export function nearestBiome(regions, wx, wy) {
  let b = regions[0].bi
  let md = Infinity
  for (const r of regions) {
    const d = (wx - r.x) ** 2 + (wy - r.y) ** 2
    if (d < md) { md = d; b = r.bi }
  }
  return b
}

// Deterministic per-tile hash — same (tx,ty) always yields the same variant, so ground
// texture doesn't flicker as the camera moves, but adjacent tiles still differ. Exported so
// scene2d.js's cyber/castillo era-tint wash can scatter its shade variants off the SAME hash
// (same tile always gets the same frame variant AND the same tint shade), instead of re-deriving
// a second, uncoordinated hash.
export function hashTile(tx, ty) {
  let h = (tx * 374761393 + ty * 668265263) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

// Index 0 is always the biome's original frame name — keeps tileNameFor('cyber', 0, 0, ...)
// deterministic at the world origin, since hashTile(0, 0) === 0.
const GROUND_VARIANTS = {
  farm: ['ground_farm', 'ground_farm_2', 'ground_farm_3'],
  pradera: ['ground_pradera', 'ground_pradera_2', 'ground_pradera_3'],
  desierto: ['ground_desierto', 'ground_desierto_2', 'ground_desierto_3'],
  selva: ['ground_selva', 'ground_selva_2', 'ground_selva_3'],
  cyber: ['ground_cyber', 'ground_cyber_2'],
  castillo: ['ground_castillo', 'ground_castillo_2'],
}

// Per-biome bias, aligned by index to GROUND_VARIANTS[bi]. farm/pradera's accent cells (paler
// Sprout Lands tufts) are a much lighter tone than the saturated cute-fantasy base grass — even
// a 4:1 split still read as a visible checker at a glance (polish-pass screenshot review), so the
// base is weighted further: base:accent is now 6:1 per accent cell, making each accent a rare
// fleck of texture rather than a repeating pattern. Biomes not listed here fall back to an even
// split, which is fine where every variant is already the same tone family (selva, desierto) or
// where the "base" cell isn't the visually-dominant one (cyber/castillo's cliff cell already
// carries the dirt band).
const GROUND_WEIGHTS = {
  farm: [6, 1, 1],
  pradera: [6, 1, 1],
}

function weighted(list, weights) {
  return list.flatMap((name, i) => Array((weights && weights[i]) || 1).fill(name))
}

const WEIGHTED_GROUND_VARIANTS = Object.fromEntries(
  Object.entries(GROUND_VARIANTS).map(([bi, list]) => [bi, weighted(list, GROUND_WEIGHTS[bi])]),
)

export function tileNameFor(bi, wx, wy, nearPathDist) {
  if (nearPathDist < 30) return 'path'
  const variants = WEIGHTED_GROUND_VARIANTS[bi] || [`ground_${bi}`]
  const tx = Math.floor(wx / 32)
  const ty = Math.floor(wy / 32)
  return variants[hashTile(tx, ty) % variants.length]
}

export function walkFrame(dir, step) {
  return `carlos_${dir}_${Math.floor(step) % 3}`
}
