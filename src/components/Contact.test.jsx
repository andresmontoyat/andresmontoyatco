import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import Contact from './Contact'
import data from '../data/contact.json'

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
      <Contact />
    </LanguageProvider>,
  )
}

describe('Contact (v4.0 Slice 2)', () => {
  it('renders the section with id="contact"', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelector('section#contact')).toBeInTheDocument()
  })

  it('renders exactly 5 contact cards', () => {
    renderWithLang('en')
    expect(screen.getByText('andresmontoyat@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('+57 324 442 2196')).toBeInTheDocument()
    expect(screen.getByText('carlos-andres-montoya-tobon')).toBeInTheDocument()
    expect(screen.getByText('andresmontoyat')).toBeInTheDocument()
    expect(screen.getByText('Medellín, Colombia')).toBeInTheDocument()
  })

  it('Email card href is mailto:', () => {
    renderWithLang('en')
    const el = screen.getByText('andresmontoyat@gmail.com').closest('a')
    expect(el).not.toBeNull()
    expect(el.getAttribute('href')).toBe('mailto:andresmontoyat@gmail.com')
  })

  it('external cards (LinkedIn, GitHub) open in new tab with rel=noopener noreferrer', () => {
    renderWithLang('en')
    const linkedin = screen.getByText('carlos-andres-montoya-tobon').closest('a')
    const github = screen.getByText('andresmontoyat').closest('a')
    for (const a of [linkedin, github]) {
      expect(a).not.toBeNull()
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })

  it('Location links to Google Maps in a new tab', () => {
    renderWithLang('en')
    const el = screen.getByText('Medellín, Colombia').closest('a')
    expect(el).not.toBeNull()
    expect(el.getAttribute('href')).toMatch(/maps\.app\.goo\.gl/)
    expect(el.getAttribute('target')).toBe('_blank')
    expect(el.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('translates label/h2/intro and kLabels when lang=es', () => {
    renderWithLang('es')
    expect(screen.getByText('Contacto')).toBeInTheDocument()
    expect(screen.getByText('Construyamos algo juntos')).toBeInTheDocument()
    expect(screen.getByText('Correo')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
  })

  it('contact.json schema sanity — 5 cards, each with required keys', () => {
    expect(Array.isArray(data.cards)).toBe(true)
    expect(data.cards).toHaveLength(5)
    for (const c of data.cards) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.icon).toBe('string')
      expect(typeof c.value).toBe('string')
      expect(typeof c.kLabel.en).toBe('string')
      expect(typeof c.kLabel.es).toBe('string')
    }
  })
})
