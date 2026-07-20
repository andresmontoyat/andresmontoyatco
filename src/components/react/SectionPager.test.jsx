import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SectionPager from './SectionPager'

vi.mock('../../hooks/useActiveSection', () => ({ default: () => 'hero' }))

function renderPager(locale = 'en') {
  return render(<SectionPager locale={locale} />)
}

describe('SectionPager', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn()
  })

  it('renders the four navigation controls with ARIA labels', () => {
    renderPager('en')
    for (const name of [/back to top/i, /previous section/i, /next section/i, /go to end/i]) {
      expect(screen.getByRole('button', { name, hidden: true })).toBeInTheDocument()
    }
  })

  it('renders a section counter dial (1/7 at start)', () => {
    const { container } = renderPager('en')
    expect(container.textContent).toContain('1')
    expect(container.textContent).toContain('/7')
  })

  it('disables top + previous at the first section, enables next + end', () => {
    renderPager('en')
    expect(screen.getByRole('button', { name: /back to top/i, hidden: true })).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous section/i, hidden: true })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next section/i, hidden: true })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /go to end/i, hidden: true })).not.toBeDisabled()
  })

  it('clicking "Go to end" scrolls the window', () => {
    renderPager('en')
    fireEvent.click(screen.getByRole('button', { name: /go to end/i, hidden: true }))
    expect(window.scrollTo).toHaveBeenCalled()
  })

  it('tints the progress dial with the active section color', () => {
    const { container } = renderPager('en')
    // first section (hero) → brand teal #00E5A8
    const ring = container.querySelector('[data-role="dial-progress"]')
    expect(ring).toBeInTheDocument()
    expect(ring.getAttribute('style')).toMatch(/stroke:\s*(#00E5A8|rgb\(0,\s*229,\s*168\))/i)
  })

  it('translates ARIA labels to Spanish', () => {
    renderPager('es')
    expect(screen.getByRole('button', { name: /volver al inicio/i, hidden: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ir al final/i, hidden: true })).toBeInTheDocument()
  })
})
