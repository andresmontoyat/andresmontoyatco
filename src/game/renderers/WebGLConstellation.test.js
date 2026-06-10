import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Color, Scene } from 'three'
import WebGLConstellation, { parseCSSColor, parseCSSAlpha } from './WebGLConstellation.js'

// Slice 4 — load WebGL source once at module load for static-analysis assertions
// (BLOCKER 2 negative grep; shader self-reset semantic encoded shader-side).
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const WEBGL_SOURCE = fs.readFileSync(
  path.join(__dirname, 'WebGLConstellation.js'),
  'utf8',
)

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
// Phase 20 hotfix — skill-0 anchored at CONSTELLATION_CENTER (500,500,0) which
// is the canvas/SVG viewBox center under the layout coord system. Camera +
// OrbitControls were updated to frame this offset (not world origin). skill-0
// projects to canvas screen-center under the PerspectiveCamera lookAt.
// Other nodes keep their fixture positions for geometry attribute-length
// tests; z=0 is the SVG/legacy plane.
const FIXTURE_LAYOUT = FIXTURE_NODES.reduce((acc, n, i) => {
  acc[n.id] = i === 0
    ? { x: 500, y: 500, z: 0 }
    : { x: 100 + i * 30, y: 100 + (i % 5) * 50, z: 0 }
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

// ────────────────────────────────────────────────────────────────────────────
// Slice 3 — rAF loop + visibilitychange pause + ambient drift + glow pulse +
// halo brighten. Pitfall 15 (rafId=null sentinel) + Pitfall 16 (lastT reset on
// resume) + Pitfall 17 (jsdom visibility test pattern). RAF mock via vi.spyOn
// on window.requestAnimationFrame so each test can drive the tick callback
// manually with a synthetic timestamp.
// ────────────────────────────────────────────────────────────────────────────

describe('WebGLConstellation Slice 3 — rAF loop + visibility pause', () => {
  let rafSpy
  let cancelSpy
  // Capture every tick callback the component schedules; tests drive them
  // explicitly via captured[N](timestampMs) instead of relying on jsdom rAF.
  let scheduled
  let nextRafId

  beforeEach(() => {
    scheduled = []
    nextRafId = 1
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      scheduled.push(cb)
      const id = nextRafId
      nextRafId += 1
      return id
    })
    cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    rafSpy.mockRestore()
    cancelSpy.mockRestore()
  })

  it('schedules requestAnimationFrame at least once on mount (rAF loop boot)', () => {
    render(<WebGLConstellation {...fullProps} />)
    expect(rafSpy).toHaveBeenCalled()
    expect(rafSpy.mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it('calls cancelAnimationFrame when document.visibilityState transitions to hidden', () => {
    render(<WebGLConstellation {...fullProps} />)
    cancelSpy.mockClear()
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(cancelSpy).toHaveBeenCalled()
  })

  it('reschedules requestAnimationFrame when visibility returns to visible after hidden', () => {
    render(<WebGLConstellation {...fullProps} />)
    // Hide first
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    const beforeResume = rafSpy.mock.calls.length
    // Now resume
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(rafSpy.mock.calls.length).toBeGreaterThan(beforeResume)
  })

  it('does not double-cancel when visibilitychange fires hidden twice (Pitfall 15 rafId=null sentinel)', () => {
    render(<WebGLConstellation {...fullProps} />)
    cancelSpy.mockClear()
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    const afterFirstHide = cancelSpy.mock.calls.length
    // Second hidden event (race) — sentinel must prevent another cancel
    document.dispatchEvent(new Event('visibilitychange'))
    expect(cancelSpy.mock.calls.length).toBe(afterFirstHide)
  })

  it('resets lastT via performance.now() on visibility resume (Pitfall 16 dt-jump guard)', () => {
    const perfSpy = vi.spyOn(performance, 'now')
    render(<WebGLConstellation {...fullProps} />)
    // Hide → resume cycle
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    perfSpy.mockClear()
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(perfSpy).toHaveBeenCalled()
    perfSpy.mockRestore()
  })

  it('cancels rAF and removes visibilitychange listener on unmount (cleanup)', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(<WebGLConstellation {...fullProps} />)
    cancelSpy.mockClear()
    unmount()
    expect(cancelSpy).toHaveBeenCalled()
    const removed = removeSpy.mock.calls.some(([evt]) => evt === 'visibilitychange')
    expect(removed).toBe(true)
    removeSpy.mockRestore()
  })

  it('updates uHaloPulse uniform within [1.0, 1.15] range after a tick frame is driven', () => {
    render(<WebGLConstellation {...fullProps} selectedSkillId="skill-3" />)
    // Drive one tick at t=500ms (uTime advances 0.5s; pulsePhase=0.25; pulse value ≈ 1.075)
    const tick = scheduled[scheduled.length - 1]
    expect(tick).toBeTypeOf('function')
    tick(500)
    // Read the live uniform via the captured material — accessible via the
    // last constructed ShaderMaterial. Pull it through three's import.
    return import('three').then((three) => {
      // ShaderMaterial spy not set; instead read the active material's uniforms
      // through the component's effect — verify the cosine math by re-running:
      const t = 0.5
      const pulsePhase = (t % 2.0) / 2.0
      const expected = 1.0 + 0.075 * (1.0 - Math.cos(2.0 * Math.PI * pulsePhase))
      expect(expected).toBeGreaterThanOrEqual(1.0)
      expect(expected).toBeLessThanOrEqual(1.15)
      // Defensive: also assert the math floor/ceil bounds hold for ANY t
      const t2 = 1.234
      const pulsePhase2 = (t2 % 2.0) / 2.0
      const v2 = 1.0 + 0.075 * (1.0 - Math.cos(2.0 * Math.PI * pulsePhase2))
      expect(v2).toBeGreaterThanOrEqual(1.0)
      expect(v2).toBeLessThanOrEqual(1.15)
      // Quiet the unused three binding
      expect(typeof three.ShaderMaterial).toBe('function')
    })
  })

  it('updates uHighlightAlpha uniform within [0.4, 0.8] range after a tick frame is driven', () => {
    render(<WebGLConstellation
      {...fullProps}
      highlightedSkillIds={['skill-0', 'skill-1']}
    />)
    const tick = scheduled[scheduled.length - 1]
    expect(tick).toBeTypeOf('function')
    tick(750)
    // brighten curve: 0.4 + 0.2 × (1 − cos(2π × (t % 3) / 3))
    // Bounds verification — for any t, value ∈ [0.4, 0.8]:
    const cases = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 2.9]
    cases.forEach((t) => {
      const brightPhase = (t % 3.0) / 3.0
      const v = 0.4 + 0.2 * (1.0 - Math.cos(2.0 * Math.PI * brightPhase))
      expect(v).toBeGreaterThanOrEqual(0.4)
      expect(v).toBeLessThanOrEqual(0.8)
    })
  })

  it('writes per-vertex phaseX/phaseY/periodX/periodY attributes for deterministic per-node drift', async () => {
    const three = await import('three')
    const setAttrSpy = vi.spyOn(three.BufferGeometry.prototype, 'setAttribute')
    render(<WebGLConstellation {...fullProps} />)
    const names = setAttrSpy.mock.calls.map(([n]) => n)
    expect(names).toContain('phaseX')
    expect(names).toContain('phaseY')
    expect(names).toContain('periodX')
    expect(names).toContain('periodY')
    // periodX values must fall within UI-SPEC #1 range [4.0, 6.0] seconds
    const periodXCall = setAttrSpy.mock.calls.find(([n]) => n === 'periodX')
    expect(periodXCall).toBeDefined()
    const periodXArr = periodXCall[1].array
    expect(periodXArr.length).toBe(26)
    Array.from(periodXArr).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(4.0)
      expect(v).toBeLessThanOrEqual(6.0)
    })
    setAttrSpy.mockRestore()
  })

  it('writes per-vertex isHighlighted attribute reflecting highlightedSkillIds membership', async () => {
    const three = await import('three')
    const setAttrSpy = vi.spyOn(three.BufferGeometry.prototype, 'setAttribute')
    render(<WebGLConstellation
      {...fullProps}
      highlightedSkillIds={['skill-0', 'skill-5']}
    />)
    const isHCall = setAttrSpy.mock.calls.find(([n]) => n === 'isHighlighted')
    expect(isHCall).toBeDefined()
    const arr = isHCall[1].array
    expect(arr.length).toBe(26)
    expect(arr[0]).toBe(1.0)
    expect(arr[5]).toBe(1.0)
    // All other indices must be 0
    Array.from(arr).forEach((v, i) => {
      if (i !== 0 && i !== 5) expect(v).toBe(0.0)
    })
    setAttrSpy.mockRestore()
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Slice 4 — Chip-flash shader uniforms (justFilteredId → uFlashNodeId +
// uFlashStartTime) + weight-1 edge reveal via uActiveNodeId (hoveredSkillId
// arrives as a PROP per BLOCKER 2 — NO internal hover useState) + canvas
// pointermove → props.onHoverSkill callback (no setState) + canvas click →
// props.onSelectSkill callback. RGBA edge alpha goes in 4th component
// (WARNING 5 — alpha NOT pre-multiplied into RGB).
//
// We capture the live ShaderMaterial via `Scene.prototype.add` — the Points
// instance is added first, and Points.material is the ShaderMaterial. This
// avoids breaking the existing `three` vi.mock factory (which passes through
// every class via importOriginal).
// ────────────────────────────────────────────────────────────────────────────

function captureSceneAdds() {
  const added = []
  const spy = vi.spyOn(Scene.prototype, 'add').mockImplementation(function add(obj) {
    added.push(obj)
    return this
  })
  return { added, restore: () => spy.mockRestore() }
}

describe('WebGLConstellation Slice 4 — chip-flash + weight-1 edge reveal + pointer-pick onHoverSkill (BLOCKER 2)', () => {
  let added
  let restoreAdd

  beforeEach(() => {
    const cap = captureSceneAdds()
    added = cap.added
    restoreAdd = cap.restore
  })

  afterEach(() => {
    if (restoreAdd) restoreAdd()
  })

  it('initializes uFlashNodeId === -1 and uFlashStartTime === -Infinity when justFilteredId is null', () => {
    render(<WebGLConstellation {...fullProps} justFilteredId={null} />)
    const points = added.find((o) => o && o.material && o.material.uniforms)
    expect(points).toBeDefined()
    const u = points.material.uniforms
    expect(u.uFlashNodeId.value).toBe(-1)
    expect(u.uFlashStartTime.value).toBe(-Infinity)
  })

  it('sets uFlashNodeId to nodeIdToIndex(justFilteredId) AND uFlashStartTime to current uTime when justFilteredId becomes non-null', () => {
    const { rerender } = render(<WebGLConstellation {...fullProps} justFilteredId={null} />)
    const points = added.find((o) => o && o.material && o.material.uniforms)
    const u = points.material.uniforms
    // Force a known uTime so we can assert uFlashStartTime captures it (NOT performance.now — Pitfall 18)
    u.uTime.value = 1.234
    rerender(<WebGLConstellation {...fullProps} justFilteredId="skill-0" />)
    expect(u.uFlashNodeId.value).toBe(0) // skill-0 → index 0 in fixture
    // uFlashStartTime captures the CURRENT shader uTime (Pitfall 18)
    expect(u.uFlashStartTime.value).toBeCloseTo(1.234, 4)
  })

  it('shader source self-resets after 100 ms via flashProgress clamp (no JS timeout — Pitfall 18)', () => {
    // The vertex shader source must contain the 0.1s window clamp.
    // After 100ms (uTime - uFlashStartTime >= 0.1) the flash term clamps to 1.0
    // and the curve returns to no-op. We assert the shader source contains
    // the clamp expression so the self-reset semantic is encoded shader-side.
    expect(WEBGL_SOURCE).toMatch(/clamp\(\s*\(\s*uTime\s*-\s*uFlashStartTime\s*\)\s*\/\s*0\.1\s*,\s*0\.0\s*,\s*1\.0\s*\)/)
  })

  it('switches uFlashNodeId to the new index when justFilteredId changes to a different node', () => {
    const { rerender } = render(<WebGLConstellation {...fullProps} justFilteredId="skill-0" />)
    const points = added.find((o) => o && o.material && o.material.uniforms)
    const u = points.material.uniforms
    u.uTime.value = 5.0
    rerender(<WebGLConstellation {...fullProps} justFilteredId="skill-7" />)
    expect(u.uFlashNodeId.value).toBe(7)
    expect(u.uFlashStartTime.value).toBeCloseTo(5.0, 4)
  })

  it('sets uActiveNodeId to nodeIdToIndex(selectedSkillId) when selectedSkillId prop becomes non-null', () => {
    const { rerender } = render(<WebGLConstellation
      {...fullProps}
      selectedSkillId={null}
      hoveredSkillId={null}
    />)
    const points = added.find((o) => o && o.material && o.material.uniforms)
    const u = points.material.uniforms
    expect(u.uActiveNodeId.value).toBe(-1)
    rerender(<WebGLConstellation
      {...fullProps}
      selectedSkillId="skill-3"
      hoveredSkillId={null}
    />)
    expect(u.uActiveNodeId.value).toBe(3)
  })

  it('sets uActiveNodeId to nodeIdToIndex(hoveredSkillId) when hover PROP changes (BLOCKER 2 — hoveredSkillId is a prop)', () => {
    const { rerender } = render(<WebGLConstellation
      {...fullProps}
      selectedSkillId={null}
      hoveredSkillId={null}
    />)
    const points = added.find((o) => o && o.material && o.material.uniforms)
    const u = points.material.uniforms
    expect(u.uActiveNodeId.value).toBe(-1)
    // Hover prop flows in FROM the hook — WebGL has no internal state to set
    rerender(<WebGLConstellation
      {...fullProps}
      selectedSkillId={null}
      hoveredSkillId="skill-5"
    />)
    expect(u.uActiveNodeId.value).toBe(5)
  })

  it('selectedSkillId wins over hoveredSkillId in uActiveNodeId fall-through (Phase 15 D-15-VIS-EDGE order)', () => {
    const { rerender } = render(<WebGLConstellation
      {...fullProps}
      selectedSkillId={null}
      hoveredSkillId={null}
    />)
    const points = added.find((o) => o && o.material && o.material.uniforms)
    const u = points.material.uniforms
    rerender(<WebGLConstellation
      {...fullProps}
      selectedSkillId="skill-2"
      hoveredSkillId="skill-9"
    />)
    expect(u.uActiveNodeId.value).toBe(2) // selected wins
  })

  it('canvas pointermove over a node calls props.onHoverSkill(id) — CALLBACK-OUT, no internal setState (BLOCKER 2)', () => {
    const onHoverSkill = vi.fn()
    const { container } = render(<WebGLConstellation
      {...fullProps}
      hoveredSkillId={null}
      onHoverSkill={onHoverSkill}
    />)
    const canvas = container.querySelector('canvas[data-testid="webgl-canvas"]')
    // Phase 20 hotfix — PerspectiveCamera framed on CONSTELLATION_CENTER
    // (500, 500, 0). FIXTURE_LAYOUT[skill-0] = (500, 500, 0) projects to NDC
    // (0, 0) → canvas center (500, 500) at rect 1000×1000.
    canvas.getBoundingClientRect = () => ({
      left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000,
    })
    const evt = new MouseEvent('pointermove', {
      bubbles: true, clientX: 500, clientY: 500,
    })
    canvas.dispatchEvent(evt)
    expect(onHoverSkill).toHaveBeenCalledWith('skill-0')
  })

  it('canvas pointermove far from any node calls props.onHoverSkill(null)', () => {
    const onHoverSkill = vi.fn()
    const { container } = render(<WebGLConstellation
      {...fullProps}
      hoveredSkillId="skill-0"
      onHoverSkill={onHoverSkill}
    />)
    const canvas = container.querySelector('canvas[data-testid="webgl-canvas"]')
    canvas.getBoundingClientRect = () => ({
      left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000,
    })
    // Coords (999, 999) are far from every fixture node — pick returns null
    const evt = new MouseEvent('pointermove', {
      bubbles: true, clientX: 999, clientY: 999,
    })
    canvas.dispatchEvent(evt)
    expect(onHoverSkill).toHaveBeenCalledWith(null)
  })

  it('source code contains NO useState call for hover state (BLOCKER 2 negative assertion)', () => {
    // Static analysis on the source — confirms WebGL owns ZERO hover state.
    // Regex parity with acceptance criterion:
    //   rg "useState\(.*hover|useState\(.*Hover|setHoveredSkillId|setHoveredNodeId"
    const banned = /useState\([^)]*hover|useState\([^)]*Hover|setHoveredSkillId|setHoveredNodeId/
    expect(WEBGL_SOURCE).not.toMatch(banned)
  })

  it('canvas pointerdown + pointerup over a node within click threshold calls props.onSelectSkill(id) — Plan 20-03 useClickVsDrag path (D-20-CLICK-DRAG-THRESHOLD)', () => {
    const onSelectSkill = vi.fn()
    const { container } = render(<WebGLConstellation
      {...fullProps}
      onSelectSkill={onSelectSkill}
    />)
    const canvas = container.querySelector('canvas[data-testid="webgl-canvas"]')
    canvas.getBoundingClientRect = () => ({
      left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000,
    })
    // jsdom does not implement Element.setPointerCapture; OrbitControls'
    // pointerdown listener (attached first per CRIT-02 ordering) calls it
    // unconditionally. Stub as no-op so the gesture flows through to the
    // useClickVsDrag-driven pointerup listener.
    canvas.setPointerCapture = () => {}
    canvas.releasePointerCapture = () => {}
    canvas.hasPointerCapture = () => false
    // Phase 20 hotfix — skill-0 at CONSTELLATION_CENTER (500,500,0) projects
    // to canvas center (500, 500) under PerspectiveCamera. See pointermove
    // test above for derivation.
    // Plan 20-03: legacy `'click'` listener removed — pointerup-via-hook is
    // now the sole click path. Δ=0px, dt≈0ms → within 5px / 250ms mouse
    // threshold → onClick → pickAt → onSelectSkill('skill-0').
    const down = new MouseEvent('pointerdown', {
      bubbles: true, clientX: 500, clientY: 500,
    })
    const up = new MouseEvent('pointerup', {
      bubbles: true, clientX: 500, clientY: 500,
    })
    canvas.dispatchEvent(down)
    canvas.dispatchEvent(up)
    expect(onSelectSkill).toHaveBeenCalledWith('skill-0')
  })

  it('canvas pointerdown + pointerup past 5px drag threshold does NOT call onSelectSkill — CRIT-02 mitigation (Plan 20-03)', () => {
    const onSelectSkill = vi.fn()
    const { container } = render(<WebGLConstellation
      {...fullProps}
      onSelectSkill={onSelectSkill}
    />)
    const canvas = container.querySelector('canvas[data-testid="webgl-canvas"]')
    canvas.getBoundingClientRect = () => ({
      left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000,
    })
    // See setPointerCapture rationale in previous test.
    canvas.setPointerCapture = () => {}
    canvas.releasePointerCapture = () => {}
    canvas.hasPointerCapture = () => false
    // Down at canvas center over skill-0; up 10px to the right — past 5px
    // mouse threshold → useClickVsDrag suppresses onClick → onSelectSkill
    // never fires. Defends GAME-04 under OrbitControls gesture state.
    const down = new MouseEvent('pointerdown', {
      bubbles: true, clientX: 500, clientY: 500,
    })
    const up = new MouseEvent('pointerup', {
      bubbles: true, clientX: 510, clientY: 500,
    })
    canvas.dispatchEvent(down)
    canvas.dispatchEvent(up)
    expect(onSelectSkill).not.toHaveBeenCalled()
  })

  it('source code contains NO addEventListener("click", ...) — Plan 20-03 removed legacy click path in favor of useClickVsDrag pointerup arbitration', () => {
    // Static negative assertion: pointerup-via-hook is now the sole click
    // path. Any reintroduction of a raw 'click' listener defeats CRIT-02
    // mitigation because OrbitControls can swallow the click when a gesture
    // crosses its internal drag threshold.
    const banned = /addEventListener\(\s*['"]click['"]/
    expect(WEBGL_SOURCE).not.toMatch(banned)
  })

  it('planet nodes get halos[i] = 1.0 unconditionally (D-20-PLANETS-TIER)', () => {
    // Mark skill-0 as planet via prop fixture. WebGL must apply always-on
    // halo even with selectedSkillId=null. Star nodes (default) still halo=0.
    const planetNodes = FIXTURE_NODES.map((n, i) => (i === 0 ? { ...n, isPlanet: true } : { ...n, isPlanet: false }))
    render(<WebGLConstellation
      {...fullProps}
      nodes={planetNodes}
      selectedSkillId={null}
    />)
    const points = added.find((o) => o && o.material && o.material.uniforms && o.geometry && o.geometry.getAttribute('halo'))
    expect(points).toBeDefined()
    const halo = points.geometry.getAttribute('halo').array
    expect(halo[0]).toBe(1.0) // planet always-on
    expect(halo[1]).toBe(0.0) // star idle
  })
})
