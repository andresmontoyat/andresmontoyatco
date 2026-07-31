import { describe, it, expect } from 'vitest'
import { animIndex, animFrame } from './anim.js'

describe('animIndex', () => {
  it('advances one frame every ticksPerFrame clock units', () => {
    expect(animIndex(0, 12, 8)).toBe(0)
    expect(animIndex(11, 12, 8)).toBe(0)
    expect(animIndex(12, 12, 8)).toBe(1)
    expect(animIndex(24, 12, 8)).toBe(2)
  })
  it('loops back to 0 after the last frame', () => {
    expect(animIndex(12 * 8, 12, 8)).toBe(0)
    expect(animIndex(12 * 9, 12, 8)).toBe(1)
  })
  it('stays in [0,count) for a negative clock', () => {
    expect(animIndex(-12, 12, 8)).toBe(7)
  })
  it('never divides by a non-positive count', () => {
    expect(animIndex(100, 12, 0)).toBe(0)
  })
})

describe('animFrame', () => {
  it('builds the indexed frame name for the current tick', () => {
    expect(animFrame('flowerwind', 0, 12, 8)).toBe('flowerwind_0')
    expect(animFrame('flowerwind', 36, 12, 8)).toBe('flowerwind_3')
  })
})
