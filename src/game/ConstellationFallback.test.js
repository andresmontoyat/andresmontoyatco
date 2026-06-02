import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ConstellationFallback from './ConstellationFallback.js'
import EXPERIENCE from '../data/experience.js'
import translations from '../i18n/translations.js'

describe('ConstellationFallback', () => {
  it('renders heading in active EN lang', () => {
    const t = translations.en
    const { getByRole } = render(
      <ConstellationFallback experiences={EXPERIENCE} lang="en" t={t} />
    )
    expect(getByRole('heading', { name: 'Full career experience' })).toBeInTheDocument()
  })

  it('renders heading in active ES lang', () => {
    const t = translations.es
    const { getByRole } = render(
      <ConstellationFallback experiences={EXPERIENCE} lang="es" t={t} />
    )
    expect(getByRole('heading', { name: 'Experiencia profesional completa' })).toBeInTheDocument()
  })

  it('renders all 12 experience entries in document order', () => {
    const t = translations.en
    const { container } = render(
      <ConstellationFallback experiences={EXPERIENCE} lang="en" t={t} />
    )
    const items = container.querySelectorAll('section.sr-only > ol > li')
    expect(EXPERIENCE.length).toBe(12)
    expect(items.length).toBe(EXPERIENCE.length)
  })

  it('renders bullets in active language ES', () => {
    const t = translations.es
    const { getByText } = render(
      <ConstellationFallback experiences={EXPERIENCE} lang="es" t={t} />
    )
    const firstBullet = EXPERIENCE[0].bullets.es[0]
    expect(getByText(firstBullet)).toBeInTheDocument()
  })

  it('renders nothing when experiences is null', () => {
    const t = translations.en
    const { container } = render(
      <ConstellationFallback experiences={null} lang="en" t={t} />
    )
    expect(container.firstChild).toBeNull()
  })
})
