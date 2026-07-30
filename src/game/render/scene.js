// Scene compositor — ported from the prototype's `draw(ts)` + its `drawEnemies`/`drawMovers`/
// `drawPowerups`/`hexPath`/`biomeAtX`/`zones` helpers. Delegates all per-entity pixel work to
// render/sprites.js, render/particles.js and render/hud.js (Phase 2 modules); this file only owns
// draw ORDER, world/screen space (camera translate + shake), and the bits the prototype drew inline
// that never got their own sprites.js export (terrain solids, the powerup glow ring, zone→biome lookup).
import { BIOMES } from '../world/biomes.js'
import { shakeOffset } from '../engine/camera.js'
import {
  rr, shade,
  drawHills, puffCloud, drawMover, drawCrate, drawCoin, drawCastle,
  drawShieldHex, drawBoot, drawBug, drawMascot,
} from './sprites.js'
import { drawParticles } from './particles.js'
import { drawPopups } from './popups.js'
import { drawHud, drawToast } from './hud.js'

// Prototype's `zones`/`biomeAtX`: one contiguous x-range per run of same-biome companies, boundary
// at the midpoint between the last company of one biome and the first of the next. Not extracted to
// world/biomes.js because it depends on `level.companies` positions (a render-time concern), and no
// other module needed it — kept local to scene.js, recomputed per frame (cheap: ~11 companies).
function computeZones(companies, levelW) {
  const zones = []
  let zs = 0
  for (let i = 1; i <= companies.length; i++) {
    if (i === companies.length || companies[i].biome !== companies[i - 1].biome) {
      const x1 = i === companies.length ? levelW : (companies[i - 1].cx + companies[i].cx) / 2
      zones.push({ biome: companies[i - 1].biome, x0: zs, x1 })
      zs = x1
    }
  }
  return zones
}

function biomeAtX(zones, x) {
  for (const z of zones) if (x >= z.x0 && x < z.x1) return z.biome
  return zones[zones.length - 1].biome
}

function drawSky(ctx, W, H, biome) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, biome.sky[0])
  g.addColorStop(1, biome.sky[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function drawClouds(ctx, W, camX) {
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 420 - camX * 0.3) % (W + 300)) - 150 + (i * 80 % 200)
    const cy = 60 + (i * 37 % 100)
    puffCloud(ctx, cx, cy, 1 + (i % 3) * 0.15)
  }
}

// Ground/platform/stair rendering never got a sprites.js wrapper (Task 8 only extracted entity
// sprites) — ported verbatim from the prototype's `for(const s of solids){...}` block.
function drawSolid(ctx, s, zones) {
  const bi = BIOMES[biomeAtX(zones, s.x + s.w / 2)]
  if (s.ground) {
    rr(ctx, s.x, s.y + 10, s.w, s.h, 0, '#8a5a34')
    ctx.fillStyle = 'rgba(0,0,0,.10)'
    ctx.fillRect(s.x, s.y + 10, s.w, s.h)
    rr(ctx, s.x, s.y, s.w, 20, 10, bi.ground)
    ctx.fillStyle = shade(bi.ground, 22)
    for (let bx = s.x + 8; bx < s.x + s.w; bx += 26) { ctx.beginPath(); ctx.arc(bx, s.y + 3, 7, Math.PI, 0); ctx.fill() }
    rr(ctx, s.x, s.y + 15, s.w, 4, 0, shade(bi.ground, -30))
  } else {
    rr(ctx, s.x, s.y, s.w, s.h, 9, '#d98a44')
    rr(ctx, s.x + 3, s.y + 3, s.w - 6, 7, 5, '#f0b471')
    ctx.fillStyle = 'rgba(120,70,25,.35)'
    for (let bx = s.x + 18; bx < s.x + s.w - 6; bx += 22) { ctx.beginPath(); ctx.arc(bx, s.y + s.h * 0.6, 1.6, 0, 7); ctx.fill() }
  }
}

function inView(x, w, camX, W) {
  return !(x + w < camX - 40 || x > camX + W + 40)
}

function drawTerrain(ctx, solids, zones, camX, W) {
  for (const s of solids) { if (inView(s.x, s.w, camX, W)) drawSolid(ctx, s, zones) }
}

