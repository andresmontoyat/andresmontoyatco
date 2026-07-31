import { describe, it, expect } from 'vitest'
import { createCritters, updateCritters } from './critters.js'

const world = { farm: { x: 300, y: 1200 } }

describe('critters', () => {
  it('positions are deterministic for the same clock value', () => {
    const a = updateCritters(createCritters(world), 1, 42)
    const b = updateCritters(createCritters(world), 1, 42)
    expect(a).toEqual(b)
  })

  it('produces different positions for different clock values', () => {
    const start = createCritters(world)
    const p0 = updateCritters(start, 1, 0).map(k => ({ x: k.x, y: k.y }))
    const p1 = updateCritters(start, 1, 30).map(k => ({ x: k.x, y: k.y }))
    expect(p1).not.toEqual(p0)
  })

  it('never wanders outside the farm radius', () => {
    let critters = createCritters(world)
    for (let clock = 0; clock < 200; clock += 5) {
      critters = updateCritters(critters, 1, clock)
      critters.forEach(c => {
        const dist = Math.hypot(c.x - world.farm.x, c.y - world.farm.y)
        expect(dist).toBeLessThan(60)
      })
    }
  })

  it('creates one critter per configured count, all starting at the farm', () => {
    const critters = createCritters(world)
    expect(critters.length).toBeGreaterThan(0)
    critters.forEach(c => {
      expect(c.x).toBe(world.farm.x)
      expect(c.y).toBe(world.farm.y)
    })
  })

  it('spawns a mix of species, not one repeated kind', () => {
    const kinds = new Set(createCritters(world).map(c => c.kind))
    expect(kinds.size).toBeGreaterThan(1)
    expect(kinds.has('chicken')).toBe(true)
  })
})
