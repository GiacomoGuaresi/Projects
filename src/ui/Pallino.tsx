/**
 * Il pallino rosso col numero, come in Adventures (doc/08-interfaccia.md,
 * "Navigazione"): quante piante nuove ci sono nella Foresta. Pulsa piano per
 * farsi notare, finché la pagina non si apre. Il bordo stacca il pallino dal
 * fondo: salvia sull'intestazione, bianco nel menu.
 */
export function Pallino({
  numero,
  su = 'salvia',
  className = '',
}: {
  numero: number
  su?: 'salvia' | 'bianco'
  className?: string
}) {
  return (
    <span
      className={`animate-richiamo grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#d93a2f] px-1 text-[11px] leading-none font-bold text-white tabular-nums ${su === 'salvia' ? 'shadow-[0_0_0_2px_var(--color-salvia)]' : 'shadow-[0_0_0_2px_white]'} ${className}`}
      aria-hidden="true"
    >
      {numero > 99 ? '99+' : numero}
    </span>
  )
}
