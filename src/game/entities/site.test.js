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

// cy is a site's TOP edge and its solid box runs cy..cy+h, so the door has to sit below the base.
// An editor-placed house is taller than a generated one (144 vs 88), which is what exposed it.
describe('doorPoint', () => {
  const tall = { cx: 500, cy: 300, w: 112, h: 144 }

  it('stands below the building base, outside its solid box', () => {
    expect(doorPoint(tall).y).toBeGreaterThan(tall.cy + tall.h)
  })

  it('is reachable by a player pressed against the base of a tall house', () => {
    const PLAYER_HALF = 10
    const player = { x: tall.cx, y: tall.cy + tall.h + PLAYER_HALF }
    expect(isPlayerAtDoor(player, tall)).toBe(true)
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
