import React from 'react'
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import OnboardingHint from './OnboardingHint'

const STORAGE_KEY = 'cam-3d-hint-seen'
const FADE_IN_DELAY_MS = 800
const AUTO_DISMISS_MS = 5000

const enT = { game: { hint: { drag: 'drag to rotate' } } }

let matchMediaImpl

function mockMatchMedia(matches) {
  matchMediaImpl = vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMediaImpl,
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  window.localStorage.clear()
  mockMatchMedia(false) // default: motion ALLOWED (prefers-reduced-motion: reduce does NOT match)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('OnboardingHint — D-20-CONTEXT-HINT', () => {
  it('returns null before FADE_IN_DELAY_MS (700ms) — no pill in DOM yet', () => {
    const { container } = render(<OnboardingHint t={enT} />)
    vi.advanceTimersByTime(FADE_IN_DELAY_MS - 100)
    expect(container.querySelector('button')).toBeNull()
  })

  it('renders <button> with t.game.hint.drag text after FADE_IN_DELAY_MS (800ms)', () => {
    const { container } = render(<OnboardingHint t={enT} />)
    vi.advanceTimersByTime(FADE_IN_DELAY_MS)
    const btn = container.querySelector('button')
    expect(btn).not.toBeNull()
    expect(btn.textContent).toBe('drag to rotate')
  })

  it('returns null when localStorage cam-3d-hint-seen=true at mount (suppression on subsequent visit)', () => {
    window.localStorage.setItem(STORAGE_KEY, 'true')
    const { container } = render(<OnboardingHint t={enT} />)
    vi.advanceTimersByTime(FADE_IN_DELAY_MS + 100)
    expect(container.querySelector('button')).toBeNull()
  })

  it('returns null when prefers-reduced-motion: reduce matches (defensive RM gate)', () => {
    mockMatchMedia(true)
    const { container } = render(<OnboardingHint t={enT} />)
    vi.advanceTimersByTime(FADE_IN_DELAY_MS + 100)
    expect(container.querySelector('button')).toBeNull()
  })

  it('click-to-dismiss writes cam-3d-hint-seen=true and unmounts the button', () => {
    const { container } = render(<OnboardingHint t={enT} />)
    vi.advanceTimersByTime(FADE_IN_DELAY_MS)
    const btn = container.querySelector('button')
    expect(btn).not.toBeNull()
    fireEvent.click(btn)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
    expect(container.querySelector('button')).toBeNull()
  })

  it('auto-dismiss after AUTO_DISMISS_MS writes cam-3d-hint-seen=true and unmounts', () => {
    const { container } = render(<OnboardingHint t={enT} />)
    vi.advanceTimersByTime(FADE_IN_DELAY_MS)
    expect(container.querySelector('button')).not.toBeNull()
    vi.advanceTimersByTime(AUTO_DISMISS_MS)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
    expect(container.querySelector('button')).toBeNull()
  })
})
