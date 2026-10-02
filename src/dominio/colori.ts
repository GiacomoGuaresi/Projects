// Colori da mescolare, per il cielo e le stagioni della Foresta.

/** Il colore a metà strada tra `a` e `b` (esadecimali `#rrggbb`): `t` = 0 è `a`, 1 è `b`. */
export function mescola(a: string, b: string, t: number): string {
  const p = Math.min(Math.max(t, 0), 1)
  const canali = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
  const [x, y] = [canali(a), canali(b)]
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * p).toString(16).padStart(2, '0')).join('')}`
}
