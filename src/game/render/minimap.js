export function minimapDot(site, world, mapW, mapH) {
  return { x: (site.cx / world.worldW) * mapW, y: (site.cy / world.worldH) * mapH }
}
