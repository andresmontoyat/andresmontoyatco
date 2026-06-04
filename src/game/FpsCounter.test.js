import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import FpsCounter from './FpsCounter'

describe('FpsCounter', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders fixed bottom-left dev widget showing initial 0 fps', () => {
    render(<FpsCounter />)
    const widget = screen.getByText(/0 fps/)
    expect(widget).toBeInTheDocument()
    expect(widget.className).toMatch(/fixed/)
    expect(widget.className).toMatch(/bottom-4/)
    expect(widget.className).toMatch(/left-4/)
  })

  it('updates fps after rAF frames cross the 1s rolling window', () => {
    // Pin performance.now() so the component sees a deterministic lastT seed.
    // Then drive rAF callbacks with timestamps relative to that seed.
    const baseT = 1_000_000 // arbitrary fixed origin
    vi.spyOn(performance, 'now').mockReturnValue(baseT)

    const rafCallbacks = []
    let rafIdCounter = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafIdCounter += 1
      rafCallbacks.push(cb)
      return rafIdCounter
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    render(<FpsCounter />)

    // Fire 60 frames at baseT+16.67, baseT+33.34, ... baseT+1001
    for (let i = 1; i <= 60; i += 1) {
      const t = baseT + i * (1001 / 60)
      act(() => {
        rafCallbacks.shift()(t)
      })
    }

    const widget = screen.getByText(/\d+ fps/)
    expect(widget.textContent).toMatch(/^\d+ fps$/)
    // 60 frames over 1001ms → Math.round((60 * 1000) / 1001) = 60
    const match = widget.textContent.match(/^(\d+) fps$/)
    expect(parseInt(match[1], 10)).toBeGreaterThanOrEqual(50)
    expect(parseInt(match[1], 10)).toBeLessThanOrEqual(70)
  })

  it('calls cancelAnimationFrame on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 42)

    const { unmount } = render(<FpsCounter />)
    unmount()
    expect(cancelSpy).toHaveBeenCalledWith(42)
  })
})
