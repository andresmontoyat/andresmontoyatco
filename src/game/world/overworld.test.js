import { describe, it, expect } from 'vitest'
import { startYear, buildOverworld, projectOntoSpine, WORLD_W, WORLD_H } from './overworld.js'
import { biomeForYear } from './biomes.js'
import { doorPoint } from '../entities/site.js'

const JSON_FIXTURE = {
  entries: [
    { id: 'a', visible: true, featured: true, date: { en: 'May 2026 — Present' }, title: { en: 'Arch', es: 'Arq' }, company: 'Soldife', metric: { v: '6+9', en: 'ms', es: 'ms' }, tech: ['Java'] },
    { id: 'b', visible: true, date: { en: 'Apr 2007 — Jun 2009' }, title: { en: 'Dev', es: 'Dev' }, company: 'Mercurio', tech: ['Java'] },
    { id: 'h', visible: false, date: { en: '2015' }, title: { en: 'X', es: 'X' }, company: 'Hidden', tech: [] },
  ],
}

// What the map contributes, in game pixels: an anchor per town (anchor:<name> layers) and a door per
// visible experience (interactables.json, footprint measured at import).
const ANCHORS = {
  farm: { x: 360, y: 1120 }, pradera: { x: 380, y: 700 }, desierto: { x: 820, y: 400 },
  selva: { x: 1300, y: 560 }, cyber: { x: 1360, y: 1040 }, castillo: { x: 1820, y: 760 },
}
const door = (over = {}) => ({ uid: 'U3', kind: 'door', id: 'a', x: 1700, y: 700, w: 120, h: 160, ...over })
const DOORS = [door(), door({ uid: 'U4', id: 'b', x: 400, y: 600, w: 66, h: 88 })]
const build = (json = JSON_FIXTURE, opts = {}) => buildOverworld(json, biomeForYear, { anchors: ANCHORS, doors: DOORS, ...opts })
const siteFor = (world, id) => world.sites.find(s => s.id === id)

describe('startYear', () => {
  it('extracts the first 4-digit year from the English date', () => {
    expect(startYear({ date: { en: 'Apr 2007 — Jun 2009' } })).toBe(2007)
  })
  it('returns 0 when no year present', () => {
    expect(startYear({ date: { en: 'Present' } })).toBe(0)
  })
})

describe('buildOverworld', () => {
  const w = build()

  it('drops entries with visible === false', () => {
    expect(w.sites.find(s => s.co === 'Hidden')).toBeUndefined()
  })
  it('orders sites chronologically by start year', () => {
    expect(w.sites.map(s => s.id)).toEqual(['b', 'a'])
  })
  it('types featured entries as castle and others as house', () => {
    expect(siteFor(w, 'a').type).toBe('castle')
    expect(siteFor(w, 'b').type).toBe('house')
  })
  it('assigns each site a biome from its year', () => {
    expect(siteFor(w, 'b').bi).toBe('pradera')
    expect(siteFor(w, 'a').bi).toBe('castillo')
  })
  it('places a barn landmark at the farm spawn', () => {
    expect(w.farmBuilding.building).toBe('barn')
    expect(w.farmBuilding.w).toBeGreaterThan(0)
  })
  it('exposes ponds inside world bounds', () => {
    expect(w.ponds.length).toBeGreaterThan(0)
    w.ponds.forEach(p => {
      expect(p.x - p.r).toBeGreaterThan(0)
      expect(p.x + p.r).toBeLessThan(w.worldW)
      expect(p.y - p.r).toBeGreaterThan(0)
      expect(p.y + p.r).toBeLessThan(w.worldH)
    })
  })
  it('places an animated windmill at the farm, clear of the spawn column', () => {
    expect(w.farmWindmill.w).toBeGreaterThan(0)
    expect(w.farmWindmill.h).toBeGreaterThan(0)
    // its tower footprint must not overlap the player spawn (farm.x, farm.y + 70)
    const towerRight = w.farmWindmill.cx - w.farmWindmill.w / 2 + w.farmWindmill.w * (69 / 128)
    expect(towerRight < w.farm.x - 12 || w.farmWindmill.cx - w.farmWindmill.w / 2 > w.farm.x + 12).toBe(true)
  })
  it('flags injected side-projects as hidden, with a building the game draws itself', () => {
    const w3 = build(JSON_FIXTURE, { sideProjects: [{ co: 'Mr. Yoker', title: { en: 'Indie', es: 'Indie' }, date: { en: 'side', es: 'propio' }, tech: ['Astro'] }] })
    expect(w3.hiddenSites).toHaveLength(1)
    expect(w3.hiddenSites[0].hidden).toBe(true)
    expect(w3.hiddenSites[0].building).toBeTruthy()
  })
})

