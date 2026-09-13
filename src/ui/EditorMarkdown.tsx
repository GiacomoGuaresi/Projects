import { useState, type KeyboardEvent } from 'react'
import { Markdown } from './Markdown'

interface Props {
  valore: string
  onCambia: (testo: string) => void
  etichetta: string
  id?: string
  autoFocus?: boolean
  righe?: number
  onKeyDown?: (evento: KeyboardEvent<HTMLTextAreaElement>) => void
}

const esempi: [string, string][] = [
  ['**grassetto**', 'grassetto'],
  ['*corsivo*', 'corsivo'],
  ['- voce', 'elenco puntato'],
  ['- [ ] da fare', 'casella vuota'],
  ['- [x] fatto', 'casella spuntata'],
  ['# Titolo', 'titolo'],
  ['[testo](https://…)', 'link'],
]

/** Un testo Markdown: "Scrivi" e "Anteprima", con l'aiuto sulla sintassi. */
export function EditorMarkdown({ valore, onCambia, etichetta, id, autoFocus, righe = 8, onKeyDown }: Props) {
  const [anteprima, setAnteprima] = useState(false)
  const scheda = (attiva: boolean) =>
    `rounded-lg px-3 py-1 text-sm ${attiva ? 'bg-pastello font-semibold text-salvia-scura' : 'text-testo-tenue hover:bg-fondo'}`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1" role="tablist" aria-label={etichetta}>
        <button type="button" role="tab" aria-selected={!anteprima} className={scheda(!anteprima)} onClick={() => setAnteprima(false)}>
          Scrivi
        </button>
        <button type="button" role="tab" aria-selected={anteprima} className={scheda(anteprima)} onClick={() => setAnteprima(true)}>
          Anteprima
        </button>
      </div>
      {anteprima ? (
        <div className="min-h-32 rounded-[11px] border border-bordo bg-white p-3">
          {valore.trim() ? <Markdown testo={valore} /> : <p className="text-testo-tenue">Niente da mostrare.</p>}
        </div>
      ) : (
        <textarea
          id={id}
          aria-label={etichetta}
          autoFocus={autoFocus}
          rows={righe}
          value={valore}
          onChange={(e) => onCambia(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full resize-y rounded-[11px] border border-bordo bg-white px-3 py-2 focus:outline-2 focus:-outline-offset-1 focus:outline-salvia"
        />
      )}
      <details className="text-xs text-testo-tenue">
        <summary className="cursor-pointer select-none">Aiuto sulla sintassi</summary>
        <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {esempi.map(([codice, significato]) => (
            <div key={codice} className="contents">
              <dt>
                <code className="rounded bg-fondo px-1 font-mono">{codice}</code>
              </dt>
              <dd>{significato}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}
