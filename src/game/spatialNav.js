export const ARROW_VECTORS = {
  ArrowRight: { dx: 1, dy: 0 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowUp: { dx: 0, dy: -1 },
}

export function findNextNode(currentId, direction, nodes, layout) {
  if (!nodes || nodes.length === 0) return currentId
  if (!layout || !layout[currentId]) return currentId
  const vec = ARROW_VECTORS[direction]
  if (!vec) return currentId
  const curr = layout[currentId]
  const candidates = nodes.filter((n) => {
    if (n.id === currentId) return false
    const p = layout[n.id]
    if (!p) return false
    return (p.x - curr.x) * vec.dx + (p.y - curr.y) * vec.dy > 0
  })
  if (candidates.length === 0) {
    const others = nodes.filter((n) => n.id !== currentId && layout[n.id])
    if (others.length === 0) return currentId
    return others.reduce((best, n) => {
      const p = layout[n.id]
      const bp = layout[best.id]
      const dotN = (p.x - curr.x) * vec.dx + (p.y - curr.y) * vec.dy
      const dotB = (bp.x - curr.x) * vec.dx + (bp.y - curr.y) * vec.dy
      return dotN < dotB ? n : best
    }, others[0]).id
  }
  return candidates.reduce((best, n) => {
    const p = layout[n.id]
    const bp = layout[best.id]
    const d = Math.hypot(p.x - curr.x, p.y - curr.y)
    const bd = Math.hypot(bp.x - curr.x, bp.y - curr.y)
    return d < bd ? n : best
  }, candidates[0]).id
}
