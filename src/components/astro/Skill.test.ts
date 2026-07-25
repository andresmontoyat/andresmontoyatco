// @vitest-environment node
//
// src/components/astro/Skill.test.ts
// Astro Container API parity test — ports all 8 it-blocks of the former
// src/components/Skill.test.jsx RTL suite against the zero-JS Skill.astro
// (D-01/D-06). Forced to the `node` environment per-file (see
// src/pages/_404.test.ts / About.test.ts for the esbuild/jsdom rationale
// established in Phase 21) — renderToString() output is plain HTML text,
// no DOM APIs needed.
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import Skill from './Skill.astro'
import data from '../../data/skills.json'

async function renderSkill(locale = 'en') {
  const container = await AstroContainer.create()
  return container.renderToString(Skill, { props: { locale } })
}

describe('Skill.astro (Container API parity — D-01/D-06)', () => {
  it('renders the section with id="skills"', async () => {
    const result = await renderSkill('en')
    expect(result).toContain('id="skills"')
  })

  it('renders label + heading + intro (EN)', async () => {
    const result = await renderSkill('en')
    expect(result).toContain('Skills')
    expect(result).toContain('Technical stack')
    expect(result).toMatch(/Tools and technologies/)
  })

  it('renders all 4 category titles (EN)', async () => {
    const result = await renderSkill('en')
    expect(result).toContain('Backend')
    expect(result).toContain('Cloud &amp; Infrastructure')
    expect(result).toContain('DevOps &amp; Tools')
    expect(result).toContain('AI &amp; Productivity')
  })

  it('renders every chip with its label (30 chips total)', async () => {
    const result = await renderSkill('en')
    const allChips = data.categories.flatMap((c) => c.chips)
    expect(allChips).toHaveLength(30)
    for (const chip of allChips) {
      expect(result).toContain(chip.label)
    }
  })

  it('renders Kotlin as a Backend skill with 8 years', async () => {
    const result = await renderSkill('en')
    expect(result).toContain('Kotlin')
    const backend = data.categories.find((c) => c.id === 'backend')
    const kotlin = backend.chips.find((ch) => ch.label === 'Kotlin')
    expect(kotlin).toBeDefined()
    expect(kotlin.years).toBe(8)
    expect(kotlin.core).toBe(true)
  })

  it('marks core skills with data-core="true" tiles (6 core total)', async () => {
    const result = await renderSkill('en')
    const coreChips = data.categories.flatMap((c) => c.chips).filter((ch) => ch.core)
    expect(coreChips).toHaveLength(6)
    expect((result.match(/data-core="true"/g) || []).length).toBe(6)
  })

  it('translates h2/intro/category-titles when locale=es', async () => {
    const result = await renderSkill('es')
    expect(result).toContain('Stack técnico')
    expect(result).toMatch(/Herramientas y tecnologías/)
    expect(result).toContain('Nube e Infraestructura')
    expect(result).toContain('DevOps y Herramientas')
    expect(result).toContain('IA y Productividad')
  })

  it('renders years next to chip label in some form (e.g. "18y" or "18a")', async () => {
    const result = await renderSkill('en')
    expect(result).toMatch(/18\s*y/)
  })

  it('skills.json schema sanity — 4 categories, each with bilingual title + chips array', () => {
    expect(Array.isArray(data.categories)).toBe(true)
    expect(data.categories).toHaveLength(4)
    for (const c of data.categories) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.symbol).toBe('string')
      expect(typeof c.title.en).toBe('string')
      expect(typeof c.title.es).toBe('string')
      expect(Array.isArray(c.chips)).toBe(true)
      expect(c.chips.length).toBeGreaterThan(0)
      for (const chip of c.chips) {
        expect(typeof chip.label).toBe('string')
        expect(typeof chip.years).toBe('number')
      }
    }
  })
})
