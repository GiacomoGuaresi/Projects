import ReactMarkdown, { type Components } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { normalizzaChecklist } from '../dominio/markdown'

/** Gli elementi resi con lo stile dell'app: Tailwind toglie quello del browser. */
const componenti: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="mt-3 mb-1.5 text-lg font-semibold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h4 className="mt-3 mb-1.5 text-base font-semibold first:mt-0">{children}</h4>,
  h3: ({ children }) => <h5 className="mt-2 mb-1 font-semibold first:mt-0">{children}</h5>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ className, children }) => (
    <ul className={`mb-2 flex flex-col gap-0.5 last:mb-0 ${className?.includes('contains-task-list') ? '' : 'list-disc pl-5'}`}>
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="mb-2 flex list-decimal flex-col gap-0.5 pl-5 last:mb-0">{children}</ol>,
  li: ({ className, children }) => (
    <li className={className?.includes('task-list-item') ? 'flex list-none items-start gap-2' : undefined}>
      {children}
    </li>
  ),
  input: ({ checked }) => (
    <input type="checkbox" checked={!!checked} disabled readOnly className="mt-1 size-4 accent-salvia" />
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-salvia-scura underline">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-fondo px-1 py-0.5 font-mono text-[13px]">{children}</code>,
  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-lg bg-fondo p-2 font-mono text-[13px]">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-bordo pl-3 text-testo-tenue">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-bordo" />,
}

/**
 * Markdown con checklist (GFM) e a capo semplici; anche "[ ] voce" senza
 * trattino diventa una casella.
 */
export function Markdown({ testo }: { testo: string }) {
  return (
    <div className="leading-relaxed break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={componenti}>
        {normalizzaChecklist(testo)}
      </ReactMarkdown>
    </div>
  )
}
