import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import { randomBytes } from 'node:crypto'
import checkBundleGate from './check-bundle-gate.mjs'

describe('check-bundle-gate', () => {
  let readdirSpy
  let readFileSpy
  let logSpy
  let warnSpy

  beforeEach(() => {
    readdirSpy = vi.spyOn(fs, 'readdirSync')
    readFileSpy = vi.spyOn(fs, 'readFileSync')
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('PASSES when mobile chunk is small + has no three.js', async () => {
    readdirSpy.mockReturnValue(['GameMode-Abc.js', 'WebGLConstellation-Xyz.js'])
    readFileSpy.mockReturnValue(Buffer.from('export const a = 1'))
    await expect(checkBundleGate()).resolves.toMatchObject({
      mobile: { name: expect.stringMatching(/GameMode/) },
    })
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('PASS'))
  })

  it('HARD FAILS when three.js appears in mobile chunk', async () => {
    readdirSpy.mockReturnValue(['GameMode-Abc.js'])
    readFileSpy.mockReturnValue(Buffer.from('import { Scene } from"three"'))
    await expect(checkBundleGate()).rejects.toThrow(/three\.js/)
  })

  it('HARD FAILS when gz > 38.82 kB (WARNING 3: crypto.randomBytes defeats gzip RLE)', async () => {
    readdirSpy.mockReturnValue(['GameMode-Abc.js', 'WebGLConstellation-Xyz.js'])
    // 80 kB random bytes -> ~80 kB gz (random content gzips near-identity)
    // Safely > 38.82 kB ceiling. If 'x'.repeat(N) were used, gz would compress to ~few kB
    // and this test would NEVER trip the HARD band — WARNING 3 fix mandates random fixtures.
    readFileSpy.mockReturnValue(randomBytes(80_000))
    await expect(checkBundleGate()).rejects.toThrow(/HARD FAIL.*kB/)
  })

  it('WARNS when mobile chunk in 14-38.82 kB band (WARNING 3: random bytes for gz target)', async () => {
    readdirSpy.mockReturnValue(['GameMode-Abc.js', 'WebGLConstellation-Xyz.js'])
    // 30 kB random bytes -> ~30 kB gz -> lands in WARN band [14, 38.82]
    readFileSpy.mockReturnValue(randomBytes(30_000))
    await checkBundleGate()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'))
  })

  it('WARNS when WebGLConstellation chunk missing (three.js leak risk)', async () => {
    readdirSpy.mockReturnValue(['GameMode-Abc.js'])
    readFileSpy.mockReturnValue(Buffer.from('clean tiny content'))
    await checkBundleGate()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('WebGLConstellation chunk not found'),
    )
  })

  it('HARD FAILS when GameMode chunk not found', async () => {
    readdirSpy.mockReturnValue([])
    await expect(checkBundleGate()).rejects.toThrow(/GameMode chunk not found/)
  })
})
