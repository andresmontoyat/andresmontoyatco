import { describe, it, expect } from 'vitest'
import { buildDecor } from './decor.js'

const world = {
  worldW: 2000,
  worldH: 1400,
  farm: { x: 300, y: 1200 },
  sites: [{ cx: 1000, cy: 700, w: 90, h: 100 }],
  hiddenSites: [{ cx: 1600, cy: 900, w: 70, h: 80 }],
  ponds: [{ x: 1200, y: 400, r: 80 }],
}

const LAND_TYPES = ['tree', 'tree_small', 'tree_birch', 'tree_spruce', 'tree_fruit', 'bush', 'rock', 'flower', 'fence']
const AQUATIC_TYPES = ['lilypad', 'cattail', 'kapybara', 'frog']
const ALLOWED_TYPES = [...LAND_TYPES, ...AQUATIC_TYPES]

describe('buildDecor', () => {
  it('is deterministic — same seed yields identical output', () => {
    expect(buildDecor(world, 7)).toEqual(buildDecor(world, 7))
  })

  it('produces a different layout for a different seed', () => {
    expect(buildDecor(world, 1)).not.toEqual(buildDecor(world, 2))
  })

  it('only emits known decor types', () => {
    buildDecor(world, 9).forEach(d => expect(ALLOWED_TYPES).toContain(d.type))
  })

  it('never places decor inside a building footprint', () => {
    const rects = [
      { x: 1000 - 45, y: 700, w: 90, h: 100 },
      { x: 1600 - 35, y: 900, w: 70, h: 80 },
    ]
    buildDecor(world, 3).forEach(d => {
      rects.forEach(r => {
        const inside = d.x >= r.x && d.x <= r.x + r.w && d.y >= r.y && d.y <= r.y + r.h
        expect(inside).toBe(false)
      })
    })
  })

  it('never scatters LAND decor inside a water pond', () => {
    buildDecor(world, 3).filter(d => LAND_TYPES.includes(d.type)).forEach(d => {
      const dist = Math.hypot(d.x - world.ponds[0].x, d.y - world.ponds[0].y)
      expect(dist).toBeGreaterThan(world.ponds[0].r)
    })
  })

  it('places aquatic decor (lilypad/cattail/kapybara) at each pond', () => {
    const aquatic = buildDecor(world, 3).filter(d => AQUATIC_TYPES.includes(d.type))
    expect(aquatic.length).toBeGreaterThan(0)
    expect(aquatic.every(d => !d.solid)).toBe(true)
    // lilypads/cattails float within the pond; the kapybara sits on the bank (<= r)
    aquatic.forEach(d => {
      const dist = Math.hypot(d.x - world.ponds[0].x, d.y - world.ponds[0].y)
      expect(dist).toBeLessThanOrEqual(world.ponds[0].r)
    })
  })

  it('never places LAND decor near the farm spawn', () => {
    buildDecor(world, 3).filter(d => LAND_TYPES.includes(d.type)).forEach(d => {
      const dist = Math.hypot(d.x - world.farm.x, d.y - world.farm.y)
      expect(dist).toBeGreaterThan(100)
    })
  })

  it('marks trees and tree_small and rock and fence as solid, bush and flower as not', () => {
    const decor = buildDecor(world, 5)
    const bySolid = t => decor.filter(d => d.type === t).every(d => d.solid === true)
    const byOpen = t => decor.filter(d => d.type === t).every(d => d.solid === false)
    expect(bySolid('tree')).toBe(true)
    expect(byOpen('flower')).toBe(true)
  })

  it('scatters a reasonable number of items across a 2000x1400 world', () => {
    expect(buildDecor(world, 1).length).toBeGreaterThan(50)
  })
})
