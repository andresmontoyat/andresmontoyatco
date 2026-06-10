import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useClickVsDrag from './useClickVsDrag'

function pointerEvent(clientX, clientY, pointerType = 'mouse') {
  return { clientX, clientY, pointerType }
}

let nowSpy

beforeEach(() => {
  // Deterministic time — every call to performance.now() returns 0 unless
  // a test overrides via mockReturnValueOnce.
  nowSpy = vi.spyOn(performance, 'now').mockReturnValue(0)
})

afterEach(() => {
  if (nowSpy) nowSpy.mockRestore()
})

describe('useClickVsDrag — D-20-CLICK-DRAG-THRESHOLD', () => {
  it('mouse click within 5px + 250ms threshold calls onClick once', () => {
    const onClick = vi.fn()
    const { result } = renderHook(() => useClickVsDrag({ onClick }))
    act(() => result.current.onPointerDown(pointerEvent(100, 100, 'mouse')))
    act(() => result.current.onPointerUp(pointerEvent(102, 101, 'mouse')))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('mouse drag past 5px threshold does NOT call onClick', () => {
    const onClick = vi.fn()
    const { result } = renderHook(() => useClickVsDrag({ onClick }))
    act(() => result.current.onPointerDown(pointerEvent(100, 100, 'mouse')))
    act(() => result.current.onPointerUp(pointerEvent(110, 100, 'mouse')))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('touch tap within 8px bump (would-fail 5px mouse) calls onClick', () => {
    const onClick = vi.fn()
    const { result } = renderHook(() => useClickVsDrag({ onClick }))
    act(() => result.current.onPointerDown(pointerEvent(100, 100, 'touch')))
    act(() => result.current.onPointerUp(pointerEvent(107, 100, 'touch')))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('touch drag past 8px threshold does NOT call onClick', () => {
    const onClick = vi.fn()
    const { result } = renderHook(() => useClickVsDrag({ onClick }))
    act(() => result.current.onPointerDown(pointerEvent(100, 100, 'touch')))
    act(() => result.current.onPointerUp(pointerEvent(109, 100, 'touch')))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('long-press past 250ms with no movement does NOT call onClick', () => {
    const onClick = vi.fn()
    const { result } = renderHook(() => useClickVsDrag({ onClick }))
    // Stage time AFTER renderHook so React internals don't consume the
    // mockReturnValueOnce queue.
    nowSpy.mockRestore()
    nowSpy = vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)    // pointerdown startT
      .mockReturnValueOnce(300)  // pointerup now
    act(() => result.current.onPointerDown(pointerEvent(100, 100, 'mouse')))
    act(() => result.current.onPointerUp(pointerEvent(100, 100, 'mouse')))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('no-op safety: useClickVsDrag() with no args does not throw on pointerdown/up', () => {
    const { result } = renderHook(() => useClickVsDrag())
    expect(() => {
      act(() => result.current.onPointerDown(pointerEvent(100, 100, 'mouse')))
      act(() => result.current.onPointerUp(pointerEvent(101, 100, 'mouse')))
    }).not.toThrow()
  })
})
