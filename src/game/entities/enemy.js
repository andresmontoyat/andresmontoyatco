export function patrolStep(en) {
  if (en.hit > 0) en.hit--
  en.x += en.vx
  if (en.x < en.x0 || en.x > en.x1) en.vx *= -1
}
export function resolveContact(player, en) {
  if (en.dead || en.hit > 0) return 'none'
  const stomping = player.vy > 0 && (player.y + player.h - player.vy) <= en.y + (en.boss ? 14 : 8)
  if (stomping) {
    player.vy = en.boss ? -11 : -9.5
    if (en.boss) { en.hit = 28; en.hp -= 1; if (en.hp <= 0) { en.dead = 1; return 'kill' } return 'stomp' }
    en.dead = 1; return 'kill'
  }
  if (player.inv <= 0) return 'hurt'
  return 'none'
}
