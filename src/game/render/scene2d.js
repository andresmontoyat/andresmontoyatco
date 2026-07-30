import { nearestBiome, tileNameFor, walkFrame } from './tiles.js'
import { BIOMES } from '../world/biomes.js'
import { drawAmbient, swayOffset, DAY_LEN } from './ambient.js'
import { critterDrawables } from '../entities/critters.js'
import { shake2D } from '../engine/camera2d.js'
import { phaseOf, nightTint } from './lighting.js'

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

// Logical (CSS-px) viewport size — WorldRpg.jsx sizes the canvas DRAWING BUFFER to
// devicePixelRatio × the CSS-displayed size (so pixel art stays crisp on retina) and then
// applies ctx.setTransform(dpr, 0, 0, dpr, 0, 0), so every draw call already operates in
// logical/CSS px. Reading the raw ctx.canvas.width/height here (the dpr-multiplied buffer)
// would place screen-space geometry — the HUD chips, dialog box, night overlay, tile-visibility
// range — off by a factor of dpr. WorldRpg.jsx annotates canvas.logicalWidth/logicalHeight with
// the CSS size before that transform; this falls back to the raw buffer when unset (unit tests,
// or a canvas that was never dpr-sized) so existing callers stay unaffected.
export function viewportOf(ctx) {
  return {
    w: ctx.canvas.logicalWidth || ctx.canvas.width,
    h: ctx.canvas.logicalHeight || ctx.canvas.height,
  }
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

// Exported so worldRpg.js's region-music tracking (nearestBiome under the avatar) shares the
// same farm-inclusive anchor list as ground-tile biome lookup, instead of re-deriving it.
export function regionsWithFarm(world) {
  return world.regions.concat([{ bi: 'farm', x: world.farm.x, y: world.farm.y }])
}

function drawGround(ctx, state, cam, sprites) {
  const { world } = state
  const anchors = regionsWithFarm(world)
  const { w: vw, h: vh } = viewportOf(ctx)
  const { x0, y0, x1, y1 } = visibleTileRange(cam, vw, vh, TILE)
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

function drawDecorItem(ctx, d, cam, sprites, t) {
  const dim = DECOR_DIMS[d.type]
  const dx = d.x - dim.w / 2 - cam.x + swayOffset(d, t)
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
function depthSortedDrawables(state, cam, t) {
  const buildings = activeSites(state).map(s => buildingDrawable(s, cam))
  const drawOne = d => (ctx, sprites) => drawDecorItem(ctx, d, cam, sprites, t)
  const decor = (state.decor || []).map(d => ({ baseY: d.y, draw: drawOne(d) }))
  const critters = critterDrawables(state, cam, t)
  const { player } = state
  const avatar = { baseY: player.y + player.h / 2, draw: (ctx, sprites) => drawAvatar(ctx, state, cam, sprites) }
  return buildings.concat(decor, critters, [avatar]).sort((a, b) => a.baseY - b.baseY)
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
  const { w, h } = viewportOf(ctx)
  ctx.fillStyle = '#0d1730f2'
  ctx.fillRect(20, h - 150, w - 40, 120)
  ctx.fillStyle = '#dfeaff'
  dialog.visibleText(lang).split('\n').forEach((ln, i) => ctx.fillText(ln, 40, h - 120 + i * 22))
}

function drawParticles(ctx, state, cam) {
  const particles = state.particles ? state.particles.alive() : []
  particles.forEach(p => {
    ctx.fillStyle = p.color
    ctx.fillRect(p.x - cam.x - 2, p.y - cam.y - 2, 4, 4)
  })
}

// lighting.js's nightTint().a is unit-tested as-is (peaks at 0.55 at true midnight) — scaling it
// down here, at the draw site, keeps that module untouched while making the darkest night read
// as an atmospheric dusky blue instead of a near-opaque black-out over the world.
const NIGHT_OVERLAY_STRENGTH = 0.55

function drawNightOverlay(ctx, state) {
  const tint = nightTint(phaseOf(state.clock || 0, DAY_LEN))
  const alpha = tint.a * NIGHT_OVERLAY_STRENGTH
  if (alpha <= 0) return
  const { w, h } = viewportOf(ctx)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = `rgb(${tint.r},${tint.g},${tint.b})`
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

// Dark ink-950 chip with a thin brand-neon border — echoes the retro-console bezel around the
// canvas (src/pages/*/game.astro) so the in-canvas HUD reads as part of the same "device" rather
// than a flat, mismatched dark bar. Colors are canvas fillStyle strings (2D context can't consume
// CSS custom properties), hand-matched to --color-ink-950 (#07091A) and --color-brand (#00E5A8)
// in src/index.css — keep these two in sync if either token changes.
const HUD_CHIP_BG = 'rgba(7,9,26,0.72)'
const HUD_CHIP_BORDER = 'rgba(0,229,168,0.55)'
const HUD_CHIP_TEXT = '#00E5A8'

function drawHudChip(ctx, text, x, align) {
  ctx.save()
  ctx.font = 'bold 11px monospace'
  ctx.textBaseline = 'middle'
  const padX = 10
  const h = 22
  const r = h / 2
  const w = ctx.measureText(text).width + padX * 2
  const chipX = align === 'right' ? x - w : x
  ctx.beginPath()
  ctx.moveTo(chipX + r, 10)
  ctx.arcTo(chipX + w, 10, chipX + w, 10 + h, r)
  ctx.arcTo(chipX + w, 10 + h, chipX, 10 + h, r)
  ctx.arcTo(chipX, 10 + h, chipX, 10, r)
  ctx.arcTo(chipX, 10, chipX + w, 10, r)
  ctx.closePath()
  ctx.fillStyle = HUD_CHIP_BG
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = HUD_CHIP_BORDER
  ctx.stroke()
  ctx.fillStyle = HUD_CHIP_TEXT
  ctx.textAlign = 'left'
  ctx.fillText(text, chipX + padX, 10 + h / 2)
  ctx.restore()
}

// regionsWithFarm() (used by both drawGround's tile lookup and worldRpg.js's region-music
// tracking) adds a synthetic { bi: 'farm', ... } anchor that has NO entry in BIOMES — the
// player spawns there, so nearestBiome() returns 'farm' on frame 1. BIOMES[bi] would then be
// undefined and BIOMES[bi].label throw immediately (crashing every render frame). Exported so
// this fallback is independently testable without a canvas.
const FARM_LABEL = { en: 'The Farm', es: 'La Granja' }

export function eraLabel(bi, lang) {
  const biome = BIOMES[bi]
  if (biome) return biome.label[lang] ?? biome.label.en
  if (bi === 'farm') return FARM_LABEL[lang] ?? FARM_LABEL.en
  return bi
}

// Top-left: current era label (biome under the avatar). Top-right: discovery progress —
// visible sites seen so far, plus a "+K🔓" once the Konami reveal has unlocked the hidden
// sideProjects sites, so recruiters get a sense of completion/discoverability at a glance.
function drawHud(ctx, state) {
  const { world, lang } = state
  const bi = nearestBiome(regionsWithFarm(world), state.player.x, state.player.y)
  drawHudChip(ctx, eraLabel(bi, lang), 10, 'left')

  const total = world.sites.length
  const seen = world.sites.filter(s => s.seen).length
  const unlocked = state.revealed ? `  +${world.hiddenSites.length}\u{1F513}` : ''
  drawHudChip(ctx, `sites ${seen}/${total}${unlocked}`, viewportOf(ctx).w - 10, 'right')
}

// World-space Y offset (above the normal follow-cam) the intro's camera descends from — a
// "sky" view of the farm before intro.camY() eases it down to the real cam.y over the intro's
// duration (see intro.js's createIntro/camY).
const INTRO_SKY_OFFSET = -420

function introCamera(state, cam) {
  if (!state.intro || state.intro.done()) return cam
  return { x: cam.x, y: state.intro.camY(cam.y + INTRO_SKY_OFFSET, cam.y) }
}

function drawIntroTitle(ctx, state) {
  const alpha = state.intro.titleAlpha()
  if (alpha <= 0) return
  const { w, h } = viewportOf(ctx)
  const cx = w / 2
  const cy = h / 2
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.textAlign = 'center'
  ctx.fillStyle = '#eafff6'
  ctx.font = 'bold 40px monospace'
  ctx.fillText('World RPG', cx, cy - 10)
  ctx.font = '16px monospace'
  ctx.fillStyle = '#9fd8c4'
  ctx.fillText('Carlos Montoya · Backend Engineer', cx, cy + 26)
  ctx.restore()
}

export function render2d(ctx, state, cam) {
  const { sprites } = state
  const introRunning = !!(state.intro && !state.intro.done())
  const shakeOff = shake2D(state.shake || 0)
  const sceneCam = introCamera(state, cam)
  const drawCam = { x: sceneCam.x + shakeOff.x, y: sceneCam.y + shakeOff.y }
  const { w: bgW, h: bgH } = viewportOf(ctx)
  ctx.fillStyle = '#0B1020'
  ctx.fillRect(0, 0, bgW, bgH)
  if (!sprites) {
    drawPlaceholderScene(ctx, state, drawCam)
  } else {
    const t = state.clock || 0
    drawGround(ctx, state, drawCam, sprites)
    depthSortedDrawables(state, drawCam, t).forEach(item => item.draw(ctx, sprites))
    drawAmbient(ctx, state, drawCam, t)
    drawParticles(ctx, state, drawCam)
    drawNightOverlay(ctx, state)
    drawHud(ctx, state)
  }
  drawDialog(ctx, state)
  if (introRunning) drawIntroTitle(ctx, state)
}
