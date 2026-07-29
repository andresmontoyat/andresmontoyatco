import { nearestBiome, tileNameFor, walkFrame } from './tiles.js'
import { BIOMES } from '../world/biomes.js'

const TILE = 32
const AVATAR_W = 40
const AVATAR_H = 44
// cyber/castillo share the same "cliff" ground texture (see manifest.js) and are told apart
// by this light per-biome color wash — kept low so the tile texture stays visible underneath,
// unlike the old 0.35-alpha flat tint that read as a solid color block.
const STONE_ERA_TINT_ALPHA = 0.12

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
        ctx.globalAlpha = STONE_ERA_TINT_ALPHA
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

function drawAvatar(ctx, state, cam, sprites) {
  const { player } = state
  const name = walkFrame(player.dir === 'left' ? 'right' : player.dir, player.moving ? player.step : 0)
  const dx = player.x - AVATAR_W / 2 - cam.x
  const dy = player.y - AVATAR_H / 2 - cam.y
  if (player.dir === 'left') sprites.drawFlipped(ctx, name, dx, dy, AVATAR_W, AVATAR_H)
  else sprites.draw(ctx, name, dx, dy, AVATAR_W, AVATAR_H)
}

// Ground-contact footprint (world w/h) per decor type — used both to size the sprite and to
// bottom-anchor it at d.y, so d.y stays the item's "feet" for both placement and y-sorting.
const DECOR_DIMS = {
  tree: { w: 64, h: 80 },
  tree_small: { w: 32, h: 48 },
  bush: { w: 16, h: 16 },
  rock: { w: 16, h: 16 },
  flower: { w: 16, h: 16 },
  fence: { w: 16, h: 32 },
}

function drawDecorItem(ctx, d, cam, sprites) {
  const dim = DECOR_DIMS[d.type]
  const dx = d.x - dim.w / 2 - cam.x
  const dy = d.y - dim.h - cam.y
  sprites.draw(ctx, d.type, dx, dy, dim.w, dim.h)
}

function buildingDrawable(s, cam) {
  return {
    baseY: s.cy + s.h,
    draw: (ctx, sprites) => {
      const bx = s.cx - s.w / 2 - cam.x
      const by = s.cy - cam.y
      sprites.draw(ctx, s.type === 'castle' ? 'castle' : 'house', bx, by, s.w, s.h)
      drawBuildingLabel(ctx, s, bx, by)
    },
  }
}

// Buildings, decor, and the avatar all draw in one y-sorted pass (sorted by each item's
// ground-contact baseY) so things nearer the bottom of the screen correctly occlude things
// behind them, instead of buildings/avatar always drawing on top of decor regardless of depth.
function depthSortedDrawables(state, cam) {
  const buildings = activeSites(state).map(s => buildingDrawable(s, cam))
  const drawOne = d => (ctx, sprites) => drawDecorItem(ctx, d, cam, sprites)
  const decor = (state.decor || []).map(d => ({ baseY: d.y, draw: drawOne(d) }))
  const { player } = state
  const avatar = { baseY: player.y + player.h / 2, draw: (ctx, sprites) => drawAvatar(ctx, state, cam, sprites) }
  return buildings.concat(decor, [avatar]).sort((a, b) => a.baseY - b.baseY)
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
    depthSortedDrawables(state, cam).forEach(item => item.draw(ctx, sprites))
  }
  drawDialog(ctx, state)
}
