import React from 'react'
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest'
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext.js'
import { ThemeProvider } from '../i18n/ThemeContext.js'
import { ViewModeProvider } from '../context/ViewModeContext.js'
import translations from '../i18n/translations.js'
import GameMode, { yearsActive, skillCount } from './GameMode.js'

// Phase 17 SC-5 hoisted capability mock — mutable shared state lets each
// test drive useRendererCapability's return value via capabilityState.value.
// Default 'svg' so all pre-Phase-17 tests continue to exercise the SVG path
// they were authored against.
const { capabilityState } = vi.hoisted(() => ({
  capabilityState: { value: 'svg' },
}))

vi.mock('./useRendererCapability', () => ({
  default: () => capabilityState.value,
}))

// Phase 17 SC-5 three.js mock (Pitfall 7) — fake WebGLRenderer so the lazy
// WebGL chunk mounts cleanly in jsdom for SC-5 Test A and live-swap Test C.
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

function renderWithProviders(ui, { lang = 'en' } = {}) {
  localStorage.setItem('cam-lang', lang)
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ViewModeProvider>
          {ui}
        </ViewModeProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

describe('GameMode - H1 derivation (pure assertions)', () => {
  it('h1 derivation matches live data', () => {
    expect(yearsActive).toBe(19)
    expect(skillCount).toBe(26)
  })
})

describe('GameMode - rendered component', () => {
  it('renders H1 with yearsActive=19 derived from live data', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('19 years.')
  })

  it('renders H1 with skillCount=26 derived from live data', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('26 skills.')
  })

  it('renders H1 in Spanish when lang=es', () => {
    renderWithProviders(<GameMode />, { lang: 'es' })
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('años')
    expect(h1.textContent).toContain('Una constelación.')
  })

  it('renders ConstellationFallback outside the error boundary', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    expect(
      screen.getByRole('heading', { name: 'Full career experience' })
    ).toBeInTheDocument()
  })

  it('renders renderer slot with data-testid="renderer-slot"', () => {
    const { getByTestId } = renderWithProviders(<GameMode />, { lang: 'en' })
    expect(getByTestId('renderer-slot')).toBeInTheDocument()
  })

  it('renders <svg> inside renderer-slot after wiring', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const slot = container.querySelector('[data-testid="renderer-slot"]')
    expect(slot.querySelector('svg')).toBeTruthy()
  })

  it('renders 26 node <g> elements', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    expect(container.querySelectorAll('g.nodes > g').length).toBe(26)
  })

  it('passes theme prop through to SvgConstellation', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const archStroke = container.querySelector('g.nodes circle[stroke="#0891b2"]')
    expect(archStroke).toBeNull()
  })

  it('still renders ConstellationFallback after wiring renderer', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    expect(
      screen.getByRole('heading', { name: 'Full career experience' })
    ).toBeInTheDocument()
  })

  // ─── Phase 16: filters + ExperienceCard wiring (RED) ────────────────────────

  it('renders <SkillFilters /> with role=group + filterBarLabel as a child below the H1', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    const t = translations.en
    const filterBar = screen.getByRole('group', { name: t.game.filterBarLabel })
    expect(filterBar).toBeInTheDocument()
  })

  it('does NOT render <ExperienceCard /> when selectedSkillId is null (initial state)', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders <ExperienceCard /> after clicking a node sets selectedSkillId', async () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const javaG = container.querySelector('g[data-node-id="Java"]')
    expect(javaG).toBeTruthy()
    fireEvent.click(javaG)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('click-outside discrimination: clicking the SVG background does NOT close the card; clicking a different node SWAPS the card (BLOCKER 1)', async () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })

    // Open the Java card
    const javaG = container.querySelector('g[data-node-id="Java"]')
    fireEvent.click(javaG)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    // The renderer-slot wrapper must carry data-game-interactive (Plan 06 Task 1)
    const slot = container.querySelector('[data-testid="renderer-slot"]')
    expect(slot.hasAttribute('data-game-interactive')).toBe(true)

    // Click on the SVG root (background) — inside [data-game-interactive], must NOT close
    await new Promise((r) => requestAnimationFrame(() => r()))
    const svg = slot.querySelector('svg')
    fireEvent.mouseDown(svg)
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Click a different node → card SWAPS to that skill (Docker has fewer jobs than Java)
    const dockerG = container.querySelector('g[data-node-id="Docker"]')
    fireEvent.click(dockerG)
    await waitFor(() => {
      // Scope to the dialog so we don't collide with ConstellationFallback's h2.
      const dialog = screen.getByRole('dialog')
      const heading = dialog.querySelector('#card-skill-heading')
      expect(heading.textContent).toContain('Docker')
    })
  })
})

