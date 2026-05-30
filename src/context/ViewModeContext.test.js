import React from 'react'
import { render, act } from '@testing-library/react'
import { ViewModeProvider, useViewMode } from './ViewModeContext'

// Helper: renders a consumer that exposes the context value via a ref
function ContextConsumer({ contextRef }) {
  const ctx = useViewMode()
  contextRef.current = ctx
  return null
}

// Stub window.location.search for ?mode= query param tests.
function setLocationSearch(search) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search },
    writable: true,
    configurable: true,
  })
}

function renderWithProvider() {
  const contextRef = { current: null }
  render(
    <ViewModeProvider>
      <ContextConsumer contextRef={contextRef} />
    </ViewModeProvider>
  )
  return contextRef
}

beforeEach(() => {
  window.localStorage.clear()
  setLocationSearch('')
})

afterEach(() => {
  window.localStorage.clear()
  setLocationSearch('')
})

describe('ViewModeContext — default and storage', () => {
  test('default viewMode is "game" when localStorage is empty and no query param', () => {
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('game')
  })

  test('setViewMode("dev") persists "dev" to localStorage under cam-viewmode', () => {
    const ref = renderWithProvider()
    act(() => {
      ref.current.setViewMode('dev')
    })
    expect(ref.current.viewMode).toBe('dev')
    expect(window.localStorage.getItem('cam-viewmode')).toBe('dev')
  })

  test('initial viewMode reads stored "dev" from localStorage on mount', () => {
    window.localStorage.setItem('cam-viewmode', 'dev')
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('dev')
  })

  test('toggleViewMode flips game → dev', () => {
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('game')
    act(() => {
      ref.current.toggleViewMode()
    })
    expect(ref.current.viewMode).toBe('dev')
  })

  test('toggleViewMode flips dev → game', () => {
    window.localStorage.setItem('cam-viewmode', 'dev')
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('dev')
    act(() => {
      ref.current.toggleViewMode()
    })
    expect(ref.current.viewMode).toBe('game')
  })

  test('setViewMode with invalid value "bogus" is ignored — state unchanged', () => {
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('game')
    act(() => {
      ref.current.setViewMode('bogus')
    })
    expect(ref.current.viewMode).toBe('game')
  })
})

describe('ViewModeContext — ?mode= query param', () => {
  test('?mode=dev wins over empty localStorage (game default)', () => {
    setLocationSearch('?mode=dev')
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('dev')
  })

  test('?mode=dev wins over localStorage "game"', () => {
    window.localStorage.setItem('cam-viewmode', 'game')
    setLocationSearch('?mode=dev')
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('dev')
  })

  test('?mode=game is accepted and yields "game"', () => {
    setLocationSearch('?mode=game')
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('game')
  })

  test('invalid ?mode=hacker falls back to stored value', () => {
    window.localStorage.setItem('cam-viewmode', 'dev')
    setLocationSearch('?mode=hacker')
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('dev')
  })

  test('invalid ?mode=hacker with no storage falls back to default "game"', () => {
    setLocationSearch('?mode=hacker')
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('game')
  })

  test('raw ?mode= param is never assigned directly — only allowlisted value used', () => {
    // Case-sensitive: 'Game' is not in the allowlist ['game','dev']
    setLocationSearch('?mode=Game')
    const ref = renderWithProvider()
    expect(ref.current.viewMode).toBe('game') // falls back to default, not 'Game'
  })
})

describe('ViewModeContext — localStorage throw safety', () => {
  test('when localStorage.getItem throws, falls back to default "game" without crashing', () => {
    // WR-04: restoration MUST live in finally — Storage.prototype is
    // process-wide; if a future assertion regression throws before the
    // restore line, every later test inherits the throwing getItem.
    const originalGetItem = Storage.prototype.getItem
    Storage.prototype.getItem = () => { throw new Error('storage blocked') }
    try {
      let ref
      expect(() => {
        ref = renderWithProvider()
      }).not.toThrow()
      expect(ref.current.viewMode).toBe('game')
    } finally {
      Storage.prototype.getItem = originalGetItem
    }
  })
})
