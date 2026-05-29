import { describe, it, expect } from 'vitest'
import { SKILL_CATEGORIES, SKILLS, resolveCanonical } from './skills.js'
import EXPERIENCE from './experience.js'

describe('SKILL_CATEGORIES', () => {
  it('should have exactly 8 keys', () => {
    const keys = Object.keys(SKILL_CATEGORIES)
    expect(keys).toHaveLength(8)
    expect(keys).toEqual(
      expect.arrayContaining(['lang', 'ai', 'arch', 'cloud', 'devops', 'security', 'data', 'hardware'])
    )
  })

  it('should have en, es, and color on every category', () => {
    for (const [key, cat] of Object.entries(SKILL_CATEGORIES)) {
      expect(cat, `category ${key} missing en`).toHaveProperty('en')
      expect(cat, `category ${key} missing es`).toHaveProperty('es')
      expect(cat, `category ${key} missing color`).toHaveProperty('color')
    }
  })

  it('should have exact colors from the design spec', () => {
    expect(SKILL_CATEGORIES.lang.color).toBe('#3b82f6')
    expect(SKILL_CATEGORIES.ai.color).toBe('#a855f7')
    expect(SKILL_CATEGORIES.arch.color).toBe('#06b6d4')
    expect(SKILL_CATEGORIES.cloud.color).toBe('#10b981')
    expect(SKILL_CATEGORIES.devops.color).toBe('#f59e0b')
    expect(SKILL_CATEGORIES.security.color).toBe('#ef4444')
    expect(SKILL_CATEGORIES.data.color).toBe('#8b5cf6')
    expect(SKILL_CATEGORIES.hardware.color).toBe('#ec4899')
  })
})

describe('SKILLS catalog', () => {
  it('should map every tech skill from experience.js to a category (no orphan skills)', () => {
    const allTechSkills = EXPERIENCE.flatMap((e) => e.tech)
    const uniqueSkills = [...new Set(allTechSkills)]
    for (const skill of uniqueSkills) {
      const canonical = resolveCanonical(skill)
      expect(canonical, `skill '${skill}' resolves to null (orphan)`).not.toBeNull()
      const entry = SKILLS[canonical]
      expect(entry, `canonical '${canonical}' not in SKILLS catalog`).toBeDefined()
      expect(SKILL_CATEGORIES[entry.category], `category '${entry.category}' for '${canonical}' not in SKILL_CATEGORIES`).toBeDefined()
    }
  })

  it('should collapse GCP and Google Cloud to the same canonical skill id', () => {
    const gcpCanonical = resolveCanonical('GCP')
    const gcCanonical = resolveCanonical('Google Cloud')
    expect(gcpCanonical).not.toBeNull()
    expect(gcCanonical).not.toBeNull()
    expect(gcpCanonical).toBe(gcCanonical)
  })

  it('should keep GKE as a separate canonical skill from Google Cloud', () => {
    const gkeCanonical = resolveCanonical('GKE')
    const gcCanonical = resolveCanonical('Google Cloud')
    expect(gkeCanonical).not.toBeNull()
    expect(gcCanonical).not.toBeNull()
    expect(gkeCanonical).not.toBe(gcCanonical)
  })

  it('should assign Spring Security to the security category', () => {
    const canonical = resolveCanonical('Spring Security')
    expect(canonical).not.toBeNull()
    expect(SKILLS[canonical].category).toBe('security')
  })
})

describe('experience.js period field', () => {
  it('should have period on all 12 entries', () => {
    expect(EXPERIENCE).toHaveLength(12)
    for (const [i, entry] of EXPERIENCE.entries()) {
      expect(entry, `entry ${i} (${entry.company}) missing period`).toHaveProperty('period')
      expect(typeof entry.period.start, `entry ${i} period.start not a number`).toBe('number')
    }
  })

  it('should have period.end as number or null for each entry', () => {
    for (const [i, entry] of EXPERIENCE.entries()) {
      const end = entry.period.end
      expect(
        end === null || typeof end === 'number',
        `entry ${i} (${entry.company}) period.end is neither number nor null: ${end}`
      ).toBe(true)
    }
  })

  it('should have period.end === null for the Coderio (present) entry', () => {
    const coderio = EXPERIENCE[0]
    expect(coderio.company).toBe('Coderio')
    expect(coderio.period.end).toBeNull()
    expect(coderio.period.start).toBe(2026)
  })

  it('should not alter the display date string on any entry', () => {
    expect(EXPERIENCE[0].date.en).toBe('Jan 2026 — Present')
    expect(EXPERIENCE[11].date.en).toBe('Apr 2007 — Jun 2009')
  })

  it('should have correct period values for all 12 entries', () => {
    const expected = [
      { start: 2026, end: null },   // 0 Coderio
      { start: 2024, end: 2025 },   // 1 F2X SAS
      { start: 2024, end: 2025 },   // 2 Blerify
      { start: 2020, end: 2022 },   // 3 KLEVER SAS
      { start: 2013, end: 2015 },   // 4 Tata
      { start: 2023, end: 2024 },   // 5 SM TECH SAS
      { start: 2022, end: 2023 },   // 6 TUL SAS
      { start: 2021, end: 2022 },   // 7 Linked
      { start: 2009, end: 2021 },   // 8 PATH — INNKUA
      { start: 2012, end: 2013 },   // 9 Grupo Nethexa
      { start: 2009, end: 2010 },   // 10 Ceiba
      { start: 2007, end: 2009 },   // 11 Mercurio SAS
    ]
    expected.forEach((exp, i) => {
      expect(EXPERIENCE[i].period.start, `entry ${i} start`).toBe(exp.start)
      expect(EXPERIENCE[i].period.end, `entry ${i} end`).toBe(exp.end)
    })
  })
})
