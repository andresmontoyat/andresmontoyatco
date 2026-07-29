import { describe, it, expect } from 'vitest'
import { aabb, hits, stepMovement } from './topdown.js'

const P = { x: 100, y: 100, w: 24, h: 28, dir: 'down' }
const bounds = { w: 2000, h: 2000 }

describe('aabb', () => {
  it('detects overlap', () => { expect(aabb(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true) })
  it('detects separation', () => { expect(aabb(0, 0, 10, 10, 50, 50, 10, 10)).toBe(false) })
})

describe('stepMovement', () => {
  it('moves right and sets dir', () => {
    const r = stepMovement(P, { R: 1 }, [], bounds, { speed: 3 })
    expect(r.x).toBe(103)
    expect(r.dir).toBe('right')
    expect(r.moving).toBe(true)
  })
  it('does not move when frozen (dialog open)', () => {
    const r = stepMovement(P, { R: 1, frozen: true }, [], bounds)
    expect(r.x).toBe(100)
    expect(r.moving).toBe(false)
  })
  it('is blocked by a solid on one axis but slides on the other', () => {
    const wall = { x: 112, y: 60, w: 40, h: 120 }
    const r = stepMovement(P, { R: 1, D: 1 }, [wall], bounds, { speed: 3 })
    expect(r.x).toBe(100) // x blocked by wall
    expect(r.y).toBe(103) // y free
  })
  it('clamps to world bounds', () => {
    const r = stepMovement({ ...P, x: 5 }, { L: 1 }, [], bounds, { speed: 30 })
    expect(r.x).toBeGreaterThanOrEqual(0)
  })
})
