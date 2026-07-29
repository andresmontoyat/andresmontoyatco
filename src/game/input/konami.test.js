import { describe, it, expect } from 'vitest'
import { createKonami, KONAMI } from './konami.js'

describe('createKonami', () => {
  it('returns true only when the full sequence completes', () => {
    const k = createKonami()
    let matched = false
    KONAMI.forEach((key, i) => { matched = k.push(key); if (i < KONAMI.length - 1) expect(matched).toBe(false) })
    expect(matched).toBe(true)
  })
  it('tolerates wrong keys and re-syncs on the rolling buffer', () => {
    const k = createKonami()
    k.push('x'); k.push('z')
    let matched = false
    KONAMI.forEach((key) => { matched = k.push(key) })
    expect(matched).toBe(true)
  })
  it('lower-cases letter keys', () => {
    const k = createKonami(['a'])
    expect(k.push('A')).toBe(true)
  })
})
