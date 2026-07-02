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

describe('Hero CTAs (redesign)', () => {
  it('primary CTA links to #contact', () => {
    const { container } = renderWithLang('en')
    const primary = container.querySelector('a[href="#contact"]')
    expect(primary).toBeInTheDocument()
  })

  it('CV button downloads the EN PDF in English', () => {
    const { container } = renderWithLang('en')
    const cv = container.querySelector('a[href="/CarlosMontoya_CV_EN.pdf"]')
    expect(cv).toBeInTheDocument()
    expect(cv).toHaveAttribute('download')
    expect(container.querySelector('a[href="/CarlosMontoya_CV_ES.pdf"]')).toBeNull()
  })

  it('CV button downloads the ES PDF in Spanish', () => {
    const { container } = renderWithLang('es')
    const cv = container.querySelector('a[href="/CarlosMontoya_CV_ES.pdf"]')
    expect(cv).toBeInTheDocument()
    expect(container.querySelector('a[href="/CarlosMontoya_CV_EN.pdf"]')).toBeNull()
  })

  it('renders accessible LinkedIn + GitHub links', () => {
    const { container } = renderWithLang('en')
    const li = container.querySelector('a[href="https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033"]')
    const gh = container.querySelector('a[href="https://github.com/andresmontoyat"]')
    expect(li).toHaveAttribute('aria-label')
    expect(gh).toHaveAttribute('aria-label')
    expect(li).toHaveAttribute('rel', 'noopener noreferrer')
    expect(gh).toHaveAttribute('target', '_blank')
  })

  it('no longer renders the old .docx download links', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelector('a[href$=".docx"]')).toBeNull()
  })
})
