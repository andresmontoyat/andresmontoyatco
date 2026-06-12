import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import { randomBytes } from 'node:crypto'
import checkBundleGate, {
  MOBILE_CHUNK_PATTERN,
  MOBILE_WARN_KB,
  MOBILE_HARD_KB,
} from './check-bundle-gate.mjs'

describe('check-bundle-gate exports', () => {
  it('MOBILE_CHUNK_PATTERN exists and matches index-*.js', () => {
    expect(MOBILE_CHUNK_PATTERN).toBeInstanceOf(RegExp)
    expect(MOBILE_CHUNK_PATTERN.test('index-AbCdEf12.js')).toBe(true)
    expect(MOBILE_CHUNK_PATTERN.test('vendor-AbCdEf12.js')).toBe(false)
  })

  it('MOBILE_WARN_KB is the v4.0 Slice 1 re-baseline value (60)', () => {
    expect(typeof MOBILE_WARN_KB).toBe('number')
    expect(MOBILE_WARN_KB).toBe(60)
  })

  it('MOBILE_HARD_KB is the v4.0 Slice 1 re-baseline value (68)', () => {
    expect(typeof MOBILE_HARD_KB).toBe('number')
    expect(MOBILE_HARD_KB).toBe(68)
  })
})

describe('check-bundle-gate logic', () => {
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

  it('PASSES when index chunk is under WARN threshold', async () => {
    readdirSpy.mockReturnValue(['index-AbCdEf12.js'])
    // Small synthetic content gzips to ~few bytes — safely under 60 kB
    readFileSpy.mockReturnValue(Buffer.from('export const a = 1'))
    const result = await checkBundleGate()
    expect(result).toMatchObject({ mobile: { name: expect.stringMatching(/^index-/) } })
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('bundle-gate OK'))
  })

  it('WARNS (but does not throw) when gz > WARN and <= HARD', async () => {
    readdirSpy.mockReturnValue(['index-AbCdEf12.js'])
    // 65 kB random bytes -> ~65 kB gz (random defeats compression) — in WARN band [60, 68]
    readFileSpy.mockReturnValue(randomBytes(65_000))
    const result = await checkBundleGate()
    expect(result).toMatchObject({ mobile: { name: 'index-AbCdEf12.js' } })
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'))
  })

  it('HARD FAILS (throws) when gz > HARD threshold (WARNING: random bytes defeats gzip RLE)', async () => {
    readdirSpy.mockReturnValue(['index-AbCdEf12.js'])
    // 80 kB random bytes -> ~80 kB gz — safely > 68 kB HARD ceiling
    readFileSpy.mockReturnValue(randomBytes(80_000))
    await expect(checkBundleGate()).rejects.toThrow(/HARD FAIL.*kB/)
  })

  it('HARD FAILS when no index-*.js chunk found', async () => {
    readdirSpy.mockReturnValue([])
    await expect(checkBundleGate()).rejects.toThrow(/no chunk matching/)
  })

  it('ignores non-js files when scanning dist/assets', async () => {
    readdirSpy.mockReturnValue(['index-AbCdEf12.js', 'index-AbCdEf12.css', 'index-AbCdEf12.js.map'])
    readFileSpy.mockReturnValue(Buffer.from('tiny'))
    const result = await checkBundleGate()
    expect(result.mobile.name).toBe('index-AbCdEf12.js')
  })
})
