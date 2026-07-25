import { describe, it, expect } from 'vitest'
import { moverDelta } from './mover.js'
describe('mover', () => {
  it('oscillates on its axis and reports a delta', () => {
    const m = { x:0, y:0, ox:0, oy:0, ax:'y', rng:100, sp:1, ph:0, px:0, py:0 }
    const a = moverDelta(m, 0)
    const b = moverDelta(m, 250) // quarter period at sp=1 → sin advances
    expect(b.y).not.toBe(a.y)
    expect(b.dy).toBeCloseTo(b.y - a.y, 5)
    expect(b.dx).toBe(0)
  })
})
