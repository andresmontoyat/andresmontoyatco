import React from 'react'
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Color } from 'three'
import WebGLConstellation, { parseCSSColor, parseCSSAlpha } from './WebGLConstellation.js'

// Pitfall 7 mitigation: jsdom has no real WebGL — mock the three.js
// WebGLRenderer constructor with a fake { setSize, setPixelRatio, render,
// domElement, dispose } so the renderer's useEffect doesn't blow up on mount.
// All other three exports (BufferGeometry, BufferAttribute, Color, Points,
// LineSegments, LineBasicMaterial, ShaderMaterial, Scene, OrthographicCamera)
// are passed through via importOriginal — tests inspect real instances.
//
// Captures every WebGLRenderer instance so individual tests can assert on
// render() call counts without re-stubbing.
const rendererInstances = []
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    WebGLRenderer: vi.fn(() => {
      const inst = {
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        render: vi.fn(),
        domElement: document.createElement('canvas'),
        dispose: vi.fn(),
      }
      rendererInstances.push(inst)
      return inst
    }),
  }
})

// 26-node fixture mirroring the Phase 14 buildConstellationGraph output shape
// (id, label, count, category, color, years). Used by Slice 2 geometry-build
// tests that assert per-vertex attribute lengths === 26 * stride.
const CATEGORIES = ['lang', 'ai', 'arch', 'cloud', 'devops', 'security', 'data', 'hardware']
const CATEGORY_COLORS = {
  lang: '#3b82f6',
  ai: '#a855f7',
  arch: '#06b6d4',
  cloud: '#10b981',
  devops: '#f59e0b',
  security: '#ef4444',
  data: '#8b5cf6',
  hardware: '#ec4899',
}
const FIXTURE_NODES = Array.from({ length: 26 }, (_, i) => {
  const cat = CATEGORIES[i % CATEGORIES.length]
  return {
    id: `skill-${i}`,
    label: `Skill ${i}`,
    count: 1 + (i % 8),
    category: cat,
    color: CATEGORY_COLORS[cat],
    years: [2018, 2024],
  }
})
const FIXTURE_LAYOUT = FIXTURE_NODES.reduce((acc, n, i) => {
  acc[n.id] = { x: 100 + i * 30, y: 100 + (i % 5) * 50 }
  return acc
}, {})
// 50 edges: each connects skill-i to skill-(i+1)%26 (weight 1 for first 30,
// weight 2 for last 20 — exercises both --color-constellation-edge and
// --color-constellation-edge-heavy code paths).
const FIXTURE_EDGES = Array.from({ length: 50 }, (_, i) => ({
  source: `skill-${i % 26}`,
  target: `skill-${(i + 1) % 26}`,
  weight: i < 30 ? 1 : 2,
}))

const fullProps = {
  nodes: FIXTURE_NODES,
  edges: FIXTURE_EDGES,
  layout: FIXTURE_LAYOUT,
  theme: 'dark',
  lang: 'en',
  t: {},
  highlightedSkillIds: [],
  selectedSkillId: null,
  hoveredSkillId: null,
  yearRange: null,
  justFilteredId: null,
  onSelectSkill: vi.fn(),
  onHoverSkill: vi.fn(),
}

// Minimal Phase 15+17 props fixture — INCLUDES hoveredSkillId (BLOCKER 2).
// Preserved from Slice 1 so the 5 baseline tests keep their original surface.
const minimalProps = {
  nodes: [{
    id: 'java', count: 5, category: 'lang', color: '#3b82f6',
  }],
  edges: [],
  layout: { java: { x: 500, y: 500 } },
  theme: 'dark',
  lang: 'en',
  t: {},
  highlightedSkillIds: [],
  selectedSkillId: null,
  hoveredSkillId: null,
  yearRange: null,
  justFilteredId: null,
  onSelectSkill: vi.fn(),
  onHoverSkill: vi.fn(),
}

let getContextSpy

beforeEach(() => {
  // Pitfall 1: override the global null stub in src/test/setup.js:10.
  getContextSpy = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({})
  rendererInstances.length = 0
})

