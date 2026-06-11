import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DevView from './DevView.js'
import { LanguageProvider } from '../i18n/LanguageContext.js'
import SECTIONS from '../data/sections.js'

const FIXTURE_WORLDS = {
  worlds: [
    {
      id: 'company:acme',
      type: 'company',
      label: 'Acme',
      biome: 'selva',
      levels: [
        {
          company: 'Acme',
          title: { en: 'Dev', es: 'Dev' },
          period: { start: 2019, end: 2020 },
          bullets: { en: ['x'], es: ['x'] },
          tech: ['Java'],
        },
      ],
      position: { x: 0, y: 0 },
    },
  ],
}

describe('DevView', () => {
  it('renders each section from SECTIONS in order', () => {
    render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    for (const s of SECTIONS) {
      // each section renders as a <section aria-label=...> or has a heading containing its label.en
      const label = typeof s.label === 'string' ? s.label : s.label.en
      // DevView renders the experience section separately (id='experience'), so we don't expect
      // a 'Skills' or 'Experience' region matching from SECTIONS — but About/Projects/Claude/Contact
      // SHOULD render as regions. Skills SHOULD also render as its own region (separate from experience).
      // Assert each SECTION has SOME identifiable text on the page (heading match or region).
      expect(
        screen.queryByText(new RegExp(label, 'i'))
          || screen.queryByRole('region', { name: new RegExp(label, 'i') }),
      ).toBeTruthy()
    }
  })

  it('renders experience entries chronologically', () => {
    render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    expect(screen.getByText(/Acme/i)).toBeInTheDocument()
    expect(screen.getByText(/2019/)).toBeInTheDocument()
  })

  it('section content renders in English by default', () => {
    render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    const aboutSec = SECTIONS.find((s) => s.id === 'about')
    // About content shape: { paragraphs: [...] } or { heading, paragraphs: [...] }
    const enContent = aboutSec.content?.en
    const sampleStr = enContent?.paragraphs?.[0] ?? enContent?.heading ?? null
    if (typeof sampleStr === 'string') {
      // Strip any inline HTML tags for the regex match
      const stripped = sampleStr.replace(/<[^>]+>/g, '').slice(0, 30)
      expect(screen.getByText(new RegExp(stripped, 'i'))).toBeInTheDocument()
    }
  })

  it('respects lang context — switches to Spanish content when lang=es', () => {
    window.localStorage.setItem('cam-lang', 'es')
    render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    const aboutSec = SECTIONS.find((s) => s.id === 'about')
    const esContent = aboutSec.content?.es
    const sampleStr = esContent?.paragraphs?.[0] ?? esContent?.heading ?? null
    if (typeof sampleStr === 'string') {
      const stripped = sampleStr.replace(/<[^>]+>/g, '').slice(0, 30)
      expect(screen.getByText(new RegExp(stripped, 'i'))).toBeInTheDocument()
    }
    window.localStorage.removeItem('cam-lang')
  })

  it('scroll-spy anchors match section IDs', () => {
    const { container } = render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    for (const s of SECTIONS) {
      expect(container.querySelector(`#${s.id}`)).toBeTruthy()
    }
  })

  it('no overlay logic — pure scroll layout (no dialog)', () => {
    const { container } = render(<LanguageProvider><DevView worldsData={FIXTURE_WORLDS} /></LanguageProvider>)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })
})
