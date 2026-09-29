import { describe, it, expect } from 'vitest'
import {
  nearestPathDist, nearestRoadDist, visibleTileRange, eraLabel, drawAuthoredTiles, drawTransformed,
  buildingDrawable,
} from './scene2d.js'

const path = [{ x: 0, y: 0 }, { x: 100, y: 0 }]

describe('nearestPathDist', () => {
  it('returns ~0 for a point on the segment', () => {
    expect(nearestPathDist(path, 50, 0)).toBeCloseTo(0)
  })
  it('returns the perpendicular distance off the segment', () => {
    expect(nearestPathDist(path, 50, 30)).toBeCloseTo(30)
  })
  it('clamps to the nearest endpoint beyond the segment ends', () => {
    expect(nearestPathDist(path, 140, 0)).toBeCloseTo(40)
  })
})

describe('nearestRoadDist', () => {
  const roads = [
    { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } },
    { a: { x: 500, y: 500 }, b: { x: 600, y: 500 } },
    { a: { x: 200, y: 0 }, b: { x: 200, y: 100 }, hidden: true },
  ]

  it('returns the min distance over every segment in the set, not just the first', () => {
    // (550, 490) is close to the second segment, far from the first — a naive "first segment
    // only" distance would be huge; the real min must come from segment 2.
    expect(nearestRoadDist(roads, 550, 490)).toBeCloseTo(10)
  })
  it('ignores hidden segments when not revealed', () => {
    // (200, 50) sits exactly ON the hidden vertical segment — should NOT count as ~0 while
    // unrevealed; the nearest visible segment is the first spine segment, ~112 away.
    expect(nearestRoadDist(roads, 200, 50, false)).toBeGreaterThan(50)
  })
  it('includes hidden segments once revealed', () => {
    expect(nearestRoadDist(roads, 200, 50, true)).toBeCloseTo(0)
  })
  it('defaults to an empty segment set (Infinity distance) when roads is omitted', () => {
    expect(nearestRoadDist(undefined, 0, 0)).toBe(Infinity)
  })
})

describe('visibleTileRange', () => {
  it('covers the viewport plus a one-tile margin on each side', () => {
    const r = visibleTileRange({ x: 64, y: 64 }, 320, 320, 32)
    expect(r.x0).toBe(1)
    expect(r.y0).toBe(1)
    expect(r.x1).toBe(13)
    expect(r.y1).toBe(13)
  })
})

describe('eraLabel', () => {
  it('returns the bilingual BIOMES label for a known biome', () => {
    expect(eraLabel('pradera', 'en')).toBe('Java / JEE Legacy')
    expect(eraLabel('castillo', 'es')).toBe('Claude Code / IA')
  })
  it('falls back to a farm label instead of throwing — the player spawns on the farm anchor, which has no BIOMES entry', () => {
    expect(eraLabel('farm', 'en')).toBe('The Farm')
    expect(eraLabel('farm', 'es')).toBe('La Granja')
  })
  it('never throws for an unknown biome id', () => {
    expect(() => eraLabel('nonexistent', 'en')).not.toThrow()
    expect(eraLabel('nonexistent', 'en')).toBe('nonexistent')
  })
})

describe('drawAuthoredTiles', () => {
  const fakeCtx = () => ({ canvas: { width: 64, height: 64 } })
  const fakeSprites = calls => ({
    draw: (ctx, name, x, y, w, h) => calls.push({ name, x, y, w, h }),
  })
  const authored = [
    { name: 'suelo', cells: new Map([['0,0', 'am_grass_0_0'], ['50,50', 'am_far_0_0']]) },
    { name: 'detalle', cells: new Map([['0,0', 'am_flower_0_0']]) },
  ]

  it('draws only cells inside the visible tile range', () => {
    const calls = []
    drawAuthoredTiles(fakeCtx(), { authored }, { x: 0, y: 0 }, fakeSprites(calls))
    expect(calls.map(c => c.name)).not.toContain('am_far_0_0')
  })
  it('draws layers in order so later layers land on top', () => {
    const calls = []
    drawAuthoredTiles(fakeCtx(), { authored }, { x: 0, y: 0 }, fakeSprites(calls))
    expect(calls.map(c => c.name)).toEqual(['am_grass_0_0', 'am_flower_0_0'])
  })
  it('positions a cell at tile coords minus the camera', () => {
    const calls = []
    drawAuthoredTiles(fakeCtx(), { authored }, { x: 10, y: 4 }, fakeSprites(calls))
    expect(calls[0]).toMatchObject({ x: -10, y: -4, w: 32, h: 32 })
  })
  it('does nothing when there is no authored map', () => {
    const calls = []
    drawAuthoredTiles(fakeCtx(), {}, { x: 0, y: 0 }, fakeSprites(calls))
    expect(calls).toEqual([])
  })
  it('washes a painted cell once with the era tint, not once per layer', () => {
    const fills = []
    const ctx = {
      canvas: { width: 64, height: 64 },
      save: () => {}, restore: () => {},
      fillRect: (x, y) => fills.push([x, y]),
      set fillStyle(v) { this._f = v },
      set globalAlpha(v) { this._a = v },
    }
    const world = { regions: [{ bi: 'cyber', x: 0, y: 0 }], farm: { x: 0, y: 0 } }
    drawAuthoredTiles(ctx, { authored, world }, { x: 0, y: 0 }, fakeSprites([]))
    expect(fills.filter(([x, y]) => x === 0 && y === 0)).toHaveLength(1)
  })
})

