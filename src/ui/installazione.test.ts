import { describe, expect, it } from 'vitest'
import { piattaforma } from './installazione'

describe('piattaforma', () => {
  it('riconosce iPhone e iPad', () => {
    expect(piattaforma('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('ios')
    expect(piattaforma('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)')).toBe('ios')
  })

  it("riconosce l'iPad che si presenta come Mac dallo schermo touch", () => {
    const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    expect(piattaforma(mac, 5)).toBe('ios')
    expect(piattaforma(mac, 0)).toBe('desktop')
  })

  it('riconosce Android, e tutto il resto è desktop', () => {
    expect(piattaforma('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe('android')
    expect(piattaforma('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop')
  })
})
