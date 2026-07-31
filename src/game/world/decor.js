// Deterministic decoration scatter (trees/bushes/rocks/flowers/fences) for the RPG overworld.
// Pure — no canvas, no Math.random. Seeded with a small mulberry32 PRNG so the same
// (world, seed) pair always yields the same layout.

const TYPES = ['tree', 'tree_small', 'tree_birch', 'tree_spruce', 'tree_fruit', 'bush', 'rock', 'flower', 'fence']
const SOLID_TYPES = new Set(['tree', 'tree_small', 'tree_birch', 'tree_spruce', 'tree_fruit', 'rock', 'fence'])
const DENSITY = 1 / 20000 // ~1 decor item per 20000 sq px of world area
const FARM_CLEAR_RADIUS = 110
const BUILDING_PAD = 24

function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildingRects(world) {
  return world.sites.concat(world.hiddenSites).map(s => ({
    x: s.cx - s.w / 2 - BUILDING_PAD,
    y: s.cy - BUILDING_PAD,
    w: s.w + BUILDING_PAD * 2,
    h: s.h + BUILDING_PAD * 2,
  }))
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

function inCircle(x, y, c) {
  return (x - c.x) ** 2 + (y - c.y) ** 2 <= (c.r || 0) ** 2
}

function blocked(x, y, rects, circles) {
  return rects.some(r => inRect(x, y, r)) || circles.some(c => inCircle(x, y, c))
}

function placeOne(rand, world, rects, circles) {
  const x = rand() * world.worldW
  const y = rand() * world.worldH
  if (blocked(x, y, rects, circles)) return null
  const type = TYPES[Math.floor(rand() * TYPES.length)]
  return { x, y, type, solid: SOLID_TYPES.has(type) }
}

// Aquatic decor per pond: a few floating lilypads + cattails plus one bathing kapybara — all
// non-solid, sitting on water the player can't reach anyway. Deterministic (same seeded PRNG). The
// Kapybara_Idle sprite has an opaque water background (it's a capybara IN the water), so it's kept
// well inside the pond (<=0.3r) where that background blends with the water tiles rather than
// showing as a square on the grass bank. Lilypads/cattails are transparent and float within 0.68r.
function buildPondLife(ponds, rand) {
  return (ponds || []).flatMap(p => {
    const life = []
    for (let i = 0; i < 4; i += 1) {
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand()) * p.r * 0.68
      life.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, type: rand() < 0.6 ? 'lilypad' : 'cattail', solid: false })
    }
    const ka = rand() * Math.PI * 2
    life.push({ x: p.x + Math.cos(ka) * p.r * 0.3, y: p.y + Math.sin(ka) * p.r * 0.3, type: 'kapybara', solid: false })
    // A frog on the bank (transparent sprite, so the grass shows through — unlike the kapybara).
    const fr = rand() * Math.PI * 2
    life.push({ x: p.x + Math.cos(fr) * p.r * 0.92, y: p.y + Math.sin(fr) * p.r * 0.92, type: 'frog', solid: false })
    return life
  })
}

export function buildDecor(world, seed = 1) {
  const rand = mulberry32(seed)
  const rects = buildingRects(world)
  const circles = [{ x: world.farm.x, y: world.farm.y, r: FARM_CLEAR_RADIUS }, ...(world.ponds || [])]
  const count = Math.round(world.worldW * world.worldH * DENSITY)
  const decor = []
  for (let i = 0; i < count; i += 1) {
    const d = placeOne(rand, world, rects, circles)
    if (d) decor.push(d)
  }
  return decor.concat(buildPondLife(world.ponds, rand))
}

export default buildDecor