// ─── Phase 17 SC-5: capability-based renderer selection + live-swap ─────────

describe('GameMode - Phase 17 SC-5 capability-based renderer selection', () => {
  let getContextSpy

  beforeEach(() => {
    // Pitfall 1: override global null stub so capability detection's WebGL
    // probe (still runs inside the real hook for any unmocked code path) is
    // happy. The vi.mock above replaces useRendererCapability entirely; this
    // spy belts-and-suspenders any leakage.
    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({})
  })

  afterEach(() => {
    capabilityState.value = 'svg'
    getContextSpy.mockRestore()
  })

  it("Test A: capability='webgl' mounts WebGLConstellation under Suspense + lazy import", async () => {
    capabilityState.value = 'webgl'
    const { findByTestId } = renderWithProviders(<GameMode />, { lang: 'en' })
    // findByTestId awaits Suspense → lazy chunk resolution → WebGL canvas.
    const canvas = await findByTestId('webgl-canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName.toLowerCase()).toBe('canvas')
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
  })

  it("Test B: capability='svg' mounts SvgConstellation directly with no Suspense flash", () => {
    capabilityState.value = 'svg'
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const slot = container.querySelector('[data-testid="renderer-slot"]')
    expect(slot).toBeInTheDocument()
    // SVG path mounts immediately — no canvas, an svg root inside the slot.
    expect(slot.querySelector('canvas[data-testid="webgl-canvas"]')).toBeNull()
    expect(slot.querySelector('svg')).toBeTruthy()
    // data-renderer attribute reflects the capability selection.
    expect(slot.getAttribute('data-renderer')).toBe('svg')
  })

  it('Test C: live-swap preserves selection state across renderer remount', async () => {
    // Start on SVG, select Java, then flip capability to webgl and assert
    // the canvas appears AND the dialog (which mirrors selectedSkillId via
    // useConstellation living ABOVE the renderer slot) is still present.
    capabilityState.value = 'svg'
    const { container, rerender, findByTestId } = renderWithProviders(
      <GameMode />,
      { lang: 'en' },
    )
    const javaG = container.querySelector('g[data-node-id="Java"]')
    fireEvent.click(javaG)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    // Flip the capability — re-render the SAME tree so useConstellation state
    // (which lives in the GameMode component above the renderer slot) is
    // preserved across the renderer subtree remount.
    capabilityState.value = 'webgl'
    rerender(
      <ThemeProvider>
        <LanguageProvider>
          <ViewModeProvider>
            <GameMode />
          </ViewModeProvider>
        </LanguageProvider>
      </ThemeProvider>,
    )
    const canvas = await findByTestId('webgl-canvas')
    expect(canvas).toBeInTheDocument()
    // Selection state preserved across the swap: the ExperienceCard dialog
    // (driven by selectedSkillId in useConstellation) still in DOM.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  // SC-2 BLOCKER fix (post-Slice-5 verifier audit): RendererErrorBoundary
  // fallback MUST render <SvgConstellation /> with the same props — NOT the
  // Phase 15 "switch to dev mode" anchor. Asserts the boundary's fallback
  // prop receives an SVG-rendering element so post-load WebGL crashes
  // (shader compile, ctx loss, runtime throw) degrade silently to SVG.
  it('SC-2: RendererErrorBoundary fallback renders SvgConstellation (not dev-mode anchor)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Force a WebGL render error: mock WebGLRenderer to throw on construction.
    const threeModule = await import('three')
    threeModule.WebGLRenderer.mockImplementationOnce(() => {
      throw new Error('shader_compile_failed')
    })

    capabilityState.value = 'webgl'
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })

    // Wait for ErrorBoundary fallback to materialize (Suspense unwinds, then catch).
    await waitFor(() => {
      const slot = container.querySelector('[data-testid="renderer-slot"]')
      // Fallback is SvgConstellation — assert an <svg> renders, NOT the dev-mode <button>.
      expect(slot?.querySelector('svg') || container.querySelector('svg')).toBeTruthy()
    })
    // Negative assertion: the old errorFallbackUI dev-mode "switch" anchor is NOT present.
    expect(screen.queryByRole('button', { name: /dev mode|modo dev/i })).toBeNull()

    consoleErrorSpy.mockRestore()
  })
})