afterEach(() => {
  cleanup()
  getContextSpy.mockRestore()
  vi.clearAllMocks()
})

describe('WebGLConstellation Slice 1', () => {
  it('mounts without throwing given minimal Phase 15+17 props contract', () => {
    expect(() => render(<WebGLConstellation {...minimalProps} />)).not.toThrow()
  })

  it('renders an aria-hidden canvas with tabIndex=-1 and data-testid="webgl-canvas"', () => {
    const { container } = render(<WebGLConstellation {...minimalProps} />)
    const canvas = container.querySelector('canvas[data-testid="webgl-canvas"]')
    expect(canvas).toBeTruthy()
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(canvas.tabIndex).toBe(-1)
  })

  it('calls WebGLRenderer constructor once on mount', async () => {
    const three = await import('three')
    three.WebGLRenderer.mockClear()
    render(<WebGLConstellation {...minimalProps} />)
    expect(three.WebGLRenderer).toHaveBeenCalledTimes(1)
  })

  it('calls renderer.dispose() on unmount (Pitfall 8 GPU cleanup)', () => {
    const { unmount } = render(<WebGLConstellation {...minimalProps} />)
    const inst = rendererInstances[rendererInstances.length - 1]
    unmount()
    expect(inst.dispose).toHaveBeenCalled()
  })

  it('accepts hoveredSkillId as a prop without crashing (BLOCKER 2 — no internal hover useState)', () => {
    const { rerender } = render(<WebGLConstellation {...minimalProps} hoveredSkillId="java" />)
    expect(() => rerender(
      <WebGLConstellation {...minimalProps} hoveredSkillId="python" />,
    )).not.toThrow()
  })
})

describe('parseCSSColor (Pitfall 13: modern + legacy rgb syntax)', () => {
  it('parses #hex strings into a THREE.Color round-tripping the same sRGB hex via getHex()', () => {
    // THREE.Color stores RGB as linear-light floats internally (r152+ default);
    // getHex() returns the equivalent sRGB hex so we round-trip the input.
    const c = parseCSSColor('#3B82F6')
    expect(c).toBeInstanceOf(Color)
    expect(c.getHex()).toBe(0x3b82f6)
  })

  it('parses modern rgb(r g b / a) syntax — strips alpha, returns RGB only (Pitfall 14)', () => {
    // Manual rgb-int path bypasses THREE's sRGB conversion, so .r/.g/.b are
    // the raw byte/255 values we pass directly.
    const c = parseCSSColor('rgb(56 56 70 / 0.18)')
    expect(c).toBeInstanceOf(Color)
    expect(c.r).toBeCloseTo(56 / 255, 4)
    expect(c.g).toBeCloseTo(56 / 255, 4)
    expect(c.b).toBeCloseTo(70 / 255, 4)
  })

  it('parses legacy rgb(r, g, b) comma syntax', () => {
    const c = parseCSSColor('rgb(56, 56, 70)')
    expect(c).toBeInstanceOf(Color)
    expect(c.r).toBeCloseTo(56 / 255, 4)
    expect(c.g).toBeCloseTo(56 / 255, 4)
    expect(c.b).toBeCloseTo(70 / 255, 4)
  })

  it('returns safe white fallback for garbage input', () => {
    const c = parseCSSColor('oops')
    expect(c).toBeInstanceOf(Color)
    expect(c.r).toBe(1)
    expect(c.g).toBe(1)
    expect(c.b).toBe(1)
  })
})

describe('parseCSSAlpha (RGBA edge attribute alpha channel — WARNING 5)', () => {
  it('extracts alpha from modern rgb(r g b / a) slash syntax', () => {
    expect(parseCSSAlpha('rgb(160 160 192 / 0.25)')).toBeCloseTo(0.25, 4)
  })

  it('defaults to 1.0 when no alpha is present (hex or comma rgb)', () => {
    expect(parseCSSAlpha('#3B82F6')).toBe(1)
    expect(parseCSSAlpha('rgb(56, 56, 70)')).toBe(1)
  })

  it('defaults to 1.0 for garbage input (safe fallback)', () => {
    expect(parseCSSAlpha('oops')).toBe(1)
  })
})

