import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useCinematicZoom from './useCinematicZoom.js'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('useCinematicZoom', () => {
  it('starts in idle state with no active world', () => {
    const { result } = renderHook(() => useCinematicZoom())

    expect(result.current.state).toBe('idle')
    expect(result.current.activeWorldId).toBeNull()
  })

  it('transitions to zoomingIn immediately on start() and sets activeWorldId', () => {
    const { result } = renderHook(() => useCinematicZoom())

    act(() => {
      result.current.start('company:acme')
    })

    expect(result.current.state).toBe('zoomingIn')
    expect(result.current.activeWorldId).toBe('company:acme')
  })

  it('ignores start() while already zoomingIn (race guard)', () => {
    const { result } = renderHook(() => useCinematicZoom())

    act(() => {
      result.current.start('company:acme')
    })

    expect(result.current.state).toBe('zoomingIn')
    expect(result.current.activeWorldId).toBe('company:acme')

    act(() => {
      result.current.start('company:other')
    })

    expect(result.current.state).toBe('zoomingIn')
    expect(result.current.activeWorldId).toBe('company:acme')
  })

  it('transitions from zoomingIn to inWorld after 600ms', () => {
    const { result } = renderHook(() => useCinematicZoom())

    act(() => {
      result.current.start('company:acme')
    })

    expect(result.current.state).toBe('zoomingIn')

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.state).toBe('inWorld')
    expect(result.current.activeWorldId).toBe('company:acme')
  })

  it('stop() during inWorld transitions zoomingOut → idle after 400ms', () => {
    const { result } = renderHook(() => useCinematicZoom())

    act(() => {
      result.current.start('company:acme')
    })
    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.state).toBe('inWorld')

    act(() => {
      result.current.stop()
    })

    expect(result.current.state).toBe('zoomingOut')

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.state).toBe('idle')
    expect(result.current.activeWorldId).toBeNull()
  })

  it('start() during inWorld closes current world then opens the new one', () => {
    const { result } = renderHook(() => useCinematicZoom())

    act(() => {
      result.current.start('a')
    })
    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.state).toBe('inWorld')
    expect(result.current.activeWorldId).toBe('a')

    act(() => {
      result.current.start('b')
    })

    expect(result.current.state).toBe('zoomingOut')
    expect(result.current.activeWorldId).toBe('a')

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.state).toBe('zoomingIn')
    expect(result.current.activeWorldId).toBe('b')

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.state).toBe('inWorld')
    expect(result.current.activeWorldId).toBe('b')
  })
})
