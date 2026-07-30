// Deterministic decoration scatter (trees/bushes/rocks/flowers/fences) for the RPG overworld.
// Pure — no canvas, no Math.random. Seeded with a small mulberry32 PRNG so the same
// (world, seed) pair always yields the same layout.

const TYPES = ['tree', 'tree_small', 'bush', 'rock', 'flower', 'fence']
const SOLID_TYPES = new Set(['tree', 'tree_small', 'rock', 'fence'])
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
  return decor
}

export default buildDecor
