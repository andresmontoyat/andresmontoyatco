import { describe, it, expect } from 'vitest'
import { startYear, buildOverworld, projectOntoSpine, buildingFor, WORLD_W, WORLD_H } from './overworld.js'
import { biomeForYear } from './biomes.js'
import { doorPoint } from '../entities/site.js'

const JSON_FIXTURE = {
  entries: [
    { id: 'a', visible: true, featured: true, date: { en: 'May 2026 — Present' }, title: { en: 'Arch', es: 'Arq' }, company: 'Soldife', metric: { v: '6+9', en: 'ms', es: 'ms' }, tech: ['Java'] },
    { id: 'b', visible: true, date: { en: 'Apr 2007 — Jun 2009' }, title: { en: 'Dev', es: 'Dev' }, company: 'Mercurio', tech: ['Java'] },
    { id: 'h', visible: false, date: { en: '2015' }, title: { en: 'X', es: 'X' }, company: 'Hidden', tech: [] },
  ],
}

describe('startYear', () => {
  it('extracts the first 4-digit year from the English date', () => {
    expect(startYear({ date: { en: 'Apr 2007 — Jun 2009' } })).toBe(2007)
  })
  it('returns 0 when no year present', () => {
    expect(startYear({ date: { en: 'Present' } })).toBe(0)
  })
})

describe('buildOverworld', () => {
  const w = buildOverworld(JSON_FIXTURE, biomeForYear)

  it('drops entries with visible === false', () => {
    expect(w.sites.find(s => s.co === 'Hidden')).toBeUndefined()
  })
  it('orders sites chronologically by start year', () => {
    const years = w.sites.map(s => s.id)
    expect(years).toEqual(['b', 'a'])
  })
  it('types featured entries as castle and others as house', () => {
    expect(w.sites.find(s => s.id === 'a').type).toBe('castle')
    expect(w.sites.find(s => s.id === 'b').type).toBe('house')
  })
  it('assigns each site a biome from its year', () => {
    expect(w.sites.find(s => s.id === 'b').bi).toBe('pradera')
    expect(w.sites.find(s => s.id === 'a').bi).toBe('castillo')
  })
  it('is deterministic — same input yields identical positions', () => {
    const w2 = buildOverworld(JSON_FIXTURE, biomeForYear)
    expect(w2.sites.map(s => [s.cx, s.cy])).toEqual(w.sites.map(s => [s.cx, s.cy]))
  })
  it('places every site inside world bounds', () => {
    for (const s of w.sites) {
      expect(s.cx).toBeGreaterThanOrEqual(0)
      expect(s.cx).toBeLessThanOrEqual(w.worldW)
      expect(s.cy).toBeGreaterThanOrEqual(0)
      expect(s.cy).toBeLessThanOrEqual(w.worldH)
    }
  })
  it('gives featured sites a landmark building and regular sites a house', () => {
    const HOUSES = ['house', 'house_wood_red', 'house_stone_blue', 'house_stone_red', 'house_lime_blue', 'house_lime_red']
    const LANDMARKS = ['church', 'inn', 'blacksmith']
    expect(LANDMARKS).toContain(w.sites.find(s => s.id === 'a').building)
    expect(HOUSES).toContain(w.sites.find(s => s.id === 'b').building)
  })
  it('assigns each building deterministically from the entry id', () => {
    expect(w.sites.find(s => s.id === 'a').building).toBe(buildingFor({ id: 'a', featured: true }))
    expect(w.sites.find(s => s.id === 'b').building).toBe(buildingFor({ id: 'b' }))
  })
  it('sizes each site footprint to its building', () => {
    const inn = buildOverworld({ entries: [{ id: 'inn-co', visible: true, featured: true, date: { en: '2026' }, title: {}, company: 'X' }] }, biomeForYear)
    const s = inn.sites[0]
    if (s.building === 'inn') { expect(s.w).toBe(150); expect(s.h).toBe(120) }
    expect(s.w).toBeGreaterThan(0)
    expect(s.h).toBeGreaterThan(0)
  })
  it('places a barn landmark at the farm spawn', () => {
    expect(w.farmBuilding.building).toBe('barn')
    expect(w.farmBuilding.w).toBeGreaterThan(0)
  })
  it('exposes ponds inside world bounds, clear of every building footprint', () => {
    expect(w.ponds.length).toBeGreaterThan(0)
    w.ponds.forEach(p => {
      expect(p.x - p.r).toBeGreaterThan(0)
      expect(p.x + p.r).toBeLessThan(w.worldW)
      expect(p.y - p.r).toBeGreaterThan(0)
      expect(p.y + p.r).toBeLessThan(w.worldH)
      w.sites.forEach(s => {
        expect(Math.hypot(p.x - s.cx, p.y - s.cy)).toBeGreaterThan(p.r + Math.max(s.w, s.h) / 2)
      })
    })
  })
  it('places an animated windmill at the farm, clear of the spawn column', () => {
    expect(w.farmWindmill.w).toBeGreaterThan(0)
    expect(w.farmWindmill.h).toBeGreaterThan(0)
    // its tower footprint must not overlap the player spawn (farm.x, farm.y + 70)
    const towerRight = w.farmWindmill.cx - w.farmWindmill.w / 2 + w.farmWindmill.w * (69 / 128)
    expect(towerRight < w.farm.x - 12 || w.farmWindmill.cx - w.farmWindmill.w / 2 > w.farm.x + 12).toBe(true)
  })
  it('flags injected side-projects as hidden', () => {
    const w3 = buildOverworld(JSON_FIXTURE, biomeForYear, { sideProjects: [{ co: 'Mr. Yoker', title: { en: 'Indie', es: 'Indie' }, date: { en: 'side', es: 'propio' }, tech: ['Astro'] }] })
    expect(w3.hiddenSites).toHaveLength(1)
    expect(w3.hiddenSites[0].hidden).toBe(true)
  })
})

