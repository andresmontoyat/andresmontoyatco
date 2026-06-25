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
    expect(screen.getByText(/Software/)).toBeInTheDocument()
    expect(screen.getByText(/delivered with AI discipline/)).toBeInTheDocument()
    expect(screen.getByText(/Senior backend engineer/)).toBeInTheDocument()
    expect(screen.getByText(/Let's talk about your project/)).toBeInTheDocument()
  })

  it('renders all 4 value cards with title + id (EN)', () => {
    renderWithLang('en')
    expect(data.values).toHaveLength(4)
    expect(screen.getByText('Delivery 3–5× faster')).toBeInTheDocument()
    expect(screen.getByText('Architecture without shortcuts')).toBeInTheDocument()
    expect(screen.getByText('Tests + observability built-in')).toBeInTheDocument()
    expect(screen.getByText('Your team keeps the workflow')).toBeInTheDocument()
  })

  it('renders all 6 offerings (EN)', () => {
    renderWithLang('en')
    expect(data.offerings).toHaveLength(6)
    expect(screen.getByText('Agentic delivery')).toBeInTheDocument()
    expect(screen.getByText('RAG & MCP servers')).toBeInTheDocument()
    expect(screen.getByText('LLM evals & guardrails')).toBeInTheDocument()
    expect(screen.getByText('Greenfield builds')).toBeInTheDocument()
    expect(screen.getByText('Legacy refactor')).toBeInTheDocument()
    expect(screen.getByText('DevOps automation')).toBeInTheDocument()
  })

  it('translates pitch + values + offerings when lang=es', () => {
    renderWithLang('es')
    expect(screen.getByText(/AI Engineering · Para tu equipo/)).toBeInTheDocument()
    expect(screen.getByText(/Software/)).toBeInTheDocument()
    expect(screen.getByText(/Hablemos de tu proyecto/)).toBeInTheDocument()
    expect(screen.getByText('Entrega 3–5× más rápida')).toBeInTheDocument()
    expect(screen.getByText('Entrega agéntica')).toBeInTheDocument()
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
