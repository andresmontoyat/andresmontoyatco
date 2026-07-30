export function doorPoint(site) {
  return { x: site.cx, y: site.cy + site.h / 2 + 20 }
}

export function isPlayerAtDoor(player, site, rx = 58, ry = 52) {
  const d = doorPoint(site)
  return Math.abs(player.x - d.x) < rx && Math.abs(player.y - d.y) < ry
}

export function nearestSite(player, sites) {
  for (const s of sites) if (isPlayerAtDoor(player, s)) return s
  return null
}
