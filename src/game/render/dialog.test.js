import { describe, it, expect } from 'vitest'
import { dialogLines, createDialog } from './dialog.js'

const site = { co: 'TCS', title: { en: 'Tech Lead', es: 'Líder' }, date: { en: '2013', es: '2013' }, metric: { v: '45+', en: 'devs', es: 'devs' }, tech: ['Java', 'OSB'] }
const noMetric = { ...site, metric: null }

describe('dialogLines', () => {
  it('builds title·company, date, metric, tech in the active language', () => {
    expect(dialogLines(site, 'es')).toEqual(['Líder  ·  TCS', '2013', '★ 45+  devs', '‹tech› Java · OSB'])
  })
  it('skips the metric line when absent', () => {
    expect(dialogLines(noMetric, 'en')).toEqual(['Tech Lead  ·  TCS', '2013', '‹tech› Java · OSB'])
  })
})

describe('createDialog', () => {
  it('opens into typing state', () => {
    const d = createDialog()
    d.open(site)
    expect(d.state).toBe('typing')
    expect(d.isOpen()).toBe(true)
  })
  it('advance during typing reveals full text and moves to waiting', () => {
    const d = createDialog()
    d.open(site)
    d.advance()
    expect(d.state).toBe('waiting')
    expect(d.visibleText('es')).toBe(dialogLines(site, 'es').join('\n'))
  })
  it('advance while waiting closes the dialog', () => {
    const d = createDialog()
    d.open(site)
    d.advance()
    d.advance()
    expect(d.state).toBe('closed')
    expect(d.isOpen()).toBe(false)
  })
  it('tick accumulates revealed characters and reaches waiting', () => {
    const d = createDialog()
    d.open(site)
    for (let i = 0; i < 200; i++) d.tick(2)
    expect(d.state).toBe('waiting')
  })
})
