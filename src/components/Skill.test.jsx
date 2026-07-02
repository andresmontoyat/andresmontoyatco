import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import Skill from './Skill'
import data from '../data/skills.json'

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
      <Skill />
    </LanguageProvider>,
  )
}

describe('Skill (v4.0 Slice 4)', () => {
  it('renders the section with id="skills"', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelector('section#skills')).toBeInTheDocument()
  })

  it('renders label + heading + intro (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText('Skills')).toBeInTheDocument()
    expect(screen.getByText('Technical stack')).toBeInTheDocument()
    expect(screen.getByText(/Tools and technologies/)).toBeInTheDocument()
  })

  it('renders all 4 category titles (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText('Backend')).toBeInTheDocument()
    expect(screen.getByText('Cloud & Infrastructure')).toBeInTheDocument()
    expect(screen.getByText('DevOps & Tools')).toBeInTheDocument()
    expect(screen.getByText('AI & Productivity')).toBeInTheDocument()
  })

  it('renders every chip with its label (29 chips total)', () => {
    renderWithLang('en')
    const allChips = data.categories.flatMap((c) => c.chips)
    expect(allChips).toHaveLength(29)
    for (const chip of allChips) {
      expect(screen.getAllByText(chip.label).length).toBeGreaterThan(0)
    }
  })

  it('translates h2/intro/category-titles when lang=es', () => {
    renderWithLang('es')
    expect(screen.getByText('Stack técnico')).toBeInTheDocument()
    expect(screen.getByText(/Herramientas y tecnologías/)).toBeInTheDocument()
    expect(screen.getByText('Nube e Infraestructura')).toBeInTheDocument()
    expect(screen.getByText('DevOps y Herramientas')).toBeInTheDocument()
    expect(screen.getByText('IA y Productividad')).toBeInTheDocument()
  })

  it('renders years next to chip label in some form (e.g. "18y" or "18a")', () => {
    renderWithLang('en')
    const { container } = renderWithLang('en')
    const html = container.textContent
    expect(html).toMatch(/18\s*y/)
  })

  it('skills.json schema sanity — 4 categories, each with bilingual title + chips array', () => {
    expect(Array.isArray(data.categories)).toBe(true)
    expect(data.categories).toHaveLength(4)
    for (const c of data.categories) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.symbol).toBe('string')
      expect(typeof c.title.en).toBe('string')
      expect(typeof c.title.es).toBe('string')
      expect(Array.isArray(c.chips)).toBe(true)
      expect(c.chips.length).toBeGreaterThan(0)
      for (const chip of c.chips) {
        expect(typeof chip.label).toBe('string')
        expect(typeof chip.years).toBe('number')
      }
    }
  })
})
