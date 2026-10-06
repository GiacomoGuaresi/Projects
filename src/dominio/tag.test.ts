import { describe, expect, it } from 'vitest'
import {
  coloreConData,
  inserisciTag,
  scadenzaDi,
  pezziTitolo,
  suggerisciTag,
  TAG,
  tagInCorso,
  titoloSenzaTag,
  trovaTag,
  trovaTagConData,
} from './tag'

describe('trovaTag', () => {
  it('ignora maiuscole, minuscole e spazi', () => {
    expect(trovaTag('URGENTE')?.nome).toBe('urgente')
    expect(trovaTag('  fai   Da te ')?.nome).toBe('fai da te')
  })

  it('riconosce i tag di stagione, cucito, Natale, cucina, bug e scadenza', () => {
    for (const nome of ['progetto', 'inverno', 'estate', 'cucito', 'natalizio', 'cucina', 'bug', 'scadenza', 'attesa', 'moto']) {
      expect(trovaTag(nome.toUpperCase())?.nome).toBe(nome)
    }
  })

  it('non trova i tag fuori elenco', () => {
    expect(trovaTag('bloccato')).toBeNull()
  })
})

describe('trovaTagConData', () => {
  it("legge la data con l'anno a 2 o 4 cifre", () => {
    expect(trovaTagConData('SCADENZA 5/3/27')).toEqual({ tag: trovaTag('scadenza'), giorno: '2027-03-05', testo: 'scadenza 5/3/27' })
    expect(trovaTagConData(' scadenza  31/12/2026 ')?.giorno).toBe('2026-12-31')
  })

  it('scarta le date che non esistono, i formati sbagliati e i tag senza data', () => {
    expect(trovaTagConData('scadenza 31/02/26')).toBeNull()
    expect(trovaTagConData('scadenza 29/02/2027')).toBeNull()
    expect(trovaTagConData('scadenza 12/10/026')).toBeNull()
    expect(trovaTagConData('scadenza domani')).toBeNull()
    expect(trovaTagConData('urgente 12/10/26')).toBeNull()
  })
})

describe('pezziTitolo', () => {
  it('separa i tag dal testo', () => {
    expect(pezziTitolo("<urgente> Chiamare l'idraulico")).toEqual([
      { tipo: 'tag', nome: 'urgente', tag: TAG[0] },
      { tipo: 'testo', testo: "Chiamare l'idraulico" },
    ])
  })

  it('ammette più tag, anche in mezzo o in fondo al titolo', () => {
    const pezzi = pezziTitolo('Rubinetto <guasto> cucina <Fai da te>')
    expect(pezzi.map((p) => (p.tipo === 'tag' ? `<${p.nome}>` : p.testo))).toEqual([
      'Rubinetto',
      '<guasto>',
      'cucina',
      '<fai da te>',
    ])
  })

  it('mostra i tag fuori elenco come neutri, con il nome scritto', () => {
    expect(pezziTitolo('<Barca> Vernice')[0]).toEqual({ tipo: 'tag', nome: 'Barca', tag: null })
  })

  it('lascia nel testo le parentesi vuote o senza chiusura', () => {
    expect(pezziTitolo('a < > b')).toEqual([{ tipo: 'testo', testo: 'a < > b' }])
    expect(pezziTitolo('prezzo <3 euro')).toEqual([{ tipo: 'testo', testo: 'prezzo <3 euro' }])
  })

  it('una scadenza porta il giorno; con una data che non esiste è neutra', () => {
    expect(pezziTitolo('Bollo auto <SCADENZA 31/10/26>')[1]).toEqual({
      tipo: 'tag',
      nome: 'scadenza 31/10/26',
      tag: trovaTag('scadenza'),
      giorno: '2026-10-31',
    })
    expect(pezziTitolo('<scadenza 31/11/26>')[0]).toEqual({ tipo: 'tag', nome: 'scadenza 31/11/26', tag: null })
  })

  it('un titolo senza tag è un solo pezzo', () => {
    expect(pezziTitolo('  Pulire  i vetri ')).toEqual([{ tipo: 'testo', testo: 'Pulire i vetri' }])
  })
})

