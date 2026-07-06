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

  it('renders exactly 4 contact cards', () => {
    renderWithLang('en')
    expect(screen.getByText('andresmontoyat@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('+57 324 442 2196')).toBeInTheDocument()
    expect(screen.getByText('carlos-andres-montoya-tobon')).toBeInTheDocument()
    expect(screen.getByText('andresmontoyat')).toBeInTheDocument()
    expect(screen.queryByText('Medellín, Colombia')).not.toBeInTheDocument()
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

  it('translates label/h2/intro and kLabels when lang=es', () => {
    renderWithLang('es')
    expect(screen.getByText('Contacto')).toBeInTheDocument()
    expect(screen.getByText('Construyamos algo juntos')).toBeInTheDocument()
    expect(screen.getByText('Correo')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
  })

  it('renders exactly one primary (hero) tile and it is the email card', () => {
    const { container } = renderWithLang('en')
    const primary = container.querySelectorAll('[data-role="primary"]')
    expect(primary).toHaveLength(1)
    expect(primary[0].textContent).toMatch(/andresmontoyat@gmail\.com/)
    expect(primary[0].closest('a').getAttribute('href')).toBe('mailto:andresmontoyat@gmail.com')
  })

  it('renders exactly three rail tiles for the secondary channels', () => {
    const { container } = renderWithLang('en')
    expect(container.querySelectorAll('[data-role="rail"]')).toHaveLength(3)
  })

  it('rail order is LinkedIn, Phone, GitHub', () => {
    const { container } = renderWithLang('en')
    const rail = [...container.querySelectorAll('[data-role="rail"]')]
    const values = rail.map((r) => r.textContent)
    expect(values[0]).toMatch(/carlos-andres-montoya-tobon/)
    expect(values[1]).toMatch(/\+57 324 442 2196/)
    expect(values[2]).toMatch(/andresmontoyat/)
  })

  it('email card is flagged primary in data', () => {
    const email = data.cards.find((c) => c.id === 'email')
    expect(email.primary).toBe(true)
  })

  it('contact.json schema sanity — 4 cards, each with required keys', () => {
    expect(Array.isArray(data.cards)).toBe(true)
    expect(data.cards).toHaveLength(4)
    for (const c of data.cards) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.icon).toBe('string')
      expect(typeof c.value).toBe('string')
      expect(typeof c.kLabel.en).toBe('string')
      expect(typeof c.kLabel.es).toBe('string')
    }
  })
})
