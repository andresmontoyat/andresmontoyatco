import { describe, it, expect, vi } from 'vitest'
import { createTopdownInput } from './topdownInput.js'

describe('createTopdownInput', () => {
  it('maps arrow keys and WASD into the shared state', () => {
    const inp = createTopdownInput()
    inp.setKey('ArrowLeft', true); expect(inp.state.L).toBe(1)
    inp.setKey('d', true); expect(inp.state.R).toBe(1)
    inp.setKey('ArrowLeft', false); expect(inp.state.L).toBe(0)
  })
  it('press() drives the same state (touch parity)', () => {
    const inp = createTopdownInput()
    inp.press('A', true)
    expect(inp.state.A).toBe(1)
  })
  it('fires onInteract on E and onLanguage on L', () => {
    const onInteract = vi.fn(); const onLanguage = vi.fn()
    const inp = createTopdownInput()
    inp.attach(null, { onInteract, onLanguage, onKey: () => {} })
    inp.setKey('e', true); inp.setKey('l', true)
    expect(onInteract).toHaveBeenCalled()
    expect(onLanguage).toHaveBeenCalled()
  })
  it('feeds every keydown to onKey for Konami', () => {
    const onKey = vi.fn()
    const inp = createTopdownInput()
    inp.attach(null, { onKey })
    inp.setKey('ArrowUp', true)
    expect(onKey).toHaveBeenCalledWith('ArrowUp')
  })
})
