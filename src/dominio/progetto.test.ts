import { describe, expect, it } from 'vitest'
import {
  cambioProgetto,
  coloreProgetto,
  iniziali,
  normalizzaProgetto,
  progettiInUso,
  suggerisciProgetti,
  tonalita,
  type ProgettoInUso,
} from './progetto'
import type { Stato } from './tipi'

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

const riga = (progetto: string | null, stato: Stato = 'da_fare') => ({ progetto, stato })

describe('progettiInUso', () => {
  it('unisce le grafie dello stesso progetto e tiene la più usata', () => {
    expect(progettiInUso([riga('casa'), riga('Casa'), riga('Casa '), riga(null)])).toEqual([
      { progetto: 'Casa', quante: 3, quanteAperte: 3 },
    ])
  })

  it('a parità di uso sceglie la grafia che viene prima', () => {
    expect(progettiInUso([riga('casa'), riga('Casa')])[0].progetto).toBe('Casa')
  })

  it('conta a parte le attività aperte e ordina per nome', () => {
    expect(progettiInUso([riga('Bagno', 'completo'), riga('auto'), riga('Bagno', 'bloccato')])).toEqual([
      { progetto: 'auto', quante: 1, quanteAperte: 1 },
      { progetto: 'Bagno', quante: 2, quanteAperte: 1 },
    ])
  })

  it('ignora i progetti vuoti', () => {
    expect(progettiInUso([riga(''), riga('  ')])).toEqual([])
  })
})

const progetti: ProgettoInUso[] = [
  { progetto: 'Bagno', quante: 12, quanteAperte: 2 },
  { progetto: 'Balcone', quante: 1, quanteAperte: 1 },
  { progetto: 'Casa', quante: 30, quanteAperte: 9 },
  { progetto: 'Garage', quante: 4, quanteAperte: 0 },
]

describe('normalizzaProgetto', () => {
  it('usa la grafia già in uso', () => {
    expect(normalizzaProgetto('  casa ', progetti)).toBe('Casa')
  })

  it('tiene i nomi nuovi come scritti, senza spazi ai bordi', () => {
    expect(normalizzaProgetto(' Auto ', progetti)).toBe('Auto')
  })

  it('vuoto è nessun progetto', () => {
    expect(normalizzaProgetto('   ', progetti)).toBeNull()
  })
})

describe('suggerisciProgetti', () => {
  it('senza testo propone i più usati tra le attività aperte', () => {
    expect(suggerisciProgetti('', progetti)).toEqual(['Casa', 'Bagno', 'Balcone', 'Garage'])
  })

  it('mette prima i progetti che iniziano con il testo', () => {
    expect(suggerisciProgetti('a', progetti)).toEqual(['Casa', 'Bagno', 'Balcone', 'Garage'])
    expect(suggerisciProgetti('ga', progetti)).toEqual(['Garage'])
    expect(suggerisciProgetti('BA', progetti)).toEqual(['Bagno', 'Balcone'])
  })

  it('non ripropone il progetto già scritto per intero', () => {
    expect(suggerisciProgetti('bagno', progetti)).toEqual([])
  })

  it('si ferma al massimo richiesto', () => {
    expect(suggerisciProgetti('', progetti, 2)).toEqual(['Casa', 'Bagno'])
  })
})

describe('cambioProgetto', () => {
  it('non fa niente se il progetto resta lo stesso', () => {
    expect(cambioProgetto('Casa', ' Casa ', progetti)).toEqual({ tipo: 'nessuno' })
    expect(cambioProgetto(null, '  ', progetti)).toEqual({ tipo: 'nessuno' })
  })

  it('salva e basta se si parte da nessun progetto', () => {
    expect(cambioProgetto(null, 'bagno', progetti)).toEqual({ tipo: 'salva', progetto: 'Bagno' })
  })

  it("salva e basta se nessun'altra attività usa il progetto di partenza", () => {
    expect(cambioProgetto('Balcone', 'Terrazzo', progetti)).toEqual({ tipo: 'salva', progetto: 'Terrazzo' })
  })

  it('chiede "solo questa / tutte" se il progetto di partenza è condiviso', () => {
    expect(cambioProgetto('Bagno', 'Bagno ospiti', progetti)).toEqual({
      tipo: 'chiedi',
      da: 'Bagno',
      a: 'Bagno ospiti',
      quante: 12,
    })
  })

  it('chiede anche quando si toglie il progetto', () => {
    expect(cambioProgetto('Casa', '', progetti)).toEqual({ tipo: 'chiedi', da: 'Casa', a: null, quante: 30 })
  })

  it('verso un progetto esistente usa la sua grafia (unione)', () => {
    expect(cambioProgetto('Garage', 'casa', progetti)).toEqual({
      tipo: 'chiedi',
      da: 'Garage',
      a: 'Casa',
      quante: 4,
    })
  })

  it('una correzione di maiuscole tiene la grafia scritta', () => {
    expect(cambioProgetto('Casa', 'CASA', progetti)).toEqual({ tipo: 'chiedi', da: 'Casa', a: 'CASA', quante: 30 })
  })
})
