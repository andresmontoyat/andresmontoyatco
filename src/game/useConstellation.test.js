import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import useConstellation from './useConstellation.js'

describe('useConstellation', () => {
  it('initializes with selectedSkillId null', () => {
    const { result } = renderHook(() => useConstellation([]))
    expect(result.current.selectedSkillId).toBeNull()
  })

  it('initializes with hoveredSkillId null', () => {
    const { result } = renderHook(() => useConstellation([]))
    expect(result.current.hoveredSkillId).toBeNull()
  })

  it('initializes highlightedSkillIds as empty array', () => {
    const { result } = renderHook(() => useConstellation([]))
    expect(result.current.highlightedSkillIds.length).toBe(0)
  })

  it('initializes yearRange as null', () => {
    const { result } = renderHook(() => useConstellation([]))
    expect(result.current.yearRange).toBeNull()
  })

  it('sets selectedSkillId on onSelectSkill call', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.onSelectSkill('Java'))
    expect(result.current.selectedSkillId).toBe('Java')
  })

  it('toggles selectedSkillId off when called twice with same id', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.onSelectSkill('Java'))
    act(() => result.current.onSelectSkill('Java'))
    expect(result.current.selectedSkillId).toBeNull()
  })

  it('replaces selectedSkillId when called with different id', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.onSelectSkill('Java'))
    act(() => result.current.onSelectSkill('Docker'))
    expect(result.current.selectedSkillId).toBe('Docker')
  })

  it('updates hoveredSkillId on onHoverSkill', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.onHoverSkill('AWS'))
    expect(result.current.hoveredSkillId).toBe('AWS')
  })

  it('clears hoveredSkillId when onHoverSkill called with null', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.onHoverSkill('AWS'))
    act(() => result.current.onHoverSkill(null))
    expect(result.current.hoveredSkillId).toBeNull()
  })

  it('memoizes returned value when state unchanged across renders', () => {
    const { result, rerender } = renderHook(() => useConstellation([]))
    const firstValue = result.current
    rerender()
    expect(result.current).toBe(firstValue)
  })

  // ─── Phase 16: filter state extensions (RED) ─────────────────────────────────

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds a skill to selectedSkills on toggleSkill call', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.toggleSkill('Java'))
    expect(result.current.selectedSkills).toEqual(['Java'])
  })

  it('removes a skill from selectedSkills when toggleSkill is called twice with same id', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.toggleSkill('Java'))
    act(() => result.current.toggleSkill('Java'))
    expect(result.current.selectedSkills).toEqual([])
  })

  it('updates yearRange on setYearRange call', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.setYearRange([2018, 2026]))
    expect(result.current.yearRange).toEqual([2018, 2026])
  })

  it('updates category on setCategory call', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.setCategory('cloud'))
    expect(result.current.category).toBe('cloud')
  })

  it('resetFilters clears selectedSkills, yearRange, and category', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.toggleSkill('Java'))
    act(() => result.current.setYearRange([2018, 2026]))
    act(() => result.current.setCategory('cloud'))
    act(() => result.current.resetFilters())
    expect(result.current.selectedSkills).toEqual([])
    expect(result.current.yearRange).toBeNull()
    expect(result.current.category).toBeNull()
  })

  it('derives highlightedSkillIds as [] when no filter is active', () => {
    const { result } = renderHook(() => useConstellation([]))
    expect(result.current.highlightedSkillIds).toEqual([])
  })

  it('derives non-empty highlightedSkillIds when any filter is active', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.toggleSkill('Java'))
    expect(Array.isArray(result.current.highlightedSkillIds)).toBe(true)
    expect(result.current.highlightedSkillIds.length).toBeGreaterThan(0)
    expect(result.current.highlightedSkillIds).toContain('Java')
  })

  it('isFilterActive is false at init', () => {
    const { result } = renderHook(() => useConstellation([]))
    expect(result.current.isFilterActive).toBe(false)
  })

  it('isFilterActive is true after toggleSkill', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.toggleSkill('Java'))
    expect(result.current.isFilterActive).toBe(true)
  })

  it('isFilterActive is true after setYearRange', () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.setYearRange([2018, 2026]))
    expect(result.current.isFilterActive).toBe(true)
  })

  it('exposes yearBounds = [2007, 2026] derived from live data', () => {
    const { result } = renderHook(() => useConstellation([]))
    expect(result.current.yearBounds).toEqual([2007, 2026])
  })

  it('sets justFilteredId to the toggled skill id immediately on toggleSkill add (chip-flash trigger)', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.toggleSkill('Java'))
    expect(result.current.justFilteredId).toBe('Java')
  })

  it('clears justFilteredId to null ~150ms after toggleSkill add', async () => {
    const { result } = renderHook(() => useConstellation([]))
    act(() => result.current.toggleSkill('Java'))
    expect(result.current.justFilteredId).toBe('Java')
    await waitFor(
      () => {
        expect(result.current.justFilteredId).toBeNull()
      },
      { timeout: 300 }
    )
  })
})
