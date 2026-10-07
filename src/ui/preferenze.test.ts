import { describe, expect, it } from 'vitest'
import { leggiChiusi, leggiCookie, leggiRilievi } from './preferenze'

describe('leggiChiusi', () => {
  it('legge le chiavi, anche quella vuota di "Senza progetto", e scarta il resto', () => {
    const valore = encodeURIComponent(JSON.stringify(['casa', '', 3, null]))
    expect(leggiChiusi(`projects_chiusi=${valore}`)).toEqual(new Set(['casa', '']))
  })

  it('senza cookie o con un valore rovinato dà vuoto', () => {
    expect(leggiChiusi('')).toEqual(new Set())
    expect(leggiChiusi('projects_chiusi=%5Bnon-json')).toEqual(new Set())
    expect(leggiChiusi('projects_chiusi=%7B%7D')).toEqual(new Set())
  })
})

describe('leggiRilievi', () => {
  it('legge preferiti e accantonati, scarta il resto', () => {
    const valore = encodeURIComponent(JSON.stringify({ casa: 'preferito', auto: 'accantonato', orto: 'boh' }))
    expect(leggiRilievi(`projects_rilievi=${valore}`)).toEqual({ casa: 'preferito', auto: 'accantonato' })
  })

  it('senza cookie o con un valore rovinato dà vuoto', () => {
    expect(leggiRilievi('')).toEqual({})
    expect(leggiRilievi('projects_rilievi=%7Bnon-json')).toEqual({})
    expect(leggiRilievi('projects_rilievi=%5B1%5D')).toEqual({})
  })
})

describe('leggiCookie', () => {
  it('trova il cookie per nome, tra gli altri', () => {
    expect(leggiCookie('sb-auth=abc; projects_completi=0; altro=1', 'projects_completi')).toBe('0')
  })

  it('non confonde nomi che si somigliano, e senza cookie dà null', () => {
    expect(leggiCookie('x_projects_completi=1', 'projects_completi')).toBeNull()
    expect(leggiCookie('', 'projects_completi')).toBeNull()
  })

  it('decodifica il valore', () => {
    expect(leggiCookie('nome=a%20b', 'nome')).toBe('a b')
  })
})
