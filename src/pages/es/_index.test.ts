// @vitest-environment node
//
// src/pages/es/_index.test.ts
// Underscore-prefixed per Astro's pages-directory convention (see
// src/pages/_404.test.ts for the full rationale) so `astro build` never
// tries to render this test file as a route.
//
// Container API coverage for the entry splash markup/copy added to the /es
// home page — Spanish counterpart of src/pages/en/_index.test.ts.
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import reactRenderer from '@astrojs/react/server.js'
import IndexPage from './index.astro'

async function renderIndex() {
  const container = await AstroContainer.create()
  container.addServerRenderer({ renderer: reactRenderer })
  return container.renderToString(IndexPage)
}

describe('es/index.astro entry splash (Container API)', () => {
  it('renders the dialog with accessible wiring', async () => {
    const result = await renderIndex()
    expect(result).toContain('id="entry-splash"')
    expect(result).toContain('role="dialog"')
    expect(result).toContain('aria-modal="true"')
    expect(result).toContain('aria-labelledby="entry-splash-title"')
    expect(result).toContain('id="entry-splash-title"')
  })

  it('hides the overlay by default (no-flash: inline style, not a client-only class)', async () => {
    const result = await renderIndex()
    expect(result).toMatch(/id="entry-splash"[^>]*style="display:none"/)
  })

  it('renders Spanish copy for eyebrow, title, hook and both CTAs', async () => {
    const result = await renderIndex()
    expect(result).toContain('Carlos Montoya')
    expect(result).toContain('Elige tu camino')
    expect(result).toContain('Senior Java Backend &amp; Solutions Architect · +18 años.')
    expect(result).toContain('Juega mi carrera')
    expect(result).toContain('Ver portafolio')
  })

  it('the Play CTA links to the /es/game route', async () => {
    const result = await renderIndex()
    expect(result).toMatch(/id="entry-splash-play"[^>]*href="\/es\/game\/?"/)
  })

  it('the View CTA is a real <button>, not a link (dismiss-only action)', async () => {
    const result = await renderIndex()
    expect(result).toMatch(/<button[^>]*id="entry-splash-view"/)
  })

  it('ships exactly one is:inline controller script for the splash', async () => {
    const result = await renderIndex()
    expect(result.match(/cam-entry-choice/g)?.length).toBeGreaterThanOrEqual(2)
  })
})
