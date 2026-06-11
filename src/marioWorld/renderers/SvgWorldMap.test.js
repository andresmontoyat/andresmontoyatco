import React from 'react'
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import SvgWorldMap from './SvgWorldMap.js'
import { LanguageProvider } from '../../i18n/LanguageContext.js'

const FIXTURE = {
  worlds: [
    {
      id: 'company:acme',
      type: 'company',
      label: 'Acme',
      biome: 'selva',
      position: { x: 0, y: 0 },
      levels: [
        {
          title: { en: 'Dev', es: 'Dev' },
          period: { start: 2019, end: 2020 },
          bullets: { en: ['x'], es: ['x'] },
          tech: [],
        },
      ],
    },
    {
      id: 'section:about',
      type: 'section',
      label: { en: 'About', es: 'Sobre' },
      biome: 'pradera',
      icon: 'home',
      position: { x: 0, y: 0 },
      content: { en: 'a', es: 'a' },
    },
    {
      id: 'secret:s1',
      type: 'secret',
      label: { en: 'Hidden', es: 'Oculto' },
      biome: 'cyber',
      position: { x: 0, y: 0 },
      command: '/x',
      content: { en: 'h', es: 'h' },
      hidden: true,
    },
  ],
}

function renderWithLang(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('SvgWorldMap', () => {
  it('renders one <section role=region> per biome with visible worlds', () => {
    renderWithLang(<SvgWorldMap worldsData={FIXTURE} />)
    const regions = screen.getAllByRole('region')
    // pradera (about) + selva (acme) yes; cyber has only a hidden secret
    expect(regions).toHaveLength(2)
  })

  it('does not render hidden worlds until unlocked', () => {
    renderWithLang(<SvgWorldMap worldsData={FIXTURE} />)
    expect(screen.queryByText(/Hidden/i)).toBeNull()
  })

  it('renders unlocked secret world when unlockedSecrets contains its bare id', () => {
    renderWithLang(<SvgWorldMap worldsData={FIXTURE} unlockedSecrets={['s1']} />)
    expect(screen.getByRole('button', { name: /Hidden/i })).toBeInTheDocument()
  })

  it('each world renders as a button with a descriptive label', () => {
    renderWithLang(<SvgWorldMap worldsData={FIXTURE} />)
    expect(screen.getByRole('button', { name: /Acme/i })).toBeInTheDocument()
  })

  it('clicking a world button calls onWorldSelect with the full world id', () => {
    const onWorldSelect = vi.fn()
    renderWithLang(<SvgWorldMap worldsData={FIXTURE} onWorldSelect={onWorldSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /Acme/i }))
    expect(onWorldSelect).toHaveBeenCalledWith('company:acme')
  })

  it('uses a roving tabindex — at least one button has tabindex=0', () => {
    renderWithLang(<SvgWorldMap worldsData={FIXTURE} />)
    const buttons = screen.getAllByRole('button')
    const hasRoving = buttons.some((b) => b.getAttribute('tabindex') === '0')
    expect(hasRoving).toBe(true)
  })

  it('switches About → Sobre when lang=es', () => {
    window.localStorage.setItem('cam-lang', 'es')
    renderWithLang(<SvgWorldMap worldsData={FIXTURE} />)
    expect(screen.getByRole('button', { name: /Sobre/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^About$/i })).toBeNull()
  })

  it('renders a fallback message when worlds array is empty', () => {
    renderWithLang(<SvgWorldMap worldsData={{ worlds: [] }} />)
    expect(screen.getByText(/Portfolio temporarily unavailable/i)).toBeInTheDocument()
  })
})
