import { describe, it, expect } from 'vitest'
import { frameRect, loadAtlas } from './atlas.js'

const meta = { frames: { grass: { x: 0, y: 0, w: 16, h: 16 }, tree: { x: 16, y: 0, w: 16, h: 32 } } }

describe('frameRect', () => {
  it('resolves a named frame', () => {
    expect(frameRect(meta, 'tree')).toEqual({ x: 16, y: 0, w: 16, h: 32 })
  })
  it('throws on an unknown frame', () => {
    expect(() => frameRect(meta, 'missing')).toThrow()
  })
})

describe('loadAtlas', () => {
  it('resolves with a frame() accessor once the image loads', async () => {
    class FakeImage { set src(v) { this._s = v; setTimeout(() => this.onload(), 0) } }
    const atlas = await loadAtlas('sprites.png', meta, FakeImage)
    expect(atlas.frame('grass')).toEqual({ x: 0, y: 0, w: 16, h: 16 })
  })
})
