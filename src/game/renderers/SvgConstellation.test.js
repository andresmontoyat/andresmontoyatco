import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import SvgConstellation from './SvgConstellation.js'
import translations from '../../i18n/translations.js'

const FIXTURE_NODES = [
  { id: 'Java', label: 'Java', category: 'lang', count: 4 },
  { id: 'Docker', label: 'Docker', category: 'devops', count: 2 },
  { id: 'AWS', label: 'AWS', category: 'cloud', count: 1 },
]
const FIXTURE_LAYOUT = {
  Java: { x: 500, y: 500 },
  Docker: { x: 200, y: 300 },
  AWS: { x: 800, y: 700 },
}
const FIXTURE_EDGES = [
  { source: 'Java', target: 'Docker', weight: 3 },
  { source: 'Docker', target: 'AWS', weight: 1 },
]

const t = translations.en

function renderRenderer(overrides = {}) {
  const defaults = {
    nodes: FIXTURE_NODES,
    edges: FIXTURE_EDGES,
    layout: FIXTURE_LAYOUT,
    highlightedSkillIds: [],
    selectedSkillId: null,
    yearRange: null,
    theme: 'dark',
    lang: 'en',
    t,
    onSelectSkill: vi.fn(),
    onHoverSkill: vi.fn(),
  }
  return render(<SvgConstellation {...defaults} {...overrides} />)
}

function makeMockMatchMedia(prefersReducedMotion = false) {
  return vi.fn().mockImplementation((q) => ({
    // no-preference query returns true when reduced motion is NOT preferred
    matches: q === '(prefers-reduced-motion: no-preference)' ? !prefersReducedMotion : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  // Default: motion-safe path (reduced motion NOT preferred)
  window.matchMedia = makeMockMatchMedia(false)
})

describe('SvgConstellation', () => {
  it('renders one <g> per node', () => {
    const { container } = renderRenderer()
    expect(container.querySelectorAll('g.nodes > g').length).toBe(3)
  })

  it('renders one <line> per edge', () => {
    const { container } = renderRenderer()
    expect(container.querySelectorAll('g.edges > line').length).toBe(2)
  })

  it('hides weight-1 edges via opacity:0', () => {
    const { container } = renderRenderer()
    const lines = container.querySelectorAll('g.edges > line')
    const weight3Line = lines[0]
    const weight1Line = lines[1]
    expect(weight1Line.style.opacity).toBe('0')
    expect(weight3Line.style.opacity).toBe('1')
  })

  it('renders empty state when nodes is []', () => {
    const { getByText } = renderRenderer({ nodes: [], edges: [] })
    expect(getByText(t.game.empty)).toBeTruthy()
  })

  it('skips animation delay under reduced-motion', () => {
    window.matchMedia = makeMockMatchMedia(true)
    const { container } = renderRenderer()
    const nodeGroups = container.querySelectorAll('g.nodes > g')
    nodeGroups.forEach((g) => {
      expect(g.style.animationName).toBe('none')
    })
  })

  it('applies light-theme stroke on borderline categories', () => {
    const archNode = [{ id: 'K8s', label: 'Kubernetes', category: 'arch', count: 2 }]
    const archLayout = { K8s: { x: 500, y: 500 } }
    const { container } = renderRenderer({
      nodes: archNode,
      edges: [],
      layout: archLayout,
      theme: 'light',
    })
    const circles = container.querySelectorAll('g.nodes > g circle')
    const visibleCircle = circles[0]
    expect(visibleCircle.getAttribute('stroke')).toBe('#0891b2')
    expect(visibleCircle.getAttribute('stroke-width')).toBe('1.5')
  })

  it('uses sqrt count scaling for radius', () => {
    const { container } = renderRenderer()
    const nodeGroups = container.querySelectorAll('g.nodes > g')
    const circlesByNodeId = {}
    nodeGroups.forEach((g) => {
      const id = g.getAttribute('data-node-id')
      const circle = g.querySelector('circle')
      if (id && circle) circlesByNodeId[id] = parseFloat(circle.getAttribute('r'))
    })
    // count=4 node (Java) should have larger radius than count=1 node (AWS)
    expect(circlesByNodeId.Java).toBeGreaterThan(circlesByNodeId.AWS)
  })

  it('does not dim any node before selectedSkillId is set', () => {
    const { container } = renderRenderer({ selectedSkillId: null })
    const circles = container.querySelectorAll('g.nodes > g circle:first-child')
    circles.forEach((c) => {
      const fillOpacity = c.getAttribute('fill-opacity') || c.style.fillOpacity
      expect(String(fillOpacity)).toBe('1')
    })
  })

  it('applies halo filter when a node is the selectedSkillId', () => {
    const { container } = renderRenderer({ selectedSkillId: 'Java' })
    const nodeGroups = container.querySelectorAll('g.nodes > g')
    let javaCircle = null
    nodeGroups.forEach((g) => {
      if (g.getAttribute('data-node-id') === 'Java') {
        javaCircle = g.querySelector('circle')
      }
    })
    expect(javaCircle).toBeTruthy()
    expect(javaCircle.style.filter).toContain('drop-shadow')
  })

  it('omits halo under reduced-motion even when selected', () => {
    window.matchMedia = makeMockMatchMedia(true)
    const { container } = renderRenderer({ selectedSkillId: 'Java' })
    const nodeGroups = container.querySelectorAll('g.nodes > g')
    let javaCircle = null
    nodeGroups.forEach((g) => {
      if (g.getAttribute('data-node-id') === 'Java') {
        javaCircle = g.querySelector('circle')
      }
    })
    expect(javaCircle).toBeTruthy()
    expect(javaCircle.style.filter === 'none' || !javaCircle.style.filter || javaCircle.style.filter === '').toBe(true)
  })
})
