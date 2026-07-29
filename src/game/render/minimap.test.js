import { describe, it, expect } from 'vitest'
import { minimapDot } from './minimap.js'

describe('minimapDot', () => {
  it('scales world coords into the minimap box', () => {
    const world = { worldW: 2000, worldH: 1000 }
    expect(minimapDot({ cx: 1000, cy: 500 }, world, 100, 50)).toEqual({ x: 50, y: 25 })
  })
})
