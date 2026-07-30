import { describe, it, expect, vi } from 'vitest'
import { isTouch, mountTouchControls } from './touch.js'

describe('touch controls', () => {
  it('detects touch capability', () => {
    expect(isTouch({ maxTouchPoints: 2 })).toBe(true)
    expect(isTouch({ maxTouchPoints: 0 })).toBe(false)
  })
  it('mounts buttons that drive input.press', () => {
    const container = { appendChild: vi.fn(), removeChild: vi.fn() }
    const btns = []
    const doc = { createElement: () => { const b = { addEventListener: (t, h) => btns.push([t, h]), style: {}, classList: { add() {} } }; return b } }
    const press = vi.fn()
    const handle = mountTouchControls(container, { press }, doc)
    const down = btns.find(([t]) => t === 'pointerdown')
    down[1]({ preventDefault() {} })
    expect(press).toHaveBeenCalled()
    handle.destroy()
  })
})
