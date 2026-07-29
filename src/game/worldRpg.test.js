import { describe, it, expect } from 'vitest'
import { createWorldRpg, update } from './worldRpg.js'
import { doorPoint } from './entities/site.js'
import { DAY_LEN } from './render/ambient.js'
import { phaseOf, daylight } from './render/lighting.js'
import experience from '../data/experience.json'

describe('worldRpg core', () => {
  it('builds a playable state with the real career data', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    expect(g.state.world.sites.length).toBeGreaterThan(0)
    expect(g.state.player).toBeTruthy()
  })
  it('starts the world clock at midday — a recruiter must see daylight on load, not night', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    expect(daylight(phaseOf(g.state.clock, DAY_LEN))).toBeGreaterThan(0.8)
  })
  it('builds state with sprites unset until start() loads them', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    expect(g.state.sprites).toBe(null)
  })
  it('update moves the player when input is held', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    const x0 = g.state.player.x
    update(g.state, { R: 1 }, 1.6)
    expect(g.state.player.x).toBeGreaterThan(x0)
  })
  it('update freezes movement while dialog is open', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    g.state.dialog.open(g.state.world.sites[0])
    const x0 = g.state.player.x
    update(g.state, { R: 1 }, 1.6)
    expect(g.state.player.x).toBe(x0)
  })
  it('revealing appends hidden sites to the interactable set', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [{ co: 'Mr. Yoker', title: { en: 'Indie', es: 'Indie' }, date: { en: 's', es: 'p' }, tech: ['Astro'] }], lang: 'es' })
    expect(g.activeSites().length).toBe(g.state.world.sites.length)
    g.reveal()
    expect(g.activeSites().length).toBe(g.state.world.sites.length + 1)
  })
  it('first read of a site emits a discovery particle burst', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    const site = g.state.world.sites[0]
    const door = doorPoint(site)
    g.state.player.x = door.x
    g.state.player.y = door.y
    g.interact()
    expect(g.state.particles.alive().length).toBeGreaterThan(0)
  })
  it('re-reading an already-seen site does not emit another burst', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    const site = g.state.world.sites[0]
    const door = doorPoint(site)
    g.state.player.x = door.x
    g.state.player.y = door.y
    g.interact() // closed -> opens (typing) + bursts on first read
    g.state.particles.update(1000) // let the discovery burst fully expire
    g.interact() // typing -> waiting
    g.interact() // waiting -> closed
    g.interact() // closed -> reopens the now-seen site: no burst this time
    expect(g.state.particles.alive().length).toBe(0)
  })
  it('the Konami reveal sets a screen-shake impulse', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    expect(g.state.shake).toBe(0)
    g.reveal()
    expect(g.state.shake).toBeGreaterThan(0)
  })
  it('update advances the world clock and never throws without a canvas', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    expect(() => update(g.state, {}, 1.6)).not.toThrow()
    expect(g.state.clock).toBeGreaterThan(0)
  })
})