function drawMovers(ctx, movers, camX, W) {
  for (const m of movers) { if (inView(m.x, m.w, camX, W)) drawMover(ctx, m) }
}

function drawQblocks(ctx, qblocks, camX, W) {
  for (const q of qblocks) { if (inView(q.x, q.w, camX, W)) drawCrate(ctx, q) }
}

// Coin "pop" animation (Q-block spawned coins float up before settling) is a state mutation done
// inside the prototype's draw() itself — ported as-is, not moved to the physics step.
function drawCoins(ctx, coins, camX, W, tsMs) {
  for (const c of coins) {
    if (c.got || !inView(c.x, 0, camX, W)) continue
    if (c.pop) { c.y -= 1.4; c.pop -= 1; if (c.pop <= 0) c.got = true }
    drawCoin(ctx, c, tsMs)
  }
}

function drawCastles(ctx, companies, camX, W) {
  for (const e of companies) { if (!(e.cx + 140 < camX || e.cx - 140 > camX + W)) drawCastle(ctx, e) }
}

// The outer glow ring never got a sprites.js wrapper either — ported from `drawPowerups`.
function drawPowerups(ctx, powerups, camX, W) {
  for (const pu of powerups) {
    if (pu.taken || !inView(pu.x, pu.w, camX, W)) continue
    const x = pu.x + 13, y = pu.y + 13 + Math.sin(pu.t) * 3, isShield = pu.type === 'shield'
    ctx.fillStyle = isShield ? 'rgba(75,184,230,.25)' : 'rgba(16,185,129,.25)'
    ctx.beginPath(); ctx.arc(x, y, 17 + Math.sin(pu.t) * 2, 0, 7); ctx.fill()
    if (isShield) drawShieldHex(ctx, x, y, 11); else drawBoot(ctx, x, y)
  }
}

function drawEnemies(ctx, enemies, camX, W, lang) {
  for (const en of enemies) { if (!en.dead && inView(en.x, en.w, camX, W)) drawBug(ctx, en, lang) }
}

function drawPlayer(ctx, player) {
  const gy = player.y + player.h
  drawMascot(ctx, player.x + player.w / 2, gy, {
    face: player.face, run: player.run, air: !player.onGround,
    sx: player.sx, sy: player.sy, inv: player.inv, boots: player.boots, shield: player.shield,
  })
}

export function drawScene(ctx, state) {
  const { W, H, player, level, cam, particles, popups, coinCount, lang, shake, reduced } = state
  const tsMs = state.tsMs || 0
  const zones = computeZones(level.companies, level.levelW)
  const biome = biomeAtX(zones, player.x)
  // Reduced motion: freeze the background-layer parallax drift (hills/clouds) at a static
  // offset instead of tracking `cam.x` — the world-space camera translate below is untouched
  // so gameplay/movement stays identical, only the cosmetic depth-drift is disabled.
  const parCam = reduced ? 0 : cam.x

  drawSky(ctx, W, H, BIOMES[biome])
  drawHills(ctx, BIOMES[biome].hill2, 0.25, 90, tsMs, { W, H, cam: parCam })
  drawHills(ctx, BIOMES[biome].hill, 0.5, 150, tsMs, { W, H, cam: parCam })
  drawClouds(ctx, W, parCam)

  const { x: shx, y: shy } = shakeOffset(shake)
  ctx.save()
  ctx.translate(-cam.x + shx, shy)

  drawTerrain(ctx, level.solids, zones, cam.x, W)
  drawMovers(ctx, level.movers, cam.x, W)
  drawQblocks(ctx, level.qblocks, cam.x, W)
  drawCoins(ctx, level.coins, cam.x, W, tsMs)
  drawCastles(ctx, level.companies, cam.x, W)
  drawPowerups(ctx, level.powerups, cam.x, W)
  drawEnemies(ctx, level.enemies, cam.x, W, lang)
  drawPlayer(ctx, player)
  drawParticles(ctx, particles)
  drawPopups(ctx, popups)

  ctx.restore()

  drawHud(ctx, { W, coinCount, player, biome, progress: player.x / level.levelW, lang })
  drawToast(ctx, { W, toast: state.toast, lang, nowMs: tsMs })
}
