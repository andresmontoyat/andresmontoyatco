const MOVE_KEYS = { L: ['ArrowLeft', 'a'], R: ['ArrowRight', 'd'], J: [' ', 'ArrowUp', 'w'] }

function matchesKey(key, names) {
  return names.includes(key)
}

export function createInput() {
  const keys = { L: 0, R: 0, J: 0 }
  const listeners = []
  let callbacks = {}

  function on(target, type, handler) {
    target.addEventListener(type, handler)
    listeners.push({ target, type, handler })
  }

  function handleKeydown(e) {
    const k = e.key
    if (matchesKey(k, MOVE_KEYS.L)) keys.L = 1
    if (matchesKey(k, MOVE_KEYS.R)) keys.R = 1
    if (matchesKey(k, MOVE_KEYS.J)) {
      keys.J = 1
      e.preventDefault()
      if (callbacks.onJumpBuffer) callbacks.onJumpBuffer()
    }
    if (k === 'Escape' && callbacks.onClose) callbacks.onClose()
    if ((k === 'Enter' || k === 'ArrowDown' || k === 's') && callbacks.onOpenNearest) {
      e.preventDefault()
      callbacks.onOpenNearest()
    }
  }

  function handleKeyup(e) {
    const k = e.key
    if (matchesKey(k, MOVE_KEYS.L)) keys.L = 0
    if (matchesKey(k, MOVE_KEYS.R)) keys.R = 0
    if (matchesKey(k, MOVE_KEYS.J)) keys.J = 0
  }

  function attach(el, cb = {}) {
    callbacks = cb
    on(el, 'keydown', handleKeydown)
    on(el, 'keyup', handleKeyup)
  }

  function bindTouch(button, kind) {
    const press = (e) => {
      e.preventDefault()
      keys[kind] = 1
      if (kind === 'J' && callbacks.onJumpBuffer) callbacks.onJumpBuffer()
    }
    const release = (e) => {
      e.preventDefault()
      keys[kind] = 0
    }
    on(button, 'pointerdown', press)
    on(button, 'pointerup', release)
    on(button, 'pointerleave', release)
  }

  function detach() {
    for (const { target, type, handler } of listeners) target.removeEventListener(type, handler)
    listeners.length = 0
  }

  return { keys, attach, detach, bindTouch }
}
