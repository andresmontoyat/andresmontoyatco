import { describe, it, expect } from 'vitest'
import { createWorldRpg, update } from './worldRpg.js'
import experience from '../data/experience.json'

describe('worldRpg core', () => {
  it('builds a playable state with the real career data', () => {
    const g = createWorldRpg({ canvas: null, experience, sideProjects: [], lang: 'es' })
    expect(g.state.world.sites.length).toBeGreaterThan(0)
    expect(g.state.player).toBeTruthy()
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
})
