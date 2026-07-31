import { describe, it, expect } from 'vitest'
import { MANIFEST } from './manifest.js'

const REQUIRED_FRAMES = [
  'ground_farm', 'ground_farm_2', 'ground_farm_3',
  'ground_pradera', 'ground_pradera_2', 'ground_pradera_3',
  'ground_desierto', 'ground_desierto_2', 'ground_desierto_3',
  'ground_selva', 'ground_selva_2', 'ground_selva_3',
  'ground_cyber', 'ground_cyber_2',
  'ground_castillo', 'ground_castillo_2',
  'path_center', 'path_n', 'path_s', 'path_w', 'path_e', 'path_nw', 'path_ne', 'path_sw', 'path_se',
  'water',
  'house', 'house_wood_red', 'house_stone_blue', 'house_stone_red', 'house_lime_blue', 'house_lime_red',
  'church', 'inn', 'blacksmith', 'barn',
  'windmill_tower', 'windmillsail_0', 'windmillsail_1', 'windmillsail_2', 'windmillsail_3',
  'tree', 'tree_small', 'fence', 'bush', 'rock',
  'flowerwind_0', 'flowerwind_1', 'flowerwind_2', 'flowerwind_3',
  'flowerwind_4', 'flowerwind_5', 'flowerwind_6', 'flowerwind_7',
  'carlos_down_0', 'carlos_down_1', 'carlos_down_2',
  'carlos_up_0', 'carlos_up_1', 'carlos_up_2',
  'carlos_left_0', 'carlos_left_1', 'carlos_left_2',
  'carlos_right_0', 'carlos_right_1', 'carlos_right_2',
  'legs_down_0', 'legs_down_1', 'legs_down_2',
  'legs_up_0', 'legs_up_1', 'legs_up_2',
  'legs_right_0', 'legs_right_1', 'legs_right_2',
  'chest_down_0', 'chest_down_1', 'chest_down_2',
  'chest_up_0', 'chest_up_1', 'chest_up_2',
  'chest_right_0', 'chest_right_1', 'chest_right_2',
  'helm_down_0', 'helm_down_1', 'helm_down_2',
  'helm_up_0', 'helm_up_1', 'helm_up_2',
  'helm_right_0', 'helm_right_1', 'helm_right_2',
  'chicken_0', 'chicken_1',
  'duck_0', 'duck_1', 'cow_0', 'cow_1',
]

// Real pixel dimensions of each source PNG, captured with
// `sips -g pixelWidth -g pixelHeight <file>` while building the manifest. Guards against
// frame rects drifting outside the actual sprite sheet bounds.
const REAL_IMAGE_SIZE = {
  cfGrass1: { w: 16, h: 16 },
  cfGrass2: { w: 16, h: 16 },
  cfGrass3: { w: 16, h: 16 },
  cfGrass4: { w: 16, h: 16 },
  cfBeach: { w: 480, h: 48 },
  cfFarmland: { w: 112, h: 128 },
  cfStoneCliff1: { w: 224, h: 96 },
  cfStoneCliff3: { w: 224, h: 96 },
  cfCobbleRoad: { w: 48, h: 80 },
  cfWater: { w: 16, h: 16 },
  cfHouse: { w: 96, h: 128 },
  cfHouseWoodRed: { w: 96, h: 128 },
  cfHouseStoneBlue: { w: 96, h: 128 },
  cfHouseStoneRed: { w: 96, h: 128 },
  cfHouseLimeBlue: { w: 96, h: 128 },
  cfHouseLimeRed: { w: 96, h: 128 },
  cfChurch: { w: 448, h: 144 },
  cfInn: { w: 240, h: 192 },
  cfBlacksmith: { w: 160, h: 128 },
  cfBarn: { w: 128, h: 144 },
  cfWindmill: { w: 128, h: 112 },
  cfWindmillSail: { w: 256, h: 80 },
  cfBigOak: { w: 192, h: 80 },
  cfMedOak: { w: 96, h: 48 },
  cfFences: { w: 64, h: 64 },
  cfOutdoorDecor: { w: 144, h: 416 },
  cfFlowerWind: { w: 128, h: 16 },
  cfPlayer: { w: 576, h: 3584 },
  cfHelm: { w: 576, h: 3584 },
  cfChest: { w: 576, h: 3584 },
  cfLegs: { w: 576, h: 3584 },
  cfChicken: { w: 256, h: 512 },
  cfDuck: { w: 256, h: 640 },
  cfCow: { w: 256, h: 480 },
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
