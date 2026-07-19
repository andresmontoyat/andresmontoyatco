// @vitest-environment node
//
// src/components/astro/About.test.ts
// Astro Container API coverage-parity spot-check (D-07) — ports all 7 it-blocks
// of the former src/components/About.test.jsx RTL suite against the zero-JS
// About.astro (D-01/D-04/D-06). Forced to the `node` environment per-file
// (see src/pages/_404.test.ts for the esbuild/jsdom rationale established in
// Phase 21) — renderToString() output is plain HTML text, no DOM APIs needed.
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import About from './About.astro'
import data from '../../data/about.json'

async function renderAbout(locale = 'en') {
  const container = await AstroContainer.create()
  return container.renderToString(About, { props: { locale } })
}

describe('About.astro (Container API coverage-parity spot-check — D-07)', () => {
  it('renders the section with id="about"', async () => {
    const result = await renderAbout('en')
    expect(result).toContain('id="about"')
  })

  it('renders label + heading + 3 paragraphs (EN)', async () => {
    const result = await renderAbout('en')
    expect(result).toContain('About')
    expect(result).toContain('Who I am')
    expect(result).toMatch(/Solutions Architect and Senior Backend Engineer/)
    expect(result).toMatch(/Spring Framework/)
    expect(result).toMatch(/wife Viky/)
  })

  it('renders all 5 quick-fact rows with EN labels + values', async () => {
    const result = await renderAbout('en')
    expect(result).toContain('Location')
    expect(result).toContain('Current role')
    expect(result).toContain('Experience')
    expect(result).toContain('Languages')
    expect(result).toContain('Work mode')
    expect(result).toContain('Medellín, CO')
    expect(result).toContain('Solution Architect @ Soldife')
    // Static value renders verbatim (no count-up on mount per D-04) — assert
    // the settled string is present rather than an animation-in-progress state.
    expect(result).toMatch(/\d+\+ years/)
    expect(result).toContain('ES · EN')
    expect(result).toContain('Remote friendly')
  })

  it('translates label/h2/quick-label and bilingual fact values when locale=es', async () => {
    const result = await renderAbout('es')
    expect(result).toContain('Sobre mí')
    expect(result).toContain('Quién soy')
    expect(result).toContain('Datos rápidos')
    expect(result).toContain('Ubicación')
    expect(result).toContain('Rol actual')
    expect(result).toContain('Remoto')
    expect(result).toMatch(/\+\d+ años/)
  })

  it('renders no dangerouslySetInnerHTML equivalent — no raw <strong> markup', async () => {
    const result = await renderAbout('en')
    expect(result.includes('<strong>')).toBe(false)
  })

  it('about.json schema sanity — 3 paragraphs + 5 facts, each with required bilingual keys', () => {
    expect(Array.isArray(data.paragraphs)).toBe(true)
    expect(data.paragraphs).toHaveLength(3)
    for (const p of data.paragraphs) {
      expect(typeof p.en).toBe('string')
      expect(typeof p.es).toBe('string')
    }
    expect(Array.isArray(data.facts)).toBe(true)
    expect(data.facts).toHaveLength(5)
    for (const f of data.facts) {
      expect(typeof f.id).toBe('string')
      expect(typeof f.kLabel.en).toBe('string')
      expect(typeof f.kLabel.es).toBe('string')
      expect(typeof f.value.en).toBe('string')
      expect(typeof f.value.es).toBe('string')
    }
  })

  it('does NOT read t.about — data-driven only (regression guard)', async () => {
    const result = await renderAbout('en')
    expect(result).toContain('Quick facts')
    expect(result).not.toContain('undefined')
  })
})
