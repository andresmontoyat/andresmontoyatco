import { describe, it, expect } from 'vitest'
import { BIOMES, ORDER, biomeForYear } from './biomes.js'

describe('biomes', () => {
  it('orders eras chronologically', () => {
    expect(ORDER).toEqual(['pradera','desierto','selva','cyber','castillo'])
  })
  it('maps years to the right era', () => {
    expect(biomeForYear(2007)).toBe('pradera')
    expect(biomeForYear(2012)).toBe('pradera')
    expect(biomeForYear(2013)).toBe('desierto')
    expect(biomeForYear(2021)).toBe('selva')
    expect(biomeForYear(2023)).toBe('cyber')
    expect(biomeForYear(2026)).toBe('castillo')
  })
  it('clamps out-of-range years to the nearest era', () => {
    expect(biomeForYear(2000)).toBe('pradera')
    expect(biomeForYear(2100)).toBe('castillo')
  })
  it('every biome carries a bilingual label and palette', () => {
    for (const id of ORDER) {
      expect(BIOMES[id].label.en).toBeTruthy()
      expect(BIOMES[id].label.es).toBeTruthy()
      expect(BIOMES[id].c).toMatch(/^#/)
    }
  })
})
