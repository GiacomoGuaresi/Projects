import { describe, expect, it } from 'vitest'
import { inModalitaSfondo } from './rotta'

describe('inModalitaSfondo', () => {
  it('solo sulla Foresta con ?sfondo', () => {
    expect(inModalitaSfondo('#/foresta?sfondo')).toBe(true)
    expect(inModalitaSfondo('#/foresta?altro&sfondo')).toBe(true)
    expect(inModalitaSfondo('#/foresta')).toBe(false)
    expect(inModalitaSfondo('#/foresta?altro')).toBe(false)
    expect(inModalitaSfondo('#/?sfondo')).toBe(false)
  })
})
