import { describe, it, expect } from 'vitest'
import { applyPowerup } from './powerup.js'
describe('powerup', () => {
  it('grants boots', () => { const p = { boots:false, shield:false }; applyPowerup(p,'boots'); expect(p.boots).toBe(true) })
  it('grants shield', () => { const p = { boots:false, shield:false }; applyPowerup(p,'shield'); expect(p.shield).toBe(true) })
})
