import { BIOMES } from '../world/biomes.js'
import { rr, shade, hexPath } from './sprites.js'

// toast payload shape (built by the engine, drawn here):
//   { born, until, i, victory?, pu?:'boots'|'shield', lost?:'boots'|'shield', company? }
// - i === -1            -> banner toast (victory / powerup-gained / powerup-lost); no company needed
// - i !== -1 (company)  -> company toast; `company` carries { co, y, biome, role:{en,es}, metric } —
//                          the same shape mapExperienceToCompanies() (src/game/world/companies.js) produces
// drawToast is pure: it does not mutate/expire `toast`, the caller owns that state transition.

export function drawHud(ctx, { W, coinCount, player, biome, progress, lang }) {
  rr(ctx, 12, 12, 116, 30, 8, 'rgba(6,16,30,.55)')
  ctx.fillStyle = '#ffd94a'
  ctx.beginPath(); ctx.ellipse(30, 27, 6, 9, 0, 0, 7); ctx.fill()
  ctx.fillStyle = '#fff'; ctx.font = '700 15px ui-monospace,monospace'; ctx.textAlign = 'left'
  ctx.fillText('× ' + coinCount, 42, 32)
  let ix = 136
  if (player.boots) {
    rr(ctx, ix, 12, 34, 30, 8, 'rgba(8,40,28,.7)')
    ctx.fillStyle = '#10b981'
    ctx.beginPath(); ctx.roundRect(ix+10, 20, 7, 10, 2); ctx.fill()
    ctx.beginPath(); ctx.roundRect(ix+8, 29, 13, 5, 2); ctx.fill()
    ix += 40
  }
  if (player.shield) {
    rr(ctx, ix, 12, 34, 30, 8, 'rgba(8,34,46,.7)')
    ctx.fillStyle = '#4bb8e6'; hexPath(ctx, ix+17, 27, 9); ctx.fill()
    ctx.fillStyle = '#bfeaff'; hexPath(ctx, ix+17, 27, 4); ctx.fill()
  }
  const B = BIOMES[biome], lab = B.label[lang]
  ctx.textAlign = 'center'; ctx.font = '700 12px ui-monospace,monospace'
  const w = lab.length*7.3 + 30
  rr(ctx, W/2 - w/2, 12, w, 30, 8, 'rgba(6,16,30,.55)')
  ctx.fillStyle = shade(B.c, 50); ctx.fillText(lab.toUpperCase(), W/2, 32)
  ctx.fillStyle = 'rgba(255,255,255,.25)'
  rr(ctx, W/2 - 90, 44, 180, 4, 2, 'rgba(255,255,255,.25)')
  ctx.fillStyle = B.c
  rr(ctx, W/2 - 90, 44, 180*progress, 4, 2, B.c)
  ctx.textAlign = 'start'
}

export function drawToast(ctx, { W, toast, lang, nowMs }) {
  if (!toast || nowMs > toast.until) return
  if (toast.i === -1) {
    const kin = Math.min(1, (nowMs - toast.born)/200)
    const kout = Math.min(1, (toast.until - nowMs)/200)
    const a = Math.min(kin, kout)
    let msg, bg, fg
    if (toast.victory) { msg = lang==='en' ? '★ CAREER CLEARED · 2007 → 2026 ★' : '★ CARRERA COMPLETADA · 2007 → 2026 ★'; bg='rgba(8,30,50,.96)'; fg='#ffd94a' }
    else if (toast.pu === 'shield') { msg = lang==='en' ? 'HEXAGONAL SHIELD! blocks one hit' : 'HEXAGONAL SHIELD! bloquea un golpe'; bg='rgba(8,34,46,.94)'; fg='#4bb8e6' }
    else if (toast.pu) { msg = lang==='en' ? 'SPRING BOOTS! double-jump unlocked' : 'SPRING BOOTS! doble salto'; bg='rgba(8,40,28,.94)'; fg='#10b981' }
    else if (toast.lost === 'shield') { msg = lang==='en' ? 'Shield broke!' : '¡Escudo roto!'; bg='rgba(50,18,24,.94)'; fg='#e8677a' }
    else { msg = lang==='en' ? 'Ouch — boots lost' : 'Ay — perdiste las boots'; bg='rgba(50,18,24,.94)'; fg='#e8677a' }
    const cw = Math.min(400, W-40), cx = W/2
    ctx.globalAlpha = a
    rr(ctx, cx-cw/2, 64, cw, 34, 10, bg)
    ctx.fillStyle = fg; ctx.font = '800 13px ui-monospace,monospace'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(msg, cx, 82)
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'start'; ctx.globalAlpha = 1
    return
  }
  const e = toast.company, b = BIOMES[e.biome]
  const kin = Math.min(1, (nowMs - toast.born)/200)
  const kout = Math.min(1, (toast.until - nowMs)/200)
  const a = Math.min(kin, kout), yy = 64 - (1-kin)*20
  const cw = Math.min(360, W-40), cx = W/2
  ctx.globalAlpha = a
  rr(ctx, cx-cw/2, yy, cw, 52, 10, 'rgba(8,18,34,.92)')
  rr(ctx, cx-cw/2, yy, 5, 52, 3, b.c)
  ctx.textAlign = 'left'; ctx.fillStyle = b.c; ctx.font = '700 9px ui-monospace,monospace'
  ctx.fillText((e.role[lang]||'').toUpperCase() + '  ·  ' + e.y, cx-cw/2+16, yy+16)
  ctx.fillStyle = '#eaf1ff'; ctx.font = '800 16px ui-monospace,monospace'
  ctx.fillText(e.co, cx-cw/2+16, yy+35)
  if (e.metric && e.metric.value) {
    ctx.fillStyle = b.c; ctx.font = '800 15px ui-monospace,monospace'; ctx.textAlign = 'right'
    ctx.fillText(e.metric.value, cx+cw/2-16, yy+31)
  }
  ctx.fillStyle = 'rgba(200,214,240,.7)'; ctx.font = '600 8px ui-monospace,monospace'; ctx.textAlign = 'right'
  ctx.fillText(lang==='en' ? '↵ / tap for details' : '↵ / toca para detalle', cx+cw/2-16, yy+45)
  ctx.textAlign = 'left'; ctx.globalAlpha = 1
}
