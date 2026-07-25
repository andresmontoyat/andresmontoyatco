import { describe, it, expect } from 'vitest'
import { mapExperienceToCompanies } from './companies.js'
import { biomeForYear } from './biomes.js'
import raw from '../../data/experience.json'

describe('companies', () => {
  const c = mapExperienceToCompanies(raw, biomeForYear)
  it('keeps only visible entries, oldest first', () => {
    expect(c.length).toBe(raw.entries.filter(e => e.visible !== false).length)
    expect(c[0].y).toBeLessThan(c[c.length - 1].y)
  })
  it('assigns a biome per start year', () => {
    expect(c[0].biome).toBe('pradera')
    expect(c[c.length - 1].biome).toBe('castillo')
  })
  it('numbers featured companies', () => {
    const featured = c.filter(x => x.featured)
    expect(featured.length).toBeGreaterThan(0)
    expect(featured.every(x => typeof x.num === 'number')).toBe(true)
  })
})
