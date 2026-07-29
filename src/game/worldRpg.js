import { buildOverworld } from './world/overworld.js'
import { biomeForYear } from './world/biomes.js'
import { buildDecor } from './world/decor.js'
import { stepMovement } from './engine/topdown.js'
import { followCamera2D } from './engine/camera2d.js'
import { nearestSite } from './entities/site.js'
import { createDialog } from './render/dialog.js'
import { createKonami } from './input/konami.js'
import { createTopdownInput } from './input/topdownInput.js'
import { render2d, activeSites } from './render/scene2d.js'
import { createLoop } from './engine/loop.js'
import { loadSprites } from './assets/loader.js'
import { MANIFEST } from './assets/manifest.js'
import { createParticles, burst } from './render/juice.js'
import { createCritters, updateCritters } from './entities/critters.js'
import { DAY_LEN } from './render/ambient.js'

const STEP_RATE = 0.15

function buildingSolids(sites) {
  return sites.map(s => ({ x: s.cx - s.w / 2, y: s.cy, w: s.w, h: s.h }))
}

// Small AABB around each solid decor item's ground-contact point (trunk/base width, not the
// full canopy sprite) — keeps trees/rocks/fences blocking without making them feel oversized.
function decorSolids(decor) {
  return decor.filter(d => d.solid).map(d => ({ x: d.x - 10, y: d.y - 14, w: 20, h: 14 }))
}

export function update(state, input, dtChars) {
  const frozen = state.dialog.isOpen()
  const solids = buildingSolids(activeSites(state)).concat(decorSolids(state.decor || []))
  const r = stepMovement(state.player, { ...input, frozen }, solids, { w: state.world.worldW, h: state.world.worldH })
  state.player.x = r.x; state.player.y = r.y; state.player.dir = r.dir; state.player.moving = r.moving
  state.player.step = r.moving ? state.player.step + STEP_RATE : 0
  state.dialog.tick(dtChars)
  state.clock += dtChars
  state.particles.update(1)
  state.shake *= 0.9
  state.critters = updateCritters(state.critters, dtChars, state.clock)
}

export function createWorldRpg({ canvas, experience, sideProjects = [], lang = 'es' }) {
  const world = buildOverworld(experience, biomeForYear, sideProjects)
  const state = {
    world,
    decor: buildDecor(world),
    player: { x: world.farm.x, y: world.farm.y + 70, w: 24, h: 28, dir: 'down', moving: false, step: 0 },
    cam: { x: 0, y: 0 },
    dialog: createDialog(),
    revealed: false,
    lang,
    sprites: null,
    // Start at midday (daylight() peaks at phase 0.5) — a recruiter's first view must be a
    // bright, inviting world, not the dark half of the day/night cycle.
    clock: DAY_LEN / 2,
    particles: createParticles(),
    shake: 0,
    critters: createCritters(world),
  }
  const konami = createKonami()
  const input = createTopdownInput()

  function reveal() { state.revealed = true; state.shake = 8 }
  function interact() {
    if (state.dialog.isOpen()) { state.dialog.advance(); return }
    const s = nearestSite(state.player, activeSites(state))
    if (!s) return
    if (!s.seen) burst(state.particles, s.cx, s.cy, 14)
    s.seen = true
    state.dialog.open(s)
  }

  let loop = null
  function start() {
    input.attach(window, {
      onInteract: interact,
      onLanguage: () => { state.lang = state.lang === 'es' ? 'en' : 'es' },
      onKey: k => { if (konami.push(k) && !state.revealed) reveal() },
    })
    loadSprites(MANIFEST).then(sprites => { state.sprites = sprites })
    const ctx = canvas.getContext('2d')
    const step = () => update(state, input.state, 1.6)
    const draw = () => {
      followCamera2D(state.cam, state.player.x, state.player.y, canvas.width, canvas.height, world.worldW, world.worldH)
      render2d(ctx, state, state.cam)
    }
    loop = createLoop(step, draw)
    loop.start()
  }
  function stop() { if (loop) loop.stop(); input.detach() }

  return { state, start, stop, reveal, interact, activeSites: () => activeSites(state) }
}
