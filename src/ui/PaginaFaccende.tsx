import { CardFaccende } from './CardFaccende'
import type { useFaccende } from './useFaccende'

interface Props {
  faccende: ReturnType<typeof useFaccende>
}

/** La pagina Faccende (doc/08-interfaccia.md): la stessa card della Dashboard, da sola. */
export function PaginaFaccende({ faccende }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3">
      <h2 className="px-1 text-lg font-semibold">Faccende</h2>
      <CardFaccende faccende={faccende} />
      <p className="px-2 text-sm text-testo-tenue">
        Tocca l'icona per segnarla fatta, il titolo per modificarla, il cestino per eliminarla. Le fatte restano barrate fino a
        mezzanotte, poi spariscono.
      </p>
    </div>
  )
}