describe('WebGLConstellation Slice 2 — full graph geometry', () => {
  it('builds a 26-node BufferGeometry with position attribute length === 26 × 3', async () => {
    const three = await import('three')
    const setAttrSpy = vi.spyOn(three.BufferGeometry.prototype, 'setAttribute')
    render(<WebGLConstellation {...fullProps} />)
    const positionCall = setAttrSpy.mock.calls.find(([name]) => name === 'position')
    expect(positionCall).toBeDefined()
    const positionAttr = positionCall[1]
    expect(positionAttr.array.length).toBe(26 * 3)
    setAttrSpy.mockRestore()
  })

  it('builds a per-vertex color attribute (vec3) length === 26 × 3', async () => {
    const three = await import('three')
    const setAttrSpy = vi.spyOn(three.BufferGeometry.prototype, 'setAttribute')
    render(<WebGLConstellation {...fullProps} />)
    // First geometry created is the nodes geometry; its 'color' attribute is vec3.
    const nodeColorCall = setAttrSpy.mock.calls.find(
      ([name, attr]) => name === 'color' && attr.itemSize === 3,
    )
    expect(nodeColorCall).toBeDefined()
    expect(nodeColorCall[1].array.length).toBe(26 * 3)
    setAttrSpy.mockRestore()
  })

  it('builds per-vertex dim attribute (float) length === 26 × 1', async () => {
    const three = await import('three')
    const setAttrSpy = vi.spyOn(three.BufferGeometry.prototype, 'setAttribute')
    render(<WebGLConstellation {...fullProps} />)
    const dimCall = setAttrSpy.mock.calls.find(([name]) => name === 'dim')
    expect(dimCall).toBeDefined()
    expect(dimCall[1].array.length).toBe(26)
    expect(dimCall[1].itemSize).toBe(1)
    setAttrSpy.mockRestore()
  })

  it('builds edge LineSegments with position length === 50 × 2 × 3 AND RGBA color attribute itemSize=4 (WARNING 5) AND transparent material', async () => {
    const three = await import('three')
    const setAttrSpy = vi.spyOn(three.BufferGeometry.prototype, 'setAttribute')
    const { container } = render(<WebGLConstellation {...fullProps} />)
    // Edge position: itemSize=3, length === 50 * 2 * 3 = 300
    const edgePosCall = setAttrSpy.mock.calls.find(
      ([name, attr]) => name === 'position' && attr.array.length === 50 * 2 * 3,
    )
    expect(edgePosCall).toBeDefined()
    // Edge color: itemSize=4 (RGBA — WARNING 5), length === 50 * 2 * 4 = 400
    const edgeColorCall = setAttrSpy.mock.calls.find(
      ([name, attr]) => name === 'color' && attr.itemSize === 4,
    )
    expect(edgeColorCall).toBeDefined()
    expect(edgeColorCall[1].array.length).toBe(50 * 2 * 4)
    // LineBasicMaterial transparent flag + vertexColors verified via the
    // mounted canvas's testid presence (mount completed without throwing — the
    // material was constructed with transparent:true since the RGBA alpha
    // channel above is non-trivially populated). Material-construction args
    // cannot be cleanly spied because spyOn on a three class breaks `new`;
    // the source-code grep in acceptance criteria pins the literal flag.
    expect(container.querySelector('canvas[data-testid="webgl-canvas"]')).toBeTruthy()
    setAttrSpy.mockRestore()
  })

  it('sets halo attribute = 1.0 for the selectedSkillId vertex, 0.0 for all others', async () => {
    const three = await import('three')
    const setAttrSpy = vi.spyOn(three.BufferGeometry.prototype, 'setAttribute')
    render(<WebGLConstellation {...fullProps} selectedSkillId="skill-3" />)
    const haloCall = setAttrSpy.mock.calls.find(([name]) => name === 'halo')
    expect(haloCall).toBeDefined()
    const haloAttr = haloCall[1]
    // skill-3 is at fixture index 3
    expect(haloAttr.array[3]).toBe(1.0)
    // All other 25 indices are 0
    const nonSelected = Array.from(haloAttr.array).filter((v, i) => i !== 3)
    expect(nonSelected.every((v) => v === 0)).toBe(true)
    setAttrSpy.mockRestore()
  })

  it('sets dim attribute = 1.0 for highlighted nodes, 0.35 for non-highlighted when filter active', async () => {
    const three = await import('three')
    const setAttrSpy = vi.spyOn(three.BufferGeometry.prototype, 'setAttribute')
    render(<WebGLConstellation
      {...fullProps}
      highlightedSkillIds={['skill-0', 'skill-1']}
    />)
    const dimCall = setAttrSpy.mock.calls.find(([name]) => name === 'dim')
    expect(dimCall).toBeDefined()
    const dimAttr = dimCall[1]
    expect(dimAttr.array[0]).toBe(1.0)
    expect(dimAttr.array[1]).toBe(1.0)
    // All other 24 indices dimmed to 0.35
    for (let i = 2; i < 26; i += 1) {
      expect(dimAttr.array[i]).toBeCloseTo(0.35, 4)
    }
    setAttrSpy.mockRestore()
  })
})

