import { describe, it, expect } from 'vitest'
import { createParticles, burst } from './juice.js'

describe('particles', () => {
  it('spawns and expires by life', () => {
    const p = createParticles(10)
    p.spawn(0, 0, 1, 1, 5, '#fff')
    expect(p.alive().length).toBe(1)
    for (let i = 0; i < 6; i++) p.update(1)
    expect(p.alive().length).toBe(0)
  })
  it('respects the pool cap', () => {
    const p = createParticles(3)
    for (let i = 0; i < 10; i++) p.spawn(0, 0, 0, 0, 5, '#fff')
    expect(p.alive().length).toBeLessThanOrEqual(3)
  })
  it('burst emits n particles', () => {
    const p = createParticles(50)
    burst(p, 10, 10, 12, () => 0.5)
    expect(p.alive().length).toBe(12)
  })
})