describe('drawTransformed', () => {
  const recorder = () => {
    const ops = []
    const ctx = {
      canvas: { width: 64, height: 64 },
      save: () => ops.push(['save']),
      restore: () => ops.push(['restore']),
      translate: (x, y) => ops.push(['translate', x, y]),
      rotate: r => ops.push(['rotate', r]),
      scale: (x, y) => ops.push(['scale', x, y]),
    }
    return { ctx, ops }
  }
  const sprites = ops => ({
    frame: () => ({ w: 32, h: 48 }),
    draw: (ctx, name, x, y, w, h) => ops.push(['draw', name, x, y, w, h]),
  })

  it('draws an untransformed placement with no canvas state changes', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 100, y: 200 }, { x: 0, y: 0 })
    expect(ops).toEqual([['draw', 'f', 84, 152, 32, 48]])
  })
  it('offsets by the camera', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 100, y: 200 }, { x: 10, y: 20 })
    expect(ops).toEqual([['draw', 'f', 74, 132, 32, 48]])
  })
  it('mirrors horizontally around the bottom-centre anchor for flipX', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 100, y: 200, flipX: true }, { x: 0, y: 0 })
    expect(ops[0]).toEqual(['save'])
    expect(ops).toContainEqual(['translate', 100, 200])
    expect(ops).toContainEqual(['scale', -1, 1])
    expect(ops[ops.length - 1]).toEqual(['restore'])
  })
  it('rotates in degrees clockwise about the anchor', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 0, y: 0, rot: 90 }, { x: 0, y: 0 })
    expect(ops).toContainEqual(['rotate', Math.PI / 2])
  })
  it('applies uniform scale', () => {
    const { ctx, ops } = recorder()
    drawTransformed(ctx, sprites(ops), { frame: 'f', x: 0, y: 0, scale: 2 }, { x: 0, y: 0 })
    expect(ops).toContainEqual(['scale', 2, 2])
  })
})

// An authored house is a placed object: the placements pass draws its sprite, so the building
// renderer must not draw a second one over it (docs/adr/0001). The label is the site's, not the
// sprite's, so it survives either way.
describe('buildingDrawable', () => {
  const fakeCtx = () => ({ fillStyle: '', font: '', fillText() {} })
  const fakeSprites = () => { const calls = []; return { calls, draw: (...a) => calls.push(a) } }
  const site = (over = {}) => ({ cx: 100, cy: 200, w: 60, h: 80, co: 'Soldife', building: 'house', ...over })

  it('draws the building sprite for a generated house', () => {
    const sprites = fakeSprites()
    buildingDrawable(site(), { x: 0, y: 0 }).draw(fakeCtx(), sprites)
    expect(sprites.calls).toHaveLength(1)
    expect(sprites.calls[0][1]).toBe('house')
  })

  it('draws no sprite for an authored one', () => {
    const sprites = fakeSprites()
    buildingDrawable(site({ building: null, authored: true }), { x: 0, y: 0 }).draw(fakeCtx(), sprites)
    expect(sprites.calls).toEqual([])
  })

  it('still labels the authored one', () => {
    const labels = []
    const ctx = { fillStyle: '', font: '', fillText: t => labels.push(t) }
    buildingDrawable(site({ building: null, authored: true }), { x: 0, y: 0 }).draw(ctx, fakeSprites())
    expect(labels).toContain('Soldife')
  })

  // The depth sort is what makes a house occlude what stands behind it. An authored house takes part
  // in it like any other, or it would draw flat against the world.
  it('reports the same ground contact either way', () => {
    expect(buildingDrawable(site({ building: null }), { x: 0, y: 0 }).baseY)
      .toBe(buildingDrawable(site(), { x: 0, y: 0 }).baseY)
  })
})
