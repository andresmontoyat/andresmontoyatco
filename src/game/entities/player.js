export function createPlayer() {
  return { x:120, y:394, w:26, h:36, vx:0, vy:0, onGround:false, face:1, run:0,
    buffer:0, coyote:0, jumps:0, boots:false, shield:false, sx:1, sy:1, inv:0, rideM:null }
}
export function hurt(p) {
  if (p.shield) { p.shield = false; p.inv = 55; p.vy = -5; return { lost:'shield' } }
  p.inv = 70; p.vx = -p.face * 5; p.vy = -6
  if (p.boots) { p.boots = false; return { lost:'boots' } }
  return { lost:null }
}
export function landReset(p) { p.jumps = 0; p.sx = 1.25; p.sy = 0.78 }
