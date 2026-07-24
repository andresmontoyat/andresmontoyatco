import { describe, it, expect } from 'vitest'
import { createPlayer, hurt, landReset } from './player.js'

describe('player', () => {
  it('starts grounded-capable with no power-ups', () => {
    const p = createPlayer()
    expect(p.boots).toBe(false); expect(p.shield).toBe(false); expect(p.inv).toBe(0)
  })
  it('consumes shield first on hurt (no knockback velocity)', () => {
    const p = createPlayer(); p.shield = true
    const r = hurt(p)
    expect(r.lost).toBe('shield'); expect(p.shield).toBe(false); expect(p.inv).toBeGreaterThan(0)
  })
  it('loses boots on hurt when no shield', () => {
    const p = createPlayer(); p.boots = true; p.face = 1
    const r = hurt(p)
    expect(r.lost).toBe('boots'); expect(p.boots).toBe(false); expect(p.vx).toBeLessThan(0)
  })
  it('plain knockback when unpowered', () => {
    const p = createPlayer(); p.face = -1
    const r = hurt(p)
    expect(r.lost).toBeNull(); expect(p.vx).toBeGreaterThan(0); expect(p.inv).toBeGreaterThan(0)
  })
  it('resets jumps and squashes on land', () => {
    const p = createPlayer(); p.jumps = 2
    landReset(p)
    expect(p.jumps).toBe(0); expect(p.sy).toBeLessThan(1); expect(p.sx).toBeGreaterThan(1)
  })
})
