import { describe, it, expect } from 'vitest'
import {
  splitRef, slugFor, frameNameFor, publicUrlFor,
  classifyLayer, anchorsFrom, placementsFrom,
} from './convert.js'

describe('splitRef', () => {
  it('splits a bundle ref into path and cell', () => {
    expect(splitRef('Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png#3,2'))
      .toEqual({ path: 'Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png', col: 3, row: 2 })
  })
  it('throws on a ref with no cell part', () => {
    expect(() => splitRef('Cute_Fantasy/Tiles/Grass.png')).toThrow(/malformed ref/)
  })
})

describe('slugFor', () => {
  it('strips the pack root and extension and prefixes am_', () => {
    expect(slugFor('Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png'))
      .toBe('am_Tiles_Grass_Grass_1_Middle')
  })
  it('collapses spaces and parentheses into single underscores', () => {
    expect(slugFor('Cute_Fantasy/NPCs (Premade)/Old Man.png'))
      .toBe('am_NPCs_Premade_Old_Man')
  })
  it('is idempotent for the same input', () => {
    const p = 'Cute_Fantasy/Trees/Tree.png'
    expect(slugFor(p)).toBe(slugFor(p))
  })
})

describe('frameNameFor', () => {
  it('appends the cell coordinates to the slug', () => {
    expect(frameNameFor('Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png#3,2'))
      .toBe('am_Tiles_Grass_Grass_1_Middle_3_2')
  })
  it('never collides with a hand-curated name', () => {
    expect(frameNameFor('Cute_Fantasy/x/house.png#0,0').startsWith('am_')).toBe(true)
  })
})

describe('publicUrlFor', () => {
  it('maps the pack root onto the public game path', () => {
    expect(publicUrlFor('Cute_Fantasy/Tiles/Grass/Grass_1_Middle.png'))
      .toBe('/game/cute-fantasy/Tiles/Grass/Grass_1_Middle.png')
  })
  it('url-encodes spaces and parentheses so the browser can fetch it', () => {
    expect(publicUrlFor('Cute_Fantasy/NPCs (Premade)/Old Man.png'))
      .toBe('/game/cute-fantasy/NPCs%20(Premade)/Old%20Man.png')
  })
})

describe('classifyLayer', () => {
  it('reads the biome out of an anchor layer name', () => {
    expect(classifyLayer({ name: 'anchor:pradera', type: 'objects' }))
      .toEqual({ kind: 'anchor', biome: 'pradera' })
  })
  it('treats any other objects layer as placements', () => {
    expect(classifyLayer({ name: 'props', type: 'objects' })).toEqual({ kind: 'objects' })
  })
  it('treats tiles layers as terrain', () => {
    expect(classifyLayer({ name: 'suelo', type: 'tiles' })).toEqual({ kind: 'tiles' })
  })
  it('rejects an anchor layer naming an unknown biome', () => {
    expect(() => classifyLayer({ name: 'anchor:atlantis', type: 'objects' }))
      .toThrow(/unknown biome "atlantis"/)
  })
})

describe('anchorsFrom', () => {
  const anchorLayer = (biome, x, y) => ({
    name: `anchor:${biome}`, type: 'objects', objects: [{ frame: 'x.png#0,0', x, y }],
  })

  it('maps each anchor layer to its single object position', () => {
    expect(anchorsFrom([anchorLayer('farm', 360, 1120), anchorLayer('cyber', 1360, 1040)]))
      .toEqual({ farm: { x: 360, y: 1120 }, cyber: { x: 1360, y: 1040 } })
  })
  it('returns an empty object when no anchor layers exist', () => {
    expect(anchorsFrom([{ name: 'props', type: 'objects', objects: [] }])).toEqual({})
  })
  it('rejects an anchor layer with no object', () => {
    expect(() => anchorsFrom([{ name: 'anchor:farm', type: 'objects', objects: [] }]))
      .toThrow(/anchor:farm.*exactly one object.*got 0/)
  })
  it('rejects an anchor layer with more than one object', () => {
    const two = { name: 'anchor:farm', type: 'objects', objects: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }
    expect(() => anchorsFrom([two])).toThrow(/anchor:farm.*exactly one object.*got 2/)
  })
})

describe('placementsFrom', () => {
  it('converts object refs to frame names and keeps the anchor position', () => {
    const layers = [{
      name: 'props',
      type: 'objects',
      objects: [{ frame: 'Cute_Fantasy/Trees/Tree.png#1,0', x: 100, y: 200 }],
    }]
    expect(placementsFrom(layers)).toEqual([{ frame: 'am_Trees_Tree_1_0', x: 100, y: 200 }])
  })
  it('carries transform fields through when present', () => {
    const layers = [{
      name: 'props',
      type: 'objects',
      objects: [{ frame: 'a/b.png#0,0', x: 1, y: 2, flipX: true, rot: 90, scale: 2 }],
    }]
    expect(placementsFrom(layers)[0]).toEqual({
      frame: 'am_a_b_0_0', x: 1, y: 2, flipX: true, rot: 90, scale: 2,
    })
  })
  it('omits absent transform fields entirely so untransformed output matches today', () => {
    const layers = [{ name: 'props', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 1, y: 2 }] }]
    expect(Object.keys(placementsFrom(layers)[0])).toEqual(['frame', 'x', 'y'])
  })
  it('never emits anchor-layer objects as placements', () => {
    const layers = [
      { name: 'anchor:farm', type: 'objects', objects: [{ frame: 'a/b.png#0,0', x: 1, y: 2 }] },
      { name: 'props', type: 'objects', objects: [{ frame: 'c/d.png#0,0', x: 3, y: 4 }] },
    ]
    expect(placementsFrom(layers)).toEqual([{ frame: 'am_c_d_0_0', x: 3, y: 4 }])
  })
})
