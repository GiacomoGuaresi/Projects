import { describe, expect, it } from 'vitest'
import { applicaModifica } from './attivita'
import { attivita } from './esempi'

const adesso = new Date('2026-09-13T10:00:00Z')

describe('applicaModifica', () => {
  it('cambia i campi richiesti e segna la modifica', () => {
    const prima = attivita({ titolo: 'Vetri', priorita: 2 })
    const dopo = applicaModifica(prima, { priorita: 5 }, adesso)
    expect(dopo).toMatchObject({ titolo: 'Vetri', priorita: 5, modificata_il: adesso.toISOString() })
  })

  it('completa ⇒ avanzamento 100 e data di completamento', () => {
    const dopo = applicaModifica(attivita({ avanzamento: 30 }), { stato: 'completo' }, adesso)
    expect(dopo).toMatchObject({ avanzamento: 100, completata_il: adesso.toISOString() })
  })

  it('una completa resta con la sua data di completamento', () => {
    const prima = attivita({ stato: 'completo', avanzamento: 100, completata_il: '2026-01-01T00:00:00Z' })
    expect(applicaModifica(prima, { titolo: 'Altro' }, adesso).completata_il).toBe('2026-01-01T00:00:00Z')
  })

  it("riaperta perde la data di completamento e tiene l'avanzamento", () => {
    const prima = attivita({ stato: 'completo', avanzamento: 100, completata_il: '2026-01-01T00:00:00Z' })
    expect(applicaModifica(prima, { stato: 'in_corso' }, adesso)).toMatchObject({
      avanzamento: 100,
      completata_il: null,
    })
  })

  it('il progetto perde gli spazi, e vuoto diventa null', () => {
    expect(applicaModifica(attivita(), { progetto: ' Casa ' }, adesso).progetto).toBe('Casa')
    expect(applicaModifica(attivita({ progetto: 'Casa' }), { progetto: '  ' }, adesso).progetto).toBeNull()
  })
})