// Per docs/adr/0001 the map is the only source of houses: a `door:<id>` object placed in the editor
// gives an experience its position, footprint and art; the CV entry gives everything else.
describe('buildOverworld builds houses from the map alone', () => {
  it('places the house where the map put it', () => {
    const s = siteFor(build(), 'a')
    expect(s.cx).toBe(1700)
    // The editor anchors an object by its BOTTOM edge; a site's cy is its top, the way the barn's is
    // (cy = anchor.y - 110, drawn downward by its height). Converting is not optional: skip it and
    // every authored house floats one sprite-height above its own shadow.
    expect(s.cy).toBe(700 - 160)
    expect({ w: s.w, h: s.h }).toEqual({ w: 120, h: 160 })
  })

  it('marks it authored, and leaves it no building sprite to draw', () => {
    const s = siteFor(build(), 'a')
    expect(s.authored).toBe(true)
    expect(s.building).toBeNull()
  })

  it('keeps every other field of the experience', () => {
    const s = siteFor(build(), 'a')
    expect(s.co).toBe('Soldife')
    expect(s.title).toEqual({ en: 'Arch', es: 'Arq' })
    expect(s.tech).toEqual(['Java'])
  })

  // The import refuses a visible experience without a door, so the game never meets one. If it did,
  // there is no generator left to invent a house for it.
  it('leaves an experience with no door out of the world', () => {
    expect(build(JSON_FIXTURE, { doors: [door()] }).sites.map(s => s.id)).toEqual(['a'])
  })

  it('ignores a door naming an experience that is not visible, or not there at all', () => {
    const world = build(JSON_FIXTURE, { doors: [...DOORS, door({ id: 'h', uid: 'U8' }), door({ id: 'nope', uid: 'U9' })] })
    expect(world.sites.map(s => s.id).sort()).toEqual(['a', 'b'])
  })

  it('ignores an interactable that is not a door', () => {
    const world = build(JSON_FIXTURE, { doors: [door(), { uid: 'U1', kind: 'npc', id: 'b', x: 10, y: 10 }] })
    expect(siteFor(world, 'b')).toBeUndefined()
  })

  // With no footprint there is no collision box and no door point; a house the player walks through
  // is worse than none, and the import measures every door anyway.
  it('ignores a door that carries no footprint', () => {
    const world = build(JSON_FIXTURE, { doors: [door(), { uid: 'U4', kind: 'door', id: 'b', x: 400, y: 600 }] })
    expect(siteFor(world, 'b')).toBeUndefined()
  })
})

