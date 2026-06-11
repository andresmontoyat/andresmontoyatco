import React from 'react'
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import IllustratedWorldMap from './IllustratedWorldMap.js'
import { LanguageProvider } from '../../i18n/LanguageContext.js'

const FIXTURE = {
  worlds: [
    {
      id: 'company:acme',
      type: 'company',
      label: 'Acme',
      biome: 'selva',
      position: { x: 100, y: 100 },
      levels: [{
        title: { en: 'Dev', es: 'Dev' },
        period: { start: 2019, end: 2020 },
        bullets: { en: [], es: [] },
        tech: [],
      }],
    },
    {
      id: 'section:about',
      type: 'section',
      label: { en: 'About', es: 'Sobre' },
      biome: 'pradera',
      icon: 'home',
      position: { x: 400, y: 200 },
      content: { en: 'a', es: 'a' },
    },
    {
      id: 'secret:s1',
      type: 'secret',
      label: { en: 'Hidden', es: 'Oculto' },
      biome: 'cyber',
      position: { x: 800, y: 150 },
      command: '/x',
      content: { en: 'h', es: 'h' },
      hidden: true,
    },
  ],
}

function renderMap(props = {}) {
  return render(
    <LanguageProvider>
      <IllustratedWorldMap worldsData={FIXTURE} {...props} />
    </LanguageProvider>,
  )
}

describe('IllustratedWorldMap', () => {
  beforeEach(() => { window.localStorage.clear() })

  it('mounts an <svg data-testid="illustrated-world-svg">', () => {
    renderMap()
    expect(screen.getByTestId('illustrated-world-svg')).toBeInTheDocument()
  })

  it('renders one button per visible world (hidden secrets gated)', () => {
    renderMap()
    // 2 visible: acme + about. secret:s1 hidden.
    expect(screen.getAllByRole('button').length).toBe(2)
  })

  it('hidden secret world appears when unlocked', () => {
    renderMap({ unlockedSecrets: ['s1'] })
    expect(screen.getAllByRole('button').length).toBe(3)
    expect(screen.getByRole('button', { name: /Hidden/i })).toBeInTheDocument()
  })

  it('clicking a world button fires onWorldSelect with the world id', () => {
    const onWorldSelect = vi.fn()
    renderMap({ onWorldSelect })
    fireEvent.click(screen.getByRole('button', { name: /Acme/i }))
    expect(onWorldSelect).toHaveBeenCalledWith('company:acme')
  })

  it('Enter key on a focused world button selects it (keyboard a11y)', () => {
    const onWorldSelect = vi.fn()
    renderMap({ onWorldSelect })
    const btn = screen.getByRole('button', { name: /Acme/i })
    fireEvent.keyDown(btn, { key: 'Enter' })
    expect(onWorldSelect).toHaveBeenCalledWith('company:acme')
  })

  it('pointerdown on the container fires onPointerDownDrag prop', () => {
    const onPointerDownDrag = vi.fn()
    const { container } = renderMap({ onPointerDownDrag })
    const wrap = container.firstChild
    fireEvent.pointerDown(wrap, { clientX: 50, clientY: 50 })
    expect(onPointerDownDrag).toHaveBeenCalled()
  })

  it('renders empty-state placeholder when no worlds visible', () => {
    render(
      <LanguageProvider>
        <IllustratedWorldMap worldsData={{ worlds: [] }} />
      </LanguageProvider>,
    )
    expect(screen.getByText(/Portfolio temporarily unavailable/i)).toBeInTheDocument()
  })

  it('renders biome label text for each present biome', () => {
    renderMap()
    // pradera (about) + selva (acme) present; cyber only-hidden so absent.
    expect(screen.getByText(/PRADERA/i)).toBeInTheDocument()
    expect(screen.getByText(/SELVA/i)).toBeInTheDocument()
    expect(screen.queryByText(/^CYBER/i)).toBeNull()
  })

  it('Spanish lang switches section label (Sobre vs About)', () => {
    window.localStorage.setItem('cam-lang', 'es')
    renderMap()
    expect(screen.getByRole('button', { name: /Sobre/i })).toBeInTheDocument()
  })

  it('zoomTargetWorldId props halo onto the target node only', () => {
    const { container } = renderMap({ zoomTargetWorldId: 'company:acme' })
    // Halo = <circle> with <animate> child — count animate elements.
    const animates = container.querySelectorAll('animate')
    expect(animates.length).toBe(1)
  })
})
