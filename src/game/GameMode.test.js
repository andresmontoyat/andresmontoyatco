import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext.js'
import { ThemeProvider } from '../i18n/ThemeContext.js'
import { ViewModeProvider } from '../context/ViewModeContext.js'
import GameMode, { yearsActive, skillCount } from './GameMode.js'
import EXPERIENCE from '../data/experience.js'
import { SKILLS } from '../data/skills.js'
import { CURRENT_YEAR } from './constellation.graph.js'

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
})
