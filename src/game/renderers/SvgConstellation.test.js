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

  // ─── Phase 16: filter consumers + chip-flash + reduced-motion guard (RED) ──

  it('dims nodes not in highlightedSkillIds when the array is non-empty', () => {
    const { container } = renderRenderer({
      selectedSkillId: null,
      highlightedSkillIds: ['Java'],
    })
    const javaCircle = container.querySelector('g[data-node-id="Java"] circle:first-child')
    const dockerCircle = container.querySelector('g[data-node-id="Docker"] circle:first-child')
    expect(parseFloat(javaCircle.getAttribute('fill-opacity'))).toBeCloseTo(1, 1)
    expect(parseFloat(dockerCircle.getAttribute('fill-opacity'))).toBeCloseTo(0.35, 1)
  })

  it('dims nodes whose years[] does not intersect yearRange (D-16-YEAR-EFFECT)', () => {
    const customNodes = [
      { id: 'Java', label: 'Java', category: 'lang', count: 4, years: [2007, 2026] },
      { id: 'Asterisk', label: 'Asterisk', category: 'hardware', count: 1, years: [2008, 2009] },
    ]
    const customLayout = { Java: { x: 500, y: 500 }, Asterisk: { x: 200, y: 200 } }
    const { container } = renderRenderer({
      nodes: customNodes,
      edges: [],
      layout: customLayout,
      yearRange: [2020, 2026],
    })
    const javaCircle = container.querySelector('g[data-node-id="Java"] circle:first-child')
    const asteriskCircle = container.querySelector('g[data-node-id="Asterisk"] circle:first-child')
    expect(parseFloat(javaCircle.getAttribute('fill-opacity'))).toBeCloseTo(1, 1)
    expect(parseFloat(asteriskCircle.getAttribute('fill-opacity'))).toBeCloseTo(0.35, 1)
  })

  it('dims edges incident to non-highlighted nodes when filters active', () => {
    const { container } = renderRenderer({
      highlightedSkillIds: ['Java'],
    })
    const lines = container.querySelectorAll('g.edges > line')
    // Java↔Docker edge (weight 3): Java highlighted but Docker dimmed → edge dimmed
    const javaDockerLine = lines[0]
    const dockerAwsLine = lines[1]
    // Either an explicit reduced opacity OR style.opacity < 1 should be observable
    const javaDockerOpacity = parseFloat(
      javaDockerLine.style.opacity || javaDockerLine.getAttribute('opacity') || '1'
    )
    expect(javaDockerOpacity).toBeLessThan(1)
    // Docker↔AWS: neither endpoint is in highlightedSkillIds — must also be dimmed
    const dockerAwsOpacity = parseFloat(
      dockerAwsLine.style.opacity || dockerAwsLine.getAttribute('opacity') || '1'
    )
    expect(dockerAwsOpacity).toBeLessThan(1)
  })

  it('applies animate-chip-flash class to the node whose id matches justFilteredId (BLOCKER 2)', () => {
    const { container, rerender } = render(
      <SvgConstellation
        nodes={FIXTURE_NODES}
        edges={FIXTURE_EDGES}
        layout={FIXTURE_LAYOUT}
        highlightedSkillIds={[]}
        selectedSkillId={null}
        yearRange={null}
        justFilteredId="Java"
        theme="dark"
        lang="en"
        t={t}
        onSelectSkill={vi.fn()}
        onHoverSkill={vi.fn()}
      />
    )
    const javaG = container.querySelector('g[data-node-id="Java"]')
    expect(javaG.className.baseVal || javaG.getAttribute('class') || '').toContain('animate-chip-flash')

    rerender(
      <SvgConstellation
        nodes={FIXTURE_NODES}
        edges={FIXTURE_EDGES}
        layout={FIXTURE_LAYOUT}
        highlightedSkillIds={[]}
        selectedSkillId={null}
        yearRange={null}
        justFilteredId="Docker"
        theme="dark"
        lang="en"
        t={t}
        onSelectSkill={vi.fn()}
        onHoverSkill={vi.fn()}
      />
    )
    const javaG2 = container.querySelector('g[data-node-id="Java"]')
    expect(javaG2.className.baseVal || javaG2.getAttribute('class') || '').not.toContain('animate-chip-flash')
  })

  it('reduced-motion guard: node circle inline transition is "none" under prefers-reduced-motion (WARNING 6)', () => {
    window.matchMedia = makeMockMatchMedia(true)
    const { container } = renderRenderer({ highlightedSkillIds: ['Java'] })
    const javaCircle = container.querySelector('g[data-node-id="Java"] circle:first-child')
    expect(javaCircle.style.transition).toBe('none')
  })

  // Phase 19 (v3.9 POLISH-02) — SVG ambient twinkle so SVG-path users perceive motion
  it('Phase 19 POLISH-02: motion-safe SVG nodes carry animate-svg-twinkle class with deterministic per-node delay', () => {
    window.matchMedia = makeMockMatchMedia(false)
    const { container } = renderRenderer({})
    const javaCircle = container.querySelector('g[data-node-id="Java"] circle:first-child')
    const cls = javaCircle.getAttribute('class') || ''
    expect(cls).toContain('motion-safe:animate-svg-twinkle')
    expect(javaCircle.style.animationDelay).toMatch(/^-\d+ms$/)
  })

  it('Phase 19 POLISH-02: reduced-motion SVG nodes DO NOT carry animate-svg-twinkle class', () => {
    window.matchMedia = makeMockMatchMedia(true)
    const { container } = renderRenderer({})
    const javaCircle = container.querySelector('g[data-node-id="Java"] circle:first-child')
    const cls = javaCircle.getAttribute('class') || ''
    expect(cls).not.toContain('animate-svg-twinkle')
    expect(javaCircle.style.animationDelay).toBeFalsy()
  })

  it('D-20-PLANETS-TIER: planet node renders larger r + always-on halo filter (idle, not selected)', () => {
    // Mark Java as planet via prop fixture. Without selection, planet must
    // STILL show halo filter (drop-shadow) AND its radius must be >= 24
    // (planet band floor). Star Docker stays in regular band (<= 23).
    const planetNodes = [
      { ...FIXTURE_NODES[0], isPlanet: true },     // Java planet
      { ...FIXTURE_NODES[1], isPlanet: false },    // Docker star
      { ...FIXTURE_NODES[2], isPlanet: false },    // AWS star
    ]
    const { container } = renderRenderer({ nodes: planetNodes, selectedSkillId: null })
    const javaCircle = container.querySelector('g[data-node-id="Java"] circle:first-child')
    const dockerCircle = container.querySelector('g[data-node-id="Docker"] circle:first-child')
    expect(javaCircle).not.toBeNull()
    expect(dockerCircle).not.toBeNull()
    // Planet r >= 24 (desktop_planet floor)
    const javaR = parseFloat(javaCircle.getAttribute('r'))
    expect(javaR).toBeGreaterThanOrEqual(24)
    // Star r <= 23 (desktop ceil)
    const dockerR = parseFloat(dockerCircle.getAttribute('r'))
    expect(dockerR).toBeLessThanOrEqual(23)
    // Planet halo filter applied idle (not just on select)
    const javaFilter = javaCircle.style.filter || ''
    expect(javaFilter).toContain('drop-shadow')
    // Star NO halo idle
    const dockerFilter = dockerCircle.style.filter || ''
    expect(dockerFilter).not.toContain('drop-shadow')
  })
})
