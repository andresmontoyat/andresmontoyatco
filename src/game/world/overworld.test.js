import { describe, it, expect } from 'vitest'
import { startYear, buildOverworld } from './overworld.js'
import { biomeForYear } from './biomes.js'

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
  it('flags injected side-projects as hidden', () => {
    const w3 = buildOverworld(JSON_FIXTURE, biomeForYear, [{ co: 'Mr. Yoker', title: { en: 'Indie', es: 'Indie' }, date: { en: 'side', es: 'propio' }, tech: ['Astro'] }])
    expect(w3.hiddenSites).toHaveLength(1)
    expect(w3.hiddenSites[0].hidden).toBe(true)
  })
})