describe('roads', () => {
  const SIDE_PROJECTS = [{ co: 'Mr. Yoker', title: { en: 'Indie', es: 'Indie' }, date: { en: 'side', es: 'propio' }, tech: ['Astro'] }]
  const wr = build(JSON_FIXTURE, { sideProjects: SIDE_PROJECTS })

  it('exposes a non-empty roads array alongside the spine path', () => {
    expect(Array.isArray(wr.roads)).toBe(true)
    expect(wr.roads.length).toBeGreaterThan(0)
    expect(wr.path.length).toBeGreaterThan(1)
  })

  it('includes the spine itself as consecutive, non-hidden segments', () => {
    for (let i = 0; i < wr.path.length - 1; i += 1) {
      const seg = wr.roads.find(r => r.a === wr.path[i] && r.b === wr.path[i + 1])
      expect(seg, `missing spine segment ${i}`).toBeDefined()
      expect(seg.hidden).toBeFalsy()
    }
  })

  it('gives every visible site a non-hidden spur segment whose one endpoint is its doorPoint', () => {
    wr.sites.forEach(s => {
      const d = doorPoint(s)
      const spur = wr.roads.find(r => !r.hidden && r.a.x === d.x && r.a.y === d.y)
      expect(spur, `no spur found for site ${s.id}`).toBeDefined()
    })
  })

  it('gives every hidden POI a loop of two hidden segments that touch the spine at distinct points', () => {
    wr.hiddenSites.forEach(hs => {
      const d = doorPoint(hs)
      const legs = wr.roads.filter(r => r.hidden
        && ((r.a.x === d.x && r.a.y === d.y) || (r.b.x === d.x && r.b.y === d.y)))
      expect(legs).toHaveLength(2)
      const spineTouch = leg => (leg.a.x === d.x && leg.a.y === d.y ? leg.b : leg.a)
      const [t1, t2] = legs.map(spineTouch)
      expect(t1).not.toEqual(t2)
      expect(wr.path).toContainEqual(t1)
      expect(wr.path).toContainEqual(t2)
    })
  })

  it('is deterministic — rebuilding the same input yields identical road segments', () => {
    expect(build(JSON_FIXTURE, { sideProjects: SIDE_PROJECTS }).roads).toEqual(wr.roads)
  })
})

describe('buildOverworld reads its towns from the map anchors', () => {
  it('puts the farm where the map anchors it', () => {
    expect(build().farm).toEqual(ANCHORS.farm)
  })
  it('re-routes the road spine through a moved anchor', () => {
    const moved = build(JSON_FIXTURE, { anchors: { ...ANCHORS, pradera: { x: 1000, y: 1000 } } })
    expect(moved.path).toContainEqual({ x: 1000, y: 1000 })
    expect(moved.regions.find(r => r.bi === 'pradera')).toMatchObject({ x: 1000, y: 1000 })
  })
  // No built-in positions remain to fall back on: a map missing a town would silently put that era
  // back where the code once guessed, so it fails and says which one.
  it('refuses a map that lays no anchor for a town, naming it', () => {
    const { selva, ...rest } = ANCHORS
    expect(() => build(JSON_FIXTURE, { anchors: rest })).toThrow(/selva/)
  })
  it('refuses a world built with no anchors at all', () => {
    expect(() => buildOverworld(JSON_FIXTURE, biomeForYear, { doors: DOORS })).toThrow(/farm/)
  })
})

describe('projectOntoSpine', () => {
  const spine = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]

  it('projects onto the nearest segment, perpendicular to it', () => {
    expect(projectOntoSpine({ x: 50, y: 30 }, spine)).toEqual({ x: 50, y: 0 })
  })
  it('clamps to a segment endpoint when the point is beyond it', () => {
    expect(projectOntoSpine({ x: -20, y: 0 }, spine)).toEqual({ x: 0, y: 0 })
  })
  it('picks whichever of several segments is actually closest', () => {
    expect(projectOntoSpine({ x: 120, y: 50 }, spine)).toEqual({ x: 100, y: 50 })
  })
})

// The world's extent comes from the map when there is one (docs/adr/0001).
describe('buildOverworld takes its size from the map', () => {
  it('uses the authored world when given one', () => {
    const w = build(JSON_FIXTURE, { world: { w: 1920, h: 1440 } })
    expect({ w: w.worldW, h: w.worldH }).toEqual({ w: 1920, h: 1440 })
  })

  it('falls back to the built-in constants without one', () => {
    const w = build()
    expect({ w: w.worldW, h: w.worldH }).toEqual({ w: WORLD_W, h: WORLD_H })
  })

  it('ignores a half-measured world rather than shrinking to nothing', () => {
    for (const world of [{ w: 0, h: 100 }, { w: 100 }, {}]) {
      expect(build(JSON_FIXTURE, { world }).worldW).toBe(WORLD_W)
    }
  })
})
