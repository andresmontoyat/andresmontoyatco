export function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export function hits(cx, cy, half, solids) {
  for (const s of solids) {
    if (aabb(cx - half, cy - half, half * 2, half * 2, s.x, s.y, s.w, s.h)) return true
  }
  return false
}

export function stepMovement(p, input, solids, bounds, opts = {}) {
  const sp = opts.speed || 2.6
  if (input.frozen) return { x: p.x, y: p.y, dir: p.dir, moving: false }
  let mx = 0
  let my = 0
  let dir = p.dir
  if (input.L) { mx = -sp; dir = 'left' }
  if (input.R) { mx = sp; dir = 'right' }
  if (input.U) { my = -sp; dir = 'up' }
  if (input.D) { my = sp; dir = 'down' }
  let { x, y } = p
  const half = (p.w || 20) / 2
  if (mx && !hits(x + mx, y, half, solids)) x += mx
  if (my && !hits(x, y + my, half, solids)) y += my
  x = Math.max(half, Math.min(bounds.w - half, x))
  y = Math.max(half, Math.min(bounds.h - half, y))
  return { x, y, dir, moving: !!(mx || my) }
}
