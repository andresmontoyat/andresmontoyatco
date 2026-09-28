import { describe, it, expect } from 'vitest'
import { migrateMapToV2, TARGET_VERSION } from './migrate.js'
import { validateMap } from './convert.js'

const obj = (over = {}) => ({ frame: 'Cute_Fantasy/Trees/T.png#0,0', x: 16, y: 32, ...over })
const v1 = (over = {}) => ({
  version: 1,
  tileSize: 16,
  world: { w: 64, h: 64 },
  // A real slice entry, so the adapter check at the bottom exercises the version gate rather than
  // tripping over missing geometry.
  slices: { 'Cute_Fantasy/Trees/T.png': { type: 'single', w: 64, h: 64 } },
  clips: [],
  layers: [
    { name: 'Terreno', type: 'tiles', cells: [] },
    { name: 'props', type: 'objects', objects: [obj(), obj({ x: 48 })] },
  ],
  ...over,
})

describe('migrateMapToV2', () => {
  it('stamps the target version', () => {
    expect(migrateMapToV2(v1()).map.version).toBe(TARGET_VERSION)
  })

  it('mints a uid for every object, numbered in document order', () => {
    const { map, minted, objects } = migrateMapToV2(v1())
    expect(map.layers[1].objects.map(o => o.uid)).toEqual(['U1', 'U2'])
    expect({ minted, objects }).toEqual({ minted: 2, objects: 2 })
  })

  it('numbers across layers in order, not per layer', () => {
    const map = v1({
      layers: [
        { name: 'a', type: 'objects', objects: [obj()] },
        { name: 'b', type: 'objects', objects: [obj(), obj()] },
      ],
    })
    const out = migrateMapToV2(map).map
    expect(out.layers.flatMap(l => l.objects.map(o => o.uid))).toEqual(['U1', 'U2', 'U3'])
  })

  it('leaves everything else about an object alone', () => {
    const map = v1({ layers: [{ name: 'p', type: 'objects', objects: [obj({ rot: 90, scale: 2, clip: 'C1' })] }] })
    expect(migrateMapToV2(map).map.layers[0].objects[0])
      .toEqual({ frame: 'Cute_Fantasy/Trees/T.png#0,0', x: 16, y: 32, rot: 90, scale: 2, clip: 'C1', uid: 'U1' })
  })

  // Pure: the file on disk is only rewritten by the CLI, and a caller that wants to diff before
  // writing needs the original intact.
  it('does not touch the map it was given', () => {
    const map = v1()
    migrateMapToV2(map)
    expect(map.version).toBe(1)
    expect('uid' in map.layers[1].objects[0]).toBe(false)
  })

  // Idempotence matters because this is a script someone will run twice: a second pass must not
  // renumber what the first one wrote, or every link made in between would repoint.
  it('is idempotent', () => {
    const once = migrateMapToV2(v1()).map
    const twice = migrateMapToV2(once)
    expect(twice.minted).toBe(0)
    expect(twice.map).toEqual(once)
  })

  it('mints above the highest uid already present, so a half-migrated file cannot collide', () => {
    const map = v1({
      layers: [{ name: 'p', type: 'objects', objects: [obj({ uid: 'U7' }), obj(), obj({ uid: 'U3' })] }],
    })
    expect(migrateMapToV2(map).map.layers[0].objects.map(o => o.uid)).toEqual(['U7', 'U8', 'U3'])
  })

  it('leaves tiles layers untouched', () => {
    const out = migrateMapToV2(v1()).map
    expect(out.layers[0]).toEqual({ name: 'Terreno', type: 'tiles', cells: [] })
  })

  it('reports the version it came from, including an absent one', () => {
    expect(migrateMapToV2(v1()).from).toBe(1)
    const map = v1()
    delete map.version
    expect(migrateMapToV2(map).from).toBe('(absent)')
  })

  it('refuses something that is not a map', () => {
    expect(() => migrateMapToV2(null)).toThrow(/not a map/)
    expect(() => migrateMapToV2({})).toThrow(/not a map/)
  })

  it('handles a map with no object layers at all', () => {
    const map = v1({ layers: [{ name: 'Terreno', type: 'tiles', cells: [] }] })
    expect(migrateMapToV2(map)).toMatchObject({ minted: 0, objects: 0 })
  })

  // The point of the whole exercise: what comes out is what the adapter accepts.
  it('produces a map the adapter no longer refuses', () => {
    const deps = { dimsOf: () => ({ w: 64, h: 64 }), exists: () => true }
    expect(() => validateMap(v1(), deps)).toThrow(/re-export/i)
    expect(() => validateMap(migrateMapToV2(v1()).map, deps)).not.toThrow()
  })

  // It adds identity, never meaning. Which house is which job is authored in the editor.
  it('invents no tags', () => {
    const out = migrateMapToV2(v1()).map
    expect(out.layers[1].objects.some(o => 'tags' in o)).toBe(false)
  })
})
