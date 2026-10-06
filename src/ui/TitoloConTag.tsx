import {
  Bug,
  CalendarClock,
  Car,
  ChefHat,
  FileText,
  Hourglass,
  Motorbike,
  Phone,
  ShoppingCart,
  Sprout,
  TreePine,
  Users,
  Zap,
  DraftingCompass,
  Flame,
  Gift,
  Hammer,
  Lightbulb,
  Scissors,
  Snowflake,
  Sparkles,
  Sun,
  Tag,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { formattaGiorno, oggi } from '../dominio/ricorrenze'
import { coloreConData, pezziTitolo, type ColoreTag } from '../dominio/tag'

/** Le icone dei tag in elenco (doc/08-interfaccia.md, "Tag"). */
const icone: Record<string, LucideIcon> = {
  urgente: Flame,
  'fai da te': Hammer,
  guasto: Wrench,
  idea: Lightbulb,
  progetto: DraftingCompass,
  inverno: Snowflake,
  estate: Sun,
  cucito: Scissors,
  natalizio: TreePine,
  cucina: ChefHat,
  bug: Bug,
  scadenza: CalendarClock,
  attesa: Hourglass,
  acquisto: ShoppingCart,
  chiamare: Phone,
  pratica: FileText,
  veloce: Zap,
  giardino: Sprout,
  auto: Car,
  moto: Motorbike,
  insieme: Users,
  regalo: Gift,
  ia: Sparkles,
}

const colori: Record<ColoreTag | 'neutro', string> = {
  rosso: 'bg-tag-rosso text-tag-rosso-testo',
  sabbia: 'bg-tag-sabbia text-tag-sabbia-testo',
  terracotta: 'bg-tag-terracotta text-tag-terracotta-testo',
  giallo: 'bg-tag-giallo text-tag-giallo-testo',
  viola: 'bg-tag-viola text-tag-viola-testo',
  ardesia: 'bg-tag-ardesia text-tag-ardesia-testo',
  blu: 'bg-tag-blu text-tag-blu-testo',
  arancio: 'bg-tag-arancio text-tag-arancio-testo',
  rosa: 'bg-tag-rosa text-tag-rosa-testo',
  verde: 'bg-tag-verde text-tag-verde-testo',
  pesca: 'bg-tag-pesca text-tag-pesca-testo',
  acqua: 'bg-tag-acqua text-tag-acqua-testo',
  indaco: 'bg-tag-indaco text-tag-indaco-testo',
  lime: 'bg-tag-lime text-tag-lime-testo',
  cielo: 'bg-tag-cielo text-tag-cielo-testo',
  ocra: 'bg-tag-ocra text-tag-ocra-testo',
  corallo: 'bg-tag-corallo text-tag-corallo-testo',
  muschio: 'bg-tag-muschio text-tag-muschio-testo',
  grafite: 'bg-tag-grafite text-tag-grafite-testo',
  bronzo: 'bg-tag-bronzo text-tag-bronzo-testo',
  lampone: 'bg-tag-lampone text-tag-lampone-testo',
  malva: 'bg-tag-malva text-tag-malva-testo',
  lavanda: 'bg-tag-lavanda text-tag-lavanda-testo',
  allarme: 'bg-tag-allarme font-bold text-white shadow-sm',
  neutro: 'bg-tag-neutro text-tag-neutro-testo',
}

/** Cosa dice una scadenza o un'attesa, passando sopra il badge. */
function spiegaData(nome: string, giorno: string, rispetto: string): string {
  const quando = formattaGiorno(giorno, rispetto)
  const passata = giorno < rispetto
  if (nome === 'attesa') return passata ? `Attesa scaduta ${quando}` : `Atteso per ${quando}`
  return passata ? `Scaduta ${quando}` : `Scade ${quando}`
}

/**
 * Il titolo con i tag `<tag>` mostrati come badge; quelli fuori elenco sono
 * neutri. Scadenze e attese passate sono rosso acceso con il testo bianco; una
 * scadenza è rossa il giorno stesso e arancio nei giorni prima.
 */
export function TitoloConTag({ titolo }: { titolo: string }) {
  const giorno = oggi()
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {pezziTitolo(titolo).map((pezzo, i) => {
        if (pezzo.tipo === 'testo') return <span key={i}>{pezzo.testo}</span>
        const Icona = (pezzo.tag && icone[pezzo.tag.nome]) || Tag
        const colore =
          pezzo.tag && pezzo.giorno ? coloreConData(pezzo.tag, pezzo.giorno, giorno) : (pezzo.tag?.colore ?? 'neutro')
        return (
          <span
            key={i}
            title={pezzo.tag && pezzo.giorno ? spiegaData(pezzo.tag.nome, pezzo.giorno, giorno) : undefined}
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-xs font-medium uppercase ${colori[colore]}`}
          >
            <Icona className="size-3" aria-hidden="true" />
            {pezzo.nome}
          </span>
        )
      })}
    </span>
  )
}
