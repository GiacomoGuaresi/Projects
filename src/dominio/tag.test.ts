import { describe, expect, it } from 'vitest'
import { inserisciTag, pezziTitolo, suggerisciTag, TAG, tagInCorso, titoloSenzaTag, trovaTag } from './tag'

describe('trovaTag', () => {
  it('ignora maiuscole, minuscole e spazi', () => {
    expect(trovaTag('URGENTE')?.nome).toBe('urgente')
    expect(trovaTag('  fai   Da te ')?.nome).toBe('fai da te')
  })

  it('riconosce i tag di stagione, cucito, Natale e cucina', () => {
    for (const nome of ['progetto', 'inverno', 'estate', 'cucito', 'natalizio', 'cucina']) {
      expect(trovaTag(nome.toUpperCase())?.nome).toBe(nome)
    }
  })

  it('non trova i tag fuori elenco', () => {
    expect(trovaTag('bloccato')).toBeNull()
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
    expect(pezziTitolo('<Giardino> Potare')[0]).toEqual({ tipo: 'tag', nome: 'Giardino', tag: null })
  })

  it('lascia nel testo le parentesi vuote o senza chiusura', () => {
    expect(pezziTitolo('a < > b')).toEqual([{ tipo: 'testo', testo: 'a < > b' }])
    expect(pezziTitolo('prezzo <3 euro')).toEqual([{ tipo: 'testo', testo: 'prezzo <3 euro' }])
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
    expect(suggerisciTag('st').map((t) => t.nome)).toEqual(['guasto', 'estate'])
    expect(suggerisciTag('in').map((t) => t.nome)).toEqual(['inverno', 'cucina'])
    expect(suggerisciTag('').some((t) => t.riservato)).toBe(false)
    expect(suggerisciTag('IA')).toEqual([])
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
})

describe('titoloSenzaTag', () => {
  it('toglie i tag e tiene il testo', () => {
    expect(titoloSenzaTag('<urgente> Caldaia <guasto> revisione')).toBe('Caldaia revisione')
  })
})