describe('roads', () => {
  const SIDE_PROJECTS = [{ co: 'Mr. Yoker', title: { en: 'Indie', es: 'Indie' }, date: { en: 'side', es: 'propio' }, tech: ['Astro'] }]
  const wr = buildOverworld(JSON_FIXTURE, biomeForYear, { sideProjects: SIDE_PROJECTS })

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
      const door = doorPoint(s)
      const spur = wr.roads.find(r => !r.hidden && r.a.x === door.x && r.a.y === door.y)
      expect(spur, `no spur found for site ${s.id}`).toBeDefined()
    })
  })

  it('gives every hidden POI a loop of two hidden segments that touch the spine at distinct points', () => {
    wr.hiddenSites.forEach(hs => {
      const door = doorPoint(hs)
      const legs = wr.roads.filter(r => r.hidden
        && ((r.a.x === door.x && r.a.y === door.y) || (r.b.x === door.x && r.b.y === door.y)))
      expect(legs).toHaveLength(2)
      const spineTouch = leg => (leg.a.x === door.x && leg.a.y === door.y ? leg.b : leg.a)
      const [t1, t2] = legs.map(spineTouch)
      expect(t1).not.toEqual(t2)
      expect(wr.path).toContainEqual(t1)
      expect(wr.path).toContainEqual(t2)
    })
  })

  it('is deterministic — rebuilding the same input yields identical road segments', () => {
    const wr2 = buildOverworld(JSON_FIXTURE, biomeForYear, { sideProjects: SIDE_PROJECTS })
    expect(wr2.roads).toEqual(wr.roads)
  })
})

