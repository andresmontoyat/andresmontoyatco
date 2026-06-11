import React from 'react'
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarioWorld from './MarioWorld.js'
import { LanguageProvider } from '../i18n/LanguageContext.js'
import { ViewModeProvider } from '../context/ViewModeContext.js'

// Phase 22 Task 22.9: viewMode === 'game' now mounts <WorldMap> which calls
// useRendererCapability — jsdom does NOT ship window.matchMedia by default, so
// stub it to a no-match query that routes the wrapper through the SvgWorldMap
// path (capability = 'svg').
function stubMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function renderApp() {
  return render(
    <LanguageProvider>
      <ViewModeProvider>
        <MarioWorld />
      </ViewModeProvider>
    </LanguageProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

describe('MarioWorld', () => {
  it('viewMode null → renders HeroGameGate', () => {
    renderApp()
    expect(screen.getByRole('button', { name: /enter the world/i })).toBeInTheDocument()
  })

  it('viewMode "dev" (from localStorage) → renders DevView directly, skip gate', () => {
    window.localStorage.setItem('cam-viewmode', 'dev')
    renderApp()
    expect(screen.queryByRole('button', { name: /enter the world/i })).toBeNull()
  })

  it('viewMode "game" (from localStorage) → renders WorldMap (region present)', () => {
    window.localStorage.setItem('cam-viewmode', 'game')
    renderApp()
    expect(screen.queryByRole('button', { name: /enter the world/i })).toBeNull()
    // SvgWorldMap renders at least one <section role="region"> per biome with worlds.
    expect(screen.getAllByRole('region').length).toBeGreaterThan(0)
  })

  it('click Enter button in gate → renders WorldMap (region present)', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /enter the world/i }))
    expect(screen.queryByRole('button', { name: /enter the world/i })).toBeNull()
    expect(screen.getAllByRole('region').length).toBeGreaterThan(0)
  })

  it('click Enter button persists "game" to localStorage', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /enter the world/i }))
    expect(window.localStorage.getItem('cam-viewmode')).toBe('game')
  })

  it('click Skip button → renders DevView + persists "dev"', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /skip to cv/i }))
    expect(window.localStorage.getItem('cam-viewmode')).toBe('dev')
  })

  it('corrupt localStorage value falls back to gate', () => {
    window.localStorage.setItem('cam-viewmode', 'banana')
    renderApp()
    expect(screen.getByRole('button', { name: /enter the world/i })).toBeInTheDocument()
  })

  it('renders without errors when MarioWorld mounts', () => {
    expect(() => renderApp()).not.toThrow()
  })
})
