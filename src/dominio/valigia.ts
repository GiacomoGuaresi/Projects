// La lista per fare la valigia (doc/08-interfaccia.md, "Valigia"): nata dalla
// lista di controllo per le vacanze del blog di Action, poi ritagliata su di noi,
// divisa in categorie; il tipo di viaggio decide quali si vedono e i giorni le quantità.
// Niente database: le spunte stanno in un cookie (ui/preferenze.ts).

export const TIPI_VIAGGIO = [
  'mare',
  'montagna',
  'rifugio',
  'citta',
  'campeggio',
] as const
export type TipoViaggio = (typeof TIPI_VIAGGIO)[number]

export const PERSONE = ['jack', 'ale'] as const
export type Persona = (typeof PERSONE)[number]

/**
 * Di chi è una voce: di tutti e due, una casella a testa (il predefinito, es.
 * le mutande); di uno solo; o comune, una casella sola per la coppia (es. le
 * chiavi di casa, i giochi).
 */
export type Di = 'entrambi' | Persona | 'comune'

export const GIORNI_MIN = 1
export const GIORNI_MAX = 30

export interface Voce {
  /** Stabile e corto: finisce nel cookie delle spunte, solo lettere minuscole, cifre e trattini. */
  id: string
  etichetta: string
  /** Le cose raggruppate nella voce, sotto l'etichetta (es. cosa c'è nel portafogli). */
  dettaglio?: string
  /** Senza: di tutti e due, una casella a testa. */
  di?: Di
  /** Serve se il viaggio ha almeno uno di questi tipi. Senza: serve sempre (se la categoria serve). */
  per?: readonly TipoViaggio[]
  /** Quanti ne servono per la durata del viaggio. */
  quantita?: (giorni: number) => number
}

export interface Categoria {
  id: string
  titolo: string
  /** Come `Voce.per`, per tutta la categoria. */
  per?: readonly TipoViaggio[]
  voci: readonly Voce[]
}

/** Uno per giorno più uno di scorta, ma oltre la settimana si lava. */
const unoAlGiorno = (giorni: number) => Math.min(giorni + 1, 8)
const ogni = (n: number) => (giorni: number) => Math.min(Math.ceil(giorni / n), 4)

/** Montagna e rifugio: le cose da escursione servono in tutti e due. */
const quota: readonly TipoViaggio[] = ['montagna', 'rifugio']

