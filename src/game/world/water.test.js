import { describe, it, expect } from 'vitest'
import { waterBodies, waterSolids, undersizedBodies, waterCellsOf, WATER_LAYER } from './water.js'

const TILE = 32
// A 3x2 lake at cells (0..2, 0..1) and a 2x2 pool at (10..11, 10..11).
const LAKE = ['0,0', '1,0', '2,0', '0,1', '1,1', '2,1']
const POOL = ['10,10', '11,10', '10,11', '11,11']

describe('waterBodies', () => {
  it('finds two separate bodies, in row-major order of their first cell', () => {
    const bodies = waterBodies([...POOL, ...LAKE], TILE)
    expect(bodies.map(b => b.cells)).toEqual([LAKE, POOL])
  })

  it('gives a body the pond shape the game already reads: centroid and an equal-area radius', () => {
    const [lake] = waterBodies(LAKE, TILE)
    expect({ x: lake.x, y: lake.y }).toEqual({ x: 48, y: 32 })
    expect(lake.r).toBeCloseTo(Math.sqrt(6 / Math.PI) * TILE)
  })

  it('keeps an L-shaped body whole', () => {
    expect(waterBodies(['0,0', '0,1', '0,2', '1,2', '2,2'], TILE)).toHaveLength(1)
  })

  it('does not join cells that only touch at a corner', () => {
    expect(waterBodies(['0,0', '1,1'], TILE)).toHaveLength(2)
  })

  it('finds nothing in an empty layer', () => {
    expect(waterBodies([], TILE)).toEqual([])
  })
})

describe('waterSolids', () => {
  const INSET = 10

  it('merges each row of a body into one box', () => {
    expect(waterSolids(waterBodies(LAKE, TILE), TILE, INSET)).toHaveLength(2)
  })

  it('pulls a box in only on the sides that face land', () => {
    const [top, bottom] = waterSolids(waterBodies(LAKE, TILE), TILE, INSET)
    expect(top).toEqual({ x: 10, y: 10, w: 76, h: 22 })
    expect(bottom).toEqual({ x: 10, y: 32, w: 76, h: 22 })
  })

  it('never merges two bodies that share a row', () => {
    expect(waterSolids(waterBodies(['0,0', '0,1', '3,0', '3,1'], TILE), TILE, INSET)).toHaveLength(4)
  })
})

describe('undersizedBodies', () => {
  it('accepts a body that holds a 2x2 square', () => {
    expect(undersizedBodies(waterBodies([...LAKE, ...POOL], TILE))).toEqual([])
  })

  it('flags a one-cell-wide strip, which the 9-cell water set cannot draw', () => {
    const strip = ['0,0', '1,0', '2,0']
    expect(undersizedBodies(waterBodies(strip, TILE)).map(b => b.cells)).toEqual([strip])
  })
})

describe('waterCellsOf', () => {
  it('reads the cells of the layer named water', () => {
    const layers = [{ name: 'road', cells: new Map([['5,5', 'r']]) }, { name: WATER_LAYER, cells: new Map([['1,1', 'w']]) }]
    expect(waterCellsOf(layers)).toEqual(['1,1'])
  })

  it('is null when the map paints no water', () => {
    expect(waterCellsOf([{ name: 'road', cells: new Map() }])).toBeNull()
  })
})
