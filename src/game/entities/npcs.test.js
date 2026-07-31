import { describe, it, expect } from 'vitest'
import { createNpcs, updateNpcs, npcTypeFor } from './npcs.js'

const world = {
  sites: [
    { id: 'a', co: 'Acme', cx: 500, cy: 400, w: 66, h: 88 },
    { id: 'b', co: 'Beta', cx: 900, cy: 700, w: 98, h: 126 },
  ],
}
const TYPES = ['farmer', 'miner', 'chef', 'katy', 'fin', 'jack']

describe('npcs', () => {
  it('spawns one NPC per visible site, each a known premade type', () => {
    const npcs = createNpcs(world)
    expect(npcs).toHaveLength(2)
    npcs.forEach(n => expect(TYPES).toContain(n.type))
  })

  it('assigns each NPC deterministically from the site id', () => {
    expect(createNpcs(world)[0].type).toBe(npcTypeFor({ id: 'a' }))
    expect(createNpcs(world)[1].type).toBe(npcTypeFor({ id: 'b' }))
  })

  it('positions are deterministic for the same clock value', () => {
    expect(updateNpcs(createNpcs(world), 42)).toEqual(updateNpcs(createNpcs(world), 42))
  })

  it('wanders in a small radius around the building it belongs to', () => {
    const npcs = createNpcs(world)
    for (let clock = 0; clock < 200; clock += 7) {
      updateNpcs(npcs, clock).forEach(n => {
        expect(Math.hypot(n.x - n.homeX, n.y - n.homeY)).toBeLessThan(40)
      })
    }
  })
})
