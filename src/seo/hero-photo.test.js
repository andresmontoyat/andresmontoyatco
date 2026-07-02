import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

describe('hero photo treatment (brand duotone, static LCP layer)', () => {
  it('brightens the photo above the old near-black value', () => {
    const m = html.match(/--hero-photo-filter:\s*([^;]+);/)
    expect(m).not.toBeNull()
    expect(m[1]).toMatch(/brightness\(0?\.6\d?\)/)
  })

  it('keeps the photo as a static img (LCP element preserved)', () => {
    expect(html).toMatch(/<div id="hero-static">/)
    expect(html).toMatch(/<img[^>]+src="\/me-800\.webp"/)
  })

  it('applies a brand-tinted overlay (teal/blue), not only flat dark', () => {
    const m = html.match(/--hero-overlay:\s*([^;]+);/)
    expect(m).not.toBeNull()
    // brand teal #00E5A8 = rgb(0,229,168) / brand blue #00C2FF = rgb(0,194,255)
    expect(m[1]).toMatch(/rgba\(0,\s*229,\s*168/)
  })
})