describe('tagInCorso', () => {
  it('trova il tag aperto prima del cursore', () => {
    expect(tagInCorso('Caldaia <gua', 12)).toEqual({ da: 8, a: 12, testo: 'gua' })
    expect(tagInCorso('<', 1)).toEqual({ da: 0, a: 1, testo: '' })
  })

  it('niente se il tag è già chiuso prima del cursore, o se non c\'è "<"', () => {
    expect(tagInCorso('<guasto> Caldaia', 16)).toBeNull()
    expect(tagInCorso('Caldaia', 7)).toBeNull()
  })

  it('correggendo dentro un tag chiuso, il tag arriva fino al ">"', () => {
    expect(tagInCorso('<gua> Caldaia', 3)).toEqual({ da: 0, a: 5, testo: 'gu' })
  })
})

describe('suggerisciTag', () => {
  it('prima quelli che iniziano col testo, poi quelli che lo contengono, senza i riservati', () => {
    expect(suggerisciTag('cu').map((t) => t.nome)).toEqual(['cucito', 'cucina'])
    expect(suggerisciTag('st').map((t) => t.nome)).toEqual(['guasto', 'estate', 'acquisto'])
    expect(suggerisciTag('in').map((t) => t.nome)).toEqual(['inverno', 'insieme', 'cucina', 'giardino'])
    expect(suggerisciTag('').some((t) => t.riservato)).toBe(false)
    expect(suggerisciTag('IA').map((t) => t.nome)).toEqual(['chiamare', 'giardino'])
  })

  it('niente suggerimenti mentre si scrive la data di una scadenza', () => {
    expect(suggerisciTag('scad').map((t) => t.nome)).toEqual(['scadenza'])
    expect(suggerisciTag('SCADENZA ')).toEqual([])
    expect(suggerisciTag('scadenza 12/1')).toEqual([])
  })
})

describe('inserisciTag', () => {
  it('sostituisce il tag in corso con quello scelto, in maiuscolo, e mette il cursore dopo lo spazio', () => {
    const titolo = 'Caldaia <gua'
    expect(inserisciTag(titolo, tagInCorso(titolo, 12)!, 'guasto')).toEqual({
      titolo: 'Caldaia <GUASTO> ',
      cursore: 17,
    })
  })

  it('non raddoppia lo spazio e sostituisce anche un tag già chiuso', () => {
    const titolo = '<gua> Caldaia'
    expect(inserisciTag(titolo, tagInCorso(titolo, 3)!, 'guasto')).toEqual({ titolo: '<GUASTO> Caldaia', cursore: 9 })
  })

  it('per una scadenza lascia il cursore dentro il tag, dove va la data', () => {
    const titolo = 'Bollo <sca'
    expect(inserisciTag(titolo, tagInCorso(titolo, 10)!, 'scadenza')).toEqual({ titolo: 'Bollo <SCADENZA > ', cursore: 16 })
  })
})

describe('coloreConData', () => {
  const scadenza = trovaTag('scadenza')!
  const attesa = trovaTag('attesa')!

  it('scadenza: allarme se passata, rossa il giorno stesso, arancio nei 3 giorni prima, poi indaco', () => {
    expect(coloreConData(scadenza, '2026-10-05', '2026-10-06')).toBe('allarme')
    expect(coloreConData(scadenza, '2026-10-06', '2026-10-06')).toBe('rosso')
    expect(coloreConData(scadenza, '2026-10-09', '2026-10-06')).toBe('arancio')
    expect(coloreConData(scadenza, '2026-10-10', '2026-10-06')).toBe('indaco')
  })

  it('attesa: allarme se passata, altrimenti lavanda', () => {
    expect(coloreConData(attesa, '2026-10-05', '2026-10-06')).toBe('allarme')
    expect(coloreConData(attesa, '2026-10-06', '2026-10-06')).toBe('lavanda')
    expect(coloreConData(attesa, '2026-10-07', '2026-10-06')).toBe('lavanda')
  })
})

describe('scadenzaDi', () => {
  it('la scadenza più vicina, senza contare attese e date che non esistono', () => {
    expect(scadenzaDi('<scadenza 9/11/26> Bollo <scadenza 1/11/26>')).toBe('2026-11-01')
    expect(scadenzaDi('<attesa 1/10/26> Pezzo <scadenza 31/02/26>')).toBeNull()
    expect(scadenzaDi('Senza tag')).toBeNull()
  })
})

describe('titoloSenzaTag', () => {
  it('toglie i tag e tiene il testo', () => {
    expect(titoloSenzaTag('<urgente> Caldaia <guasto> revisione')).toBe('Caldaia revisione')
  })
})
