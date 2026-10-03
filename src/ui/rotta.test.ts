import { describe, expect, it } from 'vitest'
import { opzioniSfondo } from './rotta'

describe('opzioniSfondo', () => {
  it('solo sulla Foresta con ?sfondo', () => {
    expect(opzioniSfondo('#/foresta?sfondo')).toEqual({ pannelli: [], posizione: 'basso-sinistra' })
    expect(opzioniSfondo('#/foresta?altro&sfondo')).not.toBeNull()
    expect(opzioniSfondo('#/foresta')).toBeNull()
    expect(opzioniSfondo('#/foresta?altro')).toBeNull()
    expect(opzioniSfondo('#/?sfondo')).toBeNull()
  })

  it('legge pannelli e posizione, nell\'ordine giusto e ignorando i valori sconosciuti', () => {
    expect(opzioniSfondo('#/foresta?sfondo&pannelli=numeri,boh,oggi&posizione=alto-destra')).toEqual({
      pannelli: ['oggi', 'numeri'],
      posizione: 'alto-destra',
    })
    expect(opzioniSfondo('#/foresta?sfondo&posizione=in-mezzo')?.posizione).toBe('basso-sinistra')
  })
})
