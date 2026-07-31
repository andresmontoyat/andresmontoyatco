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

// Distance (world px) from the path polyline within which a tile counts as "on path" — shared
// by tileNameFor's own on/off-path decision and scene2d.js's 4-neighbor edge check, so both
// agree on exactly the same road footprint.
export const PATH_THRESHOLD = 30

export function tileNameFor(bi, wx, wy, nearPathDist) {
  if (nearPathDist < PATH_THRESHOLD) return 'path'
  const variants = WEIGHTED_GROUND_VARIANTS[bi] || [`ground_${bi}`]
  const tx = Math.floor(wx / 32)
  const ty = Math.floor(wy / 32)
  return variants[hashTile(tx, ty) % variants.length]
}

// Picks which of the 9-cell Path_Tile.png autotile frames (manifest.js's path_center/_n/_s/_w/
// _e/_nw/_ne/_sw/_se) a road tile should draw, given whether its 4 grid neighbors are also
// "on path" (nearestPathDist < PATH_THRESHOLD there too). This is a lightweight edge-picker, not
// a full 16-tile bitmask autotile: it recognizes the plain interior, a single straight edge, and
// an outer corner (two ADJACENT off-path sides) — the shapes the road's own polyline actually
// produces (straight runs + turns). A grass-fringe on 3+ sides, or on two OPPOSITE sides (an
// isolated one-tile-wide sliver), has no single matching cell in a 9-frame set; falling back to
// the solid center reads as "still road" rather than a mismatched edge, which is the safer
// choice for an approximation this simple.
export function pathTileName(n, e, s, w) {
  const offN = !n; const offE = !e; const offS = !s; const offW = !w
  if (!offN && !offE && !offS && !offW) return 'path_center'
  if (offN && offW && !offE && !offS) return 'path_nw'
  if (offN && offE && !offW && !offS) return 'path_ne'
  if (offS && offW && !offE && !offN) return 'path_sw'
  if (offS && offE && !offW && !offN) return 'path_se'
  if (offN && !offE && !offS && !offW) return 'path_n'
  if (offS && !offE && !offN && !offW) return 'path_s'
  if (offW && !offN && !offE && !offS) return 'path_w'
  if (offE && !offN && !offS && !offW) return 'path_e'
  return 'path_center'
}

// Avatar draw order, bottom → top: bare base body, then the modular Iron-plate armor layers.
// drawAvatar (scene2d.js) draws avatarFrame(layer, dir, step) for each, stacked at the same
// dx,dy — the layer frames share the base's rects (see manifest.js) so they composite exactly.
export const AVATAR_LAYERS = ['carlos', 'legs', 'chest', 'helm']

export function avatarFrame(layer, dir, step) {
  return `${layer}_${dir}_${Math.floor(step) % 3}`
}

export function walkFrame(dir, step) {
  return avatarFrame('carlos', dir, step)
}
