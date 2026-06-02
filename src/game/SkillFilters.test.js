import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SkillFilters from './SkillFilters.js'
import translations from '../i18n/translations.js'

const t = translations.en

const FIXTURE_NODES = [
  { id: 'Java', label: 'Java', category: 'lang', count: 11 },
  { id: 'Spring Boot', label: 'Spring Boot', category: 'lang', count: 5 },
  { id: 'AWS', label: 'AWS', category: 'cloud', count: 2 },
  { id: 'Docker', label: 'Docker', category: 'devops', count: 1 },
  { id: 'Kubernetes', label: 'Kubernetes', category: 'devops', count: 1 },
]

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

beforeEach(() => {
  window.matchMedia = makeMockMatchMedia(false)
})

function renderFilters(overrides = {}) {
  const defaults = {
    nodes: FIXTURE_NODES,
    selectedSkills: [],
    yearRange: null,
    yearBounds: [2007, 2026],
    category: null,
    isFilterActive: false,
    onToggleSkill: vi.fn(),
    onYearRangeChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onReset: vi.fn(),
    lang: 'en',
    t,
  }
  return render(<SkillFilters {...defaults} {...overrides} />)
}

describe('SkillFilters - root container', () => {
  it('renders a root with role="group" + filterBarLabel + data-game-interactive', () => {
    const { container } = renderFilters()
    const bar = container.querySelector('[data-game-interactive]')
    expect(bar).toBeTruthy()
    expect(bar.getAttribute('role')).toBe('group')
    expect(bar.getAttribute('aria-label')).toBe(t.game.filterBarLabel)
  })
})

describe('SkillFilters - skill chip group', () => {
  it('renders skill chip group with role="group" + filterSkillsLabel', () => {
    renderFilters()
    const skillGroup = screen.getByRole('group', { name: t.game.filterSkillsLabel })
    expect(skillGroup).toBeInTheDocument()
  })

  it('calls onToggleSkill with the node id when a skill chip is clicked', async () => {
    const user = userEvent.setup()
    const onToggleSkill = vi.fn()
    renderFilters({ onToggleSkill })
    const skillGroup = screen.getByRole('group', { name: t.game.filterSkillsLabel })
    const javaChip = within(skillGroup).getByRole('button', { name: /^Java$/ })
    await user.click(javaChip)
    expect(onToggleSkill).toHaveBeenCalledWith('Java')
  })

  it('reflects selectedSkills membership via aria-pressed', () => {
    renderFilters({ selectedSkills: ['Java'] })
    const skillGroup = screen.getByRole('group', { name: t.game.filterSkillsLabel })
    const javaChip = within(skillGroup).getByRole('button', { name: /^Java$/ })
    const awsChip = within(skillGroup).getByRole('button', { name: /^AWS$/ })
    expect(javaChip.getAttribute('aria-pressed')).toBe('true')
    expect(awsChip.getAttribute('aria-pressed')).toBe('false')
  })
})

describe('SkillFilters - category chip group', () => {
  it('renders category chip group with role="group" + filterCategoryLabel', () => {
    renderFilters()
    const catGroup = screen.getByRole('group', { name: t.game.filterCategoryLabel })
    expect(catGroup).toBeInTheDocument()
  })

  it('renders 8 category chips (one per SKILL_CATEGORIES entry)', () => {
    renderFilters()
    const catGroup = screen.getByRole('group', { name: t.game.filterCategoryLabel })
    const chips = within(catGroup).getAllByRole('button')
    expect(chips.length).toBe(8)
  })
})

describe('SkillFilters - YearRangeSlider keyboard a11y (WAI-ARIA APG)', () => {
  it('ArrowRight on the focused start thumb calls onYearRangeChange([N+1, end])', async () => {
    const user = userEvent.setup()
    const onYearRangeChange = vi.fn()
    renderFilters({ yearRange: [2018, 2026], onYearRangeChange })
    const startThumb = screen.getByRole('slider', { name: t.game.yearStartLabel })
    startThumb.focus()
    await user.keyboard('{ArrowRight}')
    expect(onYearRangeChange).toHaveBeenCalledWith([2019, 2026])
  })

  it('ArrowLeft at the start thumb floor does NOT call onYearRangeChange', async () => {
    const user = userEvent.setup()
    const onYearRangeChange = vi.fn()
    renderFilters({ yearRange: [2007, 2026], onYearRangeChange })
    const startThumb = screen.getByRole('slider', { name: t.game.yearStartLabel })
    startThumb.focus()
    await user.keyboard('{ArrowLeft}')
    expect(onYearRangeChange).not.toHaveBeenCalled()
  })

  it('Home jumps the start thumb to its aria-valuemin', async () => {
    const user = userEvent.setup()
    const onYearRangeChange = vi.fn()
    renderFilters({ yearRange: [2018, 2026], onYearRangeChange })
    const startThumb = screen.getByRole('slider', { name: t.game.yearStartLabel })
    startThumb.focus()
    await user.keyboard('{Home}')
    expect(onYearRangeChange).toHaveBeenCalledWith([2007, 2026])
  })

  it('End jumps the end thumb to its aria-valuemax', async () => {
    const user = userEvent.setup()
    const onYearRangeChange = vi.fn()
    renderFilters({ yearRange: [2018, 2020], onYearRangeChange })
    const endThumb = screen.getByRole('slider', { name: t.game.yearEndLabel })
    endThumb.focus()
    await user.keyboard('{End}')
    expect(onYearRangeChange).toHaveBeenCalledWith([2018, 2026])
  })

  it('respects dependent aria-valuemax (start thumb cannot exceed end - 1)', async () => {
    const user = userEvent.setup()
    const onYearRangeChange = vi.fn()
    renderFilters({ yearRange: [2025, 2026], onYearRangeChange })
    const startThumb = screen.getByRole('slider', { name: t.game.yearStartLabel })
    startThumb.focus()
    await user.keyboard('{ArrowRight}')
    expect(onYearRangeChange).not.toHaveBeenCalled()
  })
})

describe('SkillFilters - reset button', () => {
  it('reset button is disabled (native + aria-disabled) when isFilterActive=false', () => {
    renderFilters({ isFilterActive: false })
    const reset = screen.getByRole('button', { name: t.game.filterReset })
    expect(reset).toBeDisabled()
    expect(reset).toHaveAttribute('aria-disabled', 'true')
  })

  it('reset button is enabled and onClick fires onReset when isFilterActive=true', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    renderFilters({ isFilterActive: true, onReset })
    const reset = screen.getByRole('button', { name: t.game.filterReset })
    expect(reset).not.toBeDisabled()
    await user.click(reset)
    expect(onReset).toHaveBeenCalled()
  })
})
