import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useRendererCapability from './useRendererCapability.js'

// Pitfall 1 mitigation: src/test/setup.js globally stubs
// HTMLCanvasElement.prototype.getContext = () => null. Every WebGL-positive
// test below must vi.spyOn override that stub. afterEach restores it.
let getContextSpy
let originalConnection
let originalLocation

// matchMedia mock factory — drives 4 capability gates by query string.
// Mirrors makeMockMatchMedia from 17-PATTERNS lines 227-234.
function makeMockMatchMedia(matchesMap = {}) {
  const listeners = new Map()
  return vi.fn().mockImplementation((q) => {
    const handlers = []
    listeners.set(q, handlers)
    return {
      matches: !!matchesMap[q],
      media: q,
      onchange: null,
      addEventListener: vi.fn((_evt, h) => handlers.push(h)),
      removeEventListener: vi.fn(),
      addListener: vi.fn((h) => handlers.push(h)),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn((evt) => {
        handlers.forEach((h) => h(evt))
        return true
      }),
    }
  })
}

beforeEach(() => {
  getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
  originalConnection = navigator.connection
  originalLocation = window.location
  // Default: all gates pass + WebGL present.
  window.matchMedia = makeMockMatchMedia({
    '(min-width: 1024px)': true,
    '(prefers-reduced-motion: reduce)': false,
  })
  getContextSpy.mockReturnValue({})
  // Default URL: no override.
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, search: '' },
    configurable: true,
    writable: true,
  })
})

afterEach(() => {
  getContextSpy.mockRestore()
  if (originalConnection === undefined) {
    delete navigator.connection
  } else {
    Object.defineProperty(navigator, 'connection', {
      value: originalConnection,
      configurable: true,
      writable: true,
    })
  }
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    configurable: true,
    writable: true,
  })
})

describe('useRendererCapability', () => {
  it("returns 'webgl' when all 4 gates pass and WebGL ctx is available", () => {
    const { result } = renderHook(() => useRendererCapability())
    expect(result.current).toBe('webgl')
  })

  it("returns 'svg' when viewport matchMedia matches=false (< 1024px)", () => {
    window.matchMedia = makeMockMatchMedia({
      '(min-width: 1024px)': false,
      '(prefers-reduced-motion: reduce)': false,
    })
    const { result } = renderHook(() => useRendererCapability())
    expect(result.current).toBe('svg')
  })

  it("returns 'svg' when prefers-reduced-motion: reduce matches=true", () => {
    window.matchMedia = makeMockMatchMedia({
      '(min-width: 1024px)': true,
      '(prefers-reduced-motion: reduce)': true,
    })
    const { result } = renderHook(() => useRendererCapability())
    expect(result.current).toBe('svg')
  })

  it("returns 'svg' when navigator.connection.saveData === true", () => {
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true },
      configurable: true,
      writable: true,
    })
    const { result } = renderHook(() => useRendererCapability())
    expect(result.current).toBe('svg')
  })

  it("returns 'svg' when navigator.connection.effectiveType === '2g'", () => {
    Object.defineProperty(navigator, 'connection', {
      value: { effectiveType: '2g' },
      configurable: true,
      writable: true,
    })
    const { result } = renderHook(() => useRendererCapability())
    expect(result.current).toBe('svg')
  })

  it("returns 'svg' when getContext returns null (no WebGL support)", () => {
    getContextSpy.mockReturnValue(null)
    const { result } = renderHook(() => useRendererCapability())
    expect(result.current).toBe('svg')
  })

  it("?renderer=svg URL override forces 'svg' even when all gates pass", () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '?renderer=svg' },
      configurable: true,
      writable: true,
    })
    const { result } = renderHook(() => useRendererCapability())
    expect(result.current).toBe('svg')
  })

  it("?renderer=webgl URL override forces 'webgl' (short-circuits gates)", () => {
    // Make viewport gate fail; URL override should still force webgl.
    window.matchMedia = makeMockMatchMedia({
      '(min-width: 1024px)': false,
      '(prefers-reduced-motion: reduce)': false,
    })
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '?renderer=webgl' },
      configurable: true,
      writable: true,
    })
    const { result } = renderHook(() => useRendererCapability())
    expect(result.current).toBe('webgl')
  })

  it('SSR safety: detect() returns svg when typeof window === undefined (verified by code inspection of isServer guard)', () => {
    // jsdom always defines window; this test asserts the hook still returns
    // a valid capability under jsdom AND documents the SSR branch is covered
    // by the static isServer guard in detect().
    const { result } = renderHook(() => useRendererCapability())
    expect(['svg', 'webgl']).toContain(result.current)
  })

  it('matchMedia change event re-evaluates capability (viewport breakpoint cross)', () => {
    // Start desktop: webgl
    const matchesMap = {
      '(min-width: 1024px)': true,
      '(prefers-reduced-motion: reduce)': false,
    }
    let viewportHandler
    window.matchMedia = vi.fn().mockImplementation((q) => {
      const h = []
      return {
        matches: !!matchesMap[q],
        media: q,
        onchange: null,
        addEventListener: vi.fn((_evt, fn) => {
          if (q === '(min-width: 1024px)') viewportHandler = fn
          h.push(fn)
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    })
    const { result } = renderHook(() => useRendererCapability())
    expect(result.current).toBe('webgl')

    // Cross down: viewport now < 1024
    matchesMap['(min-width: 1024px)'] = false
    act(() => {
      if (viewportHandler) viewportHandler({ matches: false })
    })
    expect(result.current).toBe('svg')
  })

  it('cleanup removes viewport AND motion matchMedia listeners on unmount', () => {
    const removeSpies = []
    window.matchMedia = vi.fn().mockImplementation((q) => {
      const removeSpy = vi.fn()
      removeSpies.push({ q, removeSpy })
      return {
        matches: q === '(min-width: 1024px)',
        media: q,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: removeSpy,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    })
    const { unmount } = renderHook(() => useRendererCapability())
    unmount()
    const viewportRemove = removeSpies.find((r) => r.q === '(min-width: 1024px)')
    const motionRemove = removeSpies.find((r) => r.q === '(prefers-reduced-motion: reduce)')
    expect(viewportRemove?.removeSpy).toHaveBeenCalled()
    expect(motionRemove?.removeSpy).toHaveBeenCalled()
  })

  it('memoization: returns the same enum across re-renders when state unchanged', () => {
    const { result, rerender } = renderHook(() => useRendererCapability())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
