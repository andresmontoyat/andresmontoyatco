import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest'
import { animate } from './count-up.js'

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

afterEach(() => {
  delete window.matchMedia
})

describe('count-up.js animate()', () => {
  it('sets textContent to the settled template immediately under prefers-reduced-motion', () => {
    mockMatchMedia(true)
    const el = document.createElement('span')
    el.dataset.countUp = '18'
    el.dataset.countUpTemplate = '{n}+'
    animate(el)
    expect(el.textContent).toBe('18+')
  })

  it('defaults the template to "{n}" when data-count-up-template is omitted', () => {
    mockMatchMedia(true)
    const el = document.createElement('span')
    el.dataset.countUp = '45'
    animate(el)
    expect(el.textContent).toBe('45')
  })

  it('is a no-op when data-count-up is non-numeric/absent', () => {
    mockMatchMedia(true)
    const withoutAttr = document.createElement('span')
    withoutAttr.textContent = 'unchanged'
    animate(withoutAttr)
    expect(withoutAttr.textContent).toBe('unchanged')

    const nonNumeric = document.createElement('span')
    nonNumeric.dataset.countUp = 'not-a-number'
    nonNumeric.textContent = 'still-unchanged'
    animate(nonNumeric)
    expect(nonNumeric.textContent).toBe('still-unchanged')
  })
})

describe('count-up.js init() (module-load side effect)', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = ''
  })

  it('returns early with no throw when zero [data-count-up] elements exist', async () => {
    mockMatchMedia(false)
    await expect(import('./count-up.js')).resolves.toBeDefined()
  })

  it('falls back to animating all matched elements directly when IntersectionObserver is undefined', async () => {
    mockMatchMedia(true)
    const el = document.createElement('span')
    el.dataset.countUp = '18'
    el.dataset.countUpTemplate = '{n}+'
    document.body.appendChild(el)

    const originalIO = globalThis.IntersectionObserver
    delete globalThis.IntersectionObserver

    try {
      await import('./count-up.js')
      expect(el.textContent).toBe('18+')
    } finally {
      globalThis.IntersectionObserver = originalIO
    }
  })
})
