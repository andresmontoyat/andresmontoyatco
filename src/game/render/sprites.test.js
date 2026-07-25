import { describe, it, expect } from 'vitest'
import { shade, drawMascot, drawBug, drawCoin } from './sprites.js'
import { createParticles, burst, updateParticles, drawParticles } from './particles.js'

function stubCtx() {
  const noop = () => {}
  return new Proxy({}, { get: (_, k) =>
    k === 'createLinearGradient' ? () => ({ addColorStop: noop })
    : (typeof k === 'string' && k.startsWith('fill') || k === 'save' || k === 'restore') ? noop
    : noop })
}

describe('render smoke', () => {
  it('shade returns an rgb string', () => { expect(shade('#5cb85c', -30)).toMatch(/^rgb/) })
  it('draws sprites without throwing', () => {
    const ctx = stubCtx()
    expect(() => drawMascot(ctx, 100, 200, { face:1, run:0, air:false, sx:1, sy:1, inv:0, boots:false, shield:false })).not.toThrow()
    expect(() => drawBug(ctx, { x:0,y:0,w:28,h:26,vx:1,t:0,hit:0,col:'#5cb85c' }, 'en')).not.toThrow()
    expect(() => drawCoin(ctx, { x:0,y:0,got:false }, 0)).not.toThrow()
  })
  it('particle pool bursts, updates and draws', () => {
    const pool = createParticles()
    burst(pool, 0, 0, 8, { c:'#fff' })
    expect(pool.length).toBe(8)
    updateParticles(pool)
    expect(() => drawParticles(stubCtx(), pool)).not.toThrow()
  })
})
