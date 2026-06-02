import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExperienceCard from './ExperienceCard.js'
import EXPERIENCE from '../data/experience.js'
import translations from '../i18n/translations.js'

const t = translations.en

const JAVA_NODE = { id: 'Java', label: 'Java', category: 'lang', count: 11 }
const JAVA_JOBS = EXPERIENCE.filter((e) => e.tech.includes('Java'))

function makeMockMatchMedia(prefersReducedMotion = false) {
  return vi.fn().mockImplementation((q) => ({
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

function setViewport(width) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
}

beforeEach(() => {
  window.matchMedia = makeMockMatchMedia(false)
  setViewport(1024) // desktop default
})

function renderCard(overrides = {}) {
  const defaults = {
    selectedNode: JAVA_NODE,
    jobs: JAVA_JOBS,
    selectedSkills: ['Java'],
    lang: 'en',
    t,
    onClose: vi.fn(),
    onToggleSkill: vi.fn(),
    position: null,
  }
  return render(<ExperienceCard {...defaults} {...overrides} />)
}

describe('ExperienceCard - ARIA dialog contract', () => {
  it('renders role="dialog" + aria-modal="true" + aria-labelledby="card-skill-heading"', () => {
    renderCard()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'card-skill-heading')
  })

  it('focuses the h2 heading on mount (initial focus)', () => {
    renderCard()
    const heading = screen.getByRole('heading', { level: 2 })
    expect(document.activeElement).toBe(heading)
  })
})

describe('ExperienceCard - keyboard close + focus trap', () => {
  it('calls onClose when Esc is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderCard({ onClose })
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('Tab from the last focusable wraps to the first (focus trap)', async () => {
    const user = userEvent.setup()
    renderCard()
    const dialog = screen.getByRole('dialog')
    const focusable = dialog.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    last.focus()
    await user.tab()
    expect(document.activeElement).toBe(first)
  })

  it('Shift+Tab from the first focusable wraps to the last (focus trap)', async () => {
    const user = userEvent.setup()
    renderCard()
    const dialog = screen.getByRole('dialog')
    const focusable = dialog.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first.focus()
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(last)
  })
})

describe('ExperienceCard - click-outside close', () => {
  it('calls onClose when mousedown fires outside [data-game-interactive] (after frame delay)', async () => {
    const onClose = vi.fn()
    renderCard({ onClose })
    // Wait one frame for the deferred listener to attach (Pitfall 2)
    await new Promise((r) => requestAnimationFrame(() => r()))
    fireEvent.mouseDown(document.body)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('does NOT call onClose when click target is inside the dialog', async () => {
    const onClose = vi.fn()
    renderCard({ onClose })
    await new Promise((r) => requestAnimationFrame(() => r()))
    const dialog = screen.getByRole('dialog')
    fireEvent.mouseDown(dialog)
    // Give microtasks time to flush
    await new Promise((r) => setTimeout(r, 20))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('ExperienceCard - CV CTA (bilingual)', () => {
  it('renders CV CTA with /CV_Carlos_Montoya_EN.docx href when lang="en"', () => {
    renderCard({ lang: 'en' })
    const link = screen.getByRole('link', { name: /download cv/i })
    expect(link).toHaveAttribute('href', '/CV_Carlos_Montoya_EN.docx')
  })

  it('renders CV CTA with /CV_Carlos_Montoya_ES.docx href when lang="es"', () => {
    renderCard({ lang: 'es', t: translations.es })
    const link = screen.getByRole('link', { name: /descargar cv/i })
    expect(link).toHaveAttribute('href', '/CV_Carlos_Montoya_ES.docx')
  })
})

describe('ExperienceCard - tech chip interactions', () => {
  it('calls onToggleSkill with the tech string when a non-locked tech chip is clicked', async () => {
    const user = userEvent.setup()
    const onToggleSkill = vi.fn()
    renderCard({ onToggleSkill })
    const dialog = screen.getByRole('dialog')
    const springChip = within(dialog).getAllByRole('button', { name: 'Spring Boot' })[0]
    await user.click(springChip)
    expect(onToggleSkill).toHaveBeenCalledWith('Spring Boot')
  })

  it('renders the currently-selected skill chip as aria-disabled and does NOT call onToggleSkill on click', async () => {
    const user = userEvent.setup()
    const onToggleSkill = vi.fn()
    renderCard({ onToggleSkill })
    const dialog = screen.getByRole('dialog')
    // The selectedNode is Java; Java chip inside the card body must be aria-disabled
    const lockedJavaChips = within(dialog).getAllByRole('button', { name: 'Java' })
    expect(lockedJavaChips.length).toBeGreaterThan(0)
    const lockedJava = lockedJavaChips[0]
    expect(lockedJava).toHaveAttribute('aria-disabled', 'true')
    await user.click(lockedJava)
    expect(onToggleSkill).not.toHaveBeenCalledWith('Java')
  })
})

describe('ExperienceCard - empty state', () => {
  it('renders t.game.filterEmpty inside role=status when jobs is empty (no <ol>)', () => {
    renderCard({ jobs: [] })
    const dialog = screen.getByRole('dialog')
    const status = within(dialog).getByRole('status')
    expect(status.textContent).toContain(t.game.filterEmpty)
    expect(dialog.querySelector('ol')).toBeNull()
  })
})

describe('ExperienceCard - bilingual job content', () => {
  it('renders bullets in Spanish when lang="es" (rerender pattern)', () => {
    const { rerender } = render(
      <ExperienceCard
        selectedNode={JAVA_NODE}
        jobs={JAVA_JOBS}
        selectedSkills={['Java']}
        lang="en"
        t={translations.en}
        onClose={vi.fn()}
        onToggleSkill={vi.fn()}
        position={null}
      />
    )
    // EN bullet from first Java job
    const enBullet = JAVA_JOBS[0].bullets.en[0]
    expect(screen.getByText(enBullet, { exact: false })).toBeInTheDocument()

    rerender(
      <ExperienceCard
        selectedNode={JAVA_NODE}
        jobs={JAVA_JOBS}
        selectedSkills={['Java']}
        lang="es"
        t={translations.es}
        onClose={vi.fn()}
        onToggleSkill={vi.fn()}
        position={null}
      />
    )
    const esBullet = JAVA_JOBS[0].bullets.es[0]
    expect(screen.getByText(esBullet, { exact: false })).toBeInTheDocument()
  })
})

describe('ExperienceCard - card swap via key prop', () => {
  it('uses key={selectedNode.id} on a content wrapper so changing node forces a remount', () => {
    const { rerender } = render(
      <ExperienceCard
        selectedNode={JAVA_NODE}
        jobs={JAVA_JOBS}
        selectedSkills={['Java']}
        lang="en"
        t={t}
        onClose={vi.fn()}
        onToggleSkill={vi.fn()}
        position={null}
      />
    )
    const heading1 = screen.getByRole('heading', { level: 2 })
    expect(heading1.textContent).toContain('Java')

    const dockerNode = { id: 'Docker', label: 'Docker', category: 'devops', count: 1 }
    rerender(
      <ExperienceCard
        selectedNode={dockerNode}
        jobs={EXPERIENCE.filter((e) => e.tech.includes('Docker'))}
        selectedSkills={['Docker']}
        lang="en"
        t={t}
        onClose={vi.fn()}
        onToggleSkill={vi.fn()}
        position={null}
      />
    )
    const heading2 = screen.getByRole('heading', { level: 2 })
    expect(heading2.textContent).toContain('Docker')
  })
})

describe('ExperienceCard - desktop node-anchored position (SUGGESTION 8)', () => {
  it('applies inline style { left: x+24, top: y-60 } when desktop viewport + position prop set', () => {
    setViewport(1024)
    renderCard({ position: { x: 500, y: 300 } })
    const dialog = screen.getByRole('dialog')
    expect(dialog.style.left).toBe('524px')
    expect(dialog.style.top).toBe('240px')
  })
})

describe('ExperienceCard - mobile ignores position prop (bottom-sheet)', () => {
  it('does NOT apply inline left/top under mobile viewport even when position is set', () => {
    setViewport(375)
    renderCard({ position: { x: 500, y: 300 } })
    const dialog = screen.getByRole('dialog')
    expect(dialog.style.left === '' || dialog.style.left === '0px').toBe(true)
    expect(dialog.style.top === '' || dialog.style.top === '0px').toBe(true)
  })
})
