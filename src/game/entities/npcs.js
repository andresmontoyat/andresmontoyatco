// Ambient townsfolk: one premade NPC milling about in front of each company building. Purely
// deterministic (position is a function of the shared world clock + a fixed per-NPC phase — no
// Math.random, no integrated state), like the critters. NPCs are non-solid background life: the
// player walks through them, they never open a dialog. Each is a single premade sprite (not the
// modular avatar stack), drawn front-facing with a 2-frame walk from its sheet's row 0.
import { animIndex } from '../render/anim.js'

// The premade NPC roster (see manifest npc_<type>_0/1). A stable hash of the site id picks one per
// building so a company always has the same townsperson, whatever the site order.
const NPC_TYPES = ['farmer', 'miner', 'chef', 'katy', 'fin', 'jack']
const NPC_W = 38
const NPC_H = 40
const NPC_TICKS = 16 // ~6fps shuffle
const WANDER_SPEED = 0.16 // rad per clock-unit (a slow amble, slower than the darting critters)
const AMP_X = 30
const AMP_Y = 15
const FRONT_OFFSET = 20 // spawn this far below the building's base, on the approach side

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return h >>> 0
}

export function npcTypeFor(site) {
  return NPC_TYPES[hashStr(String(site.id || site.co || '')) % NPC_TYPES.length]
}

export function createNpcs(world) {
  return (world.sites || []).map((s, i) => {
    const homeX = s.cx
    const homeY = s.cy + s.h + FRONT_OFFSET
    return {
      id: s.id, type: npcTypeFor(s), homeX, homeY, phase: i * 1.7, x: homeX, y: homeY,
    }
  })
}

// Pure — returns a new array (a held snapshot never mutates), same contract as updateCritters.
export function updateNpcs(npcs, clock) {
  return npcs.map(n => {
    const ang = clock * WANDER_SPEED + n.phase
    return { ...n, x: n.homeX + Math.cos(ang) * AMP_X, y: n.homeY + Math.sin(ang * 0.6) * AMP_Y }
  })
}

// Depth-sort-ready drawables ({baseY, draw}), so townsfolk occlude / are occluded correctly around
// the buildings they mill in front of. Front-facing only (the premade rows have no clean side
// view), so no flip is needed.
export function npcDrawables(state, cam, t) {
  return (state.npcs || []).map(n => {
    const frame = `npc_${n.type}_${animIndex(t, NPC_TICKS, 2)}`
    return {
      baseY: n.y,
      draw: (ctx, sprites) => {
        sprites.draw(ctx, frame, n.x - NPC_W / 2 - cam.x, n.y - NPC_H - cam.y, NPC_W, NPC_H)
      },
    }
  })
}
