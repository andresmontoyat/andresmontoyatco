import { beforeEach, describe, expect, it } from 'vitest'
import { initDismiss } from './details-dismiss.js'

function buildDetails() {
  document.body.innerHTML = `
    <details class="details-dismiss">
      <summary>Download CV</summary>
      <a href="/cv.pdf" download>CV</a>
    </details>
    <button type="button">Outside</button>
  `
  return document.querySelector('details.details-dismiss')
}

describe('details-dismiss.js initDismiss()', () => {
  let el

  beforeEach(() => {
    el = buildDetails()
  })

  it('closes an open details element on Escape keydown', () => {
    el.open = true
    initDismiss()

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(el.open).toBe(false)
  })

  it('closes an open details element on an outside document click', () => {
    el.open = true
    initDismiss()

    const outside = document.querySelector('button')
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(el.open).toBe(false)
  })
})
