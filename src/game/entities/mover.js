export function moverDelta(mover, tMs) {
  mover.px = mover.x; mover.py = mover.y
  const o = Math.sin(tMs / 1000 * mover.sp + mover.ph) * mover.rng
  if (mover.ax === 'x') mover.x = mover.ox + o; else mover.y = mover.oy + o
  return { x: mover.x, y: mover.y, dx: mover.x - mover.px, dy: mover.y - mover.py }
}
