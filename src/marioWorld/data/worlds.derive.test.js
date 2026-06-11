// src/marioWorld/data/worlds.derive.test.js
import { describe, it, expect } from 'vitest'
import { deriveWorlds } from './worlds.derive.js'
import { BIOMES } from './biomes.js'

const FIXTURE_EXPERIENCE = [
  { company: 'Acme', title: { en: 'Backend', es: 'Backend' }, period: { start: 2018, end: 2020 }, bullets: { en: ['a'], es: ['a'] }, tech: ['Java'] },
  { company: 'Acme', title: { en: 'Lead', es: 'Lead' },       period: { start: 2020, end: 2021 }, bullets: { en: ['b'], es: ['b'] }, tech: ['Java'] },
  { company: 'Beta', title: { en: 'Dev', es: 'Dev' },          period: { start: 2010, end: 2012 }, bullets: { en: ['c'], es: ['c'] }, tech: ['JEE'] },
]
const FIXTURE_SKILLS = {}
const FIXTURE_SECTIONS = [
  { id: 'about', biome: 'pradera', icon: 'home', label: { en: 'About', es: 'Sobre' }, content: { en: 'x', es: 'x' } },
]
const FIXTURE_SECRETS = [
  { id: 'hidden-1', command: '/secret', label: { en: 'Hidden', es: 'Oculto' }, biome: 'pradera', content: { en: 'h', es: 'h' } },
]

describe('deriveWorlds', () => {
  it('groups experience entries by company → 1 world per company', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, [], [])
    const companyWorlds = worlds.filter((w) => w.type === 'company')
    expect(companyWorlds.length).toBe(2) // Acme, Beta
  })

  it('company world contains all roles for that company as levels[]', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, [], [])
    const acme = worlds.find((w) => w.label === 'Acme')
    expect(acme.levels.length).toBe(2)
  })

  it('levels[] sorted chronologically by period.start ascending', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, [], [])
    const acme = worlds.find((w) => w.label === 'Acme')
    expect(acme.levels[0].period.start).toBeLessThan(acme.levels[1].period.start)
  })

  it('assigns biome based on earliest period.start of the company', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, [], [])
    const acme = worlds.find((w) => w.label === 'Acme')   // earliest = 2018 → selva
    const beta = worlds.find((w) => w.label === 'Beta')   // 2010 → pradera
    expect(acme.biome).toBe('selva')
    expect(beta.biome).toBe('pradera')
  })

  it('section world → type=section with content from input', () => {
    const { worlds } = deriveWorlds([], FIXTURE_SKILLS, FIXTURE_SECTIONS, [])
    const about = worlds.find((w) => w.id === 'section:about')
    expect(about.type).toBe('section')
    expect(about.content).toEqual(FIXTURE_SECTIONS[0].content)
  })

  it('secret world → type=secret with hidden=true', () => {
    const { worlds } = deriveWorlds([], FIXTURE_SKILLS, [], FIXTURE_SECRETS)
    const hidden = worlds.find((w) => w.id === 'secret:hidden-1')
    expect(hidden.hidden).toBe(true)
    expect(hidden.command).toBe('/secret')
  })

  it('all worlds have deterministic position {x, y} assigned', () => {
    const { worlds } = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, FIXTURE_SECTIONS, FIXTURE_SECRETS)
    for (const w of worlds) {
      expect(typeof w.position?.x).toBe('number')
      expect(typeof w.position?.y).toBe('number')
    }
  })

  it('is deterministic across calls — same input yields same positions', () => {
    const a = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, FIXTURE_SECTIONS, []).worlds
    const b = deriveWorlds(FIXTURE_EXPERIENCE, FIXTURE_SKILLS, FIXTURE_SECTIONS, []).worlds
    expect(a.map((w) => `${w.id}@${w.position.x},${w.position.y}`)).toEqual(
      b.map((w) => `${w.id}@${w.position.x},${w.position.y}`),
    )
  })

  it('empty experience + empty sections + empty secrets → empty worlds', () => {
    const { worlds } = deriveWorlds([], {}, [], [])
    expect(worlds).toEqual([])
  })

  it('biome assignment for year outside known ranges clamps to nearest', () => {
    const old = [{ company: 'Old', title: { en: 'r', es: 'r' }, period: { start: 1990, end: 1995 }, bullets: { en: [], es: [] }, tech: [] }]
    const { worlds } = deriveWorlds(old, {}, [], [])
    expect(worlds[0].biome).toBe('pradera')
  })

  it('biome assignment for future year clamps to castillo', () => {
    const future = [{ company: 'Future', title: { en: 'r', es: 'r' }, period: { start: 2030, end: 2030 }, bullets: { en: [], es: [] }, tech: [] }]
    const { worlds } = deriveWorlds(future, {}, [], [])
    expect(worlds[0].biome).toBe('castillo')
  })

  it('positions within same biome do not overlap (different x or y)', () => {
    const sameBiome = [
      { company: 'A', title: { en: 'r', es: 'r' }, period: { start: 2019, end: 2020 }, bullets: { en: [], es: [] }, tech: [] },
      { company: 'B', title: { en: 'r', es: 'r' }, period: { start: 2019, end: 2020 }, bullets: { en: [], es: [] }, tech: [] },
    ]
    const { worlds } = deriveWorlds(sameBiome, {}, [], [])
    expect(worlds[0].position).not.toEqual(worlds[1].position)
  })
})
