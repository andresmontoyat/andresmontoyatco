import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import data from '../../data/experience.json'
import Experience from './Experience'

// CareerGame is its own island with a dedicated suite (CareerGame.test.jsx).
// Stub it here so these specs exercise only the timeline/filter/expand contract
// and never touch the canvas game engine.
vi.mock('./CareerGame.jsx', () => ({
  default: () => <div data-testid="career-game-stub" />,
}))

const visible = data.entries.filter((e) => e.visible !== false)

// A chip that matches some but not all visible entries — required for the
// dimming/clear/count assertions (e.g. "Java" is on every role → dims nothing).
const partialChip = data.filter.chips.find((c) => {
  const n = visible.filter((e) => e.tech.includes(c)).length
  return n > 0 && n < visible.length
})

function renderExp(locale = 'en') {
  return render(<Experience locale={locale} />)
}

describe('Experience island — timeline', () => {
  it('renders every visible entry and hides visible===false entries', () => {
    renderExp('en')
    const cards = document.querySelectorAll('[data-variant]')
    expect(cards.length).toBe(visible.length)
    expect(cards.length).toBe(11)
  })

  it('keeps the accessible timeline as the default (a known company renders)', () => {
    renderExp('en')
    expect(screen.getByText(/Soldife/)).toBeInTheDocument()
  })

  it('mounts the CareerGame entry alongside the timeline', () => {
    renderExp('en')
    expect(screen.getByTestId('career-game-stub')).toBeInTheDocument()
  })

  it('renders featured entries as featured and the rest as compact', () => {
    renderExp('en')
    const featuredCount = visible.filter((e) => e.featured).length
    expect(document.querySelectorAll('[data-variant="featured"]').length).toBe(featuredCount)
    expect(document.querySelectorAll('[data-variant="compact"]').length).toBe(
      visible.length - featuredCount,
    )
  })

  it('shows the Active badge on a present role', () => {
    renderExp('en')
    // soldife-2026 date is "… — Present" → featured active card
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})

describe('Experience island — i18n', () => {
  it('renders Spanish copy when locale is es', () => {
    renderExp('es')
    expect(screen.getByText('Experiencia')).toBeInTheDocument()
    expect(screen.getByText(data.filter.hint.es)).toBeInTheDocument()
    expect(screen.getByText('En curso')).toBeInTheDocument()
  })
})

describe('Experience island — tech-chip filter', () => {
  it('dims non-matching entries and marks the chip pressed when a filter is active', () => {
    renderExp('en')
    const chip = screen.getByRole('button', { name: `Filter by ${partialChip}` })
    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')

    const dimmed = document.querySelectorAll('[data-dim="true"]')
    const lit = document.querySelectorAll('[data-dim="false"]')
    // At least one match and at least one non-match for a partial-coverage chip
    expect(lit.length).toBeGreaterThan(0)
    expect(dimmed.length).toBeGreaterThan(0)
    expect(lit.length + dimmed.length).toBe(visible.length)
  })

  it('reports the live match count only while a filter is active', () => {
    renderExp('en')
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('') // idle: empty

    fireEvent.click(screen.getByRole('button', { name: `Filter by ${partialChip}` }))
    const matches = visible.filter((e) => e.tech.includes(partialChip)).length
    expect(status).toHaveTextContent(new RegExp(`^${matches} `))
  })

  it('shows a Clear control that resets all dimming', () => {
    renderExp('en')
    fireEvent.click(screen.getByRole('button', { name: `Filter by ${partialChip}` }))
    expect(document.querySelectorAll('[data-dim="true"]').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: data.filter.clear.en }))
    expect(document.querySelectorAll('[data-dim="true"]').length).toBe(0)
  })
})

describe('Experience island — expand/collapse', () => {
  it('toggles aria-expanded and reveals bullets on a compact row', () => {
    renderExp('en')
    // pick the first compact entry with bullets
    const compact = visible.find((e) => !e.featured)
    const bullet0 = compact.bullets.en[0]

    expect(screen.queryByText(bullet0)).not.toBeInTheDocument()

    const row = document.querySelector('[data-variant="compact"]')
    const toggle = within(row).getByRole('button')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(bullet0)).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(bullet0)).not.toBeInTheDocument()
  })
})
