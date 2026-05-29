import { describe, it, expect } from 'vitest'
import { computeLayout } from './constellation.layout.js'
import { buildConstellationGraph } from './constellation.graph.js'
import EXPERIENCE from '../data/experience.js'
import { SKILL_CATEGORIES, SKILLS } from '../data/skills.js'

function buildTestNodes() {
  const { nodes } = buildConstellationGraph(EXPERIENCE, SKILLS)
  return nodes
}

describe('computeLayout - interface', () => {
  it('should return one position per node id', () => {
    const nodes = buildTestNodes()
    const layout = computeLayout(nodes)
    expect(typeof layout).toBe('object')
    expect(layout).not.toBeNull()
    for (const node of nodes) {
      expect(layout[node.id], `missing position for node ${node.id}`).toBeDefined()
      const pos = layout[node.id]
      expect(typeof pos.x).toBe('number')
      expect(typeof pos.y).toBe('number')
    }
  })

  it('should return exactly as many positions as nodes (no extra, no missing)', () => {
    const nodes = buildTestNodes()
    const layout = computeLayout(nodes)
    expect(Object.keys(layout)).toHaveLength(nodes.length)
  })
})

describe('computeLayout - determinism', () => {
  it('should return byte-identical positions when called twice with the same input', () => {
    const nodes = buildTestNodes()
    const layoutA = computeLayout(nodes)
    const layoutB = computeLayout(nodes)
    for (const node of nodes) {
      expect(layoutA[node.id].x).toBe(layoutB[node.id].x)
      expect(layoutA[node.id].y).toBe(layoutB[node.id].y)
    }
  })

  it('should be deterministic even if nodes are passed in different order', () => {
    const nodes = buildTestNodes()
    const shuffled = [...nodes].reverse()
    const layoutA = computeLayout(nodes)
    const layoutB = computeLayout(shuffled)
    for (const node of nodes) {
      expect(layoutA[node.id].x).toBe(layoutB[node.id].x)
      expect(layoutA[node.id].y).toBe(layoutB[node.id].y)
    }
  })
})

describe('computeLayout - category clustering', () => {
  it('should place same-category nodes closer to their category centroid than to a different category centroid', () => {
    const nodes = buildTestNodes()
    const layout = computeLayout(nodes)

    // Compute centroids per category
    const centroids = {}
    for (const [cat] of Object.entries(SKILL_CATEGORIES)) {
      const catNodes = nodes.filter((n) => n.category === cat)
      if (catNodes.length === 0) continue
      const sumX = catNodes.reduce((s, n) => s + layout[n.id].x, 0)
      const sumY = catNodes.reduce((s, n) => s + layout[n.id].y, 0)
      centroids[cat] = { x: sumX / catNodes.length, y: sumY / catNodes.length }
    }

    // For each node, its distance to its own category centroid should be <= distance to another category centroid
    const categories = Object.keys(centroids)
    if (categories.length < 2) return // not enough categories to test

    for (const node of nodes) {
      const pos = layout[node.id]
      const ownCentroid = centroids[node.category]
      if (!ownCentroid) continue
      const ownDist = Math.hypot(pos.x - ownCentroid.x, pos.y - ownCentroid.y)

      // Check against at least one different category (pick the one with most members)
      const otherCats = categories.filter((c) => c !== node.category)
      for (const otherCat of otherCats) {
        const otherCentroid = centroids[otherCat]
        const otherDist = Math.hypot(pos.x - otherCentroid.x, pos.y - otherCentroid.y)
        // Own centroid distance should be less than or equal to other centroid distance
        // We allow a small tolerance for edge nodes at category boundaries
        expect(
          ownDist,
          `node ${node.id} (cat:${node.category}) is closer to ${otherCat} centroid than own centroid`
        ).toBeLessThanOrEqual(otherDist + 0.01)
      }
    }
  })

  it('should spread nodes (no two nodes at exactly the same position)', () => {
    const nodes = buildTestNodes()
    const layout = computeLayout(nodes)
    const positions = nodes.map((n) => `${layout[n.id].x},${layout[n.id].y}`)
    const uniquePositions = new Set(positions)
    expect(uniquePositions.size).toBe(nodes.length)
  })
})
