import React from 'react'
import {
  describe, it, expect, beforeEach,
} from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarioWorld from './MarioWorld.js'
import { LanguageProvider } from '../i18n/LanguageContext.js'
import { ViewModeProvider } from '../context/ViewModeContext.js'

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

  it('viewMode "game" (from localStorage) → renders WorldMap directly', () => {
    window.localStorage.setItem('cam-viewmode', 'game')
    renderApp()
    expect(screen.queryByRole('button', { name: /enter the world/i })).toBeNull()
  })

  it('click Enter button in gate → renders WorldMap', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /enter the world/i }))
    expect(screen.queryByRole('button', { name: /enter the world/i })).toBeNull()
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
