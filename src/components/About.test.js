import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import About from './About'
import data from '../data/about.json'

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
      <About />
    </LanguageProvider>,
  )
}

describe('About (v4.0 Slice 3)', () => {
  it('renders the section with id="about"', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelector('section#about')).toBeInTheDocument()
  })

  it('renders label + heading + 3 paragraphs (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Who I am')).toBeInTheDocument()
    expect(screen.getByText(/Solutions Architect and Senior Backend Engineer/)).toBeInTheDocument()
    expect(screen.getByText(/Spring Framework/)).toBeInTheDocument()
    expect(screen.getByText(/wife Viky/)).toBeInTheDocument()
  })

  it('renders all 5 quick-fact rows with EN labels + values', () => {
    renderWithLang('en')
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Current role')).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Languages')).toBeInTheDocument()
    expect(screen.getByText('Work mode')).toBeInTheDocument()
    expect(screen.getByText('Medellín, CO')).toBeInTheDocument()
    expect(screen.getByText('Backend @ Coderio')).toBeInTheDocument()
    expect(screen.getByText('18+ years')).toBeInTheDocument()
    expect(screen.getByText('ES · EN')).toBeInTheDocument()
    expect(screen.getByText('Remote friendly')).toBeInTheDocument()
  })

  it('translates label/h2/quick-label and bilingual fact values when lang=es', () => {
    renderWithLang('es')
    expect(screen.getByText('Sobre mí')).toBeInTheDocument()
    expect(screen.getByText('Quién soy')).toBeInTheDocument()
    expect(screen.getByText('Datos rápidos')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
    expect(screen.getByText('Rol actual')).toBeInTheDocument()
    expect(screen.getByText('+18 años')).toBeInTheDocument()
    expect(screen.getByText('Remoto')).toBeInTheDocument()
  })

  it('renders no dangerouslySetInnerHTML — no raw <strong> markup in DOM', () => {
    const { container } = renderWithLang('en')
    const html = container.innerHTML
    expect(html.includes('<strong>')).toBe(false)
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

  it('does NOT read t.about — data-driven only (regression guard)', () => {
    renderWithLang('en')
    expect(screen.queryByText('Quick facts')).toBeInTheDocument()
    expect(screen.queryAllByText('undefined')).toHaveLength(0)
  })
})