export const CATALOGO: readonly Categoria[] = [
  {
    id: 'mano',
    titolo: 'Bagaglio a mano',
    voci: [
      { id: 'cellulare', etichetta: 'Cellulare' },
      {
        id: 'portafogli',
        etichetta: 'Portafogli',
        dettaglio: "Carta d'identità, patente, tessera sanitaria, bancomat / carta di credito, contanti",
      },
      { id: 'chiavi', di: 'comune', etichetta: 'Chiavi di casa' },
    ],
  },
  {
    id: 'vestiti',
    titolo: 'Abbigliamento, scarpe e accessori',
    voci: [
      { id: 'intimo', etichetta: 'Biancheria intima', quantita: unoAlGiorno },
      { id: 'calzini', etichetta: 'Calzini', quantita: unoAlGiorno },
      { id: 'magliette', etichetta: 'Magliette', quantita: unoAlGiorno },
      { id: 'pantaloni', etichetta: 'Pantaloni / gonne', quantita: ogni(3) },
      { id: 'pigiama', etichetta: 'Pigiama', quantita: ogni(4) },
      { id: 'abiti-leggeri', etichetta: 'Abiti leggeri, da non stirare', per: ['mare', 'citta'] },
      { id: 'maglioncino', etichetta: 'Maglioncino per la sera' },
      { id: 'abiti-pesanti', etichetta: 'Vestiti pesanti / pile', per: quota },
      { id: 'giacca-vento', etichetta: 'Giacca a vento', per: quota },
      { id: 'berretto', etichetta: 'Berretto, guanti e sciarpa', per: quota },
      { id: 'micropile', etichetta: 'Micropile', per: ['rifugio'] },
      { id: 'termica', etichetta: 'Maglia termica', per: ['rifugio'] },
      { id: 'pantaloni-trekking', etichetta: 'Pantaloni lunghi da trekking', per: ['rifugio'] },
      { id: 'calze-trekking', etichetta: 'Calze da trekking', per: ['rifugio'], quantita: unoAlGiorno },
      { id: 'cambio-sera', etichetta: 'Cambio asciutto per la sera', per: ['rifugio'] },
      { id: 'abiti-eleganti', etichetta: 'Vestito per le occasioni eleganti' },
      { id: 'costume', etichetta: 'Costume da bagno', per: ['mare'], quantita: () => 2 },
      { id: 'pareo', etichetta: 'Pareo o copricostume', per: ['mare'] },
      { id: 'cappello', etichetta: 'Cappello di paglia', per: ['mare'] },
      { id: 'ciabatte', etichetta: 'Ciabatte' },
      { id: 'impermeabile', etichetta: 'Impermeabile' },
      { id: 'ombrello', di: 'comune', etichetta: 'Ombrello', per: ['citta'] },
      { id: 'occhiali-vista', di: 'ale', etichetta: 'Occhiali da vista', dettaglio: 'Custodia e panno' },
      { id: 'occhiali-sole', etichetta: 'Occhiali da sole' },
      { id: 'scarpe-comode', etichetta: 'Scarpe comode o sportive' },
      { id: 'scarpe-eleganti', etichetta: 'Scarpe eleganti' },
      { id: 'sandali', etichetta: 'Sandali', per: ['mare'] },
      { id: 'scarponi', etichetta: 'Scarponi da trekking', per: quota },
      { id: 'sacco-sporchi', di: 'comune', etichetta: 'Sacchetto per i panni sporchi' },
    ],
  },
  {
    id: 'beauty',
    titolo: 'Beauty',
    voci: [
      { id: 'spazzolino', etichetta: 'Spazzolino da denti' },
      { id: 'dentifricio', di: 'comune', etichetta: 'Dentifricio' },
      { id: 'deodorante', etichetta: 'Deodorante' },
      { id: 'shampoo', di: 'comune', etichetta: 'Shampoo e balsamo' },
      { id: 'bagnoschiuma', di: 'comune', etichetta: 'Bagnoschiuma' },
      { id: 'lozione', di: 'comune', etichetta: 'Lozione per il corpo' },
      { id: 'spazzola', etichetta: 'Spazzola / pettine' },
      { id: 'rasoio', di: 'jack', etichetta: 'Rasoio' },
      { id: 'tagliaunghie', di: 'comune', etichetta: 'Tagliaunghie' },
      { id: 'profumo', etichetta: 'Profumo' },
      { id: 'trucchi', di: 'ale', etichetta: 'Trucchi', dettaglio: 'Fondotinta, mascara, struccante' },
      { id: 'lenti', di: 'ale', etichetta: 'Lenti a contatto', dettaglio: 'Liquido e custodia' },
      { id: 'assorbenti', di: 'ale', etichetta: 'Assorbenti' },
      { id: 'anello', di: 'ale', etichetta: 'Anello anticoncezionale' },
      {
        id: 'farmaci',
        di: 'comune',
        etichetta: 'Farmaci',
        dettaglio:
          "Medicinali abituali, antidolorifici, crema per le punture d'insetto, cerotti, pinzette, kit di primo soccorso",
      },
      { id: 'antistaminico', di: 'comune', etichetta: 'Antistaminico' },
      { id: 'tappi', etichetta: 'Tappi per le orecchie' },
      { id: 'fazzoletti', di: 'comune', etichetta: 'Fazzoletti' },
      { id: 'solare', di: 'comune', etichetta: 'Protezione solare', per: ['mare', ...quota] },
      { id: 'doposole', di: 'comune', etichetta: 'Doposole', per: ['mare'] },
    ],
  },
  {
    id: 'tecnologia',
    titolo: 'Tecnologia',
    voci: [
      { id: 'caricatori', etichetta: 'Caricatori' },
      { id: 'power-bank', di: 'comune', etichetta: 'Power bank' },
      { id: 'cuffie', etichetta: 'Cuffie o auricolari' },
      { id: 'portatile', di: 'jack', etichetta: 'Computer portatile' },
    ],
  },
  {
    id: 'relax',
    titolo: 'Giochi e letture',
    voci: [
      { id: 'letture', di: 'comune', etichetta: 'Letture', dettaglio: 'Guida di viaggio, libri, riviste, cruciverba' },
      { id: 'giochi', di: 'comune', etichetta: 'Giochi', dettaglio: 'Carte, palla, palline da ping pong, set da badminton' },
    ],
  },
  {
    id: 'spiaggia',
    titolo: 'Spiaggia o piscina',
    per: ['mare'],
    voci: [
      { id: 'borsa-spiaggia', di: 'comune', etichetta: 'Borsa da spiaggia' },
      { id: 'telo', etichetta: 'Telo mare' },
      { id: 'infradito', etichetta: 'Infradito' },
      { id: 'occhialini', etichetta: 'Occhialini e pinne' },
      { id: 'borsa-frigo', di: 'comune', etichetta: 'Borsa frigo', dettaglio: 'Elementi di raffreddamento' },
      { id: 'thermos', di: 'comune', etichetta: 'Thermos' },
    ],
  },
  {
    id: 'escursioni',
    titolo: 'Escursioni',
    per: quota,
    voci: [
      { id: 'zaino', etichetta: 'Zaino da escursione' },
      { id: 'borraccia', etichetta: 'Borraccia' },
      { id: 'bastoncini', etichetta: 'Bastoncini da trekking' },
      { id: 'cartina', di: 'comune', etichetta: 'Cartina dei sentieri' },
    ],
  },
  {
    id: 'rifugio',
    titolo: 'Per dormire in rifugio',
    per: ['rifugio'],
    voci: [
      { id: 'sacco-lenzuolo', etichetta: 'Sacco lenzuolo' },
      { id: 'federa', etichetta: 'Federa o copricuscino' },
    ],
  },
  {
    id: 'campeggio',
    titolo: 'Speciale per i campeggiatori',
    per: ['campeggio'],
    voci: [
      { id: 'tenda', di: 'comune', etichetta: 'Tenda' },
      { id: 'montaggio', di: 'comune', etichetta: 'Montaggio tenda', dettaglio: 'Picchetti, martello di gomma, corde, telo per terreno' },
      { id: 'materassino', etichetta: 'Stuoia o materasso ad aria', dettaglio: 'Pompa di gonfiaggio' },
      { id: 'sacco-pelo', etichetta: 'Sacco a pelo' },
      { id: 'cuscini', etichetta: 'Cuscini' },
      { id: 'pentole', di: 'comune', etichetta: 'Pentole e padelle' },
      { id: 'piatti', di: 'comune', etichetta: 'Piatti, posate e vassoi' },
      { id: 'apriscatole', di: 'comune', etichetta: 'Apriscatole' },
      { id: 'fornello', di: 'comune', etichetta: 'Fornello a gas', dettaglio: 'Ricariche per gas, accendino' },
    ],
  },
]