describe('buildOverworld with authored anchors', () => {
  const json = { entries: [{ id: 'a', company: 'A', date: { en: '2020' }, visible: true }] }
  const biomeForYear = () => 'pradera'

  it('keeps the built-in anchors when none are supplied', () => {
    const w = buildOverworld(json, biomeForYear)
    expect(w.farm).toEqual({ x: 360, y: 1120 })
  })
  it('overrides only the biomes present in the authored anchors', () => {
    const w = buildOverworld(json, biomeForYear, { anchors: { farm: { x: 500, y: 900 } } })
    expect(w.farm).toEqual({ x: 500, y: 900 })
    expect(w.regions.find(r => r.bi === 'cyber')).toMatchObject({ x: 1360, y: 1040 })
  })
  it('moves the site ring with its authored anchor', () => {
    const base = buildOverworld(json, biomeForYear)
    const moved = buildOverworld(json, biomeForYear, { anchors: { pradera: { x: 1000, y: 1000 } } })
    expect(moved.sites[0].cx).not.toBeCloseTo(base.sites[0].cx)
  })
  it('re-routes the road spine through the authored anchor', () => {
    const moved = buildOverworld(json, biomeForYear, { anchors: { pradera: { x: 1000, y: 1000 } } })
    expect(moved.path).toContainEqual({ x: 1000, y: 1000 })
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

// Authored houses. Per docs/adr/0001, the map owns the world and this generator is the fallback:
// an experience with a `door:<id>` object placed in the editor takes its position, its footprint and
// its art from the map, and everything else keeps being computed exactly as before.
describe('buildOverworld honours authored doors', () => {
  // interactables.json shape, already in game pixels with the sprite's footprint measured at import.
  const door = (over = {}) => ({ uid: 'U3', kind: 'door', id: 'a', x: 1000, y: 700, w: 120, h: 160, ...over })
  const build = (doors) => buildOverworld(JSON_FIXTURE, biomeForYear, { doors })
  const siteFor = (world, id) => world.sites.find(s => s.id === id)

  it('places the authored house where the map put it', () => {
    const s = siteFor(build([door()]), 'a')
    expect(s.cx).toBe(1000)
    // The editor anchors an object by its BOTTOM edge; a site's cy is its top, the way the barn's is
    // (cy = anchor.y - 110, drawn downward by its height). Converting is not optional: skip it and
    // every authored house floats one sprite-height above its own shadow.
    expect(s.cy).toBe(700 - 160)
    expect({ w: s.w, h: s.h }).toEqual({ w: 120, h: 160 })
  })

  it('marks it authored, and leaves it no building sprite to draw', () => {
    const s = siteFor(build([door()]), 'a')
    expect(s.authored).toBe(true)
    expect(s.building).toBeNull()
  })

  it('keeps every other field of the experience', () => {
    const s = siteFor(build([door()]), 'a')
    expect(s.co).toBe('Soldife')
    expect(s.title).toEqual({ en: 'Arch', es: 'Arq' })
    expect(s.tech).toEqual(['Java'])
    expect(s.bi).toBe(siteFor(buildOverworld(JSON_FIXTURE, biomeForYear), 'a').bi)
  })

  it('leaves an unauthored experience exactly where the generator put it', () => {
    const before = siteFor(buildOverworld(JSON_FIXTURE, biomeForYear), 'b')
    const after = siteFor(build([door()]), 'b')
    expect({ cx: after.cx, cy: after.cy, building: after.building }).toEqual({ cx: before.cx, cy: before.cy, building: before.building })
  })

  // The ring exists to space out the houses a biome has to fit. An authored house has left the ring,
  // so it must not count toward it — otherwise it reserves a slot nobody stands in and the remaining
  // houses spread around a gap.
  it('does not let an authored house reserve a slot in its biome ring', () => {
    const many = {
      entries: [
        { id: 'x', visible: true, date: { en: '2007' }, title: { en: 'A', es: 'A' }, company: 'X', tech: [] },
        { id: 'y', visible: true, date: { en: '2007' }, title: { en: 'B', es: 'B' }, company: 'Y', tech: [] },
      ],
    }
    const alone = buildOverworld({ entries: [many.entries[1]] }, biomeForYear)
    const withAuthored = buildOverworld(many, biomeForYear, { doors: [door({ id: 'x' })] })
    const y = withAuthored.sites.find(s => s.id === 'y')
    expect({ cx: y.cx, cy: y.cy }).toEqual({ cx: alone.sites[0].cx, cy: alone.sites[0].cy })
  })

  it('ignores a door naming an experience that is not visible, or not there at all', () => {
    const world = build([door({ id: 'h' }), door({ id: 'nope', uid: 'U9' })])
    expect(world.sites.map(s => s.id).sort()).toEqual(['a', 'b'])
    expect(world.sites.every(s => !s.authored)).toBe(true)
  })

  it('behaves exactly as before when nothing is authored', () => {
    const plain = buildOverworld(JSON_FIXTURE, biomeForYear)
    for (const doors of [undefined, null, []]) {
      expect(buildOverworld(JSON_FIXTURE, biomeForYear, { doors }).sites).toEqual(plain.sites)
    }
  })

  it('ignores an interactable that is not a door', () => {
    const world = build([{ uid: 'U1', kind: 'npc', id: 'a', x: 10, y: 10 }])
    expect(world.sites.find(s => s.id === 'a').authored).toBeUndefined()
  })

  // A door with no measured footprint cannot define collision or a door point, so it is not enough
  // to place a house — better the generator's known-good geometry than a zero-sized building the
  // player walks through.
  it('falls back to the generator when a door carries no footprint', () => {
    const before = siteFor(buildOverworld(JSON_FIXTURE, biomeForYear), 'a')
    const s = siteFor(build([{ uid: 'U3', kind: 'door', id: 'a', x: 1000, y: 700 }]), 'a')
    expect({ cx: s.cx, cy: s.cy }).toEqual({ cx: before.cx, cy: before.cy })
    expect(s.authored).toBeUndefined()
  })

  // The roads are derived, not authored: buildRoads reads site positions, so moving a house moves
  // its spur with it and nothing else has to be told.
  it('runs its road spur to the authored door', () => {
    const world = build([door()])
    const s = siteFor(world, 'a')
    const d = doorPoint(s)
    expect(world.roads.some(r => r.a.x === d.x && r.a.y === d.y)).toBe(true)
  })
})

// The world's extent comes from the map when there is one (docs/adr/0001).
describe('buildOverworld takes its size from the map', () => {
  it('uses the authored world when given one', () => {
    const w = buildOverworld(JSON_FIXTURE, biomeForYear, { world: { w: 1920, h: 1440 } })
    expect({ w: w.worldW, h: w.worldH }).toEqual({ w: 1920, h: 1440 })
  })

  it('falls back to the built-in constants without one', () => {
    const w = buildOverworld(JSON_FIXTURE, biomeForYear)
    expect({ w: w.worldW, h: w.worldH }).toEqual({ w: WORLD_W, h: WORLD_H })
  })

  it('ignores a half-measured world rather than shrinking to nothing', () => {
    for (const world of [{ w: 0, h: 100 }, { w: 100 }, {}]) {
      const w = buildOverworld(JSON_FIXTURE, biomeForYear, { world })
      expect(w.worldW).toBe(WORLD_W)
    }
  })
})
