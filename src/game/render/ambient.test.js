import { describe, it, expect } from 'vitest'
import { swayOffset } from './ambient.js'

// Regression coverage for the "trees vibrate instead of sway" bug: `t` passed in is
// `state.clock`, which advances ~96 units/sec (see ambient.js's DAY_LEN comment), not real
// seconds — the old SWAY_SPEED assumed real seconds and oscillated ~21x/sec. These assertions
// pin (a) non-swaying decor is untouched, (b) the amplitude is a small dimensionless skew
// factor (not a multi-pixel translate), and (c) one frame's worth of clock advance moves the
// skew by a tiny amount — the frame-to-frame delta that used to read as a tremble.
const FRAME_DT = 1.6 // update()'s per-frame clock increment (worldRpg.js: update(state, input, 1.6))

describe('swayOffset', () => {
  it('is zero for decor types that should not sway', () => {
    expect(swayOffset({ type: 'rock', x: 10, y: 10 }, 100)).toBe(0)
    expect(swayOffset({ type: 'flower', x: 10, y: 10 }, 100)).toBe(0)
    expect(swayOffset({ type: 'fence', x: 10, y: 10 }, 100)).toBe(0)
  })

  it('stays within a small, gentle skew-factor amplitude for trees', () => {
    const d = { type: 'tree', x: 40, y: 80 }
    for (let t = 0; t < 2000; t += 37) {
      expect(Math.abs(swayOffset(d, t))).toBeLessThanOrEqual(0.05 + 1e-9)
    }
  })

  it('gives bushes an even smaller amplitude than trees', () => {
    const tree = { type: 'tree', x: 5, y: 5 }
    const bush = { type: 'bush', x: 5, y: 5 }
    let maxTree = 0
    let maxBush = 0
    for (let t = 0; t < 2000; t += 11) {
      maxTree = Math.max(maxTree, Math.abs(swayOffset(tree, t)))
      maxBush = Math.max(maxBush, Math.abs(swayOffset(bush, t)))
    }
    expect(maxBush).toBeLessThan(maxTree)
  })

  it('barely changes across a single frame — no frame-to-frame vibration', () => {
    const d = { type: 'tree', x: 100, y: 200 }
    for (let t = 0; t < 3000; t += 251) {
      const delta = Math.abs(swayOffset(d, t + FRAME_DT) - swayOffset(d, t))
      expect(delta).toBeLessThan(0.005)
    }
  })

  it('is deterministic for the same element and clock value', () => {
    const d = { type: 'tree', x: 12, y: 34 }
    expect(swayOffset(d, 500)).toBe(swayOffset(d, 500))
  })

  it('does not sway neighboring trees in lockstep', () => {
    const a = swayOffset({ type: 'tree', x: 0, y: 0 }, 300)
    const b = swayOffset({ type: 'tree', x: 32, y: 0 }, 300)
    expect(a).not.toBe(b)
  })
})
