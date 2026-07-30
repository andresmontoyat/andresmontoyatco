import { describe, it, expect } from 'vitest'
import { phaseOf, daylight, nightTint } from './lighting.js'

describe('phaseOf', () => {
  it('is cyclic over dayLen', () => {
    expect(phaseOf(0, 100)).toBeCloseTo(0)
    expect(phaseOf(100, 100)).toBeCloseTo(0)
    expect(phaseOf(50, 100)).toBeCloseTo(0.5)
  })
})

describe('daylight', () => {
  it('peaks at midday and bottoms at midnight', () => {
    expect(daylight(0.5)).toBeGreaterThan(daylight(0))
    expect(daylight(0.5)).toBeGreaterThan(daylight(1))
  })
})

describe('nightTint', () => {
  it('is transparent at midday and opaque-ish at night', () => {
    expect(nightTint(0.5).a).toBeLessThan(nightTint(0).a)
  })
})