export interface Viaggio {
  giorni: number
  tipi: readonly TipoViaggio[]
}

export const VIAGGIO_PREDEFINITO: Viaggio = { giorni: 7, tipi: [] }

export interface VoceDaPrendere {
  id: string
  etichetta: string
  dettaglio?: string
  di: Di
  /** I tipi scelti che l'hanno fatta comparire; vuoto se serve sempre. */
  tipi: TipoViaggio[]
  /** Solo per le voci che dipendono dai giorni. */
  quantita?: number
}

export interface CategoriaDaPrendere {
  id: string
  titolo: string
  /** Come `VoceDaPrendere.tipi`, per tutta la categoria. */
  tipi: TipoViaggio[]
  voci: VoceDaPrendere[]
}

function serve(regola: { per?: readonly TipoViaggio[] }, tipi: readonly TipoViaggio[]) {
  return !regola.per || regola.per.some((t) => tipi.includes(t))
}

/** I tipi del viaggio che fanno comparire la voce (o la categoria), nell'ordine dei tipi. */
function perche(regola: { per?: readonly TipoViaggio[] }, tipi: readonly TipoViaggio[]): TipoViaggio[] {
  return regola.per ? TIPI_VIAGGIO.filter((t) => tipi.includes(t) && regola.per?.includes(t)) : []
}

