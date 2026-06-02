import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext.js'
import { ThemeProvider } from '../i18n/ThemeContext.js'
import { ViewModeProvider } from '../context/ViewModeContext.js'
import translations from '../i18n/translations.js'
import GameMode, { yearsActive, skillCount } from './GameMode.js'

function renderWithProviders(ui, { lang = 'en' } = {}) {
  localStorage.setItem('cam-lang', lang)
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ViewModeProvider>
          {ui}
        </ViewModeProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

describe('GameMode - H1 derivation (pure assertions)', () => {
  it('h1 derivation matches live data', () => {
    expect(yearsActive).toBe(19)
    expect(skillCount).toBe(26)
  })
})

describe('GameMode - rendered component', () => {
  it('renders H1 with yearsActive=19 derived from live data', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('19 years.')
  })

  it('renders H1 with skillCount=26 derived from live data', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('26 skills.')
  })

  it('renders H1 in Spanish when lang=es', () => {
    renderWithProviders(<GameMode />, { lang: 'es' })
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('años')
    expect(h1.textContent).toContain('Una constelación.')
  })

  it('renders ConstellationFallback outside the error boundary', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    expect(
      screen.getByRole('heading', { name: 'Full career experience' })
    ).toBeInTheDocument()
  })

  it('renders renderer slot with data-testid="renderer-slot"', () => {
    const { getByTestId } = renderWithProviders(<GameMode />, { lang: 'en' })
    expect(getByTestId('renderer-slot')).toBeInTheDocument()
  })

  it('renders <svg> inside renderer-slot after wiring', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const slot = container.querySelector('[data-testid="renderer-slot"]')
    expect(slot.querySelector('svg')).toBeTruthy()
  })

  it('renders 26 node <g> elements', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    expect(container.querySelectorAll('g.nodes > g').length).toBe(26)
  })

  it('passes theme prop through to SvgConstellation', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const archStroke = container.querySelector('g.nodes circle[stroke="#0891b2"]')
    expect(archStroke).toBeNull()
  })

  it('still renders ConstellationFallback after wiring renderer', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    expect(
      screen.getByRole('heading', { name: 'Full career experience' })
    ).toBeInTheDocument()
  })

  // ─── Phase 16: filters + ExperienceCard wiring (RED) ────────────────────────

  it('renders <SkillFilters /> with role=group + filterBarLabel as a child below the H1', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    const t = translations.en
    const filterBar = screen.getByRole('group', { name: t.game.filterBarLabel })
    expect(filterBar).toBeInTheDocument()
  })

  it('does NOT render <ExperienceCard /> when selectedSkillId is null (initial state)', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders <ExperienceCard /> after clicking a node sets selectedSkillId', async () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const javaG = container.querySelector('g[data-node-id="Java"]')
    expect(javaG).toBeTruthy()
    fireEvent.click(javaG)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('click-outside discrimination: clicking the SVG background does NOT close the card; clicking a different node SWAPS the card (BLOCKER 1)', async () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })

    // Open the Java card
    const javaG = container.querySelector('g[data-node-id="Java"]')
    fireEvent.click(javaG)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    // The renderer-slot wrapper must carry data-game-interactive (Plan 06 Task 1)
    const slot = container.querySelector('[data-testid="renderer-slot"]')
    expect(slot.hasAttribute('data-game-interactive')).toBe(true)

    // Click on the SVG root (background) — inside [data-game-interactive], must NOT close
    await new Promise((r) => requestAnimationFrame(() => r()))
    const svg = slot.querySelector('svg')
    fireEvent.mouseDown(svg)
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Click a different node → card SWAPS to that skill (Docker has fewer jobs than Java)
    const dockerG = container.querySelector('g[data-node-id="Docker"]')
    fireEvent.click(dockerG)
    await waitFor(() => {
      // Scope to the dialog so we don't collide with ConstellationFallback's h2.
      const dialog = screen.getByRole('dialog')
      const heading = dialog.querySelector('#card-skill-heading')
      expect(heading.textContent).toContain('Docker')
    })
  })
})
