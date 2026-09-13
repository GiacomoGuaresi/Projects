import { describe, expect, it } from 'vitest'
import { pagina } from './paginazione'

const numeri = Array.from({ length: 120 }, (_, i) => i + 1)

describe('pagina', () => {
  it('taglia la pagina richiesta', () => {
    expect(pagina(numeri, 2, 50)).toMatchObject({ numero: 2, pagine: 3, da: 51, a: 100, totale: 120 })
  })

  it("l'ultima pagina può essere più corta", () => {
    expect(pagina(numeri, 3, 50).elementi).toEqual(numeri.slice(100))
  })

  it('riporta dentro i limiti un numero fuori scala', () => {
    expect(pagina(numeri, 9, 50).numero).toBe(3)
    expect(pagina(numeri, 0, 50).numero).toBe(1)
  })

  it('un elenco vuoto ha una pagina vuota', () => {
    expect(pagina([], 1, 25)).toEqual({ elementi: [], numero: 1, pagine: 1, da: 0, a: 0, totale: 0 })
  })
})
