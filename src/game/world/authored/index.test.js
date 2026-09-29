import { describe, it, expect } from 'vitest'
import { buildAuthoredIndex, worldSizeOf } from './index.js'

const tiles = {
  version: 1,
  tileSize: 32,
  cols: 4,
  rows: 3,
  frames: ['am_grass_0_0', 'am_path_1_1'],
  layers: [
    { name: 'suelo', cells: [[0, 0, 0], [2, 1, 1]] },
    { name: 'detalle', cells: [[2, 1, 0]] },
  ],
  anchors: {},
}

describe('buildAuthoredIndex', () => {
  it('keys each layer by "x,y" and resolves the palette index to a frame name', () => {
    const idx = buildAuthoredIndex(tiles)
    expect(idx).toHaveLength(2)
    expect(idx[0].name).toBe('suelo')
    expect(idx[0].cells.get('0,0')).toBe('am_grass_0_0')
    expect(idx[0].cells.get('2,1')).toBe('am_path_1_1')
  })
  it('keeps layer order so later layers can overdraw earlier ones', () => {
    const idx = buildAuthoredIndex(tiles)
    expect(idx[1].cells.get('2,1')).toBe('am_grass_0_0')
  })
  it('returns an empty array for a null map', () => {
    expect(buildAuthoredIndex(null)).toEqual([])
  })
})

// The map owns the world's size (docs/adr/0001). WORLD_W/WORLD_H were hand-tuned constants — 2140
// is not even a whole number of 32px tiles — and the mismatch between them and the authored carpet
// is why 220px of the world carried no authored tiles at all.
describe('worldSizeOf', () => {
  it('measures the map in game pixels', () => {
    expect(worldSizeOf({ cols: 60, rows: 45 })).toEqual({ w: 1920, h: 1440 })
  })

  it('has no opinion without a map', () => {
    expect(worldSizeOf(null)).toBeNull()
    expect(worldSizeOf({})).toBeNull()
    expect(worldSizeOf({ cols: 0, rows: 10 })).toBeNull()
  })

  // The tiles artifact stores the SOURCE granularity (16), while the game draws at WORLD_TILE (32).
  // Measuring with the source number would halve the world.
  it('measures in game tiles, not source tiles', () => {
    expect(worldSizeOf({ cols: 10, rows: 10, tileSize: 16 })).toEqual({ w: 320, h: 320 })
  })
})
