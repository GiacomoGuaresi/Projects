import { describe, expect, it } from 'vitest'
import { limitaZoom, pinza, scorriDopoZoom, ZOOM_MASSIMO, ZOOM_MINIMO } from './useGesti'

describe('scorriDopoZoom', () => {
  it('tiene fermo il punto sotto le dita', () => {
    // Il punto a 100px dal bordo, con 300px già scorsi, è a 400px nel contenuto.
    const scorri = scorriDopoZoom(300, 100, 1, 2)
    // Raddoppiando, quel punto finisce a 800px: va scorso a 700 perché resti a 100.
    expect(scorri).toBe(700)
    expect((scorri + 100) / 2).toBe(400)
  })

  it('senza cambio di zoom non scorre', () => {
    expect(scorriDopoZoom(250, 40, 1.5, 1.5)).toBe(250)
  })
})

describe('pinza', () => {
  it('dà distanza e punto di mezzo delle due dita', () => {
    expect(pinza({ x: 0, y: 0 }, { x: 30, y: 40 })).toEqual({ distanza: 50, x: 15, y: 20 })
  })
})

describe('limitaZoom', () => {
  it('resta tra il minimo e il massimo', () => {
    expect(limitaZoom(0.2)).toBe(ZOOM_MINIMO)
    expect(limitaZoom(2)).toBe(2)
    expect(limitaZoom(99)).toBe(ZOOM_MASSIMO)
  })
})
