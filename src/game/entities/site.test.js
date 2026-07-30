import { describe, it, expect } from 'vitest'
import { doorPoint, isPlayerAtDoor, nearestSite } from './site.js'

const site = { cx: 500, cy: 300, w: 66, h: 78 }

describe('isPlayerAtDoor', () => {
  it('is true when the player stands in front of the door', () => {
    const d = doorPoint(site)
    expect(isPlayerAtDoor({ x: d.x, y: d.y }, site)).toBe(true)
  })
  it('is false when far away', () => {
    expect(isPlayerAtDoor({ x: 900, y: 900 }, site)).toBe(false)
  })
})

describe('nearestSite', () => {
  it('returns the closest site in range or null', () => {
    const a = { cx: 100, cy: 100, w: 66, h: 78 }
    const b = { cx: 500, cy: 300, w: 66, h: 78 }
    const d = doorPoint(b)
    expect(nearestSite({ x: d.x, y: d.y }, [a, b])).toBe(b)
    expect(nearestSite({ x: 5000, y: 5000 }, [a, b])).toBe(null)
  })
})
