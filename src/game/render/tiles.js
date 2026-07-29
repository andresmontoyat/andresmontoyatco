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
// texture doesn't flicker as the camera moves, but adjacent tiles still differ.
function hashTile(tx, ty) {
  let h = (tx * 374761393 + ty * 668265263) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

// Index 0 is always the biome's original frame name — keeps tileNameFor('cyber', 0, 0, ...)
// deterministic at the world origin, since hashTile(0, 0) === 0.
const GROUND_VARIANTS = {
  pradera: ['ground_pradera', 'ground_pradera_2', 'ground_pradera_3'],
  desierto: ['ground_desierto', 'ground_desierto_2'],
  selva: ['ground_selva', 'ground_selva_2', 'ground_selva_3'],
  cyber: ['ground_cyber', 'ground_cyber_2'],
  castillo: ['ground_castillo', 'ground_castillo_2'],
}

export function tileNameFor(bi, wx, wy, nearPathDist) {
  if (nearPathDist < 30) return 'path'
  const variants = GROUND_VARIANTS[bi] || [`ground_${bi}`]
  const tx = Math.floor(wx / 32)
  const ty = Math.floor(wy / 32)
  return variants[hashTile(tx, ty) % variants.length]
}

export function walkFrame(dir, step) {
  return `carlos_${dir}_${Math.floor(step) % 3}`
}
