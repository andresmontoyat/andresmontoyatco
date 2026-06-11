import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useSecretCommand from './useSecretCommand.js'

const COMMANDS = ['/secret1', '/about-secret']

function typeSequence(str) {
  for (const k of str) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: k }))
  }
}

afterEach(() => { document.body.innerHTML = '' })

describe('useSecretCommand', () => {
  it('calls onUnlock once when full command "/secret1" is typed', () => {
    const onUnlock = vi.fn()
    renderHook(() => useSecretCommand({ commands: COMMANDS, onUnlock }))

    act(() => { typeSequence('/secret1') })

    expect(onUnlock).toHaveBeenCalledTimes(1)
    expect(onUnlock).toHaveBeenCalledWith('/secret1')
  })

  it('clears buffer on idle timeout (2000ms) so partial + remainder does not match', () => {
    vi.useFakeTimers()
    try {
      const onUnlock = vi.fn()
      renderHook(() => useSecretCommand({ commands: COMMANDS, onUnlock }))

      act(() => { typeSequence('/sec') })
      act(() => { vi.advanceTimersByTime(2100) })
      act(() => { typeSequence('ret1') })

      expect(onUnlock).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not call onUnlock when an unknown sequence "/wrong" is typed', () => {
    const onUnlock = vi.fn()
    renderHook(() => useSecretCommand({ commands: COMMANDS, onUnlock }))

    act(() => { typeSequence('/wrong') })

    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('Backspace clears the buffer so the command no longer matches', () => {
    const onUnlock = vi.fn()
    renderHook(() => useSecretCommand({ commands: COMMANDS, onUnlock }))

    act(() => { typeSequence('/secre') })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }))
    })
    act(() => { typeSequence('t1') })

    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('Escape clears the buffer so the command no longer matches', () => {
    const onUnlock = vi.fn()
    renderHook(() => useSecretCommand({ commands: COMMANDS, onUnlock }))

    act(() => { typeSequence('/secre') })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    act(() => { typeSequence('t1') })

    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('ignores keystrokes while an input element has focus', () => {
    const onUnlock = vi.fn()
    renderHook(() => useSecretCommand({ commands: COMMANDS, onUnlock }))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    expect(document.activeElement).toBe(input)

    act(() => { typeSequence('/secret1') })

    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('removes the keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useSecretCommand({ commands: COMMANDS, onUnlock: () => {} }))

    unmount()

    const keydownCalls = removeSpy.mock.calls.filter((args) => args[0] === 'keydown')
    expect(keydownCalls.length).toBeGreaterThanOrEqual(1)
    removeSpy.mockRestore()
  })

  it('does not match commands that are not in the catalog', () => {
    const onUnlock = vi.fn()
    renderHook(() => useSecretCommand({ commands: ['/x'], onUnlock }))

    act(() => { typeSequence('/secret1') })

    expect(onUnlock).not.toHaveBeenCalled()
  })
})
