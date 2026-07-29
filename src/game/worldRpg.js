import { buildOverworld } from './world/overworld.js'
import { biomeForYear } from './world/biomes.js'
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

const STEP_RATE = 0.15

function buildingSolids(sites) {
  return sites.map(s => ({ x: s.cx - s.w / 2, y: s.cy, w: s.w, h: s.h }))
}

export function update(state, input, dtChars) {
  const frozen = state.dialog.isOpen()
  const r = stepMovement(state.player, { ...input, frozen }, buildingSolids(activeSites(state)), { w: state.world.worldW, h: state.world.worldH })
  state.player.x = r.x; state.player.y = r.y; state.player.dir = r.dir; state.player.moving = r.moving
  state.player.step = r.moving ? state.player.step + STEP_RATE : 0
  state.dialog.tick(dtChars)
}

export function createWorldRpg({ canvas, experience, sideProjects = [], lang = 'es' }) {
  const world = buildOverworld(experience, biomeForYear, sideProjects)
  const state = {
    world,
    player: { x: world.farm.x, y: world.farm.y + 70, w: 24, h: 28, dir: 'down', moving: false, step: 0 },
    cam: { x: 0, y: 0 },
    dialog: createDialog(),
    revealed: false,
    lang,
    sprites: null,
  }
  const konami = createKonami()
  const input = createTopdownInput()

  function reveal() { state.revealed = true }
  function interact() {
    if (state.dialog.isOpen()) { state.dialog.advance(); return }
    const s = nearestSite(state.player, activeSites(state))
    if (s) { s.seen = true; state.dialog.open(s) }
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
