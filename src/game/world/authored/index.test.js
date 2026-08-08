import { describe, it, expect } from 'vitest'
import { buildAuthoredIndex } from './index.js'

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
