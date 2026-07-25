import { describe, it, expect, vi } from 'vitest'
import { createAudio, initAudio, sfx, setMuted } from './sfx.js'

describe('sfx', () => {
  it('is a no-op before init and when muted, and never throws', () => {
    const a = createAudio()
    expect(() => sfx(a, 'jump')).not.toThrow()   // no ctx yet
    setMuted(a, true)
    expect(a.muted).toBe(true)
    expect(() => sfx(a, 'coin')).not.toThrow()
  })
  it('creates an AudioContext on init when available', () => {
    const start = vi.fn(), stop = vi.fn()
    const osc = { type:'', frequency:{ value:0, exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), start, stop }
    const gain = { gain:{ value:0, exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }
    global.AudioContext = vi.fn(function AudioContext() { return { currentTime:0, destination:{}, createOscillator:()=>osc, createGain:()=>gain } })
    const a = createAudio(); initAudio(a); sfx(a, 'jump')
    expect(a.ctx).toBeTruthy(); expect(start).toHaveBeenCalled()
    delete global.AudioContext
  })
})
