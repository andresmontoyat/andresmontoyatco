import { describe, it, expect } from 'vitest'
import { THREE_JS_PATTERN } from '../../scripts/check-bundle-gate.mjs'

describe('check-bundle-gate THREE_JS_PATTERN (CRIT-03 regex widening)', () => {
  it('matches the literal import `from \'three\'` (existing behavior preserved)', () => {
    expect(THREE_JS_PATTERN.test("from 'three'")).toBe(true)
  })

  it('matches `from \'three/addons/controls/OrbitControls.js\'` (NEW — CRIT-03 fix)', () => {
    expect(THREE_JS_PATTERN.test("from 'three/addons/controls/OrbitControls.js'")).toBe(true)
  })

  it('matches `from \'three/examples/jsm/controls/OrbitControls.js\'` (NEW — defensive legacy alias)', () => {
    expect(THREE_JS_PATTERN.test("from 'three/examples/jsm/controls/OrbitControls.js'")).toBe(true)
  })

  it('matches `THREE.PerspectiveCamera` (existing namespace alternation preserved)', () => {
    expect(THREE_JS_PATTERN.test('THREE.PerspectiveCamera')).toBe(true)
  })

  it('does NOT match unrelated source (`from \'react\'`, `const x = 1`)', () => {
    expect(THREE_JS_PATTERN.test("from 'react'")).toBe(false)
    expect(THREE_JS_PATTERN.test('const x = 1')).toBe(false)
  })
})
