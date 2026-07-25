import { describe, it, expect } from 'vitest'
import { patrolStep, resolveContact } from './enemy.js'

const bug = (o={}) => ({ x:100, y:100, w:28, h:26, vx:1, x0:80, x1:160, dead:0, hit:0, ...o })
const faller = (o={}) => ({ x:100, y:64, w:26, h:36, vy:8, inv:0, ...o }) // above the bug

describe('enemy', () => {
  it('patrols and reverses at bounds', () => {
    const en = bug({ x:160, vx:1 }); patrolStep(en)
    expect(en.vx).toBeLessThan(0)
  })
  it('is stomped when the player falls onto its head', () => {
    const en = bug(); const p = faller()
    expect(resolveContact(p, en)).toBe('kill'); expect(en.dead).toBe(1); expect(p.vy).toBeLessThan(0)
  })
  it('hurts the player on a side hit', () => {
    const en = bug(); const p = { x:100, y:100, w:26, h:36, vy:0, inv:0 }
    expect(resolveContact(p, en)).toBe('hurt'); expect(en.dead).toBe(0)
  })
  it('a boss survives the first two stomps and dies on the third', () => {
    const en = bug({ boss:1, hp:3, w:56, h:52, y:100 })
    const seq = []
    for (let i = 0; i < 3; i++) { en.hit = 0; const p = faller({ y:52 }); seq.push(resolveContact(p, en)) }
    expect(seq).toEqual(['stomp','stomp','kill']); expect(en.dead).toBe(1)
  })
  it('ignores contact during hit cooldown', () => {
    const en = bug({ hit:10 }); const p = faller()
    expect(resolveContact(p, en)).toBe('none')
  })
})
