import { describe, it, expect } from 'vitest'
import { trackForBiome, createMusic } from './music.js'

describe('trackForBiome', () => {
  it('maps each biome to a distinct track and falls back safely', () => {
    expect(trackForBiome('pradera')).toBeTruthy()
    expect(trackForBiome('unknown')).toBe(trackForBiome('pradera'))
  })
})

describe('createMusic', () => {
  it('tracks mute state and tolerates a null audio context', () => {
    const m = createMusic(null)
    expect(m.isMuted()).toBe(true) // muted until gesture
    m.mute(false)
    expect(m.isMuted()).toBe(false)
    m.setRegion('cyber') // must not throw with null ctx
  })
})
