import { describe, expect, it } from 'vitest'
import {
  daCreare,
  daSalvare,
  descrivi,
  formattaGiorno,
  giornoSettimanaDi,
  inizioDa,
  occorrenzaDa,
  occorrenzaDopo,
  oggi,
  prossimaDopoModifica,
  primeVolte,
  prossimeOccorrenze,
  regolaDa,
  scelteDa,
  ULTIMO,
  type Scelte,
} from './ricorrenze'
import type { Regola, Ricorrenza } from './tipi'

const regola = (campi: Partial<Regola> = {}): Regola => ({
  unita: 'giorno',
  ogni: 1,
  giorni: null,
  inizio: '2026-09-25', // venerdì
  ...campi,
})

describe('oggi', () => {
  it('è la data locale del dispositivo', () => {
    expect(oggi(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(oggi(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31')
  })
})

describe('giornoSettimanaDi', () => {
  it('conta da lunedì = 1 a domenica = 7', () => {
    expect(giornoSettimanaDi('2026-09-21')).toBe(1)
    expect(giornoSettimanaDi('2026-09-25')).toBe(5)
    expect(giornoSettimanaDi('2026-09-27')).toBe(7)
    expect(giornoSettimanaDi('1969-12-29')).toBe(1)
  })
})

describe('occorrenzaDa', () => {
  it('mai prima dell’inizio', () => {
    expect(occorrenzaDa(regola(), '2026-01-01')).toBe('2026-09-25')
  })

  it('ogni giorno e ogni 3 giorni', () => {
    expect(occorrenzaDa(regola(), '2026-10-10')).toBe('2026-10-10')
    expect(occorrenzaDa(regola({ ogni: 3 }), '2026-09-26')).toBe('2026-09-28')
    expect(occorrenzaDa(regola({ ogni: 3 }), '2026-09-28')).toBe('2026-09-28')
  })

  it('ogni settimana, senza giorni scelti, il giorno dell’inizio', () => {
    const r = regola({ unita: 'settimana' })
    expect(prossimeOccorrenze(r, '2026-09-25', 3)).toEqual(['2026-09-25', '2026-10-02', '2026-10-09'])
  })

  it('ogni settimana, lunedì e giovedì', () => {
    const r = regola({ unita: 'settimana', giorni: [4, 1] })
    // L'inizio è venerdì: le prime date sono lunedì e giovedì della settimana dopo.
    expect(prossimeOccorrenze(r, '2026-09-01', 4)).toEqual(['2026-09-28', '2026-10-01', '2026-10-05', '2026-10-08'])
  })

  it('ogni 2 settimane salta una settimana', () => {
    const r = regola({ unita: 'settimana', ogni: 2, giorni: [1, 5] })
    expect(prossimeOccorrenze(r, '2026-09-25', 4)).toEqual(['2026-09-25', '2026-10-05', '2026-10-09', '2026-10-19'])
    // Dentro la settimana saltata, la prima è il lunedì di quella dopo.
    expect(occorrenzaDa(r, '2026-09-29')).toBe('2026-10-05')
  })

  it('ogni mese lo stesso giorno, o l’ultimo del mese se è più corto', () => {
    const r = regola({ unita: 'mese', inizio: '2026-01-31' })
    expect(prossimeOccorrenze(r, '2026-01-01', 4)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('ogni 3 mesi', () => {
    const r = regola({ unita: 'mese', ogni: 3, inizio: '2026-09-15' })
    expect(occorrenzaDa(r, '2026-09-16')).toBe('2026-12-15')
    expect(occorrenzaDa(r, '2027-03-15')).toBe('2027-03-15')
  })

  it('ogni anno, anche dal 29 febbraio', () => {
    expect(occorrenzaDa(regola({ unita: 'anno' }), '2026-09-26')).toBe('2027-09-25')
    const bisestile = regola({ unita: 'anno', inizio: '2028-02-29' })
    expect(prossimeOccorrenze(bisestile, '2028-01-01', 3)).toEqual(['2028-02-29', '2029-02-28', '2030-02-28'])
  })
})

describe('occorrenzaDopo', () => {
  it('è la prima dopo quel giorno, anche se quel giorno è un’occorrenza', () => {
    expect(occorrenzaDopo(regola({ unita: 'settimana' }), '2026-09-25')).toBe('2026-10-02')
    expect(occorrenzaDopo(regola({ ogni: 2 }), '2026-10-04')).toBe('2026-10-05')
  })
})

describe('daCreare', () => {
  const ricorrenza = (campi: Partial<Ricorrenza>): Ricorrenza => ({
    id: 1,
    titolo: 'Pulire il bagno',
    ...regola(),
    prossima: '2026-09-25',
    ultima: null,
    attiva: true,
    creata_il: '2026-09-20T10:00:00Z',
    ...campi,
  })

  it('quando il giorno è arrivato, anche se in ritardo, ma non in pausa', () => {
    expect(daCreare(ricorrenza({}), '2026-09-25')).toBe(true)
    expect(daCreare(ricorrenza({}), '2026-09-30')).toBe(true)
    expect(daCreare(ricorrenza({}), '2026-09-24')).toBe(false)
    expect(daCreare(ricorrenza({ attiva: false }), '2026-09-30')).toBe(false)
  })
})

describe('prossimaDopoModifica', () => {
  it('da oggi, ma non di nuovo un giorno già creato', () => {
    const r = regola({ inizio: '2026-09-01' })
    expect(prossimaDopoModifica(r, '2026-09-25', null)).toBe('2026-09-25')
    expect(prossimaDopoModifica(r, '2026-09-25', '2026-09-24')).toBe('2026-09-25')
    expect(prossimaDopoModifica(r, '2026-09-25', '2026-09-25')).toBe('2026-09-26')
  })
})

describe('daSalvare', () => {
  it('pulisce il titolo, tiene i giorni solo per le settimanali e calcola la prossima', () => {
    const settimanale = daSalvare(
      { titolo: '  Lenzuola ', unita: 'settimana', ogni: 1, giorni: [6, 6, 3], inizio: '2026-09-25', attiva: true },
      '2026-09-25',
    )
    expect(settimanale).toMatchObject({ titolo: 'Lenzuola', giorni: [3, 6], prossima: '2026-09-26' })

    const mensile = daSalvare(
      { titolo: 'Filtri', unita: 'mese', ogni: 1, giorni: [1], inizio: '2026-09-25', attiva: true },
      '2026-09-25',
    )
    expect(mensile).toMatchObject({ giorni: null, prossima: '2026-09-25' })
  })

  it('una settimanale senza giorni prende quello dell’inizio', () => {
    const r = daSalvare(
      { titolo: 'Vetri', unita: 'settimana', ogni: 2, giorni: [], inizio: '2026-09-25', attiva: true },
      '2026-09-25',
    )
    expect(r.giorni).toEqual([5])
  })
})

describe('descrivi', () => {
  it('a parole', () => {
    expect(descrivi(regola())).toBe('Ogni giorno')
    expect(descrivi(regola({ ogni: 3 }))).toBe('Ogni 3 giorni')
    expect(descrivi(regola({ unita: 'settimana', giorni: [1, 4] }))).toBe('Ogni settimana, lunedì e giovedì')
    expect(descrivi(regola({ unita: 'settimana', ogni: 2, giorni: [1, 3, 5] }))).toBe(
      'Ogni 2 settimane, lunedì, mercoledì e venerdì',
    )
    expect(descrivi(regola({ unita: 'settimana', giorni: [1, 2, 3, 4, 5, 6, 7] }))).toBe(
      'Ogni settimana, tutti i giorni',
    )
    expect(descrivi(regola({ unita: 'mese' }))).toBe('Ogni mese il 25')
    expect(descrivi(regola({ unita: 'mese', ogni: 2, inizio: '2026-01-30' }))).toBe(
      'Ogni 2 mesi il 30 (o l’ultimo del mese)',
    )
    expect(descrivi(regola({ unita: 'anno', inizio: '2026-12-08' }))).toBe('Ogni anno l’8 dicembre')
    expect(descrivi(regola({ unita: 'mese', inizio: '2026-10-01' }))).toBe('Ogni mese il 1°')
  })
})

describe('formattaGiorno', () => {
  it('oggi, domani, ieri o la data breve', () => {
    expect(formattaGiorno('2026-09-25', '2026-09-25')).toBe('oggi')
    expect(formattaGiorno('2026-09-26', '2026-09-25')).toBe('domani')
    expect(formattaGiorno('2026-09-24', '2026-09-25')).toBe('ieri')
    expect(formattaGiorno('2026-10-02', '2026-09-25')).toMatch(/2 ott/)
    expect(formattaGiorno('2027-01-02', '2026-09-25')).toMatch(/2027/)
  })
})

describe('scelte del modale', () => {
  // Venerdì 25 settembre 2026.
  const oggi = '2026-09-25'
  const scelte = (campi: Partial<Scelte>): Scelte => ({
    unita: 'settimana',
    ogni: 1,
    giorni: [5],
    giornoMese: 25,
    mese: 9,
    sfasamento: 0,
    ...campi,
  })

  it('ogni giorno parte oggi; ogni 3 giorni si sceglie tra oggi, domani e dopodomani', () => {
    expect(primeVolte(scelte({ unita: 'giorno' }), oggi)).toEqual(['2026-09-25'])
    expect(primeVolte(scelte({ unita: 'giorno', ogni: 3 }), oggi)).toEqual(['2026-09-25', '2026-09-26', '2026-09-27'])
  })

  it('ogni 2 settimane: questa settimana o la prossima, senza i giorni già passati', () => {
    const s = scelte({ ogni: 2, giorni: [1, 6] })
    expect(primeVolte(s, oggi)).toEqual(['2026-09-26', '2026-09-28'])
    expect(prossimeOccorrenze(regolaDa({ ...s, sfasamento: 1 }, oggi), oggi, 3)).toEqual([
      '2026-09-28',
      '2026-10-03',
      '2026-10-12',
    ])
  })

  it('ogni mese: il giorno scelto, da questo mese se non è passato', () => {
    expect(inizioDa(scelte({ unita: 'mese', giornoMese: 25 }), oggi)).toBe('2026-09-25')
    expect(inizioDa(scelte({ unita: 'mese', giornoMese: 10 }), oggi)).toBe('2026-10-10')
    expect(primeVolte(scelte({ unita: 'mese', ogni: 3, giornoMese: 1 }), oggi)).toEqual([
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
    ])
  })

  it('l’ultimo del mese resta l’ultimo anche nei mesi corti', () => {
    const r = regolaDa(scelte({ unita: 'mese', giornoMese: ULTIMO }), oggi)
    expect(r.inizio).toBe('2026-10-31')
    expect(prossimeOccorrenze(r, oggi, 3)).toEqual(['2026-10-31', '2026-11-30', '2026-12-31'])
  })

  it('ogni anno: giorno e mese scelti, quest’anno se non sono passati', () => {
    expect(inizioDa(scelte({ unita: 'anno', giornoMese: 8, mese: 12 }), oggi)).toBe('2026-12-08')
    expect(inizioDa(scelte({ unita: 'anno', giornoMese: 1, mese: 3 }), oggi)).toBe('2027-03-01')
    expect(inizioDa(scelte({ unita: 'anno', giornoMese: 29, mese: 2 }), oggi)).toBe('2028-02-29')
  })

  it('una ricorrenza da modificare ritrova le sue scelte e la sua prima volta', () => {
    const ricorrenza: Ricorrenza = {
      id: 1,
      titolo: 'Vetri',
      unita: 'settimana',
      ogni: 2,
      giorni: [1],
      inizio: '2026-09-07', // lunedì: poi 21/9, 5/10…
      prossima: '2026-10-05',
      ultima: '2026-09-21',
      attiva: true,
      creata_il: '2026-09-01T10:00:00Z',
    }
    const s = scelteDa(ricorrenza, oggi)
    // Questa settimana è quella giusta, ma il suo lunedì è passato: la prima volta resta il 5/10.
    expect(primeVolte(s, oggi)).toEqual(['2026-10-05', '2026-09-28'])
    expect(s).toMatchObject({ unita: 'settimana', ogni: 2, giorni: [1], sfasamento: 0 })
    expect(occorrenzaDa(regolaDa(s, oggi), oggi)).toBe('2026-10-05')
  })

  it('descrive l’ultimo giorno del mese', () => {
    expect(descrivi(regolaDa(scelte({ unita: 'mese', giornoMese: ULTIMO }), oggi))).toBe('Ogni mese l’ultimo giorno')
  })
})
