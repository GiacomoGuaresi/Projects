import { CardFaccende } from './CardFaccende'
import { CardRicorrenze } from './CardRicorrenze'
import type { useFaccende } from './useFaccende'
import { useRicorrenze } from './useRicorrenze'

interface Props {
  faccende: ReturnType<typeof useFaccende>
  onAvviso: (messaggio: string) => void
}

/**
 * La pagina Faccende (doc/08-interfaccia.md): la stessa card della Dashboard,
 * da sola, e sotto le faccende ricorrenti.
 */
export function PaginaFaccende({ faccende, onAvviso }: Props) {
  const ricorrenze = useRicorrenze(faccende.ricarica, onAvviso)

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3">
      <h2 className="px-1 text-lg font-semibold">Faccende</h2>
      <CardFaccende faccende={faccende} />
      <p className="px-2 text-sm text-testo-tenue">
        Tocca l'icona per segnarla fatta, il titolo per modificarla, il cestino per eliminarla. Le fatte restano barrate fino a
        mezzanotte, poi spariscono.
      </p>
      <h2 className="mt-3 px-1 text-lg font-semibold">Ricorrenti</h2>
      <CardRicorrenze ricorrenze={ricorrenze} />
      <p className="px-2 text-sm text-testo-tenue">
        Arrivato il giorno, la faccenda si aggiunge da sola all'elenco. Se quella precedente non è ancora fatta, non se ne
        aggiunge un'altra.
      </p>
    </div>
  )
}
