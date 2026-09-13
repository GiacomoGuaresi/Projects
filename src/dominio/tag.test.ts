import { describe, expect, it } from 'vitest'
import { pezziTitolo, TAG, titoloSenzaTag, trovaTag } from './tag'

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

describe('titoloSenzaTag', () => {
  it('toglie i tag e tiene il testo', () => {
    expect(titoloSenzaTag('<urgente> Caldaia <guasto> revisione')).toBe('Caldaia revisione')
  })
})
