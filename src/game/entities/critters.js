// A mix of critters wandering near the Farm — chickens, ducks, a grazing cow, a butterfly.
// Purely deterministic: each critter's position is a function of the shared world clock plus a
// fixed per-critter phase (no Math.random, no integrated velocity state), so the same clock value
// always reproduces the same layout and `updateCritters` can be called in any order/step size
// without drifting.
import { animIndex } from '../render/anim.js'

// Per-species behaviour + sprite. `frames`/`ticks` drive the walk animation via anim.js; `size` is
// the draw box; `ampX/ampY/speed` shape the wander ellipse. Bigger, slower animals (cow) get a
// tighter, lazier wander than the darting fowl.
const KINDS = {
  chicken: { frames: ['chicken_0', 'chicken_1'], size: 20, ticks: 12, ampX: 45, ampY: 26, speed: 0.5 },
  duck: { frames: ['duck_0', 'duck_1'], size: 20, ticks: 11, ampX: 52, ampY: 22, speed: 0.42 },
  cow: { frames: ['cow_0', 'cow_1'], size: 30, ticks: 26, ampX: 34, ampY: 16, speed: 0.24 },
  pig: { frames: ['pig_0', 'pig_1'], size: 26, ticks: 22, ampX: 40, ampY: 20, speed: 0.3 },
  sheep: { frames: ['sheep_0', 'sheep_1'], size: 26, ticks: 24, ampX: 36, ampY: 18, speed: 0.27 },
}
// The farm's critter roster — a lively barnyard mix, not four identical chickens.
const ROSTER = ['chicken', 'chicken', 'duck', 'duck', 'cow', 'pig', 'sheep', 'chicken']

export function createCritters(world, seed = 0) {
  const { farm } = world
  return ROSTER.map((kind, i) => ({
    id: i,
    kind,
    farmX: farm.x,
    farmY: farm.y,
    phase: i * 2.4 + seed * 0.7,
    x: farm.x,
    y: farm.y,
    facingLeft: false,
  }))
}

// Pure — returns a new array rather than mutating `critters` in place, so a caller holding the
// previous snapshot (e.g. a test) never sees it change out from under it.
export function updateCritters(critters, dt, clock) {
  return critters.map(c => {
    const k = KINDS[c.kind]
    const ang = clock * k.speed + c.phase
    return {
      ...c,
      x: c.farmX + Math.cos(ang) * k.ampX,
      y: c.farmY + Math.sin(ang * 0.7) * k.ampY,
      facingLeft: Math.sin(ang) > 0,
    }
  })
}

// Depth-sort-ready drawables (same {baseY, draw} shape scene2d.js uses for decor/buildings) so
// critters correctly occlude/are occluded by whatever else is near their feet.
export function critterDrawables(state, cam, t) {
  return (state.critters || []).map(c => {
    const k = KINDS[c.kind]
    const name = k.frames[animIndex(t, k.ticks, k.frames.length)]
    return {
      baseY: c.y,
      draw: (ctx, sprites) => {
        const dx = c.x - k.size / 2 - cam.x
        const dy = c.y - k.size - cam.y
        if (c.facingLeft) sprites.drawFlipped(ctx, name, dx, dy, k.size, k.size)
        else sprites.draw(ctx, name, dx, dy, k.size, k.size)
      },
    }
  })
}
