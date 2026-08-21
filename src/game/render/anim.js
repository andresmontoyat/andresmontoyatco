// Frame-strip animation for the atlas renderer. The atlas bakes every strip frame as an ordinary
// static rect (name_0 … name_{count-1}); animation is just picking WHICH of those baked frames to
// draw this tick from the world clock — so no atlas/loader change is needed, only a deterministic
// clock→index map. `state.clock` advances ~96 units/sec (see ambient.js DAY_LEN), so a
// ticksPerFrame of ~12 gives ~8fps. Pure + deterministic (no Date.now/Math.random): the same
// (clock, ticksPerFrame, count) always yields the same frame, so it's screenshot- and unit-testable.

export function animIndex(clock, ticksPerFrame, count) {
  if (count <= 0) return 0
  const raw = Math.floor(clock / ticksPerFrame) % count
  return raw < 0 ? raw + count : raw // keep the index in [0,count) even if a caller passes clock<0
}

export function animFrame(base, clock, ticksPerFrame, count) {
  return `${base}_${animIndex(clock, ticksPerFrame, count)}`
}

// state.clock advances ~96 units per real second (see DAY_LEN in ambient.js). This is the ONE
// place an authored fps becomes clock ticks — every other module speaks one or the other.
export const CLOCK_UNITS_PER_SEC = 96

export function ticksFor(fps) {
  return CLOCK_UNITS_PER_SEC / (fps > 0 ? fps : 8)
}

// clipFrame: which baked frame name an authored clip shows now. The editor resolved the clip's
// range to explicit frame names at export, so there is no base+index to rebuild here — animFrame's
// naming convention does not apply and only the INDEX is shared with it. `phase` desynchronises
// two placements of the same clip; pass hashPhase(x, y) for a stable per-position offset.
export function clipFrame(clip, clock, phase = 0) {
  const n = clip && clip.frames ? clip.frames.length : 0
  if (!n) return null
  return clip.frames[animIndex(clock + phase, ticksFor(clip.fps), n)]
}

// hashPhase: a deterministic offset from a world position, so five cows sharing one clip do not
// step in lockstep — and no Math.random anywhere, which is what keeps the render screenshot-testable.
export function hashPhase(x, y) {
  const h = (Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) >>> 0
  return h % 256
}
