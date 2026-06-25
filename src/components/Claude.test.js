import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import Claude from './Claude'
import data from '../data/claude.json'

function setLangBeforeRender(lang) {
  try {
    window.localStorage.setItem('cam-lang', lang)
  } catch (e) {
    // ignore
  }
}

function renderWithLang(lang = 'en') {
  setLangBeforeRender(lang)
  return render(
    <LanguageProvider>
      <Claude />
    </LanguageProvider>,
  )
}

describe('Claude (v4.0 Slice 7)', () => {
  it('renders the section with id="claude-code"', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelector('section#claude-code')).toBeInTheDocument()
  })

  it('renders pitch hero label/h2/subLead/CTAs (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText(/AI Engineering · For your team/)).toBeInTheDocument()
    expect(screen.getByText(/Backend systems/)).toBeInTheDocument()
    expect(screen.getByText(/delivered with AI discipline/)).toBeInTheDocument()
    expect(screen.getByText(/Senior backend engineer/)).toBeInTheDocument()
    expect(screen.getByText(/Let's talk about your project/)).toBeInTheDocument()
    expect(screen.getByText('See projects')).toBeInTheDocument()
  })

  it('renders all 4 value cards with title + id (EN)', () => {
    renderWithLang('en')
    expect(data.values).toHaveLength(4)
    expect(screen.getByText('Delivery 3–5× faster')).toBeInTheDocument()
    expect(screen.getByText('Hexagonal without shortcuts')).toBeInTheDocument()
    expect(screen.getByText('Tests + observability built-in')).toBeInTheDocument()
    expect(screen.getByText('Your team keeps the workflow')).toBeInTheDocument()
  })

  it('renders proof block with 7 counters (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText('Track record')).toBeInTheDocument()
    expect(screen.getByText(/built my own toolkit/)).toBeInTheDocument()
    expect(data.counters).toHaveLength(7)
    expect(screen.getByText('37')).toBeInTheDocument()
    expect(screen.getByText('81')).toBeInTheDocument()
    expect(screen.getByText('86')).toBeInTheDocument()
    expect(screen.getByText('custom agents')).toBeInTheDocument()
    expect(screen.getByText('orchestrations')).toBeInTheDocument()
  })

  it('renders all 5 services + 5 featured apps (EN)', () => {
    renderWithLang('en')
    expect(data.services).toHaveLength(5)
    expect(screen.getByText('Greenfield builds')).toBeInTheDocument()
    expect(screen.getByText('MCP server development')).toBeInTheDocument()
    expect(screen.getByText('Legacy refactor')).toBeInTheDocument()
    expect(data.apps).toHaveLength(5)
    expect(screen.getAllByText('ci-templates').length).toBeGreaterThan(0)
    expect(screen.getByText('GSD framework')).toBeInTheDocument()
    expect(screen.getAllByText('spring-ai-qdrant-mcp').length).toBeGreaterThan(0)
  })

  it('renders stackChips strip (17 chips)', () => {
    renderWithLang('en')
    expect(data.stackChips).toHaveLength(17)
    expect(screen.getAllByText('Java 21').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Spring Boot 3').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Spring AI').length).toBeGreaterThan(0)
  })

  it('translates pitch + values + counters when lang=es', () => {
    renderWithLang('es')
    expect(screen.getByText(/AI Engineering · Para tu equipo/)).toBeInTheDocument()
    expect(screen.getByText(/Sistemas backend/)).toBeInTheDocument()
    expect(screen.getByText(/Hablemos de tu proyecto/)).toBeInTheDocument()
    expect(screen.getByText('Entrega 3–5× más rápida')).toBeInTheDocument()
    expect(screen.getByText('subagents propios')).toBeInTheDocument()
    expect(screen.getByText('CÓDIGO ABIERTO')).toBeInTheDocument()
  })

  it('claude.json schema sanity — values/services/counters/apps bilingual + stackChips array', () => {
    expect(Array.isArray(data.values)).toBe(true)
    for (const v of data.values) {
      expect(typeof v.id).toBe('string')
      expect(typeof v.title.en).toBe('string')
      expect(typeof v.title.es).toBe('string')
      expect(typeof v.desc.en).toBe('string')
      expect(typeof v.desc.es).toBe('string')
    }
    for (const s of data.services) {
      expect(typeof s.id).toBe('string')
      expect(typeof s.title.en).toBe('string')
      expect(typeof s.desc.es).toBe('string')
    }
    for (const c of data.counters) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.value).toBe('number')
      expect(typeof c.label.en).toBe('string')
      expect(typeof c.label.es).toBe('string')
    }
    for (const a of data.apps) {
      expect(typeof a.id).toBe('string')
      expect(typeof a.name.en).toBe('string')
      expect(typeof a.tag.es).toBe('string')
      expect(Array.isArray(a.stack)).toBe(true)
    }
    expect(Array.isArray(data.stackChips)).toBe(true)
  })
})
