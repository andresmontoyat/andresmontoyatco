import { nearestBiome, tileNameFor, walkFrame } from './tiles.js'
import { BIOMES } from '../world/biomes.js'

const TILE = 32
const AVATAR_W = 32
const AVATAR_H = 36
const CYBER_ERA_TINT_ALPHA = 0.35

export function activeSites(state) {
  return state.revealed ? state.world.sites.concat(state.world.hiddenSites) : state.world.sites
}

function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax
  const aby = by - ay
  const lenSq = abx * abx + aby * aby
  const t = lenSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq)) : 0
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t))
}

export function nearestPathDist(path, wx, wy) {
  let min = Infinity
  for (let i = 0; i < path.length - 1; i += 1) {
    const d = distToSegment(wx, wy, path[i].x, path[i].y, path[i + 1].x, path[i + 1].y)
    if (d < min) min = d
  }
  return min
}

export function visibleTileRange(cam, vw, vh, tile) {
  return {
    x0: Math.floor(cam.x / tile) - 1,
    y0: Math.floor(cam.y / tile) - 1,
    x1: Math.ceil((cam.x + vw) / tile) + 1,
    y1: Math.ceil((cam.y + vh) / tile) + 1,
  }
}

function regionsWithFarm(world) {
  return world.regions.concat([{ bi: 'farm', x: world.farm.x, y: world.farm.y }])
}

function drawGround(ctx, state, cam, sprites) {
  const { world } = state
  const anchors = regionsWithFarm(world)
  const { x0, y0, x1, y1 } = visibleTileRange(cam, ctx.canvas.width, ctx.canvas.height, TILE)
  for (let ty = y0; ty < y1; ty += 1) {
    for (let tx = x0; tx < x1; tx += 1) {
      const wx = tx * TILE + TILE / 2
      const wy = ty * TILE + TILE / 2
      const bi = nearestBiome(anchors, wx, wy)
      const dist = nearestPathDist(world.path, wx, wy)
      const name = tileNameFor(bi, wx, wy, dist)
      const sx = tx * TILE - cam.x
      const sy = ty * TILE - cam.y
      sprites.draw(ctx, name, sx, sy, TILE, TILE)
      if (bi === 'cyber' || bi === 'castillo') {
        ctx.save()
        ctx.globalAlpha = CYBER_ERA_TINT_ALPHA
        ctx.fillStyle = BIOMES[bi].c
        ctx.fillRect(sx, sy, TILE, TILE)
        ctx.restore()
      }
    }
  }
}

function drawBuildingLabel(ctx, s, bx, by) {
  ctx.fillStyle = '#eafff6'
  ctx.font = '11px monospace'
  ctx.fillText(s.co, bx, by - 6)
  if (s.seen) ctx.fillText('✓', bx + s.w - 10, by - 6)
}

function drawBuildings(ctx, state, cam, sprites) {
  activeSites(state).forEach(s => {
    const bx = s.cx - s.w / 2 - cam.x
    const by = s.cy - cam.y
    sprites.draw(ctx, s.type === 'castle' ? 'castle' : 'house', bx, by, s.w, s.h)
    drawBuildingLabel(ctx, s, bx, by)
  })
}

function drawAvatar(ctx, state, cam, sprites) {
  const { player } = state
  const name = walkFrame(player.dir === 'left' ? 'right' : player.dir, player.moving ? player.step : 0)
  const dx = player.x - AVATAR_W / 2 - cam.x
  const dy = player.y - AVATAR_H / 2 - cam.y
  if (player.dir === 'left') sprites.drawFlipped(ctx, name, dx, dy, AVATAR_W, AVATAR_H)
  else sprites.draw(ctx, name, dx, dy, AVATAR_W, AVATAR_H)
}

function drawPlaceholderScene(ctx, state, cam) {
  const { player } = state
  activeSites(state).forEach(s => {
    const bx = s.cx - s.w / 2 - cam.x
    const by = s.cy - cam.y
    ctx.fillStyle = s.type === 'castle' ? '#9b6fd0' : '#e6d3ad'
    ctx.fillRect(bx, by, s.w, s.h)
    drawBuildingLabel(ctx, s, bx, by)
  })
  ctx.fillStyle = '#00C2FF'
  ctx.fillRect(player.x - player.w / 2 - cam.x, player.y - player.h / 2 - cam.y, player.w, player.h)
}

function drawDialog(ctx, state) {
  const { dialog, lang } = state
  if (!dialog.isOpen()) return
  ctx.fillStyle = '#0d1730f2'
  ctx.fillRect(20, ctx.canvas.height - 150, ctx.canvas.width - 40, 120)
  ctx.fillStyle = '#dfeaff'
  dialog.visibleText(lang).split('\n').forEach((ln, i) => ctx.fillText(ln, 40, ctx.canvas.height - 120 + i * 22))
}

export function render2d(ctx, state, cam) {
  const { sprites } = state
  ctx.fillStyle = '#0B1020'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  if (!sprites) {
    drawPlaceholderScene(ctx, state, cam)
  } else {
    drawGround(ctx, state, cam, sprites)
    drawBuildings(ctx, state, cam, sprites)
    drawAvatar(ctx, state, cam, sprites)
  }
  drawDialog(ctx, state)
}
