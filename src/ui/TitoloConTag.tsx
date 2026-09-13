import { Flame, Hammer, Lightbulb, Sparkles, Tag, Wrench, type LucideIcon } from 'lucide-react'
import { pezziTitolo, type ColoreTag } from '../dominio/tag'

/** Le icone dei tag in elenco (doc/08-interfaccia.md, "Tag"). */
const icone: Record<string, LucideIcon> = {
  urgente: Flame,
  'fai da te': Hammer,
  guasto: Wrench,
  idea: Lightbulb,
  ia: Sparkles,
}

const colori: Record<ColoreTag | 'neutro', string> = {
  rosso: 'bg-tag-rosso text-tag-rosso-testo',
  sabbia: 'bg-tag-sabbia text-tag-sabbia-testo',
  terracotta: 'bg-tag-terracotta text-tag-terracotta-testo',
  giallo: 'bg-tag-giallo text-tag-giallo-testo',
  viola: 'bg-tag-viola text-tag-viola-testo',
  neutro: 'bg-tag-neutro text-tag-neutro-testo',
}

/** Il titolo con i tag `<tag>` mostrati come badge; quelli fuori elenco sono neutri. */
export function TitoloConTag({ titolo }: { titolo: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {pezziTitolo(titolo).map((pezzo, i) => {
        if (pezzo.tipo === 'testo') return <span key={i}>{pezzo.testo}</span>
        const Icona = (pezzo.tag && icone[pezzo.tag.nome]) || Tag
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-xs font-medium ${
              colori[pezzo.tag?.colore ?? 'neutro']
            }`}
          >
            <Icona className="size-3" aria-hidden="true" />
            {pezzo.nome}
          </span>
        )
      })}
    </span>
  )
}
