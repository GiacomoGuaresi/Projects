import { describe, expect, it } from 'vitest'
import { contieneParole, paroleRicerca } from './ricerca'

describe('paroleRicerca', () => {
  it('divide agli spazi, in minuscolo e senza accenti', () => {
    expect(paroleRicerca('  Caffè   SOFTWARE ')).toEqual(['caffe', 'software'])
  })

  it('niente parole per un testo vuoto o di soli spazi', () => {
    expect(paroleRicerca('')).toEqual([])
    expect(paroleRicerca('   ')).toEqual([])
  })
})

describe('contieneParole', () => {
  it('trova a metà parola, senza distinguere maiuscole e accenti', () => {
    expect(contieneParole('Software / Grocery', paroleRicerca('soft'))).toBe(true)
    expect(contieneParole('Comprare il caffè', paroleRicerca('CAFFE'))).toBe(true)
    expect(contieneParole('Casa', paroleRicerca('software'))).toBe(false)
  })

  it('vuole tutte le parole, in qualsiasi ordine', () => {
    expect(contieneParole('Software / Grocery', paroleRicerca('grocery soft'))).toBe(true)
    expect(contieneParole('Software / Grocery', paroleRicerca('software projects'))).toBe(false)
  })

  it('senza parole è sempre vero', () => {
    expect(contieneParole('Casa', [])).toBe(true)
  })
})
