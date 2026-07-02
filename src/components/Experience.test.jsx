import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import Experience from './Experience'
import data from '../data/experience.json'

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
      <Experience />
    </LanguageProvider>,
  )
}

describe('Experience (v4.0 Slice 5)', () => {
  it('renders the section with id="experience"', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelector('section#experience')).toBeInTheDocument()
  })

  it('renders label + heading + intro (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Career timeline')).toBeInTheDocument()
    expect(screen.getByText(/18\+ years of building, leading and shipping/)).toBeInTheDocument()
  })

  it('renders all 12 entry companies', () => {
    renderWithLang('en')
    expect(data.entries).toHaveLength(12)
    for (const entry of data.entries.filter((e) => e.visible !== false)) {
      expect(screen.getAllByText(entry.company).length).toBeGreaterThan(0)
    }
  })

  it('every entry has a visible attribute and only visible entries render', () => {
    renderWithLang('en')
    for (const entry of data.entries) {
      expect(typeof entry.visible).toBe('boolean')
    }
    const visibleCount = data.entries.filter((e) => e.visible !== false).length
    const cards = screen.getAllByRole('button', { name: /expand entry/i })
    expect(cards).toHaveLength(visibleCount)
  })

  it('each entry renders its date + title + location (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText('Jan 2026 — Present')).toBeInTheDocument()
    expect(screen.getByText('Backend Developer — Squad User Profile')).toBeInTheDocument()
    expect(screen.getAllByText('Remote').length).toBeGreaterThan(0)
    expect(screen.getByText('Apr 2007 — Jun 2009')).toBeInTheDocument()
  })

  it('expand/collapse buttons render with bilingual ARIA labels (EN starts collapsed)', () => {
    renderWithLang('en')
    const buttons = screen.getAllByRole('button', { name: /expand entry/i })
    expect(buttons).toHaveLength(data.entries.filter((e) => e.visible !== false).length)
    for (const b of buttons) {
      expect(b.getAttribute('aria-expanded')).toBe('false')
    }
  })

  it('clicking expand toggles bullets and aria-expanded=true', () => {
    renderWithLang('en')
    const buttons = screen.getAllByRole('button', { name: /expand entry/i })
    expect(screen.queryByText(/latency reduction on the Person API/)).toBeNull()
    fireEvent.click(buttons[0])
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText(/latency reduction on the Person API/)).toBeInTheDocument()
  })

  it('translates label/h2/intro/ARIA when lang=es', () => {
    renderWithLang('es')
    expect(screen.getByText('Experiencia')).toBeInTheDocument()
    expect(screen.getByText('Línea de tiempo')).toBeInTheDocument()
    expect(screen.getByText(/Highlights de \+18 años/)).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { name: /expandir entrada/i })
    expect(buttons).toHaveLength(12)
  })

  it('experience.json schema sanity — 12 entries each with required bilingual keys', () => {
    expect(Array.isArray(data.entries)).toBe(true)
    expect(data.entries).toHaveLength(12)
    for (const e of data.entries) {
      expect(typeof e.id).toBe('string')
      expect(typeof e.company).toBe('string')
      expect(typeof e.date.en).toBe('string')
      expect(typeof e.date.es).toBe('string')
      expect(typeof e.title.en).toBe('string')
      expect(typeof e.title.es).toBe('string')
      expect(typeof e.location.en).toBe('string')
      expect(typeof e.location.es).toBe('string')
      expect(Array.isArray(e.bullets.en)).toBe(true)
      expect(Array.isArray(e.bullets.es)).toBe(true)
      expect(Array.isArray(e.tech)).toBe(true)
    }
  })
})
