import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
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
    const nodeGroups = container.querySelectorAll('g[data-node-id]')
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
    const circles = container.querySelectorAll('g[data-node-id] circle')
    const visibleCircle = circles[0]
    expect(visibleCircle.getAttribute('stroke')).toBe('#0891b2')
    expect(visibleCircle.getAttribute('stroke-width')).toBe('1.5')
  })

  it('uses sqrt count scaling for radius', () => {
    const { container } = renderRenderer()
    const nodeGroups = container.querySelectorAll('g[data-node-id]')
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
    const circles = container.querySelectorAll('g[data-node-id] circle:first-child')
    circles.forEach((c) => {
      const fillOpacity = c.getAttribute('fill-opacity') || c.style.fillOpacity
      expect(String(fillOpacity)).toBe('1')
    })
  })

  it('applies halo filter when a node is the selectedSkillId', () => {
    const { container } = renderRenderer({ selectedSkillId: 'Java' })
    const nodeGroups = container.querySelectorAll('g[data-node-id]')
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
    const nodeGroups = container.querySelectorAll('g[data-node-id]')
    let javaCircle = null
    nodeGroups.forEach((g) => {
      if (g.getAttribute('data-node-id') === 'Java') {
        javaCircle = g.querySelector('circle')
      }
    })
    expect(javaCircle).toBeTruthy()
    expect(javaCircle.style.filter === 'none' || !javaCircle.style.filter || javaCircle.style.filter === '').toBe(true)
  })

  // ─── Slice 3: a11y / interaction tests (tests 11-22) ─────────────────────────

  it('wraps SVG in role=application with aria-label', () => {
    const { getByRole } = renderRenderer()
    const appContainer = getByRole('application')
    expect(appContainer).toBeTruthy()
    expect(appContainer.getAttribute('aria-label')).toBe(t.game.constellationLabel)
  })

  it('starts with the biggest node as rovingNodeId (tabIndex=0)', () => {
    // Java count=4, Docker count=2, AWS count=1 → Java is biggest
    const { container } = renderRenderer()
    const javaG = container.querySelector('g[data-node-id="Java"]')
    const dockerG = container.querySelector('g[data-node-id="Docker"]')
    const awsG = container.querySelector('g[data-node-id="AWS"]')
    expect(javaG.getAttribute('tabindex')).toBe('0')
    expect(dockerG.getAttribute('tabindex')).toBe('-1')
    expect(awsG.getAttribute('tabindex')).toBe('-1')
  })

  it('renders aria-label per node with skill + category + count format', () => {
    const { container } = renderRenderer()
    const javaG = container.querySelector('g[data-node-id="Java"]')
    // Java, lang category = 'Languages & Frameworks', count=4 → 'jobs'
    expect(javaG.getAttribute('aria-label')).toContain('Java')
    expect(javaG.getAttribute('aria-label')).toContain('Languages & Frameworks')
    expect(javaG.getAttribute('aria-label')).toContain('used in')
    expect(javaG.getAttribute('aria-label')).toContain('4')
    expect(javaG.getAttribute('aria-label')).toContain('jobs')
  })

  it('moves roving focus on ArrowRight', () => {
    // Layout: Java at (500,500), Docker at (200,300), AWS at (800,700)
    // Java is biggest node so starts with tabIndex=0
    // ArrowRight from Java (500,500): AWS at (800,700) is in +x half-plane
    const { container, getByRole } = renderRenderer()
    const appEl = getByRole('application')
    const javaBefore = container.querySelector('g[data-node-id="Java"]')
    expect(javaBefore.getAttribute('tabindex')).toBe('0')

    fireEvent.keyDown(appEl, { key: 'ArrowRight' })

    // After ArrowRight from Java (500,500), AWS at (800,700) is in +x half-plane
    const awsAfter = container.querySelector('g[data-node-id="AWS"]')
    expect(awsAfter.getAttribute('tabindex')).toBe('0')
  })

  it('selects focused node on Enter', () => {
    const onSelectSkill = vi.fn()
    const { getByRole } = renderRenderer({ onSelectSkill })
    const appEl = getByRole('application')

    // Navigate to AWS via ArrowRight, then activate with Enter
    fireEvent.keyDown(appEl, { key: 'ArrowRight' })
    fireEvent.keyDown(appEl, { key: 'Enter' })

    expect(onSelectSkill).toHaveBeenCalled()
  })

  it('selects focused node on Space', () => {
    const onSelectSkill = vi.fn()
    const { getByRole } = renderRenderer({ onSelectSkill })
    const appEl = getByRole('application')

    // Activate Java (starting roving node) with Space
    fireEvent.keyDown(appEl, { key: ' ' })

    expect(onSelectSkill).toHaveBeenCalledWith('Java')
  })

  it('clears selection on Esc by calling onSelectSkill with current selectedSkillId', () => {
    const onSelectSkill = vi.fn()
    const { getByRole } = renderRenderer({ selectedSkillId: 'Java', onSelectSkill })
    const appEl = getByRole('application')

    fireEvent.keyDown(appEl, { key: 'Escape' })

    // Esc uses toggle-off: calls onSelectSkill(selectedSkillId) to clear
    expect(onSelectSkill).toHaveBeenCalledWith('Java')
  })

  it('emits aria-live announcement on selection', async () => {
    const { getByRole, rerender } = renderRenderer({ selectedSkillId: null })
    const statusEl = getByRole('status')
    expect(statusEl.textContent).toBe('')

    rerender(
      <SvgConstellation
        nodes={FIXTURE_NODES}
        edges={FIXTURE_EDGES}
        layout={FIXTURE_LAYOUT}
        highlightedSkillIds={[]}
        selectedSkillId="Java"
        yearRange={null}
        theme="dark"
        lang="en"
        t={t}
        onSelectSkill={vi.fn()}
        onHoverSkill={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(statusEl.textContent).toContain('Java')
    })
  })

  it('shows pulse on biggest node in motion-safe mode', () => {
    // motion-safe = reduced motion NOT preferred (default mock)
    const { container } = renderRenderer()
    const javaG = container.querySelector('g[data-node-id="Java"]')
    // Pulse circle has class containing animate-pulse2
    const pulseCircle = javaG.querySelector('[class*="animate-pulse2"]')
    expect(pulseCircle).toBeTruthy()
  })

  it('shows hint pill under reduced-motion', () => {
    window.matchMedia = makeMockMatchMedia(true)
    const { getByText } = renderRenderer()
    // hintPill text
    expect(getByText(t.game.hintPill)).toBeTruthy()
  })

  it('hides pulse after first user interaction', () => {
    const { container } = renderRenderer()
    const javaG = container.querySelector('g[data-node-id="Java"]')

    // Verify pulse exists before interaction
    expect(javaG.querySelector('[class*="animate-pulse2"]')).toBeTruthy()

    // Click the node to trigger interaction
    fireEvent.click(javaG)

    // After interaction, pulse should be gone
    expect(container.querySelector('[class*="animate-pulse2"]')).toBeNull()
  })

  it('renders focus ring on the focused node', () => {
    const { container } = renderRenderer()
    const javaG = container.querySelector('g[data-node-id="Java"]')

    fireEvent.focus(javaG)

    // Focus ring circle uses stroke="var(--color-brand)"
    const focusRing = javaG.querySelector('circle[stroke="var(--color-brand)"]')
    expect(focusRing).toBeTruthy()
  })
})
