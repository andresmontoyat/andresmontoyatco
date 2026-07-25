// @vitest-environment node
//
// src/components/astro/Claude.test.ts
// Astro Container API parity test — ports all 6 it-blocks of the former
// src/components/Claude.test.jsx RTL suite against the zero-JS Claude.astro
// (D-01/D-06). Forced to the `node` environment per-file (see
// src/pages/_404.test.ts for the esbuild/jsdom rationale established in
// Phase 21) — renderToString() output is plain HTML text, no DOM APIs needed.
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import Claude from './Claude.astro'
import data from '../../data/claude.json'

async function renderClaude(locale = 'en') {
  const container = await AstroContainer.create()
  return container.renderToString(Claude, { props: { locale } })
}

describe('Claude.astro (Container API parity — D-06)', () => {
  it('renders the section with id="claude-code"', async () => {
    const result = await renderClaude('en')
    expect(result).toContain('id="claude-code"')
  })

  it('renders pitch hero label/h2/subLead/CTA (EN)', async () => {
    const result = await renderClaude('en')
    expect(result).toMatch(/AI Engineering · For your team/)
    expect(result).toMatch(/Software/)
    expect(result).toMatch(/delivered with AI discipline/)
    expect(result).toMatch(/Senior backend engineer/)
    expect(result).toContain('Let&#39;s talk about your project')
  })

  it('renders all 4 value cards with title + id (EN)', async () => {
    const result = await renderClaude('en')
    expect(data.values).toHaveLength(4)
    expect(result).toContain('Delivery 3–5× faster')
    expect(result).toContain('Architecture without shortcuts')
    expect(result).toContain('Tests + observability built-in')
    expect(result).toContain('Your team keeps the workflow')
  })

  it('renders all 6 offerings (EN)', async () => {
    const result = await renderClaude('en')
    expect(data.offerings).toHaveLength(6)
    expect(result).toContain('Agentic delivery')
    expect(result).toContain('RAG &amp; MCP servers')
    expect(result).toContain('LLM evals &amp; guardrails')
    expect(result).toContain('Greenfield builds')
    expect(result).toContain('Legacy refactor')
    expect(result).toContain('DevOps automation')
  })

  it('translates pitch + values + offerings when locale=es', async () => {
    const result = await renderClaude('es')
    expect(result).toMatch(/AI Engineering · Para tu equipo/)
    expect(result).toMatch(/Software/)
    expect(result).toMatch(/Hablemos de tu proyecto/)
    expect(result).toContain('Entrega 3–5× más rápida')
    expect(result).toContain('Entrega agéntica')
  })

  it('claude.json schema sanity — values/offerings bilingual', () => {
    expect(Array.isArray(data.values)).toBe(true)
    for (const v of data.values) {
      expect(typeof v.id).toBe('string')
      expect(typeof v.title.en).toBe('string')
      expect(typeof v.title.es).toBe('string')
      expect(typeof v.desc.en).toBe('string')
      expect(typeof v.desc.es).toBe('string')
    }
    for (const o of data.offerings) {
      expect(typeof o.id).toBe('string')
      expect(typeof o.title.en).toBe('string')
      expect(typeof o.title.es).toBe('string')
      expect(typeof o.desc.en).toBe('string')
      expect(typeof o.desc.es).toBe('string')
    }
  })
})
