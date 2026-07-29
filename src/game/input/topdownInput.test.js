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
  it('handles uppercase WASD (Shift+A/D/W/S) via key normalization', () => {
    const inp = createTopdownInput()
    inp.setKey('D', true)
    expect(inp.state.R).toBe(1)
  })
  it('attach registers keydown/keyup on a real element and detach removes them', () => {
    const handlers = []
    const el = {
      addEventListener: (type, h) => handlers.push({ type, h, active: true }),
      removeEventListener: (type, h) => { const f = handlers.find(x => x.type === type && x.h === h); if (f) f.active = false },
    }
    const inp = createTopdownInput()
    inp.attach(el, {})
    expect(handlers.filter(x => x.active).map(x => x.type).sort()).toEqual(['keydown', 'keyup'])
    handlers.find(x => x.type === 'keydown').h({ key: 'ArrowRight', preventDefault() {} })
    expect(inp.state.R).toBe(1)
    inp.detach()
    expect(handlers.every(x => !x.active)).toBe(true)
  })
})
