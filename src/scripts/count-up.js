// Shared count-up enhancer (D-02) — animates every [data-count-up] element
// from 0 to its data-target using the same cubic ease-out curve as the old
// per-component useCountUp (Hero.jsx). Used by Hero.astro and About.astro.
const DURATION_MS = 1100
const SELECTOR = '[data-count-up]'

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function animate(el) {
  const target = Number(el.dataset.countUp)
  if (!Number.isFinite(target)) return
  const template = el.dataset.countUpTemplate || '{n}'
  const setDisplay = (n) => { el.textContent = template.replace('{n}', String(n)) }

  if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
    setDisplay(target)
    return
  }
  let startTs = null
  // D-04 seam: if visual QA (Plan 24-05) shows counting during Hero's 850ms
  // fade-in, insert a fixed start offset here before the first rAF call.
  function tick(ts) {
    if (startTs === null) startTs = ts
    const p = Math.min(1, (ts - startTs) / DURATION_MS)
    setDisplay(Math.round(target * (1 - (1 - p) ** 3)))
    if (p < 1) requestAnimationFrame(tick)
  }
  setDisplay(0)
  requestAnimationFrame(tick)
}

function init() {
  const els = document.querySelectorAll(SELECTOR)
  if (els.length === 0) return
  if (typeof IntersectionObserver !== 'function') {
    els.forEach(animate)
    return
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target)
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.4 })
  els.forEach((el) => observer.observe(el))
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

export { animate }
