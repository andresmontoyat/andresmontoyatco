// Composition root — ported from the prototype's `physics()` + boot sequence. Wires every Phase 1-3
// pure module (world/engine/entities/render/audio) into one mutable `state` object and exposes the
// game as start/stop/tick, matching the prototype's `function loop(ts){...}` + `physics()` 1:1.
import { biomeForYear } from './world/biomes.js'
import { mapExperienceToCompanies } from './world/companies.js'
import { buildLevel } from './world/level.js'
import { TUNING } from './engine/tuning.js'
import { jumpVelocity, gravityStep, aabb, resolveHorizontal, resolveVertical } from './engine/physics.js'
import { followCamera } from './engine/camera.js'
import { createInput } from './engine/input.js'
import { createPlayer, hurt, landReset } from './entities/player.js'
import { patrolStep, resolveContact } from './entities/enemy.js'
import { applyPowerup } from './entities/powerup.js'
import { moverDelta } from './entities/mover.js'
import { createParticles, burst, updateParticles } from './render/particles.js'
import { createAudio, initAudio, sfx, setMuted as setAudioMuted } from './audio/sfx.js'
import { drawScene } from './render/scene.js'
import { createLoop } from './engine/loop.js'
import experienceData from '../data/experience.json'

const WIN_COLORS = ['#10b981', '#3b82f6', '#ffd94a', '#a855f7', '#e0433a']
const NEAR_CASTLE_RANGE = 72
const TAP_OPEN_RANGE = 110
const TOAST_COMPANY_RANGE = 46

function buildState({ locale, reduced }) {
  const companies = mapExperienceToCompanies(experienceData, biomeForYear)
  const level = buildLevel(companies)
  return {
    W: 0, H: 0,
    player: createPlayer(),
    level,
    cam: { x: 0 },
    coinCount: 0,
    paused: false,
    curCo: 0,
    seenToast: new Set(),
    toast: null,
    hitstop: 0,
    shake: 0,
    particles: createParticles(),
    audio: createAudio(),
    input: createInput(),
    lang: locale,
    reduced,
    tsMs: 0,
  }
}

function resize(canvas, ctx, state) {
  const r = canvas.getBoundingClientRect()
  state.W = r.width
  state.H = r.height
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2)
  canvas.width = state.W * dpr
  canvas.height = state.H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.imageSmoothingEnabled = true
}

function nearCastle(state) {
  const { player, level } = state
  for (let i = 0; i < level.companies.length; i++) {
    if (Math.abs((player.x + player.w / 2) - level.companies[i].cx) < NEAR_CASTLE_RANGE) return i
  }
  return -1
}

function openCompany(state, index, onOpenPanel) {
  if (index < 0) return
  state.paused = true
  if (onOpenPanel) onOpenPanel(state.level.companies[index])
}

function win(state, tsMs) {
  if (!state.reduced) {
    for (let k = 0; k < 44; k++) {
      burst(state.particles, state.player.x + state.player.w / 2, state.player.y - 10, 1,
        { c: WIN_COLORS[k % 5], spread: 6, up: 4.5, grav: 0.14, r: 3.6 })
    }
  }
  sfx(state.audio, 'power')
  state.shake = Math.max(state.shake, 14)
  state.toast = { i: -1, born: tsMs, until: tsMs + 6000, victory: 1 }
}

// ---- physics sub-steps (ported from the prototype's physics(), split for readability) ----

function applyRunAndJump(state) {
  const p = state.player, { keys } = state.input, t = TUNING
  const wasSkid = (keys.L && p.vx > 1) || (keys.R && p.vx < -1)
  if (keys.L) { p.vx -= t.MOVE; p.face = -1 }
  if (keys.R) { p.vx += t.MOVE; p.face = 1 }
  if (!keys.L && !keys.R) p.vx *= t.FRICT
  p.vx = Math.max(-t.MAXV, Math.min(t.MAXV, p.vx))
  if (!state.reduced && wasSkid && p.onGround && Math.random() < 0.4) {
    burst(state.particles, p.x + p.w / 2, p.y + p.h, 1, { c: '#e8dcc0', spread: 1.5, up: 0.5, grav: 0.2, r: 2 })
  }
  if (p.buffer > 0) applyJump(state)
  if (!keys.J && p.vy < -5) p.vy = -5
  p.vy = gravityStep(p.vy, t)
  p.buffer = Math.max(0, p.buffer - 1); p.coyote = Math.max(0, p.coyote - 1); p.inv = Math.max(0, p.inv - 1)
  p.sx += (1 - p.sx) * 0.2; p.sy += (1 - p.sy) * 0.2
}

