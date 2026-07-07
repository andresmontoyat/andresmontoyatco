import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import SectionPager from './SectionPager'

function renderWithLang(lang = 'en') {
  try {
    window.localStorage.setItem('cam-lang', lang)
  } catch (e) {
    // ignore
  }
  return render(
    <LanguageProvider>
      <SectionPager />
    </LanguageProvider>,
  )
}

describe('SectionPager', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn()
  })

  it('renders the four navigation controls with ARIA labels', () => {
    renderWithLang('en')
    for (const name of [/back to top/i, /previous section/i, /next section/i, /go to end/i]) {
      expect(screen.getByRole('button', { name, hidden: true })).toBeInTheDocument()
    }
  })

  it('renders a section counter dial (1/7 at start)', () => {
    const { container } = renderWithLang('en')
    expect(container.textContent).toContain('1')
    expect(container.textContent).toContain('/7')
  })

  it('disables top + previous at the first section, enables next + end', () => {
    renderWithLang('en')
    expect(screen.getByRole('button', { name: /back to top/i, hidden: true })).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous section/i, hidden: true })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next section/i, hidden: true })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /go to end/i, hidden: true })).not.toBeDisabled()
  })

  it('clicking "Go to end" scrolls the window', () => {
    renderWithLang('en')
    fireEvent.click(screen.getByRole('button', { name: /go to end/i, hidden: true }))
    expect(window.scrollTo).toHaveBeenCalled()
  })

  it('translates ARIA labels to Spanish', () => {
    renderWithLang('es')
    expect(screen.getByRole('button', { name: /volver al inicio/i, hidden: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ir al final/i, hidden: true })).toBeInTheDocument()
  })
})
