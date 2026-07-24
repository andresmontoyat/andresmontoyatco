export function jumpVelocity(p, t) {
  if (p.onGround || p.coyote > 0) return t.JUMP
  if (p.boots && p.jumps < 2) return t.JUMP * 0.92
  return null
}

export function gravityStep(vy, t) {
  const g = Math.abs(vy) < t.APEX_VY ? t.GRAV * t.APEX_MULT : t.GRAV
  const next = vy + g
  return next > t.MAX_FALL ? t.MAX_FALL : next
}

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
