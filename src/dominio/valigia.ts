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

export const GIORNI_MIN = 1
export const GIORNI_MAX = 30

export interface Voce {
  /** Stabile e corto: finisce nel cookie delle spunte, solo lettere minuscole, cifre e trattini. */
  id: string
  etichetta: string
  /** Le cose raggruppate nella voce, sotto l'etichetta (es. cosa c'è nel portafogli). */
  dettaglio?: string
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
      { id: 'chiavi', etichetta: 'Chiavi di casa' },
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
      { id: 'ombrello', etichetta: 'Ombrello', per: ['citta'] },
      { id: 'occhiali-vista', etichetta: 'Occhiali da vista', dettaglio: 'Custodia e panno' },
      { id: 'occhiali-sole', etichetta: 'Occhiali da sole' },
      { id: 'scarpe-comode', etichetta: 'Scarpe comode o sportive' },
      { id: 'scarpe-eleganti', etichetta: 'Scarpe eleganti' },
      { id: 'sandali', etichetta: 'Sandali', per: ['mare'] },
      { id: 'scarponi', etichetta: 'Scarponi da trekking', per: quota },
      { id: 'sacco-sporchi', etichetta: 'Sacchetto per i panni sporchi' },
    ],
  },
  {
    id: 'beauty',
    titolo: 'Beauty',
    voci: [
      { id: 'spazzolino', etichetta: 'Spazzolino da denti' },
      { id: 'dentifricio', etichetta: 'Dentifricio' },
      { id: 'deodorante', etichetta: 'Deodorante' },
      { id: 'shampoo', etichetta: 'Shampoo e balsamo' },
      { id: 'bagnoschiuma', etichetta: 'Bagnoschiuma' },
      { id: 'lozione', etichetta: 'Lozione per il corpo' },
      { id: 'spazzola', etichetta: 'Spazzola / pettine' },
      { id: 'rasoio', etichetta: 'Rasoio' },
      { id: 'tagliaunghie', etichetta: 'Tagliaunghie' },
      { id: 'profumo', etichetta: 'Profumo' },
      { id: 'trucchi', etichetta: 'Trucchi', dettaglio: 'Fondotinta, mascara, struccante' },
      { id: 'lenti', etichetta: 'Lenti a contatto', dettaglio: 'Liquido e custodia' },
      { id: 'assorbenti', etichetta: 'Assorbenti' },
      { id: 'anello', etichetta: 'Anello anticoncezionale' },
      {
        id: 'farmaci',
        etichetta: 'Farmaci',
        dettaglio:
          "Medicinali abituali, antidolorifici, crema per le punture d'insetto, cerotti, pinzette, kit di primo soccorso",
      },
      { id: 'antistaminico', etichetta: 'Antistaminico' },
      { id: 'tappi', etichetta: 'Tappi per le orecchie' },
      { id: 'fazzoletti', etichetta: 'Fazzoletti' },
      { id: 'solare', etichetta: 'Protezione solare', per: ['mare', ...quota] },
      { id: 'doposole', etichetta: 'Doposole', per: ['mare'] },
    ],
  },
  {
    id: 'tecnologia',
    titolo: 'Tecnologia',
    voci: [
      { id: 'caricatori', etichetta: 'Caricatori' },
      { id: 'power-bank', etichetta: 'Power bank' },
      { id: 'cuffie', etichetta: 'Cuffie o auricolari' },
      { id: 'portatile', etichetta: 'Computer portatile' },
    ],
  },
  {
    id: 'relax',
    titolo: 'Giochi e letture',
    voci: [
      { id: 'letture', etichetta: 'Letture', dettaglio: 'Guida di viaggio, libri, riviste, cruciverba' },
      { id: 'giochi', etichetta: 'Giochi', dettaglio: 'Carte, palla, palline da ping pong, set da badminton' },
    ],
  },
  {
    id: 'spiaggia',
    titolo: 'Spiaggia o piscina',
    per: ['mare'],
    voci: [
      { id: 'borsa-spiaggia', etichetta: 'Borsa da spiaggia' },
      { id: 'telo', etichetta: 'Telo mare' },
      { id: 'infradito', etichetta: 'Infradito' },
      { id: 'occhialini', etichetta: 'Occhialini e pinne' },
      { id: 'borsa-frigo', etichetta: 'Borsa frigo', dettaglio: 'Elementi di raffreddamento' },
      { id: 'thermos', etichetta: 'Thermos' },
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
      { id: 'cartina', etichetta: 'Cartina dei sentieri' },
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
      { id: 'tenda', etichetta: 'Tenda' },
      { id: 'montaggio', etichetta: 'Montaggio tenda', dettaglio: 'Picchetti, martello di gomma, corde, telo per terreno' },
      { id: 'materassino', etichetta: 'Stuoia o materasso ad aria', dettaglio: 'Pompa di gonfiaggio' },
      { id: 'sacco-pelo', etichetta: 'Sacco a pelo' },
      { id: 'cuscini', etichetta: 'Cuscini' },
      { id: 'pentole', etichetta: 'Pentole e padelle' },
      { id: 'piatti', etichetta: 'Piatti, posate e vassoi' },
      { id: 'apriscatole', etichetta: 'Apriscatole' },
      { id: 'fornello', etichetta: 'Fornello a gas', dettaglio: 'Ricariche per gas, accendino' },
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
  /** Solo per le voci che dipendono dai giorni. */
  quantita?: number
}

export interface CategoriaDaPrendere {
  id: string
  titolo: string
  voci: VoceDaPrendere[]
}

function serve(regola: { per?: readonly TipoViaggio[] }, tipi: readonly TipoViaggio[]) {
  return !regola.per || regola.per.some((t) => tipi.includes(t))
}

/** Le categorie e le voci che servono per il viaggio, con le quantità; le categorie vuote spariscono. */
export function listaPerViaggio(viaggio: Viaggio, catalogo: readonly Categoria[] = CATALOGO): CategoriaDaPrendere[] {
  return catalogo
    .filter((c) => serve(c, viaggio.tipi))
    .map((c) => ({
      id: c.id,
      titolo: c.titolo,
      voci: c.voci
        .filter((v) => serve(v, viaggio.tipi))
        .map((v) => ({
          id: v.id,
          etichetta: v.etichetta,
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

// Nei cookie: il viaggio come `7.mare.rifugio`, le spunte come `calzini.intimo`.
// Il punto è ammesso in un cookie senza codifica, e gli id non ne contengono.

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

/** Le spunte dal cookie; gli id che non sono più nel catalogo si scartano. */
export function leggiSpunte(testo: string | null, catalogo: readonly Categoria[] = CATALOGO): Set<string> {
  if (!testo) return new Set()
  const noti = new Set(catalogo.flatMap((c) => c.voci.map((v) => v.id)))
  return new Set(testo.split('.').filter((id) => noti.has(id)))
}
