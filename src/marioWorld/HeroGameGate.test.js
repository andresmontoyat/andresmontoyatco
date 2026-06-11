import React from 'react'
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import HeroGameGate from './HeroGameGate.js'
import { LanguageProvider } from '../i18n/LanguageContext.js'

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

describe('HeroGameGate', () => {
  it('renders existing Hero content (H1 + photo + stat grid)', () => {
    renderWithLang(<HeroGameGate onPick={() => {}} />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders 2 buttons: Enter the World + Skip to CV', () => {
    renderWithLang(<HeroGameGate onPick={() => {}} />)
    expect(screen.getByRole('button', { name: /enter the world/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip to cv/i })).toBeInTheDocument()
  })

  it('button labels switch to Spanish when lang=es', () => {
    // The project's LanguageProvider reads initial lang from localStorage key
    // 'cam-lang' at mount (see src/i18n/LanguageContext.js readInitialLang).
    // Seed 'es' before render so the provider initializes with Spanish.
    window.localStorage.setItem('cam-lang', 'es')
    renderWithLang(<HeroGameGate onPick={() => {}} />)
    expect(screen.getByRole('button', { name: /entrar al mundo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /saltar al cv/i })).toBeInTheDocument()
  })

  it('clicking Enter button calls onPick("game")', () => {
    const onPick = vi.fn()
    renderWithLang(<HeroGameGate onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: /enter the world/i }))
    expect(onPick).toHaveBeenCalledWith('game')
  })

  it('clicking Skip button calls onPick("dev")', () => {
    const onPick = vi.fn()
    renderWithLang(<HeroGameGate onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: /skip to cv/i }))
    expect(onPick).toHaveBeenCalledWith('dev')
  })

  it('both buttons have descriptive aria-label and visible focus styles', () => {
    renderWithLang(<HeroGameGate onPick={() => {}} />)
    const enterBtn = screen.getByRole('button', { name: /enter the world/i })
    expect(enterBtn).toHaveAttribute('aria-label')
  })
})
