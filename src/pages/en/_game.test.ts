// @vitest-environment node
//
// src/pages/en/_game.test.ts — underscore-prefixed so astro build never renders it as a route.
// While the game is switched off (src/config/features.js), /en/game sends a visitor home instead
// of serving the unfinished game.
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { afterEach, describe, expect, it } from 'vitest'
import reactRenderer from '@astrojs/react/server.js'
import GamePage from './game.astro'
import { features } from '../../config/features.js'

const shipped = features.game

async function renderGame() {
  const container = await AstroContainer.create()
  container.addServerRenderer({ renderer: reactRenderer })
  return container.renderToResponse(GamePage, { partial: false, locals: {}, request: new Request('http://x/en/game') })
}

describe('en/game.astro', () => {
  afterEach(() => { features.game = shipped })

  it('redirects to the portfolio while the game is switched off', async () => {
    features.game = false
    const res = await renderGame()
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('location')).toMatch(/^\/en\/?$/)
  })

  it('serves the game while it is switched on', async () => {
    features.game = true
    const res = await renderGame()
    expect(res.status).toBe(200)
  })
})
