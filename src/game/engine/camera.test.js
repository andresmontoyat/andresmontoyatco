import { describe, it, expect } from 'vitest'
import { followCamera, shakeOffset } from './camera.js'

describe('camera', () => {
  it('eases toward the target and clamps to level bounds', () => {
    const cam = { x: 0 }
    followCamera(cam, 5000, 1280, 10000)
    expect(cam.x).toBeGreaterThan(0)
    expect(cam.x).toBeLessThanOrEqual(10000 - 1280)
  })
  it('never scrolls past the left edge', () => {
    const cam = { x: 0 }
    followCamera(cam, 0, 1280, 10000)
    expect(cam.x).toBe(0)
  })
  it('returns zero shake when idle', () => {
    expect(shakeOffset(0)).toEqual({ x: 0, y: 0 })
  })
})
