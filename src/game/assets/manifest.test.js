import { describe, it, expect } from 'vitest'
import { MANIFEST, AVATAR_FRAMES, NPC_FRAMES } from './manifest.js'

const REQUIRED_FRAMES = [
  'ground_farm', 'ground_farm_2', 'ground_farm_3',
  'ground_pradera', 'ground_pradera_2', 'ground_pradera_3',
  'ground_desierto', 'ground_desierto_2', 'ground_desierto_3',
  'ground_selva', 'ground_selva_2', 'ground_selva_3',
  'ground_cyber', 'ground_cyber_2',
  'ground_castillo', 'ground_castillo_2',
  'path_center', 'path_n', 'path_s', 'path_w', 'path_e', 'path_nw', 'path_ne', 'path_sw', 'path_se',
  'water',
  'water_center', 'water_n', 'water_s', 'water_w', 'water_e', 'water_nw', 'water_ne', 'water_sw', 'water_se',
  'lilypad_0', 'lilypad_1', 'lilypad_2', 'lilypad_3', 'lilypad_4', 'lilypad_5', 'lilypad_6', 'lilypad_7',
  'cattail_0', 'cattail_1', 'cattail_2', 'cattail_3', 'cattail_4', 'cattail_5', 'cattail_6', 'cattail_7',
  'kapybara_0', 'kapybara_1', 'kapybara_2', 'kapybara_3', 'kapybara_4', 'kapybara_5', 'kapybara_6', 'kapybara_7', 'kapybara_8',
  'house', 'house_wood_red', 'house_stone_blue', 'house_stone_red', 'house_lime_blue', 'house_lime_red',
  'church', 'inn', 'blacksmith', 'barn',
  'windmill_tower', 'windmillsail_0', 'windmillsail_1', 'windmillsail_2', 'windmillsail_3',
  'tree', 'tree_small', 'tree_birch', 'tree_spruce', 'tree_fruit', 'fence', 'bush', 'rock',
  'flowerwind_0', 'flowerwind_1', 'flowerwind_2', 'flowerwind_3',
  'flowerwind_4', 'flowerwind_5', 'flowerwind_6', 'flowerwind_7',
  // Modular avatar frames (carlos/legs/feet/chest/hair × down/right/up × 6 walk + 2 idle) are
  // generated in manifest.js; regenerate the expected names from that single source of truth.
  ...Object.keys(AVATAR_FRAMES),
  'chicken_0', 'chicken_1',
  'duck_0', 'duck_1', 'cow_0', 'cow_1', 'pig_0', 'pig_1', 'sheep_0', 'sheep_1', 'frog_0', 'frog_1',
  // Ambient NPC frames (npc_<type>_0/1) generated in manifest.js — same source of truth.
  ...Object.keys(NPC_FRAMES),
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
  cfWaterTile: { w: 48, h: 80 },
  cfLilypad: { w: 128, h: 16 },
  cfCattail: { w: 128, h: 16 },
  cfKapybara: { w: 288, h: 32 },
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
  cfMedBirch: { w: 96, h: 48 },
  cfMedSpruce: { w: 96, h: 48 },
  cfMedFruit: { w: 96, h: 64 },
  cfFences: { w: 64, h: 64 },
  cfOutdoorDecor: { w: 144, h: 416 },
  cfFlowerWind: { w: 128, h: 16 },
  cfPlayer: { w: 576, h: 3584 },
  cfLegs: { w: 576, h: 3584 },
  cfFeet: { w: 576, h: 3584 },
  cfChest: { w: 576, h: 3584 },
  cfHair: { w: 576, h: 3584 },
  cfChicken: { w: 256, h: 512 },
  cfDuck: { w: 256, h: 640 },
  cfCow: { w: 256, h: 480 },
  cfPig: { w: 288, h: 480 },
  cfSheep: { w: 256, h: 480 },
  cfFrog: { w: 320, h: 128 },
  cfNpcFarmer: { w: 384, h: 832 },
  cfNpcMiner: { w: 384, h: 640 },
  cfNpcChef: { w: 384, h: 448 },
  cfNpcKaty: { w: 384, h: 448 },
  cfNpcFin: { w: 576, h: 832 },
  cfNpcJack: { w: 384, h: 640 },
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
