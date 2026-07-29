export function createAudio() { return { ctx: null, muted: false } }
export function initAudio(a) {
  if (a.ctx) return
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext
  if (AC) { try { a.ctx = new AC() } catch (e) { a.ctx = null } }
}
export function setMuted(a, m) { a.muted = m }
function beep(a, freq, dur, type, vol, slideTo) {
  if (a.muted || !a.ctx) return
  const o = a.ctx.createOscillator(), g = a.ctx.createGain()
  o.type = type || 'square'; o.frequency.value = freq
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.ctx.currentTime + dur)
  g.gain.value = vol || 0.05; g.gain.exponentialRampToValueAtTime(0.0001, a.ctx.currentTime + dur)
  o.connect(g); g.connect(a.ctx.destination); o.start(); o.stop(a.ctx.currentTime + dur)
}
export function sfx(a, t) {
  if (t === 'jump') beep(a, 320, 0.14, 'square', 0.05, 620)
  else if (t === 'jump2') beep(a, 500, 0.14, 'triangle', 0.05, 900)
  else if (t === 'coin') { beep(a, 880, 0.06, 'square', 0.045); setTimeout(() => beep(a, 1320, 0.09, 'square', 0.045), 60) }
  else if (t === 'stomp') beep(a, 200, 0.12, 'sawtooth', 0.06, 70)
  else if (t === 'power') [440,660,880,1180].forEach((f,i) => setTimeout(() => beep(a, f, 0.1, 'triangle', 0.05), i*55))
  else if (t === 'hurt') beep(a, 300, 0.22, 'sawtooth', 0.06, 90)
  else if (t === 'confirm') beep(a, 660, 0.08, 'square', 0.045)
  else if (t === 'discover') { beep(a, 700, 0.07, 'triangle', 0.045); setTimeout(() => beep(a, 1050, 0.09, 'triangle', 0.045), 70) }
  else if (t === 'fanfare') [523,659,784,1047,1319].forEach((f,i) => setTimeout(() => beep(a, f, 0.14, 'triangle', 0.055), i*90))
  else if (t === 'footstep') beep(a, 150, 0.045, 'square', 0.02)
}
