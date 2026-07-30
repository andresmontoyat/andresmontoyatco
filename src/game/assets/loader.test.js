import { describe, it, expect, vi } from 'vitest'
import { loadSprites } from './loader.js'

class FakeImage {
  set src(v) {
    this._s = v
    this.width = 10
    this.height = 10
    setTimeout(() => this.onload(), 0)
  }

  get src() { return this._s }
}

const manifest = {
  images: {
    tiles: 'tiles.png',
    player: 'player.png',
  },
  frames: {
    ground_pradera: { img: 'tiles', x: 0, y: 0, w: 16, h: 16 },
    carlos_down_0: { img: 'player', x: 0, y: 0, w: 32, h: 32 },
  },
}

describe('loadSprites', () => {
  it('loads every distinct image and resolves a ready sprite sheet', async () => {
    const sheet = await loadSprites(manifest, FakeImage)
    expect(sheet.ready).toBe(true)
  })

  it('resolves frame() to the manifest rect plus the loaded image', async () => {
    const sheet = await loadSprites(manifest, FakeImage)
    const f = sheet.frame('ground_pradera')
    expect(f).toEqual({ img: expect.any(FakeImage), x: 0, y: 0, w: 16, h: 16 })
  })

  it('resolves a second frame from a different image', async () => {
    const sheet = await loadSprites(manifest, FakeImage)
    const f = sheet.frame('carlos_down_0')
    expect(f).toMatchObject({ x: 0, y: 0, w: 32, h: 32 })
    expect(f.img).toBeInstanceOf(FakeImage)
  })

  it('throws when asked for an unknown frame', async () => {
    const sheet = await loadSprites(manifest, FakeImage)
    expect(() => sheet.frame('nope')).toThrow()
  })

  it('draw() blits the resolved frame via ctx.drawImage', async () => {
    const sheet = await loadSprites(manifest, FakeImage)
    const ctx = { drawImage: vi.fn() }
    sheet.draw(ctx, 'ground_pradera', 5, 6, 32, 32)
    const f = sheet.frame('ground_pradera')
    expect(ctx.drawImage).toHaveBeenCalledWith(f.img, 0, 0, 16, 16, 5, 6, 32, 32)
  })

  it('drawFlipped() mirrors horizontally around the destination rect', async () => {
    const sheet = await loadSprites(manifest, FakeImage)
    const calls = []
    const ctx = {
      save: () => calls.push('save'),
      restore: () => calls.push('restore'),
      translate: (x, y) => calls.push(['translate', x, y]),
      scale: (x, y) => calls.push(['scale', x, y]),
      drawImage: (...args) => calls.push(['drawImage', ...args]),
    }
    sheet.drawFlipped(ctx, 'carlos_down_0', 10, 20, 32, 32)
    const f = sheet.frame('carlos_down_0')
    expect(calls[0]).toBe('save')
    expect(calls[1]).toEqual(['translate', 42, 20])
    expect(calls[2]).toEqual(['scale', -1, 1])
    expect(calls[3]).toEqual(['drawImage', f.img, 0, 0, 32, 32, 0, 0, 32, 32])
    expect(calls[4]).toBe('restore')
  })
})
