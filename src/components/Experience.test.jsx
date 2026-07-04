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

  it('marks coderio, klever and tcs as featured; the rest are compact', () => {
    const featuredIds = data.entries.filter((e) => e.featured).map((e) => e.id)
    expect(featuredIds.sort()).toEqual(['coderio-2026', 'klever-2020', 'tcs-2013'])
  })

  it('featured entries render as featured variant, others as compact', () => {
    const { container } = renderWithLang('en')
    const featured = container.querySelectorAll('[data-variant="featured"]')
    const compact = container.querySelectorAll('[data-variant="compact"]')
    const visibleCount = data.entries.filter((e) => e.visible !== false).length
    expect(featured).toHaveLength(3)
    expect(compact).toHaveLength(visibleCount - 3)
  })

  it('renders hero metric value + label for a featured entry with a value (Coderio, EN)', () => {
    renderWithLang('en')
    expect(screen.getByText('~40%')).toBeInTheDocument()
    expect(screen.getByText('Person API latency ↓')).toBeInTheDocument()
    expect(screen.getByText('45+')).toBeInTheDocument()
    expect(screen.getByText('developers led')).toBeInTheDocument()
  })

  it('featured entry without a metric value (KLEVER) renders label only, no crash', () => {
    renderWithLang('en')
    expect(screen.getByText('PaaS Architect · health')).toBeInTheDocument()
    const klever = data.entries.find((e) => e.id === 'klever-2020')
    expect(klever.metric.value).toBeUndefined()
  })

  it('metric label swaps to ES on language toggle', () => {
    renderWithLang('es')
    expect(screen.getByText('latencia Person API ↓')).toBeInTheDocument()
    expect(screen.getByText('devs liderados')).toBeInTheDocument()
    expect(screen.getByText('Arquitecto PaaS · salud')).toBeInTheDocument()
  })

  it('compact rows keep expand/collapse bullets behaviour', () => {
    renderWithLang('en')
    // F2X is compact (not featured); its bullet text is hidden until expanded
    expect(screen.queryByText(/commissions-calculation component/)).toBeNull()
    const buttons = screen.getAllByRole('button', { name: /expand entry/i })
    // F2X is the 2nd visible entry
    fireEvent.click(buttons[1])
    expect(screen.getByText(/commissions-calculation component/)).toBeInTheDocument()
  })

  it('renders the curated tech filter chip bar as aria-pressed buttons', () => {
    renderWithLang('en')
    for (const chip of data.filter.chips) {
      const btn = screen.getByRole('button', { name: new RegExp(`filter by ${chip}`, 'i') })
      expect(btn).toBeInTheDocument()
      expect(btn.getAttribute('aria-pressed')).toBe('false')
    }
  })

  it('no chip active dims nothing', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelectorAll('[data-dim="true"]')).toHaveLength(0)
  })

  it('activating a chip highlights matching roles and dims the rest', () => {
    const { container } = renderWithLang('en')
    const k8s = screen.getByRole('button', { name: /filter by Kubernetes/i })
    fireEvent.click(k8s)
    expect(k8s.getAttribute('aria-pressed')).toBe('true')
    // Only Blerify has Kubernetes → 1 match, rest dimmed
    const matches = data.entries.filter((e) => e.visible !== false && e.tech.includes('Kubernetes'))
    const visible = data.entries.filter((e) => e.visible !== false)
    expect(container.querySelectorAll('[data-dim="false"]')).toHaveLength(matches.length)
    expect(container.querySelectorAll('[data-dim="true"]')).toHaveLength(visible.length - matches.length)
  })

  it('multi-select unions matches (OR semantics)', () => {
    const { container } = renderWithLang('en')
    fireEvent.click(screen.getByRole('button', { name: /filter by Kubernetes/i }))
    fireEvent.click(screen.getByRole('button', { name: /filter by Keycloak/i }))
    const matches = data.entries.filter(
      (e) => e.visible !== false && (e.tech.includes('Kubernetes') || e.tech.includes('Keycloak')),
    )
    expect(container.querySelectorAll('[data-dim="false"]')).toHaveLength(matches.length)
  })

  it('clear resets all filters', () => {
    const { container } = renderWithLang('en')
    fireEvent.click(screen.getByRole('button', { name: /filter by Kubernetes/i }))
    expect(container.querySelectorAll('[data-dim="true"]').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(container.querySelectorAll('[data-dim="true"]')).toHaveLength(0)
  })

  it('announces match count in a live region when filtering', () => {
    renderWithLang('en')
    const status = screen.getByRole('status')
    fireEvent.click(screen.getByRole('button', { name: /filter by AWS/i }))
    const matches = data.entries.filter((e) => e.visible !== false && e.tech.includes('AWS'))
    expect(status.textContent).toMatch(new RegExp(`${matches.length}`))
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