function applyJump(state) {
  const p = state.player, t = TUNING
  const v = jumpVelocity(p, t)
  if (v === null) return
  if (p.onGround || p.coyote > 0) {
    p.vy = v; p.onGround = false; p.coyote = 0; p.buffer = 0; p.jumps = 1
    p.sx = 0.82; p.sy = 1.26
    sfx(state.audio, 'jump')
  } else {
    p.vy = v; p.buffer = 0; p.jumps = 2
    p.sx = 0.8; p.sy = 1.3
    if (!state.reduced) burst(state.particles, p.x + p.w / 2, p.y + p.h, 10, { c: '#10b981', spread: 2.4, up: 1.5, grav: 0.25 })
    sfx(state.audio, 'jump2')
  }
}

function stepMovers(level, tsMs) {
  for (const m of level.movers) {
    const d = moverDelta(m, tsMs)
    m.dx = d.dx; m.dy = d.dy
  }
}

function collisionSolids(level) {
  return level.solids.concat(level.movers, level.qblocks.map(q => ({ x: q.x, y: q.y, w: q.w, h: q.h, q })))
}

function moveAndCollide(state, prevVy) {
  const p = state.player, level = state.level
  stepMovers(level, state.tsMs)
  if (p.rideM) { p.x += p.rideM.dx; p.y += p.rideM.dy }
  p.rideM = null

  p.x += p.vx
  const solids = collisionSolids(level)
  resolveHorizontal(p, solids)

  p.y += p.vy
  const wasOn = p.onGround
  const { landedOn, hitHead } = resolveVertical(p, solids)
  if (landedOn && landedOn.mover) p.rideM = landedOn
  if (hitHead && hitHead.q) openQblock(state, hitHead.q)

  if (!wasOn && p.onGround) {
    landReset(p)
    if (!state.reduced && prevVy > 6) {
      burst(state.particles, p.x + p.w / 2, p.y + p.h, 7, { c: '#e8dcc0', spread: 2.4, up: 0.6, grav: 0.2, r: 2.4 })
    }
  }
  if (wasOn && !p.onGround && p.jumps === 0) p.coyote = TUNING.COYOTE

  clampToLevel(state)
}

function openQblock(state, q) {
  if (q.used) return
  q.used = true
  state.coinCount += 1
  state.level.coins.push({ x: q.x + 10, y: q.y - 28, got: false, pop: 14 })
  if (!state.reduced) burst(state.particles, q.x + q.w / 2, q.y, 8, { c: '#ffd94a', up: 2 })
  sfx(state.audio, 'coin')
}

function clampToLevel(state) {
  const p = state.player, level = state.level
  if (p.x < 0) p.x = 0
  if (p.x > level.levelW - p.w) p.x = level.levelW - p.w
  const groundY = level.solids[0].y
  if (p.y > state.H + 240) { p.x = Math.max(120, p.x - 200); p.y = groundY - 80; p.vy = 0 }
  if (Math.abs(p.vx) > 0.4 && p.onGround) p.run += Math.abs(p.vx) * 0.12
  else p.run = 0
}

function collectCoins(state) {
  const p = state.player
  for (const c of state.level.coins) {
    if (c.got || c.pop) continue
    if (Math.hypot((p.x + p.w / 2) - c.x, (p.y + p.h / 2) - c.y) < 26) {
      c.got = true
      state.coinCount += 1
      if (!state.reduced) burst(state.particles, c.x, c.y, 6, { c: '#ffd94a', up: 1.6 })
      sfx(state.audio, 'coin')
    }
  }
}

function collectPowerups(state, tsMs) {
  const p = state.player
  for (const pu of state.level.powerups) {
    if (pu.taken) continue
    pu.t += 0.1
    if (!aabb(p, pu)) continue
    pu.taken = 1
    const isShield = pu.type === 'shield'
    applyPowerup(p, pu.type)
    if (!state.reduced) burst(state.particles, pu.x + 13, pu.y + 13, 18, { c: isShield ? '#4bb8e6' : '#10b981', spread: 3, up: 2 })
    sfx(state.audio, 'power')
    state.toast = { i: -1, born: tsMs, until: tsMs + 2600, pu: isShield ? 'shield' : 'boots' }
  }
}

function stompFx(state, en) {
  const p = state.player
  p.jumps = Math.min(p.jumps, 1); p.inv = Math.max(p.inv, 8)
  state.hitstop = en.boss ? 7 : 4
  state.shake = Math.max(state.shake, en.boss ? 11 : 7)
  if (!state.reduced) {
    burst(state.particles, en.x + en.w / 2, en.y + 6, en.boss ? 24 : 16, { c: en.col, spread: en.boss ? 4.5 : 3.4 })
    burst(state.particles, en.x + en.w / 2, en.y, 6, { c: '#fff', spread: 2, up: 1 })
  }
  state.coinCount += 1
  sfx(state.audio, 'stomp')
}

