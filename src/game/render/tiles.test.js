import { describe, it, expect } from 'vitest'
import {
  nearestBiome, tileNameFor, walkFrame, pathTileName, avatarFrame, AVATAR_LAYERS,
} from './tiles.js'

const regions = [{ bi: 'pradera', x: 0, y: 0 }, { bi: 'cyber', x: 1000, y: 0 }]

describe('nearestBiome', () => {
  it('returns the closest region biome', () => {
    expect(nearestBiome(regions, 10, 0)).toBe('pradera')
    expect(nearestBiome(regions, 990, 0)).toBe('cyber')
  })
})

describe('tileNameFor', () => {
  it('returns a path tile near the path', () => {
    expect(tileNameFor('pradera', 0, 0, 10)).toBe('path')
  })
  it('returns a biome ground tile off the path', () => {
    expect(tileNameFor('cyber', 0, 0, 200)).toBe('ground_cyber')
  })
  it('is deterministic — the same tile coord always returns the same variant', () => {
    expect(tileNameFor('pradera', 500, 900, 200)).toBe(tileNameFor('pradera', 500, 900, 200))
  })
  it('scatters more than one ground variant across nearby tiles', () => {
    const names = new Set()
    for (let tx = 0; tx < 12; tx += 1) names.add(tileNameFor('pradera', tx * 32 + 16, 16, 200))
    expect(names.size).toBeGreaterThan(1)
    names.forEach(n => expect(n.startsWith('ground_pradera')).toBe(true))
  })
  it('gives the farm ground a grass frame instead of the old tilled-dirt frame', () => {
    expect(tileNameFor('farm', 0, 0, 200)).toBe('ground_farm')
  })
  it('scatters 3 sand variants across nearby desert tiles', () => {
    const names = new Set()
    for (let tx = 0; tx < 12; tx += 1) names.add(tileNameFor('desierto', tx * 32 + 16, 16, 200))
    expect(names.size).toBeGreaterThan(1)
  })
  it('biases pradera/farm toward the base tile so accents read as occasional, not 50/50', () => {
    const counts = {}
    for (let tx = 0; tx < 240; tx += 1) {
      const name = tileNameFor('pradera', tx * 32 + 16, 5000, 200)
      counts[name] = (counts[name] || 0) + 1
    }
    expect(counts.ground_pradera).toBeGreaterThan((counts.ground_pradera_2 || 0) * 1.5)
    expect(counts.ground_pradera).toBeGreaterThan((counts.ground_pradera_3 || 0) * 1.5)
  })
})

describe('pathTileName', () => {
  it('picks the solid center when all 4 neighbors are on path', () => {
    expect(pathTileName(true, true, true, true)).toBe('path_center')
  })
  it('picks a straight edge when exactly one neighbor is off path', () => {
    expect(pathTileName(false, true, true, true)).toBe('path_n')
    expect(pathTileName(true, true, false, true)).toBe('path_s')
    expect(pathTileName(true, true, true, false)).toBe('path_w')
    expect(pathTileName(true, false, true, true)).toBe('path_e')
  })
  it('picks an outer corner when two ADJACENT neighbors are off path', () => {
    expect(pathTileName(false, true, true, false)).toBe('path_nw')
    expect(pathTileName(false, false, true, true)).toBe('path_ne')
    expect(pathTileName(true, true, false, false)).toBe('path_sw')
    expect(pathTileName(true, false, false, true)).toBe('path_se')
  })
  it('falls back to center for shapes a 9-cell autotile cannot represent', () => {
    // Two OPPOSITE sides off path (an isolated one-tile sliver) — no single matching cell.
    expect(pathTileName(false, true, false, true)).toBe('path_center')
    expect(pathTileName(true, false, true, false)).toBe('path_center')
    // 3+ sides off path (a lone tip) — same fallback.
    expect(pathTileName(false, false, false, true)).toBe('path_center')
    expect(pathTileName(false, false, false, false)).toBe('path_center')
  })
})

describe('walkFrame', () => {
  it('cycles 3 frames per direction', () => {
    expect(walkFrame('down', 0)).toBe('carlos_down_0')
    expect(walkFrame('left', 5)).toBe(`carlos_left_${5 % 3}`)
  })
})

describe('avatarFrame', () => {
  it('names a frame per layer, direction and 3-step cycle', () => {
    expect(avatarFrame('helm', 'up', 4)).toBe('helm_up_1')
    expect(avatarFrame('carlos', 'down', 0)).toBe('carlos_down_0')
  })

  it('layers the bare base below the three armor pieces, top piece last', () => {
    expect(AVATAR_LAYERS).toEqual(['carlos', 'legs', 'chest', 'helm'])
  })
})
