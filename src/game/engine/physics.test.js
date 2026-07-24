import { describe, it, expect } from 'vitest'
import { TUNING } from './tuning.js'
import { jumpVelocity, gravityStep, aabb, resolveHorizontal, resolveVertical } from './physics.js'

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

describe('collision', () => {
  const floor = { x:-100, y:100, w:400, h:50 }
  it('lands on a floor and flags onGround', () => {
    const p = { x:0, y:96, w:20, h:20, vx:0, vy:8, onGround:false }
    const r = resolveVertical(p, [floor])
    expect(p.y).toBe(floor.y - p.h) // 80
    expect(p.vy).toBe(0)
    expect(p.onGround).toBe(true)
    expect(r.landedOn).toBe(floor)
  })
  it('reports a head bump when moving up into a block', () => {
    const block = { x:0, y:0, w:40, h:20 }
    const p = { x:10, y:15, w:20, h:20, vx:0, vy:-6, onGround:false }
    const r = resolveVertical(p, [block])
    expect(p.y).toBe(block.y + block.h) // 20
    expect(r.hitHead).toBe(block)
  })
  it('stops horizontal movement against a wall', () => {
    const wall = { x:50, y:0, w:20, h:200 }
    const p = { x:35, y:50, w:20, h:20, vx:5 }
    resolveHorizontal(p, [wall])
    expect(p.x).toBe(wall.x - p.w) // 30
    expect(p.vx).toBe(0)
  })
})
