import { describe, it, expect } from 'vitest'
import { MANIFEST } from './manifest.js'

const REQUIRED_FRAMES = [
  'ground_farm',
  'ground_pradera', 'ground_pradera_2', 'ground_pradera_3',
  'ground_desierto', 'ground_desierto_2',
  'ground_selva', 'ground_selva_2', 'ground_selva_3',
  'ground_cyber', 'ground_cyber_2',
  'ground_castillo', 'ground_castillo_2',
  'path', 'water',
  'house', 'castle',
  'tree', 'tree_small', 'fence', 'bush', 'rock', 'flower',
  'carlos_down_0', 'carlos_down_1', 'carlos_down_2',
  'carlos_up_0', 'carlos_up_1', 'carlos_up_2',
  'carlos_left_0', 'carlos_left_1', 'carlos_left_2',
  'carlos_right_0', 'carlos_right_1', 'carlos_right_2',
  'chicken_0', 'chicken_1',
]

// Real pixel dimensions of each source PNG, captured with
// `sips -g pixelWidth -g pixelHeight <file>` while building the manifest. Guards against
// frame rects drifting outside the actual sprite sheet bounds.
const REAL_IMAGE_SIZE = {
  cfGrass: { w: 16, h: 16 },
  cfPath: { w: 16, h: 16 },
  cfWater: { w: 16, h: 16 },
  cfFarmland: { w: 48, h: 48 },
  cfBeach: { w: 80, h: 48 },
  cfHouse: { w: 96, h: 128 },
  cfOakTree: { w: 64, h: 80 },
  cfOakTreeSmall: { w: 96, h: 48 },
  cfFences: { w: 64, h: 64 },
  cfPlayer: { w: 192, h: 320 },
  cfChicken: { w: 64, h: 64 },
  slGrass: { w: 176, h: 112 },
  slHills: { w: 176, h: 144 },
  slTilledDirt: { w: 176, h: 112 },
  slBiomThings: { w: 144, h: 80 },
}

describe('MANIFEST integrity', () => {
  it('defines every required frame name', () => {
    REQUIRED_FRAMES.forEach(name => {
      expect(MANIFEST.frames[name]).toBeDefined()
    })
  })

  it('does not define any unexpected extra frame names beyond the required set', () => {
    expect(Object.keys(MANIFEST.frames).sort()).toEqual([...REQUIRED_FRAMES].sort())
  })

  it('points every frame.img at an image that exists in images', () => {
    Object.entries(MANIFEST.frames).forEach(([name, frame]) => {
      expect(MANIFEST.images[frame.img], `frame "${name}" references unknown image "${frame.img}"`).toBeDefined()
    })
  })

  it('gives every frame positive width and height', () => {
    Object.values(MANIFEST.frames).forEach(frame => {
      expect(frame.w).toBeGreaterThan(0)
      expect(frame.h).toBeGreaterThan(0)
      expect(frame.x).toBeGreaterThanOrEqual(0)
      expect(frame.y).toBeGreaterThanOrEqual(0)
    })
  })

  it('url-encodes every image path (no raw spaces)', () => {
    Object.values(MANIFEST.images).forEach(src => {
      expect(src).not.toMatch(/ /)
      expect(src.startsWith('/game/')).toBe(true)
    })
  })

  it('has a known real size recorded for every image key', () => {
    Object.keys(MANIFEST.images).forEach(key => {
      expect(REAL_IMAGE_SIZE[key], `no REAL_IMAGE_SIZE entry for "${key}"`).toBeDefined()
    })
  })

  it('keeps every frame rect within its image real pixel bounds', () => {
    Object.entries(MANIFEST.frames).forEach(([name, frame]) => {
      const size = REAL_IMAGE_SIZE[frame.img]
      expect(frame.x + frame.w, `frame "${name}" exceeds width of "${frame.img}"`).toBeLessThanOrEqual(size.w)
      expect(frame.y + frame.h, `frame "${name}" exceeds height of "${frame.img}"`).toBeLessThanOrEqual(size.h)
    })
  })
})
