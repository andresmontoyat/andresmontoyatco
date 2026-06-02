import { describe, it, expect } from 'vitest'
import {
  filterByYearRange,
  filterBySkillIntersection,
  filterByCategory,
  composeFilters,
  yearBounds,
  visibleSkillIds,
} from './filters.js'
import EXPERIENCE from '../data/experience.js'
import { SKILLS } from '../data/skills.js'

describe('filterByYearRange', () => {
  it('returns all experiences when range covers full bounds', () => {
    const result = filterByYearRange(EXPERIENCE, [2007, 2026])
    expect(result.length).toBe(EXPERIENCE.length)
  })

  it('returns only experiences whose period intersects a single year boundary', () => {
    // 2007 is the start of the oldest entry (TMS COL, 2007-2009)
    const result = filterByYearRange(EXPERIENCE, [2007, 2007])
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.period.start <= 2007 && (e.period.end ?? 2026) >= 2007)).toBe(true)
  })

  it('returns empty array for a disjoint range', () => {
    // No job exists before 2007 — pre-2007 range yields []
    const result = filterByYearRange(EXPERIENCE, [2000, 2006])
    expect(result).toEqual([])
  })

  it('treats period.end == null as CURRENT_YEAR (2026)', () => {
    // First entry has period { start: 2026, end: null } — should match [2026, 2026]
    const result = filterByYearRange(EXPERIENCE, [2026, 2026])
    expect(result.some((e) => e.period.end === null && e.period.start === 2026)).toBe(true)
  })
})

describe('filterBySkillIntersection - AND semantics', () => {
  it('returns the input unchanged when skillIds is empty', () => {
    const result = filterBySkillIntersection(EXPERIENCE, [])
    expect(result.length).toBe(EXPERIENCE.length)
  })

  it('filters by single-skill membership', () => {
    const result = filterBySkillIntersection(EXPERIENCE, ['Java'])
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.tech.includes('Java'))).toBe(true)
  })

  it('returns experiences that contain every requested skill (Java AND Spring Boot)', () => {
    const result = filterBySkillIntersection(EXPERIENCE, ['Java', 'Spring Boot'])
    expect(result.length).toBeGreaterThan(0)
    expect(
      result.every((e) => e.tech.includes('Java') && e.tech.includes('Spring Boot'))
    ).toBe(true)
  })

  it('returns empty array when no experience matches all requested skills', () => {
    // Asterisk (2012) and Kubernetes (2024) never co-occurred in any role
    const result = filterBySkillIntersection(EXPERIENCE, ['Asterisk', 'Kubernetes'])
    expect(result).toEqual([])
  })

  it('returns empty array when a non-existent skill is requested', () => {
    const result = filterBySkillIntersection(EXPERIENCE, ['NonExistentSkill'])
    expect(result).toEqual([])
  })
})

describe('filterByCategory', () => {
  it('returns the input unchanged when category is null', () => {
    const result = filterByCategory(EXPERIENCE, null, SKILLS)
    expect(result.length).toBe(EXPERIENCE.length)
  })

  it('returns experiences using at least one skill in the given category', () => {
    // 'cloud' category includes AWS, Google Cloud (GCP), GKE
    const result = filterByCategory(EXPERIENCE, 'cloud', SKILLS)
    expect(result.length).toBeGreaterThan(0)
    expect(
      result.every((e) =>
        e.tech.some((rawTech) => {
          const canonical = SKILLS[rawTech] ? rawTech : null
          return canonical && SKILLS[canonical].category === 'cloud'
        })
      )
    ).toBe(true)
  })
})

describe('composeFilters', () => {
  it('chains skill intersection, year range, and category filters', () => {
    const result = composeFilters(
      EXPERIENCE,
      { skillIds: ['Java'], yearRange: [2020, 2026], category: null },
      SKILLS
    )
    expect(result.length).toBeGreaterThan(0)
    expect(
      result.every(
        (e) =>
          e.tech.includes('Java')
          && e.period.start <= 2026
          && (e.period.end ?? 2026) >= 2020
      )
    ).toBe(true)
  })

  it('returns the input unchanged when all three dimensions are inactive', () => {
    const result = composeFilters(
      EXPERIENCE,
      { skillIds: [], yearRange: null, category: null },
      SKILLS
    )
    expect(result.length).toBe(EXPERIENCE.length)
  })
})

describe('yearBounds (D-16-YEAR-BOUNDS honesty rule)', () => {
  it('derives [2007, 2026] from live EXPERIENCE data', () => {
    expect(yearBounds(EXPERIENCE)).toEqual([2007, 2026])
  })
})

describe('visibleSkillIds', () => {
  it('dedupes skill ids across multiple experiences', () => {
    // Two experiences both containing Java — output must have Java exactly once
    const subset = EXPERIENCE.filter((e) => e.tech.includes('Java')).slice(0, 3)
    const result = visibleSkillIds(subset)
    const javaCount = result.filter((id) => id === 'Java').length
    expect(javaCount).toBe(1)
  })

  it('returns empty array for empty input', () => {
    expect(visibleSkillIds([])).toEqual([])
  })
})
