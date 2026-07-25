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

export function resolveHorizontal(p, solids) {
  for (const s of solids) {
    if (!aabb(p, s)) continue
    if (p.vx > 0) p.x = s.x - p.w
    else if (p.vx < 0) p.x = s.x + s.w
    p.vx = 0
  }
}

export function resolveVertical(p, solids) {
  let landedOn = null, hitHead = null
  p.onGround = false
  for (const s of solids) {
    if (!aabb(p, s)) continue
    if (p.vy > 0) { p.y = s.y - p.h; p.vy = 0; p.onGround = true; landedOn = s }
    else if (p.vy < 0) { p.y = s.y + s.h; p.vy = 0; hitHead = s }
  }
  return { landedOn, hitHead }
}
