// A handful of chickens wandering near the Farm. Purely deterministic — each critter's position
// is a function of the shared world clock plus a fixed per-critter phase (no Math.random, no
// integrated velocity state), so the same clock value always reproduces the same layout and
// `updateCritters` can be called in any order/step size without drifting.

const CRITTER_COUNT = 4
const WANDER_SPEED = 0.5 // rad per clock-unit
const AMP_X = 45
const AMP_Y = 26
const CHICKEN_SIZE = 20

export function createCritters(world, seed = 0) {
  const { farm } = world
  return Array.from({ length: CRITTER_COUNT }, (_, i) => ({
    id: i,
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
    const ang = clock * WANDER_SPEED + c.phase
    return {
      ...c,
      x: c.farmX + Math.cos(ang) * AMP_X,
      y: c.farmY + Math.sin(ang * 0.7) * AMP_Y,
      facingLeft: Math.sin(ang) > 0,
    }
  })
}

function chickenFrame(t) {
  return Math.floor(t * 4) % 2 === 0 ? 'chicken_0' : 'chicken_1'
}

// Depth-sort-ready drawables (same {baseY, draw} shape scene2d.js uses for decor/buildings) so
// chickens correctly occlude/are occluded by whatever else is near their feet.
export function critterDrawables(state, cam, t) {
  const frame = chickenFrame(t)
  return (state.critters || []).map(c => ({
    baseY: c.y,
    draw: (ctx, sprites) => {
      const dx = c.x - CHICKEN_SIZE / 2 - cam.x
      const dy = c.y - CHICKEN_SIZE - cam.y
      if (c.facingLeft) sprites.drawFlipped(ctx, frame, dx, dy, CHICKEN_SIZE, CHICKEN_SIZE)
      else sprites.draw(ctx, frame, dx, dy, CHICKEN_SIZE, CHICKEN_SIZE)
    },
  }))
}
