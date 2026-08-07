import { describe, it, expect } from 'vitest'
import {
  splitRef, slugFor, frameNameFor, publicUrlFor,
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
