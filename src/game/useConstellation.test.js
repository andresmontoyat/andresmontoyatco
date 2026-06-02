import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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
})
