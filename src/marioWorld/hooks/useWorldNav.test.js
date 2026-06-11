import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useWorldNav from './useWorldNav.js'

const BBOX = { minX: -1000, maxX: 1000, minY: -800, maxY: 800 }
const STEP = 20

afterEach(() => {
  document.body.innerHTML = ''
})

function fireKeyDown(key) {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

function fireKeyUp(key) {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  })
}

describe('useWorldNav', () => {
  it('initializes position at (0,0)', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    expect(result.current.position).toEqual({ x: 0, y: 0 })
  })

  it('increments x by step on ArrowRight', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    fireKeyDown('ArrowRight')
    expect(result.current.position).toEqual({ x: STEP, y: 0 })
  })

  it('decrements x by step on ArrowLeft', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    fireKeyDown('ArrowLeft')
    expect(result.current.position).toEqual({ x: -STEP, y: 0 })
  })

  it('adjusts y on ArrowUp (-y) and ArrowDown (+y)', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    fireKeyDown('ArrowUp')
    expect(result.current.position).toEqual({ x: 0, y: -STEP })
    fireKeyDown('ArrowDown')
    fireKeyDown('ArrowDown')
    expect(result.current.position).toEqual({ x: 0, y: STEP })
  })

  it('clamps to bbox.maxX when moving right past edge', () => {
    const tightBbox = { minX: -1000, maxX: 50, minY: -800, maxY: 800 }
    const { result } = renderHook(() => useWorldNav({ bbox: tightBbox, step: STEP }))
    for (let i = 0; i < 10; i += 1) fireKeyDown('ArrowRight')
    expect(result.current.position.x).toBe(50)
  })

  it('clamps to bbox.minX when moving left past edge', () => {
    const tightBbox = { minX: -50, maxX: 1000, minY: -800, maxY: 800 }
    const { result } = renderHook(() => useWorldNav({ bbox: tightBbox, step: STEP }))
    for (let i = 0; i < 10; i += 1) fireKeyDown('ArrowLeft')
    expect(result.current.position.x).toBe(-50)
  })

  it('ignores keystrokes when focus is on <input>', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    input.focus()
    expect(document.activeElement).toBe(input)
    fireKeyDown('ArrowRight')
    expect(result.current.position).toEqual({ x: 0, y: 0 })
  })

  it('drag updates cameraOffset, not position', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    act(() => {
      result.current.onPointerDown({ clientX: 100, clientY: 0, pointerId: 1, currentTarget: { setPointerCapture: () => {} } })
    })
    act(() => {
      result.current.onPointerMove({ clientX: 150, clientY: 0, pointerId: 1 })
    })
    expect(result.current.cameraOffset.x).toBe(-50)
    expect(result.current.position).toEqual({ x: 0, y: 0 })
  })

  it('cleans up keydown/keyup listeners on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    const addedKeydown = addSpy.mock.calls.find((c) => c[0] === 'keydown')
    const addedKeyup = addSpy.mock.calls.find((c) => c[0] === 'keyup')
    expect(addedKeydown).toBeTruthy()
    expect(addedKeyup).toBeTruthy()
    unmount()
    const removedKeydown = removeSpy.mock.calls.find((c) => c[0] === 'keydown')
    const removedKeyup = removeSpy.mock.calls.find((c) => c[0] === 'keyup')
    expect(removedKeydown).toBeTruthy()
    expect(removedKeyup).toBeTruthy()
    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('returns isWalking=true while arrow held, false after keyup', () => {
    const { result } = renderHook(() => useWorldNav({ bbox: BBOX, step: STEP }))
    fireKeyDown('ArrowRight')
    expect(result.current.isWalking).toBe(true)
    fireKeyUp('ArrowRight')
    expect(result.current.isWalking).toBe(false)
  })
})
