import { describe, expect, it } from 'vitest'
import { mescola } from './colori'

describe('mescola', () => {
  it('va da un colore all\'altro', () => {
    expect(mescola('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mescola('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(mescola('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mescola('#ff0000', '#0000ff', 0.25)).toBe('#bf0040')
  })

  it('tiene t tra 0 e 1', () => {
    expect(mescola('#102030', '#405060', -1)).toBe('#102030')
    expect(mescola('#102030', '#405060', 3)).toBe('#405060')
  })
})
