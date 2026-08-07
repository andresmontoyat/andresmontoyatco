import { describe, it, expect } from 'vitest'
import {
  splitRef, slugFor, frameNameFor, publicUrlFor,
  classifyLayer, anchorsFrom, placementsFrom,
  tilesFrom, framesFrom, convertMap,
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

const SAMPLE = {
  version: 1,
  tileSize: 32,
  cols: 4,
  rows: 3,
  world: { w: 128, h: 96 },
  layers: [
    {
      name: 'suelo',
      type: 'tiles',
      cells: [
        { x: 0, y: 0, frame: 'Cute_Fantasy/Tiles/Grass/G.png#0,0' },
        { x: 1, y: 0, frame: 'Cute_Fantasy/Tiles/Grass/G.png#0,0' },
        { x: 2, y: 1, frame: 'Cute_Fantasy/Tiles/Path/P.png#1,1' },
      ],
    },
    { name: 'props', type: 'objects', objects: [{ frame: 'Cute_Fantasy/Trees/T.png#0,0', x: 50, y: 60 }] },
    { name: 'anchor:farm', type: 'objects', objects: [{ frame: 'Cute_Fantasy/Trees/T.png#0,0', x: 8, y: 9 }] },
  ],
}

const DIMS = {
  'Cute_Fantasy/Tiles/Grass/G.png': { w: 64, h: 64 },
  'Cute_Fantasy/Tiles/Path/P.png': { w: 96, h: 96 },
  'Cute_Fantasy/Trees/T.png': { w: 32, h: 32 },
}
const dimsOf = p => DIMS[p]

describe('tilesFrom', () => {
  it('dedupes frames into a palette and encodes cells as [x, y, paletteIndex]', () => {
    const t = tilesFrom(SAMPLE)
    expect(t.frames).toEqual(['am_Tiles_Grass_G_0_0', 'am_Tiles_Path_P_1_1'])
    expect(t.layers).toEqual([{ name: 'suelo', cells: [[0, 0, 0], [1, 0, 0], [2, 1, 1]] }])
  })
  it('sorts the palette by name so indices are stable across re-imports', () => {
    const reversed = { ...SAMPLE, layers: [{ ...SAMPLE.layers[0], cells: [...SAMPLE.layers[0].cells].reverse() }] }
    expect(tilesFrom(reversed).frames).toEqual(tilesFrom(SAMPLE).frames)
  })
  it('carries dimensions and anchors', () => {
    const t = tilesFrom(SAMPLE)
    expect(t).toMatchObject({ version: 1, tileSize: 32, cols: 4, rows: 3 })
    expect(t.anchors).toEqual({ farm: { x: 8, y: 9 } })
  })
  it('keeps object layers out of the tile output', () => {
    expect(tilesFrom(SAMPLE).layers).toHaveLength(1)
  })
})

describe('framesFrom', () => {
  it('emits one image entry per distinct source path', () => {
    const { images } = framesFrom(SAMPLE, dimsOf)
    expect(images).toEqual({
      am_Tiles_Grass_G: '/game/cute-fantasy/Tiles/Grass/G.png',
      am_Tiles_Path_P: '/game/cute-fantasy/Tiles/Path/P.png',
      am_Trees_T: '/game/cute-fantasy/Trees/T.png',
    })
  })
  it('turns each cell into a manifest rect at tileSize granularity', () => {
    const { frames } = framesFrom(SAMPLE, dimsOf)
    expect(frames.am_Tiles_Path_P_1_1).toEqual({ img: 'am_Tiles_Path_P', x: 32, y: 32, w: 32, h: 32 })
  })
  it('includes frames referenced only by objects', () => {
    expect(framesFrom(SAMPLE, dimsOf).frames.am_Trees_T_0_0)
      .toEqual({ img: 'am_Trees_T', x: 0, y: 0, w: 32, h: 32 })
  })
})

describe('convertMap', () => {
  it('returns the three artifacts together', () => {
    const out = convertMap(SAMPLE, { dimsOf })
    expect(Object.keys(out).sort()).toEqual(['manifest', 'placements', 'tiles'])
    expect(out.placements).toEqual([{ frame: 'am_Trees_T_0_0', x: 50, y: 60 }])
    expect(out.tiles.anchors.farm).toEqual({ x: 8, y: 9 })
    expect(out.manifest.frames.am_Tiles_Grass_G_0_0).toBeDefined()
  })
  it('is deterministic — same input, identical json', () => {
    expect(JSON.stringify(convertMap(SAMPLE, { dimsOf })))
      .toBe(JSON.stringify(convertMap(SAMPLE, { dimsOf })))
  })
})
