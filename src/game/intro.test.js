import { describe, it, expect } from 'vitest'
import { createIntro } from './intro.js'

describe('createIntro', () => {
  it('descends the camera from sky to farm over the duration', () => {
    const i = createIntro(3)
    expect(i.camY(0, 300)).toBeCloseTo(0, 1)
    i.update(3)
    expect(i.camY(0, 300)).toBeCloseTo(300, 1)
    expect(i.done()).toBe(true)
  })
  it('skip() completes immediately', () => {
    const i = createIntro(3)
    i.skip()
    expect(i.done()).toBe(true)
  })
})
