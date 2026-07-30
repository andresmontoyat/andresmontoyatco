import { describe, it, expect } from 'vitest'
import { nearestBiome, tileNameFor, walkFrame } from './tiles.js'

const regions = [{ bi: 'pradera', x: 0, y: 0 }, { bi: 'cyber', x: 1000, y: 0 }]

describe('nearestBiome', () => {
  it('returns the closest region biome', () => {
    expect(nearestBiome(regions, 10, 0)).toBe('pradera')
    expect(nearestBiome(regions, 990, 0)).toBe('cyber')
  })
})

describe('tileNameFor', () => {
  it('returns a path tile near the path', () => {
    expect(tileNameFor('pradera', 0, 0, 10)).toBe('path')
  })
  it('returns a biome ground tile off the path', () => {
    expect(tileNameFor('cyber', 0, 0, 200)).toBe('ground_cyber')
  })
  it('is deterministic — the same tile coord always returns the same variant', () => {
    expect(tileNameFor('pradera', 500, 900, 200)).toBe(tileNameFor('pradera', 500, 900, 200))
  })
  it('scatters more than one ground variant across nearby tiles', () => {
    const names = new Set()
    for (let tx = 0; tx < 12; tx += 1) names.add(tileNameFor('pradera', tx * 32 + 16, 16, 200))
    expect(names.size).toBeGreaterThan(1)
    names.forEach(n => expect(n.startsWith('ground_pradera')).toBe(true))
  })
  it('gives the farm ground a grass frame instead of the old tilled-dirt frame', () => {
    expect(tileNameFor('farm', 0, 0, 200)).toBe('ground_farm')
  })
  it('scatters 3 sand variants across nearby desert tiles', () => {
    const names = new Set()
    for (let tx = 0; tx < 12; tx += 1) names.add(tileNameFor('desierto', tx * 32 + 16, 16, 200))
    expect(names.size).toBeGreaterThan(1)
  })
  it('biases pradera/farm toward the base tile so accents read as occasional, not 50/50', () => {
    const counts = {}
    for (let tx = 0; tx < 240; tx += 1) {
      const name = tileNameFor('pradera', tx * 32 + 16, 5000, 200)
      counts[name] = (counts[name] || 0) + 1
    }
    expect(counts.ground_pradera).toBeGreaterThan((counts.ground_pradera_2 || 0) * 1.5)
    expect(counts.ground_pradera).toBeGreaterThan((counts.ground_pradera_3 || 0) * 1.5)
  })
})

describe('walkFrame', () => {
  it('cycles 3 frames per direction', () => {
    expect(walkFrame('down', 0)).toBe('carlos_down_0')
    expect(walkFrame('left', 5)).toBe(`carlos_left_${5 % 3}`)
  })
})
