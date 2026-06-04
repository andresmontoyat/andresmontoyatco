import React from 'react'
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { render, cleanup } from '@testing-library/react'
import WebGLConstellation from './WebGLConstellation.js'

// Pitfall 7 mitigation: jsdom has no real WebGL — mock the three.js
// WebGLRenderer constructor with a fake { setSize, setPixelRatio, render,
// domElement, dispose } so the renderer's useEffect doesn't blow up on mount.
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    WebGLRenderer: vi.fn(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas'),
      dispose: vi.fn(),
    })),
  }
})

// Minimal Phase 15+17 props fixture — INCLUDES hoveredSkillId (BLOCKER 2).
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

  it('calls renderer.dispose() on unmount (Pitfall 8 GPU cleanup)', async () => {
    const three = await import('three')
    // Stash the renderer instance the mock will hand back so we can assert dispose.
    const disposeSpy = vi.fn()
    three.WebGLRenderer.mockImplementationOnce(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas'),
      dispose: disposeSpy,
    }))
    const { unmount } = render(<WebGLConstellation {...minimalProps} />)
    unmount()
    expect(disposeSpy).toHaveBeenCalled()
  })

  it('accepts hoveredSkillId as a prop without crashing (BLOCKER 2 — no internal hover useState)', () => {
    const { rerender } = render(<WebGLConstellation {...minimalProps} hoveredSkillId="java" />)
    expect(() => rerender(
      <WebGLConstellation {...minimalProps} hoveredSkillId="python" />,
    )).not.toThrow()
  })
})
