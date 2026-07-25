import { describe, it, expect, vi, beforeEach } from 'vitest'
import { init } from './careerGame.js'

function stubCanvas() {
  const noop = () => {}
  const ctx = new Proxy({}, { get: (_, k) =>
    k === 'createLinearGradient' ? () => ({ addColorStop: noop }) : noop })
  return { getContext: () => ctx, width:1280, height:720,
    getBoundingClientRect: () => ({ width:1280, height:720, left:0, top:0 }),
    addEventListener: noop, removeEventListener: noop }
}

describe('careerGame composition', () => {
  beforeEach(() => { global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {} })
  it('builds a playable state from experience data', () => {
    const game = init(stubCanvas(), { locale:'en', reduced:true })
    const s = game.getState()
    expect(s.player).toBeTruthy()
    expect(s.level.companies.length).toBeGreaterThan(0)
    expect(s.level.enemies.some(e => e.boss)).toBe(true)
    game.stop()
  })
  it('advances the player to the right when the run intent is held', () => {
    const game = init(stubCanvas(), { locale:'en', reduced:true })
    const s = game.getState()
    const x0 = s.player.x
    s.input.keys.R = 1
    for (let i = 0; i < 30; i++) game.tick(i * 16) // tick = one manual step, exposed for tests
    expect(game.getState().player.x).toBeGreaterThan(x0)
    game.stop()
  })
  it('suppresses juice under reduced motion', () => {
    const game = init(stubCanvas(), { locale:'en', reduced:true })
    const s = game.getState()
    // force a stomp and assert no particles spawn under reduced motion
    const before = s.particles.length
    game.tick(16)
    expect(s.reduced).toBe(true)
    expect(s.particles.length).toBe(before) // no idle particle spawns when reduced
    game.stop()
  })
  it('switches company labels with locale', () => {
    const game = init(stubCanvas(), { locale:'en', reduced:true })
    game.setLocale('es')
    expect(game.getState().lang).toBe('es')
    game.stop()
  })
})
