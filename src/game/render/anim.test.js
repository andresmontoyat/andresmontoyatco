import { describe, it, expect } from 'vitest'
import { animIndex, animFrame, clipFrame, ticksFor, hashPhase } from './anim.js'

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

describe('clipFrame', () => {
  const clip = { frames: ['a_0', 'a_1', 'a_2', 'a_3'], fps: 6 }

  it('advances one frame per ticksFor(fps) clock units and loops', () => {
    expect(clipFrame(clip, 0)).toBe('a_0')
    expect(clipFrame(clip, ticksFor(6))).toBe('a_1')
    expect(clipFrame(clip, ticksFor(6) * 4)).toBe('a_0')
  })

  it('offsets by the phase', () => {
    expect(clipFrame(clip, 0, ticksFor(6) * 2)).toBe('a_2')
  })

  it('holds on a one-frame clip and is null for an empty one', () => {
    expect(clipFrame({ frames: ['solo'], fps: 6 }, 12345)).toBe('solo')
    expect(clipFrame({ frames: [], fps: 6 }, 0)).toBeNull()
    expect(clipFrame(null, 0)).toBeNull()
  })

  it('falls back to a sane rate for a missing fps', () => {
    expect(ticksFor(0)).toBe(ticksFor(8))
  })
})

describe('hashPhase', () => {
  it('is deterministic and differs between neighbouring positions', () => {
    expect(hashPhase(64, 128)).toBe(hashPhase(64, 128))
    expect(hashPhase(64, 128)).not.toBe(hashPhase(96, 128))
  })
})
