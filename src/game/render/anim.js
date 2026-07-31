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
