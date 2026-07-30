export function isTouch(nav = navigator) {
  return (nav.maxTouchPoints || 0) > 0
}

const BTNS = [
  { kind: 'U', label: '▲' }, { kind: 'D', label: '▼' }, { kind: 'L', label: '◀' }, { kind: 'R', label: '▶' }, { kind: 'A', label: 'A' },
]

export function mountTouchControls(container, input, doc = document) {
  const els = []
  for (const b of BTNS) {
    const el = doc.createElement('button')
    el.textContent = b.label
    el.classList.add('rpg-touch', `rpg-touch-${b.kind.toLowerCase()}`)
    const down = e => { e.preventDefault(); input.press(b.kind, true) }
    const up = e => { e.preventDefault(); input.press(b.kind, false) }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', up)
    container.appendChild(el)
    els.push(el)
  }
  return { destroy() { for (const el of els) container.removeChild(el) } }
}