/** Le categorie e le voci che servono per il viaggio, con le quantità; le categorie vuote spariscono. */
export function listaPerViaggio(viaggio: Viaggio, catalogo: readonly Categoria[] = CATALOGO): CategoriaDaPrendere[] {
  return catalogo
    .filter((c) => serve(c, viaggio.tipi))
    .map((c) => ({
      id: c.id,
      titolo: c.titolo,
      tipi: perche(c, viaggio.tipi),
      voci: c.voci
        .filter((v) => serve(v, viaggio.tipi))
        .map((v) => ({
          id: v.id,
          etichetta: v.etichetta,
          di: v.di ?? 'entrambi',
          tipi: perche(v, viaggio.tipi),
          ...(v.dettaglio && { dettaglio: v.dettaglio }),
          ...(v.quantita && { quantita: v.quantita(viaggio.giorni) }),
        })),
    }))
    .filter((c) => c.voci.length > 0)
}

/** I giorni riportati tra il minimo e il massimo; un valore non numerico vale il predefinito. */
export function giorniValidi(giorni: number): number {
  if (!Number.isFinite(giorni)) return VIAGGIO_PREDEFINITO.giorni
  return Math.min(GIORNI_MAX, Math.max(GIORNI_MIN, Math.round(giorni)))
}

export interface Casella {
  persona: Persona | 'comune'
  /** La chiave nel cookie delle spunte: l'id per le voci comuni, `id_j` / `id_a` per quelle personali. */
  chiave: string
}

const SUFFISSI: Record<Persona, string> = { jack: 'j', ale: 'a' }

/**
 * Le caselle di una voce, nell'ordine delle colonne: una per persona, o una
 * sola se è comune. La chiave dipende solo da voce e persona, così passare una
 * voce da "entrambi" a una persona sola non perde la spunta.
 */
export function caselle(voce: { id: string; di: Di }): Casella[] {
  if (voce.di === 'comune') return [{ persona: 'comune', chiave: voce.id }]
  return PERSONE.filter((p) => voce.di === 'entrambi' || voce.di === p).map((persona) => ({
    persona,
    chiave: `${voce.id}_${SUFFISSI[persona]}`,
  }))
}

// Nei cookie: il viaggio come `7.mare.rifugio`, le spunte come `calzini_j.chiavi`.
// Punto e trattino basso restano uguali anche codificati, e gli id non ne contengono.

export function scriviViaggio(viaggio: Viaggio): string {
  return [viaggio.giorni, ...viaggio.tipi].join('.')
}

/** Il viaggio dal cookie; tipi sconosciuti o ripetuti si scartano, un valore rovinato vale il predefinito. */
export function leggiViaggio(testo: string | null): Viaggio {
  if (!testo) return VIAGGIO_PREDEFINITO
  const [giorni = '', ...tipi] = testo.split('.')
  const numero = Number(giorni)
  if (giorni === '' || !Number.isFinite(numero)) return VIAGGIO_PREDEFINITO
  return {
    giorni: giorniValidi(numero),
    tipi: TIPI_VIAGGIO.filter((t) => tipi.includes(t)),
  }
}

export function scriviSpunte(spunte: ReadonlySet<string>): string {
  return [...spunte].join('.')
}

/** Le spunte dal cookie; le chiavi che non sono più nel catalogo si scartano. */
export function leggiSpunte(testo: string | null, catalogo: readonly Categoria[] = CATALOGO): Set<string> {
  if (!testo) return new Set()
  const noti = new Set(
    catalogo.flatMap((c) => c.voci.flatMap((v) => caselle({ id: v.id, di: v.di ?? 'entrambi' }).map((k) => k.chiave))),
  )
  return new Set(testo.split('.').filter((id) => noti.has(id)))
}
