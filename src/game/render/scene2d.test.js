import { describe, it, expect } from 'vitest'
import { nearestPathDist, visibleTileRange } from './scene2d.js'

const path = [{ x: 0, y: 0 }, { x: 100, y: 0 }]

describe('nearestPathDist', () => {
  it('returns ~0 for a point on the segment', () => {
    expect(nearestPathDist(path, 50, 0)).toBeCloseTo(0)
  })
  it('returns the perpendicular distance off the segment', () => {
    expect(nearestPathDist(path, 50, 30)).toBeCloseTo(30)
  })
  it('clamps to the nearest endpoint beyond the segment ends', () => {
    expect(nearestPathDist(path, 140, 0)).toBeCloseTo(40)
  })
})

describe('visibleTileRange', () => {
  it('covers the viewport plus a one-tile margin on each side', () => {
    const r = visibleTileRange({ x: 64, y: 64 }, 320, 320, 32)
    expect(r.x0).toBe(1)
    expect(r.y0).toBe(1)
    expect(r.x1).toBe(13)
    expect(r.y1).toBe(13)
  })
})