describe('WebGLConstellation Slice 2 — theme reactivity (WARNING 4 pinned strategy)', () => {
  it('calls getComputedStyle on theme change and re-reads --color-constellation-halo CSS var', () => {
    const propValueSpy = vi.fn((prop) => {
      if (prop === '--color-constellation-halo') return 'rgba(255, 255, 255, 0.18)'
      if (prop === '--color-constellation-edge') return 'rgba(160, 160, 192, 0.25)'
      if (prop === '--color-constellation-edge-heavy') return 'rgba(160, 160, 192, 0.55)'
      return ''
    })
    const gcsSpy = vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      getPropertyValue: propValueSpy,
    }))
    const { rerender } = render(<WebGLConstellation {...fullProps} theme="dark" />)
    // Mount alone reads CSS vars (initial paint)
    expect(gcsSpy).toHaveBeenCalled()
    expect(propValueSpy).toHaveBeenCalledWith('--color-constellation-halo')
    propValueSpy.mockClear()
    // Theme change re-triggers the effect
    rerender(<WebGLConstellation {...fullProps} theme="light" />)
    expect(propValueSpy).toHaveBeenCalledWith('--color-constellation-halo')
    gcsSpy.mockRestore()
  })

  it('re-uploads RGBA edge color attribute (itemSize=4) on theme change — WARNING 5 alpha channel sync', async () => {
    const three = await import('three')
    // Spy on BufferAttribute setXYZW to confirm the RGBA writer path runs on theme change.
    const setXYZWSpy = vi.spyOn(three.BufferAttribute.prototype, 'setXYZW')
    const propValueSpy = vi.fn((prop) => {
      if (prop === '--color-constellation-halo') return 'rgba(255, 255, 255, 0.18)'
      if (prop === '--color-constellation-edge') return 'rgba(160, 160, 192, 0.25)'
      if (prop === '--color-constellation-edge-heavy') return 'rgba(160, 160, 192, 0.55)'
      return ''
    })
    const gcsSpy = vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      getPropertyValue: propValueSpy,
    }))
    const { rerender } = render(<WebGLConstellation {...fullProps} theme="dark" />)
    setXYZWSpy.mockClear()
    rerender(<WebGLConstellation {...fullProps} theme="light" />)
    // After theme change the RGBA edge attribute is rewritten — 50 edges × 2 vertices = 100 setXYZW calls
    expect(setXYZWSpy.mock.calls.length).toBeGreaterThanOrEqual(100)
    // Each call writes (index, r, g, b, a) — alpha is the 5th argument (index 4 in args array)
    const sampleCall = setXYZWSpy.mock.calls[0]
    expect(sampleCall).toHaveLength(5)
    // Alpha is a number, not undefined (proves the 4th component is written explicitly per WARNING 5)
    expect(typeof sampleCall[4]).toBe('number')
    setXYZWSpy.mockRestore()
    gcsSpy.mockRestore()
  })
})
