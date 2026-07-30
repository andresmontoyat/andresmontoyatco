export function createIntro(dur = 3) {
  let t = 0
  const ease = p => 1 - (1 - p) ** 3
  return {
    update(dt) { t = Math.min(dur, t + dt) },
    camY(fromY, toY) { return fromY + (toY - fromY) * ease(t / dur) },
    titleAlpha() { const p = t / dur; return Math.min(1, p * 2) * Math.min(1, (1 - p) * 3 + 0.4) },
    done() { return t >= dur },
    skip() { t = dur },
  }
}
