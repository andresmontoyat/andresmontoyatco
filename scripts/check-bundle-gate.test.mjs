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

  it('PASSES when main chunk is small + has no three.js', async () => {
    readdirSpy.mockReturnValue(['index-Abc.js', 'WebGLWorldMap-Xyz.js'])
    readFileSpy.mockReturnValue(Buffer.from('export const a = 1'))
    await expect(checkBundleGate()).resolves.toMatchObject({
      mobile: { name: expect.stringMatching(/index/) },
    })
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('PASS'))
  })

  it('HARD FAILS when three.js appears in main chunk', async () => {
    readdirSpy.mockReturnValue(['index-Abc.js'])
    readFileSpy.mockReturnValue(Buffer.from('import { Scene } from"three"'))
    await expect(checkBundleGate()).rejects.toThrow(/three\.js/)
  })

  it('HARD FAILS when main gz > 90 kB (Phase 22 re-baselined ceiling)', async () => {
    readdirSpy.mockReturnValue(['index-Abc.js', 'WebGLWorldMap-Xyz.js'])
    // 100 kB random bytes -> ~100 kB gz (random content gzips near-identity).
    // Safely > 90 kB ceiling. If 'x'.repeat(N) were used, gz would compress to ~few kB
    // and this test would NEVER trip the HARD band — WARNING 3 fix mandates random fixtures.
    readFileSpy.mockReturnValue(randomBytes(100_000))
    await expect(checkBundleGate()).rejects.toThrow(/HARD FAIL.*kB/)
  })

  it('WARNS when main chunk in 50-90 kB band (Phase 22 re-baselined ceiling)', async () => {
    readdirSpy.mockReturnValue(['index-Abc.js', 'WebGLWorldMap-Xyz.js'])
    // 70 kB random bytes -> ~70 kB gz -> lands in WARN band [50, 90]
    readFileSpy.mockReturnValue(randomBytes(70_000))
    await checkBundleGate()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'))
  })

  it('WARNS when WebGLWorldMap chunk missing (three.js leak risk)', async () => {
    readdirSpy.mockReturnValue(['index-Abc.js'])
    readFileSpy.mockReturnValue(Buffer.from('clean tiny content'))
    await checkBundleGate()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('WebGLWorldMap chunk not found'),
    )
  })

  it('HARD FAILS when main entry chunk not found', async () => {
    readdirSpy.mockReturnValue([])
    await expect(checkBundleGate()).rejects.toThrow(/main entry chunk.*not found/)
  })
})