// ─── Phase 18 POLISH-01: above-the-fold layout-positioning assertions ───────
// D-18-BAR-POS / D-18-H1-SIZE / D-18-SUBCOPY-RELOC / D-18-SLOT-H / D-18-STACKING.
// These six tests lock the layout contract for the constellation-above-the-fold
// restructure. Five are RED before Task 2's GREEN edits; one (Test 1) is a
// regression guard that passes today and continues to pass after the change.

describe('GameMode - Phase 18 above-the-fold layout (RED)', () => {
  it('Test 1: section root retains min-h-screen + flex + flex-col (regression guard)', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const section = container.querySelector('section#game-mode')
    expect(section).toBeInTheDocument()
    expect(section).toHaveClass('min-h-screen', 'flex', 'flex-col')
  })

  it('Test 2: renderer-slot wrapper has flex-1 + min-h-0 so it fills remaining viewport', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const slot = container.querySelector('[data-testid="renderer-slot"]')
    expect(slot).toBeInTheDocument()
    expect(slot).toHaveClass('flex-1', 'min-h-0')
  })

  it('Test 3: H1 uses compact text-xl md:text-2xl sizing (not text-2xl/md:text-4xl)', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveClass('text-xl', 'md:text-2xl')
    expect(h1).not.toHaveClass('md:text-4xl')
  })

  it('Test 4: SkillFilters root is fixed bottom-0 left-0 right-0 z-30 (no rounded-b-xl)', () => {
    renderWithProviders(<GameMode />, { lang: 'en' })
    const t = translations.en
    const filterBar = screen.getByRole('group', { name: t.game.filterBarLabel })
    expect(filterBar).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0', 'z-30')
    expect(filterBar).not.toHaveClass('rounded-b-xl')
  })

  it('Test 5: ConstellationFallback sr-only section contains a <p> with subCopy text', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const fallback = container.querySelector('section[aria-labelledby="constellation-fallback-heading"]')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveClass('sr-only')
    const paragraphs = fallback.querySelectorAll('p')
    const subCopyText = translations.en.game.subCopy
    const found = Array.from(paragraphs).some((p) => p.textContent === subCopyText)
    expect(found).toBe(true)
  })

  it('Test 6: visible region (section excluding sr-only fallback) does NOT contain subCopy text', () => {
    const { container } = renderWithProviders(<GameMode />, { lang: 'en' })
    const section = container.querySelector('section#game-mode')
    const fallback = section.querySelector('section[aria-labelledby="constellation-fallback-heading"]')
    const sectionClone = section.cloneNode(true)
    const fallbackClone = sectionClone.querySelector('section[aria-labelledby="constellation-fallback-heading"]')
    if (fallbackClone) fallbackClone.remove()
    expect(fallback).toBeInTheDocument()
    const subCopyText = translations.en.game.subCopy
    expect(sectionClone.textContent).not.toContain(subCopyText)
  })
})
