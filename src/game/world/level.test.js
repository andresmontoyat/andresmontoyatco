import { describe, it, expect } from 'vitest'
import { mapExperienceToCompanies } from './companies.js'
import { buildLevel } from './level.js'
import { biomeForYear } from './biomes.js'
import raw from '../../data/experience.json'

describe('level', () => {
  const lvl = buildLevel(mapExperienceToCompanies(raw, biomeForYear))
  it('spans all companies with a ground solid', () => {
    expect(lvl.companies.length).toBeGreaterThan(0)
    expect(lvl.solids.some(s => s.ground)).toBe(true)
    expect(lvl.levelW).toBeGreaterThan(lvl.companies.at(-1).cx)
  })
  it('places exactly one boss guarding the final company', () => {
    const bosses = lvl.enemies.filter(e => e.boss)
    expect(bosses.length).toBe(1)
    expect(bosses[0].x).toBeLessThan(lvl.companies.at(-1).cx)
  })
  it('provides both power-up types', () => {
    const types = new Set(lvl.powerups.map(p => p.type))
    expect(types.has('boots')).toBe(true)
    expect(types.has('shield')).toBe(true)
  })
  it('tints bugs by their biome', () => {
    expect(lvl.enemies.every(e => typeof e.col === 'string')).toBe(true)
  })
})
