import { describe, it, expect } from 'vitest'
import { findNextNode, ARROW_VECTORS } from './spatialNav.js'

describe('ARROW_VECTORS', () => {
  it('exports all four arrow direction vectors', () => {
    expect(ARROW_VECTORS.ArrowRight).toEqual({ dx: 1, dy: 0 })
    expect(ARROW_VECTORS.ArrowLeft).toEqual({ dx: -1, dy: 0 })
    expect(ARROW_VECTORS.ArrowDown).toEqual({ dx: 0, dy: 1 })
    expect(ARROW_VECTORS.ArrowUp).toEqual({ dx: 0, dy: -1 })
  })
})

describe('findNextNode', () => {
  it('returns currentId if direction is unknown', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    const layout = { A: { x: 100, y: 500 }, B: { x: 500, y: 500 }, C: { x: 900, y: 500 } }
    expect(findNextNode('A', 'Foo', nodes, layout)).toBe('A')
  })

  it('returns currentId if nodes is empty', () => {
    const layout = { A: { x: 100, y: 500 } }
    expect(findNextNode('A', 'ArrowRight', [], layout)).toBe('A')
  })

  it('returns currentId if nodes contains only currentId', () => {
    const nodes = [{ id: 'A' }]
    const layout = { A: { x: 500, y: 500 } }
    expect(findNextNode('A', 'ArrowRight', nodes, layout)).toBe('A')
  })

  it('moves right to the nearest node in +x half-plane', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    const layout = { A: { x: 100, y: 500 }, B: { x: 500, y: 500 }, C: { x: 900, y: 500 } }
    // From A at (100,500), ArrowRight: B at (500,500) is closer than C at (900,500)
    expect(findNextNode('A', 'ArrowRight', nodes, layout)).toBe('B')
  })

  it('moves left to the nearest node in -x half-plane', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    const layout = { A: { x: 100, y: 500 }, B: { x: 500, y: 500 }, C: { x: 900, y: 500 } }
    // From C at (900,500), ArrowLeft: B at (500,500) is closer than A at (100,500)
    expect(findNextNode('C', 'ArrowLeft', nodes, layout)).toBe('B')
  })

  it('moves up to the nearest node in -y half-plane', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    // ArrowUp = dy:-1 → candidates where (ny - cy)*(-1) > 0 → ny < cy (smaller y = up on screen)
    const layout = { A: { x: 500, y: 900 }, B: { x: 500, y: 500 }, C: { x: 500, y: 100 } }
    // From A at y=900, ArrowUp: B at y=500 is closer than C at y=100
    expect(findNextNode('A', 'ArrowUp', nodes, layout)).toBe('B')
  })

  it('moves down to the nearest node in +y half-plane', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    // ArrowDown = dy:+1 → candidates where (ny - cy)*(+1) > 0 → ny > cy
    const layout = { A: { x: 500, y: 100 }, B: { x: 500, y: 500 }, C: { x: 500, y: 900 } }
    // From A at y=100, ArrowDown: B at y=500 is closer than C at y=900
    expect(findNextNode('A', 'ArrowDown', nodes, layout)).toBe('B')
  })

  it('breaks ties by Euclidean distance, not just axis distance', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    // A at center, B and C both to the right (+x) at same x-offset but different y
    // B is directly to the right (closer Euclidean), C is diagonally right (farther)
    const layout = {
      A: { x: 100, y: 500 },
      B: { x: 500, y: 500 },  // distance = 400
      C: { x: 500, y: 900 },  // distance = sqrt(400^2 + 400^2) ≈ 566
    }
    expect(findNextNode('A', 'ArrowRight', nodes, layout)).toBe('B')
  })

  it('wraps to farthest node in opposite half-plane when arrow has no candidate', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    const layout = { A: { x: 100, y: 500 }, B: { x: 500, y: 500 }, C: { x: 900, y: 500 } }
    // From C at (900,500), ArrowRight: no nodes to the right; wrap to farthest LEFT = A at (100,500)
    expect(findNextNode('C', 'ArrowRight', nodes, layout)).toBe('A')
  })

  it('does not include currentId as a candidate', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }]
    const layout = { A: { x: 500, y: 500 }, B: { x: 600, y: 500 } }
    // A should navigate to B, not return A itself
    const result = findNextNode('A', 'ArrowRight', nodes, layout)
    expect(result).toBe('B')
    expect(result).not.toBe('A')
  })
})
