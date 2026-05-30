/**
 * Deterministic baked node positions clustered by category.
 * No d3-force. No DOM. No React. Pure function.
 *
 * Strategy: radial layout — categories arranged on an outer ring,
 * nodes within each category arranged on an inner ring around their
 * category centroid. Positions are fully deterministic (no randomness).
 *
 * Canvas coordinates: [0, 1000] x [0, 1000], centred at (500, 500).
 */

// Canonical category order for stable centroid placement
const CATEGORY_ORDER = ['lang', 'ai', 'arch', 'cloud', 'devops', 'security', 'data', 'hardware']

const CANVAS_CENTER = { x: 500, y: 500 }
const CATEGORY_RING_RADIUS = 320 // radius of the ring on which category centroids sit
const NODE_CLUSTER_RADIUS = 80   // radius within which nodes spread around their centroid

/**
 * Compute deterministic baked positions for a set of nodes, clustered by category.
 *
 * @param {Array} nodes - Array of node objects with { id, category }
 * @returns {Object} Map of node.id → { x, y }
 */
export function computeLayout(nodes) {
  if (!nodes || nodes.length === 0) return {}

  // Determine which categories are represented (preserve CATEGORY_ORDER for determinism)
  const presentCategories = CATEGORY_ORDER.filter((cat) =>
    nodes.some((n) => n.category === cat)
  )
  const catCount = presentCategories.length

  // Place category centroids on an evenly-spaced ring
  const categoryCentroids = {}
  for (let i = 0; i < catCount; i++) {
    const angle = (2 * Math.PI * i) / catCount - Math.PI / 2 // start at top
    categoryCentroids[presentCategories[i]] = {
      x: CANVAS_CENTER.x + CATEGORY_RING_RADIUS * Math.cos(angle),
      y: CANVAS_CENTER.y + CATEGORY_RING_RADIUS * Math.sin(angle),
    }
  }

  // Group nodes by category, sort by id within each group for determinism
  const nodesByCategory = {}
  for (const node of nodes) {
    if (!nodesByCategory[node.category]) nodesByCategory[node.category] = []
    nodesByCategory[node.category].push(node)
  }
  for (const cat of Object.keys(nodesByCategory)) {
    nodesByCategory[cat].sort((a, b) => a.id.localeCompare(b.id))
  }

  // Spread nodes within each category cluster on a sub-ring around their centroid
  const layout = {}
  for (const cat of presentCategories) {
    const centroid = categoryCentroids[cat]
    const catNodes = nodesByCategory[cat] || []
    const n = catNodes.length

    if (n === 1) {
      // Single node: place at centroid
      layout[catNodes[0].id] = { x: centroid.x, y: centroid.y }
    } else {
      // Multiple nodes: evenly distribute on a sub-ring
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2
        // WR-08: 2-node clusters look visually stretched at full radius —
        // pull them closer (60%) so the pair reads as a single category
        // rather than two singletons. 3+ nodes naturally distribute well.
        const radius = n === 2 ? NODE_CLUSTER_RADIUS * 0.6 : NODE_CLUSTER_RADIUS
        layout[catNodes[i].id] = {
          x: centroid.x + radius * Math.cos(angle),
          y: centroid.y + radius * Math.sin(angle),
        }
      }
    }
  }

  return layout
}
