// Generic rAF wrapper — ported from the prototype's `function loop(ts){...requestAnimationFrame(loop)}`.
// Deliberately knows nothing about hit-stop/pause: `step` and `draw` are closures the composition
// root (careerGame.js) already binds to its own `state`, so the hit-stop gate lives there instead
// (see careerGame.js's `runStep`) — kept out of this file to keep it a plain, state-agnostic wrapper.
export function createLoop(step, draw) {
  let rafId = null
  let running = false

  function frame(ts) {
    if (!running) return
    step(ts)
    draw(ts)
    rafId = requestAnimationFrame(frame)
  }

  function start() {
    if (running) return
    running = true
    rafId = requestAnimationFrame(frame)
  }

  function stop() {
    running = false
    if (rafId != null) cancelAnimationFrame(rafId)
    rafId = null
  }

  return { start, stop }
}
