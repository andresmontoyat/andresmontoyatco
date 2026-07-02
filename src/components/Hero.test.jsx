import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import Hero from './Hero'

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
      <Hero />
    </LanguageProvider>,
  )
}

describe('Hero copy (redesign)', () => {
  it('renders role-forward H1 via aria-label (EN)', () => {
    const { container } = renderWithLang('en')
    const h1 = container.querySelector('h1')
    expect(h1).toHaveAttribute('aria-label', 'Solutions Architect & Senior Backend Engineer.')
  })

  it('renders role-forward H1 via aria-label (ES)', () => {
    const { container } = renderWithLang('es')
    const h1 = container.querySelector('h1')
    expect(h1).toHaveAttribute('aria-label', 'Arquitecto de Soluciones e Ingeniero Backend Senior.')
  })

  it('renders the punchy lead (EN)', () => {
    renderWithLang('en')
    expect(screen.getByText(/clean hexagonal architecture, cloud-native/)).toBeInTheDocument()
  })

  it('renders the punchy lead (ES)', () => {
    renderWithLang('es')
    expect(screen.getByText(/arquitectura hexagonal limpia, cloud-native/)).toBeInTheDocument()
  })
})
