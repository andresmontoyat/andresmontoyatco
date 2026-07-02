import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)

describe('index.html Person JSON-LD (ASEO-01)', () => {
  it('embeds a static application/ld+json block in the head', () => {
    expect(match).toBeTruthy()
  })

  it('parses as valid JSON', () => {
    expect(() => JSON.parse(match[1])).not.toThrow()
  })

  it('declares the schema.org context', () => {
    const data = JSON.parse(match[1])
    expect(data['@context']).toBe('https://schema.org')
  })

  it('is typed as a Person', () => {
    const data = JSON.parse(match[1])
    expect(data['@type']).toBe('Person')
  })

  it('carries the canonical person name', () => {
    const data = JSON.parse(match[1])
    expect(data.name).toBe('Carlos Andrés Montoya Tobón')
  })

  it('links both github and linkedin profiles via sameAs', () => {
    const data = JSON.parse(match[1])
    expect(Array.isArray(data.sameAs)).toBe(true)
    expect(data.sameAs.some((s) => s.includes('github.com'))).toBe(true)
    expect(data.sameAs.some((s) => s.includes('linkedin.com'))).toBe(true)
  })

  it('describes a Colombian postal address', () => {
    const data = JSON.parse(match[1])
    expect(data.address['@type']).toBe('PostalAddress')
    expect(data.address.addressCountry).toBe('CO')
  })
})
