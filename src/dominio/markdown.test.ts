import { describe, expect, it } from 'vitest'
import { normalizzaChecklist } from './markdown'

describe('normalizzaChecklist', () => {
  it('aggiunge il trattino alle caselle scritte da sole', () => {
    expect(normalizzaChecklist('[ ] pane\n[X] latte')).toBe('- [ ] pane\n- [x] latte')
  })

  it('lascia com’è una checklist già valida e mantiene il rientro', () => {
    expect(normalizzaChecklist('- [ ] uno\n  * [x] due')).toBe('- [ ] uno\n  - [x] due')
  })

  it('non tocca il resto del testo', () => {
    expect(normalizzaChecklist('Nota [importante] qui\n[link](http://x)')).toBe('Nota [importante] qui\n[link](http://x)')
  })
})
