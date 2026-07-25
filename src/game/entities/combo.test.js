import { describe, it, expect } from 'vitest'
import { comboScore } from './combo.js'

describe('comboScore', () => {
  it('awards 100 for the first stomp in a chain', () => {
    expect(comboScore(1)).toBe(100)
  })
  it('doubles per chained stomp', () => {
    expect(comboScore(2)).toBe(200)
    expect(comboScore(3)).toBe(400)
    expect(comboScore(4)).toBe(800)
  })
  it('never drops below 100 for non-positive chains', () => {
    expect(comboScore(0)).toBe(100)
  })
})
