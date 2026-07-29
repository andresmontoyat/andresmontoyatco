export function nearestBiome(regions, wx, wy) {
  let b = regions[0].bi
  let md = Infinity
  for (const r of regions) {
    const d = (wx - r.x) ** 2 + (wy - r.y) ** 2
    if (d < md) { md = d; b = r.bi }
  }
  return b
}

export function tileNameFor(bi, wx, wy, nearPathDist) {
  if (nearPathDist < 30) return 'path'
  return `ground_${bi}`
}

export function walkFrame(dir, step) {
  return `carlos_${dir}_${Math.floor(step) % 3}`
}
