import { describe, it, expect } from 'vitest'
import { startYear, buildOverworld, projectOntoSpine, buildingFor } from './overworld.js'
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
  it('places an animated windmill at the farm, clear of the spawn column', () => {
    expect(w.farmWindmill.w).toBeGreaterThan(0)
    expect(w.farmWindmill.h).toBeGreaterThan(0)
    // its tower footprint must not overlap the player spawn (farm.x, farm.y + 70)
    const towerRight = w.farmWindmill.cx - w.farmWindmill.w / 2 + w.farmWindmill.w * (69 / 128)
    expect(towerRight < w.farm.x - 12 || w.farmWindmill.cx - w.farmWindmill.w / 2 > w.farm.x + 12).toBe(true)
  })
  it('flags injected side-projects as hidden', () => {
    const w3 = buildOverworld(JSON_FIXTURE, biomeForYear, [{ co: 'Mr. Yoker', title: { en: 'Indie', es: 'Indie' }, date: { en: 'side', es: 'propio' }, tech: ['Astro'] }])
    expect(w3.hiddenSites).toHaveLength(1)
    expect(w3.hiddenSites[0].hidden).toBe(true)
  })
})

describe('roads', () => {
  const SIDE_PROJECTS = [{ co: 'Mr. Yoker', title: { en: 'Indie', es: 'Indie' }, date: { en: 'side', es: 'propio' }, tech: ['Astro'] }]
  const wr = buildOverworld(JSON_FIXTURE, biomeForYear, SIDE_PROJECTS)

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
    const wr2 = buildOverworld(JSON_FIXTURE, biomeForYear, SIDE_PROJECTS)
    expect(wr2.roads).toEqual(wr.roads)
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
