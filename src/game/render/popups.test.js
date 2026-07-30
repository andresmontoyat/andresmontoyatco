import { describe, it, expect } from 'vitest'
import { createPopups, addPopup, updatePopups } from './popups.js'

describe('popups', () => {
  it('starts empty and adds a popup with the given text', () => {
    const pool = createPopups()
    addPopup(pool, 50, 80, '+100')
    expect(pool).toHaveLength(1)
    expect(pool[0].text).toBe('+100')
    expect(pool[0].life).toBe(1)
  })
  it('rises (y decreases) and fades on update when not reduced', () => {
    const pool = createPopups()
    addPopup(pool, 50, 80, '+100')
    const y0 = pool[0].y
    updatePopups(pool, false)
    expect(pool[0].y).toBeLessThan(y0)
    expect(pool[0].life).toBeLessThan(1)
  })
  it('does NOT move under reduced motion but still fades', () => {
    const pool = createPopups()
    addPopup(pool, 50, 80, '+100')
    const y0 = pool[0].y
    updatePopups(pool, true)
    expect(pool[0].y).toBe(y0)
    expect(pool[0].life).toBeLessThan(1)
  })
  it('culls the popup once its life runs out', () => {
    const pool = createPopups()
    addPopup(pool, 50, 80, '+100')
    for (let i = 0; i < 50; i++) updatePopups(pool, false)
    expect(pool).toHaveLength(0)
  })
})
