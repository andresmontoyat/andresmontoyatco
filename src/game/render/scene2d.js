import { dialogLines } from './dialog.js'
import { BIOMES } from '../world/biomes.js'

export function render2d(ctx, state, cam) {
  const { world, player, dialog, lang } = state
  ctx.fillStyle = '#0B1020'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const s of activeSites(state)) {
    const bx = s.cx - s.w / 2 - cam.x
    const by = s.cy - cam.y
    ctx.fillStyle = s.type === 'castle' ? '#9b6fd0' : '#e6d3ad'
    ctx.fillRect(bx, by, s.w, s.h)
    ctx.fillStyle = '#eafff6'
    ctx.font = '11px monospace'
    ctx.fillText(s.co, bx, by - 6)
  }
  ctx.fillStyle = '#00C2FF'
  ctx.fillRect(player.x - player.w / 2 - cam.x, player.y - player.h / 2 - cam.y, player.w, player.h)
  if (dialog.isOpen()) {
    ctx.fillStyle = '#0d1730f2'
    ctx.fillRect(20, ctx.canvas.height - 150, ctx.canvas.width - 40, 120)
    ctx.fillStyle = '#dfeaff'
    dialog.visibleText(lang).split('\n').forEach((ln, i) => ctx.fillText(ln, 40, ctx.canvas.height - 120 + i * 22))
  }
}

export function activeSites(state) {
  return state.revealed ? state.world.sites.concat(state.world.hiddenSites) : state.world.sites
}