function hurtFx(state, tsMs) {
  const r = hurt(state.player)
  state.shake = Math.max(state.shake, 6)
  sfx(state.audio, 'hurt')
  if (r.lost) state.toast = { i: -1, born: tsMs, until: tsMs + 2200, lost: r.lost }
}

function resolveEnemies(state, tsMs) {
  const p = state.player
  for (const en of state.level.enemies) {
    if (en.dead) continue
    en.t += 0.14
    patrolStep(en)
    if (!aabb(p, en)) continue
    const result = resolveContact(p, en)
    if (result === 'kill' || result === 'stomp') {
      stompFx(state, en)
      if (result === 'kill' && en.boss) win(state, tsMs)
    } else if (result === 'hurt') {
      hurtFx(state, tsMs)
    }
  }
}

function updateToastsAndProgress(state, tsMs) {
  const p = state.player, { companies } = state.level
  companies.forEach((c, i) => {
    if (Math.abs((p.x + p.w / 2) - c.cx) < TOAST_COMPANY_RANGE && p.onGround && !state.seenToast.has(i)) {
      state.seenToast.add(i)
      state.toast = { i, born: tsMs, until: tsMs + 3800, company: c }
    }
  })
  state.curCo = companies.reduce((a, c, i) => (
    Math.abs(p.x - c.cx) < Math.abs(p.x - companies[a].cx) ? i : a
  ), 0)
}

function stepPhysics(state, tsMs) {
  // Captured before this frame's gravity/jump changes vy — the prototype's physics() reads
  // `prevVy` at its very top for the same reason (landing-dust threshold uses last frame's fall speed).
  const prevVy = state.player.vy
  applyRunAndJump(state)
  moveAndCollide(state, prevVy)
  collectCoins(state)
  collectPowerups(state, tsMs)
  resolveEnemies(state, tsMs)
  updateToastsAndProgress(state, tsMs)
  updateParticles(state.particles)
  if (state.shake > 0) state.shake *= 0.85
  if (state.shake < 0.3) state.shake = 0
  followCamera(state.cam, state.player.x, state.W, state.level.levelW)
}

// Hit-stop/pause gate — the prototype's `loop()` does `if(!paused){ if(hitstop>0)hitstop--; else
// physics(); }`. Lives here (per the brief, it "may live [in loop.js] or in careerGame") rather than
// in loop.js so loop.js can stay a generic, state-agnostic rAF wrapper.
function runStep(state, tsMs) {
  state.tsMs = tsMs
  if (state.paused) return
  if (state.hitstop > 0) { state.hitstop -= 1; return }
  stepPhysics(state, tsMs)
}

function wireInput(state, canvas, onOpenPanel) {
  state.input.attach(window, {
    onJumpBuffer: () => { state.player.buffer = TUNING.BUFFER; initAudio(state.audio) },
    onOpenNearest: () => { if (!state.paused) openCompany(state, nearCastle(state), onOpenPanel) },
    onClose: () => { state.paused = false },
  })
  const onTap = (e) => {
    if (state.paused) return
    const r = canvas.getBoundingClientRect()
    const wx = state.cam.x + (e.clientX - r.left)
    let best = -1, bestDist = TAP_OPEN_RANGE
    state.level.companies.forEach((c, i) => {
      const d = Math.abs(c.cx - wx)
      if (d < bestDist) { bestDist = d; best = i }
    })
    openCompany(state, best, onOpenPanel)
  }
  canvas.addEventListener('pointerdown', onTap)
  return () => canvas.removeEventListener('pointerdown', onTap)
}

export function init(canvas, { locale = 'en', reduced = false, onOpenPanel } = {}) {
  const ctx = canvas.getContext('2d')
  const state = buildState({ locale, reduced })
  resize(canvas, ctx, state)

  const detachTap = wireInput(state, canvas, onOpenPanel)
  const onResize = () => resize(canvas, ctx, state)
  window.addEventListener('resize', onResize)

  const loop = createLoop(
    tsMs => runStep(state, tsMs),
    tsMs => { state.tsMs = tsMs; drawScene(ctx, state) },
  )

  return {
    start: () => loop.start(),
    stop: () => {
      loop.stop()
      state.input.detach()
      detachTap()
      window.removeEventListener('resize', onResize)
    },
    setLocale: (l) => { state.lang = l },
    setMuted: (m) => setAudioMuted(state.audio, m),
    getState: () => state,
    tick: (tsMs) => runStep(state, tsMs),
  }
}
