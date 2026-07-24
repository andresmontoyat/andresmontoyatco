import { describe, it, expect } from 'vitest'
import { TUNING } from './tuning.js'
import { jumpVelocity, gravityStep, aabb } from './physics.js'

const P = (o) => ({ onGround:false, coyote:0, jumps:0, boots:false, ...o })

describe('physics', () => {
  it('jumps from the ground', () => {
    expect(jumpVelocity(P({ onGround:true }), TUNING)).toBe(TUNING.JUMP)
  })
  it('jumps during coyote time', () => {
    expect(jumpVelocity(P({ coyote:3 }), TUNING)).toBe(TUNING.JUMP)
  })
  it('cannot jump midair without boots', () => {
    expect(jumpVelocity(P({ jumps:1 }), TUNING)).toBeNull()
  })
  it('allows a second (weaker) jump midair with boots', () => {
    const v = jumpVelocity(P({ jumps:1, boots:true }), TUNING)
    expect(v).toBeLessThan(0)
    expect(v).toBeGreaterThan(TUNING.JUMP) // weaker than a full jump
  })
  it('applies reduced gravity near the apex', () => {
    const nearApex = gravityStep(0.5, TUNING)
    const falling = gravityStep(10, TUNING)
    expect(nearApex - 0.5).toBeCloseTo(TUNING.GRAV * TUNING.APEX_MULT, 5)
    expect(falling - 10).toBeCloseTo(TUNING.GRAV, 5)
  })
  it('clamps fall speed', () => {
    expect(gravityStep(TUNING.MAX_FALL + 5, TUNING)).toBe(TUNING.MAX_FALL)
  })
  it('detects AABB overlap', () => {
    expect(aabb({x:0,y:0,w:10,h:10}, {x:5,y:5,w:10,h:10})).toBe(true)
    expect(aabb({x:0,y:0,w:10,h:10}, {x:20,y:0,w:10,h:10})).toBe(false)
  })
})
