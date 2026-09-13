import { describe, expect, it } from 'vitest'
import { leggiCookie } from './preferenze'

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
