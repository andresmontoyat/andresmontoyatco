// Ambient, non-collidable animated layer: tree/bush sway, water waves, chimney smoke, and
// night fireflies over the castillo (AI) region. Everything here is a pure function of world
// position + `t` (state.clock) — no Math.random/Date.now — so the same (state, cam, t) always
// paints the same frame (deterministic, screenshot/testable in principle, though we deliberately
// don't assert on pixels — see ambient.test.js absence note in the task report).
import { phaseOf, daylight } from './lighting.js'

// Full day/night lap, in state.clock units. `update()` advances the clock by the same per-call
// `dtChars` it feeds the dialog typewriter (~1.6/frame at the rAF ~60fps cadence), i.e. ~96
// clock-units per real second — so DAY_LEN=7200 lands a full cycle at ~75 real seconds (60-90s
// target). Retune this constant (not the increment site) if the frame cadence changes.
export const DAY_LEN = 7200

const SWAY_TYPES = new Set(['tree', 'tree_small', 'bush'])
const SWAY_SPEED = 1.4
const SWAY_AMPLITUDE = 3

// Deterministic per-element phase seeded from its world position — same tree always sways the
// same way, neighboring trees don't sway in lockstep.
function phaseFor(x, y) {
  return x * 0.13 + y * 0.07
}

export function swayOffset(d, t) {
  if (!SWAY_TYPES.has(d.type)) return 0
  return Math.sin(t * SWAY_SPEED + phaseFor(d.x, d.y)) * SWAY_AMPLITUDE
}

function inView(cam, vw, vh, x, y, pad) {
  return x > cam.x - pad && x < cam.x + vw + pad && y > cam.y - pad && y < cam.y + vh + pad
}

function activeSitesOf(state) {
  return state.revealed ? state.world.sites.concat(state.world.hiddenSites) : state.world.sites
}

// --- Water waves -----------------------------------------------------------
// `world.ponds` isn't authored in the live overworld yet (decor.js already guards the same
// way pending real pond regions) — this stays inert today, but the mechanism is ready and
// exercised by ambient.test.js via a fixture world.

const WAVE_RINGS = 3
const WAVE_SPEED = 1.1
const WAVE_AMPLITUDE = 3

function drawPondWaves(ctx, pond, cam, t) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1.5
  for (let ring = 0; ring < WAVE_RINGS; ring += 1) {
    const baseR = pond.r * (0.35 + ring * 0.28)
    ctx.beginPath()
    for (let a = 0; a <= Math.PI * 2 + 0.001; a += Math.PI / 12) {
      const wob = Math.sin(t * WAVE_SPEED + a * 3 + ring) * WAVE_AMPLITUDE
      const x = pond.x + Math.cos(a) * (baseR + wob) - cam.x
      const y = pond.y + Math.sin(a) * (baseR + wob) * 0.55 - cam.y
      if (a === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
}

function drawWater(ctx, state, cam, t) {
  const ponds = state.world.ponds || []
  const { width: vw, height: vh } = ctx.canvas
  ponds.filter(p => inView(cam, vw, vh, p.x, p.y, p.r + 40)).forEach(p => drawPondWaves(ctx, p, cam, t))
}

// --- Chimney smoke -----------------------------------------------------------

const SMOKE_PUFFS = 3
const SMOKE_RISE = 36
const SMOKE_PERIOD = 3.2

function drawChimneyPuffs(ctx, s, cam, t) {
  const cx = s.cx - cam.x
  const roofY = s.cy - s.h - cam.y
  for (let i = 0; i < SMOKE_PUFFS; i += 1) {
    const raw = (t / SMOKE_PERIOD) + (i / SMOKE_PUFFS)
    const phase = ((raw % 1) + 1) % 1
    const x = cx + Math.sin(t * 0.8 + i * 2 + s.cx * 0.01) * 4
    const y = roofY - phase * SMOKE_RISE
    ctx.save()
    ctx.globalAlpha = 0.32 * (1 - phase)
    ctx.fillStyle = '#cfd7e6'
    ctx.beginPath()
    ctx.arc(x, y, 3 + phase * 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function drawSmoke(ctx, state, cam, t) {
  const { width: vw, height: vh } = ctx.canvas
  activeSitesOf(state)
    .filter(s => inView(cam, vw, vh, s.cx, s.cy - s.h, SMOKE_RISE + 20))
    .forEach(s => drawChimneyPuffs(ctx, s, cam, t))
}

// --- Fireflies (castillo / AI region, night only) ---------------------------

const FIREFLY_COUNT = 14
const FIREFLY_RADIUS = 90
const FIREFLY_DAYLIGHT_CUTOFF = 0.25

function fireflyPos(center, i, t) {
  const ang = (i / FIREFLY_COUNT) * Math.PI * 2 + t * 0.15 + i
  const wob = (Math.sin(t * 0.6 + i * 1.7) + 1) / 2
  const r = FIREFLY_RADIUS * (0.3 + wob * 0.7)
  return { x: center.x + Math.cos(ang) * r, y: center.y + Math.sin(ang) * r * 0.6 }
}

function drawFireflies(ctx, state, cam, t) {
  const dl = daylight(phaseOf(state.clock || 0, DAY_LEN))
  if (dl > FIREFLY_DAYLIGHT_CUTOFF) return
  const center = (state.world.regions || []).find(r => r.bi === 'castillo')
  if (!center) return
  const strength = 1 - dl / FIREFLY_DAYLIGHT_CUTOFF
  for (let i = 0; i < FIREFLY_COUNT; i += 1) {
    const p = fireflyPos(center, i, t)
    const pulse = (Math.sin(t * 2 + i * 2.3) + 1) / 2
    ctx.save()
    ctx.globalAlpha = strength * (0.25 + pulse * 0.75)
    ctx.fillStyle = '#e8ff8a'
    ctx.beginPath()
    ctx.arc(p.x - cam.x, p.y - cam.y, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// --- Entry point --------------------------------------------------------------
// Called after the depth-sorted world layer so smoke/fireflies read as "on top"; water is an
// inert no-op until ponds exist. Sway is NOT drawn here — scene2d's decor pass calls
// `swayOffset` directly so trees stay correctly depth-sorted with the rest of the world.
export function drawAmbient(ctx, state, cam, t) {
  drawWater(ctx, state, cam, t)
  drawSmoke(ctx, state, cam, t)
  drawFireflies(ctx, state, cam, t)
}
