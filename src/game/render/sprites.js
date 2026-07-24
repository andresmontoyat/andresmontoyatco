import { BIOMES } from '../world/biomes.js'

const GY = 430
const PLAYER_H = 36

export function rr(ctx, x, y, w, h, r, c) {
  ctx.fillStyle = c
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const cl = v => Math.max(0, Math.min(255, v))
  return `rgb(${cl((n>>16&255)+f)},${cl((n>>8&255)+f)},${cl((n&255)+f)})`
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`
}

export function hexPath(ctx, x, y, r) {
  ctx.beginPath()
  for (let a = 0; a < 6; a++) {
    const an = a / 6 * Math.PI * 2 - Math.PI / 2
    const px = x + Math.cos(an) * r, py = y + Math.sin(an) * r
    a ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
  }
  ctx.closePath()
}

export function puffCloud(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,.92)'
  const c = [[0,0,15],[16,-6,18],[34,-2,15],[48,4,13],[10,6,14],[30,8,15]]
  c.forEach(p => { ctx.beginPath(); ctx.arc(x+p[0]*s, y+p[1]*s, p[2]*s, 0, 7); ctx.fill() })
  ctx.fillStyle = 'rgba(210,230,255,.5)'
  c.forEach(p => { ctx.beginPath(); ctx.arc(x+p[0]*s, y+(p[1]+3)*s, p[2]*s*0.85, 0, 7); ctx.fill() })
  ctx.fillStyle = 'rgba(255,255,255,.92)'
  c.forEach(p => { ctx.beginPath(); ctx.arc(x+p[0]*s, y+(p[1]-1)*s, p[2]*s*0.9, 0, 7); ctx.fill() })
}

export function drawHills(ctx, col, par, amp, ts, view) {
  const { W, H, cam } = view
  ctx.fillStyle = col
  ctx.beginPath()
  ctx.moveTo(0, H)
  for (let x = 0; x <= W; x += 20) {
    const wx = x + cam * par
    ctx.lineTo(x, H - 70 - amp * (0.5 + 0.5 * Math.sin(wx * 0.004)) - 30 * Math.sin(wx * 0.0013))
  }
  ctx.lineTo(W, H)
  ctx.closePath()
  ctx.fill()
}

export function drawCastle(ctx, e) {
  const x = e.cx, gy = GY, big = e.featured, col = BIOMES[e.biome].c
  ctx.fillStyle = '#cfd6e2'
  ctx.fillRect(x+(big?34:22)-1, gy-(big?150:96), 3, big?150:96)
  ctx.fillStyle = e.boss ? '#a855f7' : (big ? '#e0433a' : '#10b981')
  ctx.beginPath()
  ctx.moveTo(x+(big?37:25), gy-(big?150:96))
  ctx.lineTo(x+(big?37:25)+26, gy-(big?150:96)+9)
  ctx.lineTo(x+(big?37:25), gy-(big?150:96)+18)
  ctx.fill()
  if (big) {
    const st = '#c4c9d4', lit = '#dfe3ea', sd = '#9aa0ae'
    rr(ctx, x-38, gy-92, 16, 92, 7, sd); rr(ctx, x+22, gy-92, 16, 92, 7, sd)
    rr(ctx, x-38, gy-96, 16, 10, 5, st); rr(ctx, x+22, gy-96, 16, 10, 5, st)
    rr(ctx, x-30, gy-70, 60, 70, 10, st); rr(ctx, x-30, gy-70, 60, 10, 8, lit)
    for (let c=-30;c<28;c+=15) { ctx.fillStyle=st; ctx.beginPath(); ctx.arc(c+x+4, gy-72, 5, Math.PI, 0); ctx.fill() }
    ctx.fillStyle='#3a3040'; ctx.beginPath(); ctx.moveTo(x-9,gy); ctx.lineTo(x-9,gy-24); ctx.arc(x,gy-24,9,Math.PI,0); ctx.lineTo(x+9,gy); ctx.fill()
    ctx.fillStyle='#ffd45e'; ctx.beginPath(); ctx.arc(x-20,gy-52,4.5,0,7); ctx.arc(x+20,gy-52,4.5,0,7); ctx.fill()
    rr(ctx, x-30, gy-9, 60, 6, 3, e.boss?'#a855f7':col)
    rr(ctx, x-14, gy-66, 28, 20, 8, '#2a2f3a'); rr(ctx, x-11, gy-63, 22, 14, 6, '#fff')
    ctx.fillStyle='#f2a20a'; ctx.font='800 14px ui-monospace,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.fillText('★', x, gy-55); ctx.textBaseline='alphabetic'; ctx.textAlign='start'
  } else {
    const hc = col
    rr(ctx, x-18, gy-34, 36, 34, 8, shade(hc,-12))
    ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(x, gy-34, 18, Math.PI, 0); ctx.fill()
    ctx.fillStyle = shade(hc,28); ctx.beginPath(); ctx.arc(x, gy-34, 18, Math.PI, 1.15*Math.PI); ctx.fill()
    ctx.fillStyle = '#3a3040'; ctx.beginPath(); ctx.moveTo(x-7,gy); ctx.lineTo(x-7,gy-14); ctx.arc(x,gy-14,7,Math.PI,0); ctx.lineTo(x+7,gy); ctx.fill()
  }
  const nm = e.co, w = nm.length*6.2+16, sy = gy-(big?178:124)
  rr(ctx, x-w/2, sy, w, 30, 8, 'rgba(6,20,38,.82)')
  ctx.strokeStyle = hexA(col,.7); ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(x-w/2, sy, w, 30, 8); ctx.stroke()
  ctx.fillStyle = '#eaf1ff'; ctx.font='700 10px ui-monospace,monospace'; ctx.textAlign='center'
  ctx.fillText(nm, x, sy+13)
  ctx.fillStyle = '#ffe09a'; ctx.font='700 9px ui-monospace,monospace'
  ctx.fillText(e.y, x, sy+25); ctx.textAlign='start'
}

// cx/gy = mascot's world-space feet-center point; opts mirrors the player entity's visual fields.
// Body proportions are baked into the fixed pixel offsets below (matches entities/player.js h:36),
// same as the prototype's drawPlayer which read them off the player object directly.
export function drawMascot(ctx, cx, gy, opts) {
  const { face: f, run, air, sx, sy, inv, boots, shield } = opts
  ctx.fillStyle = 'rgba(0,0,0,.16)'
  ctx.beginPath(); ctx.ellipse(cx, gy+2, 13, 4, 0, 0, 7); ctx.fill()
  const flash = inv > 0 && Math.floor(performance.now()/80) % 2 === 0
  ctx.save()
  ctx.globalAlpha = flash ? 0.35 : 1
  ctx.translate(cx, gy)
  ctx.scale(f*sx, sy)
  const RB = (x,y,w,h,r,c) => { ctx.fillStyle=c; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill() }
  if (boots) {
    ctx.fillStyle='#12c990'
    ctx.beginPath(); ctx.roundRect(-8,-3,7,4,2); ctx.fill()
    ctx.beginPath(); ctx.roundRect(1,-3,7,4,2); ctx.fill()
  }
  const lp = air ? 3 : Math.sin(run)*3
  RB(-7,-9+(air?-2:Math.max(0,lp)),6,10,3,'#274a86'); RB(1,-9+(air?-2:Math.max(0,-lp)),6,10,3,'#274a86')
  RB(-7,-2,7,4,2,'#1c3765'); RB(1,-2,7,4,2,'#1c3765')
  RB(-10,-27,20,20,9,'#3b82f6'); RB(-10,-27,20,8,8,'#5a9bf8')
  ctx.fillStyle='#2a68d0'; ctx.beginPath(); ctx.arc(-4,-14,1.6,0,7); ctx.arc(4,-14,1.6,0,7); ctx.fill()
  RB(-13,-25,5,11,3,'#f0bd93'); RB(8,-25-(air?4:0),5,11,3,'#f0bd93')
  ctx.fillStyle='#f4c69c'; ctx.beginPath(); ctx.arc(0,-34,11,0,7); ctx.fill()
  ctx.fillStyle='rgba(240,130,120,.5)'; ctx.beginPath(); ctx.arc(-6,-31,2.6,0,7); ctx.arc(6,-31,2.6,0,7); ctx.fill()
  ctx.fillStyle='#2a2230'; ctx.beginPath(); ctx.arc(-3.5,-35,1.8,0,7); ctx.arc(4.5,-35,1.8,0,7); ctx.fill()
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-3,-35.6,.7,0,7); ctx.arc(5,-35.6,.7,0,7); ctx.fill()
  ctx.strokeStyle='#b5654a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(1,-31,3.4,.15*Math.PI,.85*Math.PI); ctx.stroke()
  ctx.fillStyle='#10b981'; ctx.beginPath(); ctx.arc(0,-40,11,Math.PI,0); ctx.fill()
  RB(-11,-41,22,4,2,'#0e9d73'); RB(4,-42,14,4,3,'#12c990')
  ctx.fillStyle='#0b8f68'; ctx.beginPath(); ctx.arc(0,-44,2.4,0,7); ctx.fill()
  ctx.restore()
  if (shield) {
    const rx = cx, ry = gy - PLAYER_H/2 - 4, rad = 24 + Math.sin(performance.now()/200)*2
    ctx.strokeStyle='rgba(75,184,230,.9)'; ctx.lineWidth=2.5; ctx.fillStyle='rgba(75,184,230,.10)'
    ctx.beginPath()
    for (let a=0;a<6;a++) { const an=a/6*Math.PI*2-Math.PI/2, px=rx+Math.cos(an)*rad, py=ry+Math.sin(an)*rad; a?ctx.lineTo(px,py):ctx.moveTo(px,py) }
    ctx.closePath(); ctx.fill(); ctx.stroke()
  }
}

export function drawBug(ctx, en, lang) {
  const sc = en.w/28, x = en.x + en.w/2, h = en.h, wob = Math.sin(en.t)*1.5*sc, dir = en.vx>0?1:-1
  const flash = en.hit>0 && Math.floor(en.hit/3)%2===0, body = flash?'#ffffff':en.col
  ctx.fillStyle='rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(x, en.y+h, 12*sc, 3.5*sc, 0, 0, 7); ctx.fill()
  ctx.fillStyle=shade(en.col,-30); ctx.beginPath(); ctx.arc(x-6*sc, en.y+h-2+wob, 3*sc, 0, 7); ctx.arc(x+6*sc, en.y+h-2-wob, 3*sc, 0, 7); ctx.fill()
  ctx.fillStyle=body; ctx.beginPath(); ctx.roundRect(x-13*sc, en.y+2, 26*sc, h-4, 10*sc); ctx.fill()
  ctx.fillStyle=flash?'#fff':shade(en.col,26); ctx.beginPath(); ctx.roundRect(x-13*sc, en.y+2, 26*sc, 7*sc, 6*sc); ctx.fill()
  ctx.strokeStyle=body; ctx.lineWidth=2*sc
  ctx.beginPath(); ctx.moveTo(x-5*sc, en.y+3); ctx.lineTo(x-8*sc, en.y-6*sc); ctx.moveTo(x+5*sc, en.y+3); ctx.lineTo(x+8*sc, en.y-6*sc); ctx.stroke()
  ctx.fillStyle='#ffcf3a'; ctx.beginPath(); ctx.arc(x-8*sc, en.y-7*sc, 2*sc, 0, 7); ctx.arc(x+8*sc, en.y-7*sc, 2*sc, 0, 7); ctx.fill()
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x-5*sc, en.y+11*sc, 4*sc, 0, 7); ctx.arc(x+5*sc, en.y+11*sc, 4*sc, 0, 7); ctx.fill()
  ctx.fillStyle='#c0263a'; ctx.beginPath(); ctx.arc(x-5*sc+dir, en.y+12*sc, 2*sc, 0, 7); ctx.arc(x+5*sc+dir, en.y+12*sc, 2*sc, 0, 7); ctx.fill()
  ctx.fillStyle='rgba(255,255,255,.55)'; ctx.font='800 '+(8*sc)+'px ui-monospace,monospace'; ctx.textAlign='center'
  ctx.fillText(en.boss?'NULL':'∅', x, en.y+h-4*sc); ctx.textAlign='start'
  if (en.boss) {
    for (let k=0;k<3;k++) { ctx.fillStyle = k<en.hp?'#e0433a':'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.arc(x-14+k*14, en.y-14, 4, 0, 7); ctx.fill() }
    ctx.fillStyle='#eaddff'; ctx.font='700 9px ui-monospace,monospace'; ctx.textAlign='center'
    ctx.fillText(lang==='en'?'LEGACY BOSS':'BOSS LEGACY', x, en.y-26); ctx.textAlign='start'
  }
}

export function drawBoot(ctx, x, y) {
  ctx.fillStyle='#10b981'
  ctx.beginPath(); ctx.roundRect(x-7,y-9,10,13,3); ctx.fill()
  ctx.beginPath(); ctx.roundRect(x-9,y+2,16,6,3); ctx.fill()
  ctx.fillStyle='#0b8f68'
  for (let s=0;s<3;s++) { ctx.beginPath(); ctx.roundRect(x-9,y+8+s*3,16,2,1); ctx.fill() }
  ctx.fillStyle='#bff3e0'
  ctx.beginPath(); ctx.roundRect(x-6,y-8,4,5,2); ctx.fill()
}

export function drawShieldHex(ctx, x, y, r) {
  ctx.fillStyle='#4bb8e6'; hexPath(ctx, x, y, r); ctx.fill()
  ctx.fillStyle='#2a86b8'; hexPath(ctx, x, y, r); ctx.lineWidth=2; ctx.strokeStyle='#2a86b8'; ctx.stroke()
  ctx.fillStyle='#bfeaff'; hexPath(ctx, x, y, r*5/11); ctx.fill()
}

export function drawMover(ctx, m) {
  rr(ctx, m.x, m.y, m.w, m.h, 8, '#3a4a63')
  rr(ctx, m.x+3, m.y+3, m.w-6, 6, 4, '#5b7699')
  ctx.fillStyle = 'rgba(16,185,129,.7)'
  for (let k=0;k<3;k++) {
    const ax = m.x + m.w/2 - 14 + k*14
    ctx.beginPath(); ctx.moveTo(ax, m.y+13); ctx.lineTo(ax+5, m.y+9); ctx.lineTo(ax+10, m.y+13); ctx.fill()
  }
}

export function drawCoin(ctx, c, tMs) {
  const wob = Math.abs(Math.sin(tMs/150 + c.x)), rx = 5 + wob*3
  ctx.fillStyle='#f0b400'; ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, 9, 0, 0, 7); ctx.fill()
  ctx.fillStyle='#ffd94a'; ctx.beginPath(); ctx.ellipse(c.x, c.y, rx*0.62, 6.5, 0, 0, 7); ctx.fill()
  ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(c.x-rx*0.2, c.y-2.5, rx*0.18, 2, 0, 0, 7); ctx.fill()
}

export function drawCrate(ctx, q) {
  const c = q.used ? '#b79a6a' : '#f5b83e'
  rr(ctx, q.x, q.y, q.w, q.h, 9, c)
  rr(ctx, q.x+3, q.y+3, q.w-6, 8, 5, q.used ? '#cbb187' : '#ffd777')
  if (!q.used) {
    ctx.fillStyle='#8a5410'; ctx.font='800 22px ui-monospace,monospace'
    ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.fillText('?', q.x+q.w/2, q.y+q.h/2+1)
    ctx.textBaseline='alphabetic'; ctx.textAlign='start'
  } else {
    ctx.strokeStyle='rgba(120,90,40,.5)'; ctx.lineWidth=3
    ctx.strokeRect(q.x+11, q.y+11, q.w-22, q.h-22)
  }
}
