export function applyPowerup(player, type) {
  if (type === 'shield') player.shield = true
  else player.boots = true
}
