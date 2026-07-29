const MAP = { ArrowLeft: 'L', a: 'L', ArrowRight: 'R', d: 'R', ArrowUp: 'U', w: 'U', ArrowDown: 'D', s: 'D' }

export function createTopdownInput() {
  const state = { L: 0, R: 0, U: 0, D: 0, A: 0 }
  let cb = {}
  const listeners = []

  function press(kind, down) { state[kind] = down ? 1 : 0 }

  function setKey(key, down) {
    const kind = MAP[key]
    if (kind) press(kind, down)
    if (!down) return
    if (cb.onKey) cb.onKey(key)
    const k = key.toLowerCase()
    if ((k === 'e' || key === ' ') && cb.onInteract) cb.onInteract()
    if (k === 'l' && cb.onLanguage) cb.onLanguage()
  }

  function attach(el, callbacks = {}) {
    cb = callbacks
    if (!el) return
    const kd = e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); setKey(e.key, true) }
    const ku = e => setKey(e.key, false)
    el.addEventListener('keydown', kd); el.addEventListener('keyup', ku)
    listeners.push([el, 'keydown', kd], [el, 'keyup', ku])
  }

  function detach() { for (const [t, ty, h] of listeners) t.removeEventListener(ty, h); listeners.length = 0 }

  return { state, attach, setKey, press, detach }
}
