import { useState } from 'react'
import type { Rilievo } from '../dominio/ordinamento'

// Le preferenze dell'interfaccia (doc/08-interfaccia.md, "Dashboard"), salvate in
// un cookie per ciascuna: restano tra una visita e l'altra sullo stesso dispositivo.

/** Un anno: una preferenza scelta resta finché non la si cambia. */
const DURATA = 60 * 60 * 24 * 365

/** Il valore del cookie `nome` nel testo di `document.cookie`, o null se non c'è. */
export function leggiCookie(testo: string, nome: string): string | null {
  for (const pezzo of testo.split(';')) {
    const uguale = pezzo.indexOf('=')
    if (uguale < 0) continue
    if (pezzo.slice(0, uguale).trim() === nome) return decodeURIComponent(pezzo.slice(uguale + 1).trim())
  }
  return null
}

/**
 * Un interruttore on/off salvato nel cookie `nome`. Il percorso è quello
 * dell'app (`/Projects/`), così non si mescola con i cookie di Grocery.
 */
export function useInterruttore(nome: string, predefinito: boolean): [boolean, (acceso: boolean) => void] {
  const [acceso, setAcceso] = useState(() => {
    const salvato = leggiCookie(document.cookie, nome)
    return salvato === null ? predefinito : salvato === '1'
  })

  const cambia = (nuovo: boolean) => {
    setAcceso(nuovo)
    document.cookie = `${nome}=${nuovo ? '1' : '0'}; path=${import.meta.env.BASE_URL}; max-age=${DURATA}; SameSite=Lax`
  }

  return [acceso, cambia]
}

const COOKIE_RILIEVI = 'projects_rilievi'

/** I rilievi salvati nel cookie (JSON `{chiave: rilievo}`, senza i normali); un valore rovinato vale vuoto. */
export function leggiRilievi(testo: string): Record<string, Rilievo> {
  const salvato = leggiCookie(testo, COOKIE_RILIEVI)
  if (salvato === null) return {}
  try {
    const dati: unknown = JSON.parse(salvato)
    if (typeof dati !== 'object' || dati === null || Array.isArray(dati)) return {}
    return Object.fromEntries(
      Object.entries(dati).filter(([, r]) => r === 'preferito' || r === 'accantonato'),
    ) as Record<string, Rilievo>
  } catch {
    return {}
  }
}

/** Preferiti e accantonati della Dashboard, per chiave del progetto, salvati nel cookie `projects_rilievi`. */
export function useRilievi(): [Record<string, Rilievo>, (chiave: string, rilievo: Rilievo) => void] {
  const [rilievi, setRilievi] = useState(() => leggiRilievi(document.cookie))

  const cambia = (chiave: string, rilievo: Rilievo) => {
    const { [chiave]: _, ...altri } = leggiRilievi(document.cookie)
    const nuovi = rilievo === 'normale' ? altri : { ...altri, [chiave]: rilievo }
    setRilievi(nuovi)
    document.cookie = `${COOKIE_RILIEVI}=${encodeURIComponent(JSON.stringify(nuovi))}; path=${import.meta.env.BASE_URL}; max-age=${DURATA}; SameSite=Lax`
  }

  return [rilievi, cambia]
}
