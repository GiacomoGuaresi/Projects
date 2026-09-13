import { describe, expect, it } from 'vitest'
import { coloreProgetto, iniziali, tonalita } from './progetto'

describe('iniziali', () => {
  it('prende i primi due caratteri in maiuscolo', () => {
    expect(iniziali('Casa')).toBe('CA')
    expect(iniziali('bagno nuovo')).toBe('BA')
  })

  it('ignora gli spazi ai bordi', () => {
    expect(iniziali('  auto ')).toBe('AU')
  })

  it('regge nomi di un carattere e caratteri fuori dal BMP', () => {
    expect(iniziali('x')).toBe('X')
    expect(iniziali('🏠casa')).toBe('🏠C')
  })
})

describe('tonalita', () => {
  it('è sempre la stessa per lo stesso progetto', () => {
    expect(tonalita('Casa')).toBe(tonalita('Casa'))
  })

  it('non distingue maiuscole, minuscole e spazi ai bordi', () => {
    expect(tonalita(' casa ')).toBe(tonalita('CASA'))
  })

  it('sta tra 0 e 359', () => {
    for (const nome of ['Casa', 'Giardino', 'Auto', 'Bagno', 'Cucina', 'a'.repeat(200)]) {
      const t = tonalita(nome)
      expect(t).toBeGreaterThanOrEqual(0)
      expect(t).toBeLessThan(360)
    }
  })

  it('distingue progetti diversi', () => {
    expect(tonalita('Casa')).not.toBe(tonalita('Auto'))
  })
})

describe('coloreProgetto', () => {
  it('usa la tonalità del progetto', () => {
    expect(coloreProgetto('Casa')).toBe(`hsl(${tonalita('Casa')} 45% 82%)`)
  })
})
