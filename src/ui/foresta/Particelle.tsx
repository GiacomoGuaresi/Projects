import { useEffect, useRef } from 'react'
import type { Luce, Meteo, Stagione } from '../../dominio/ambiente'

// Quello che cade o vola sopra la Foresta (doc/08-interfaccia.md, "Foresta"):
// pioggia, neve, foglie d'autunno, petali di primavera, lucciole nelle notti
// d'estate e i lampi del temporale. Un solo <canvas>, che si ferma con la
// pagina nascosta e non parte se si è chiesto meno movimento.

type Tipo = 'goccia' | 'fiocco' | 'foglia' | 'lucciola'

interface Particella {
  tipo: Tipo
  x: number
  y: number
  vx: number
  vy: number
  /** Grandezza, in px. */
  r: number
  /** Fase per oscillare, ruotare o lampeggiare. */
  fase: number
  colore: string
}

interface Props {
  meteo: Meteo
  stagione: Stagione
  luce: Luce
  vento: number
}

const FOGLIE = ['#d0692a', '#b23a22', '#8a3a1e', '#e09a36']
const PETALI = ['#f8c8d8', '#fbe0ea', '#ffffff']
/** I px quadrati di cielo per ogni particella, a intensità piena. */
const DENSITA = { goccia: 2200, fiocco: 4500 }
const MASSIMO = 450
const RAPPORTO_MASSIMO = 2

/** Quali particelle servono in queste condizioni, e quante (per i tipi a densità). */
function scegli(meteo: Meteo, stagione: Stagione, notte: boolean, area: number): { tipo: Tipo; quante: number }[] {
  const scelte: { tipo: Tipo; quante: number }[] = []
  const quante = (densita: number, intensita: number) => Math.min(Math.round((area / densita) * intensita), MASSIMO)
  if (meteo.cielo === 'pioggia' || meteo.cielo === 'temporale')
    scelte.push({ tipo: 'goccia', quante: quante(DENSITA.goccia, Math.max(meteo.intensita, 0.3)) })
  if (meteo.cielo === 'neve') scelte.push({ tipo: 'fiocco', quante: quante(DENSITA.fiocco, Math.max(meteo.intensita, 0.3)) })
  const asciutto = meteo.cielo === 'sereno' || meteo.cielo === 'nuvoloso'
  if (asciutto && !notte && (stagione === 'autunno' || stagione === 'primavera'))
    scelte.push({ tipo: 'foglia', quante: stagione === 'autunno' ? 16 : 10 })
  if (asciutto && notte && stagione === 'estate') scelte.push({ tipo: 'lucciola', quante: 26 })
  return scelte
}

function nuova(tipo: Tipo, larga: number, alta: number, stagione: Stagione, ovunque: boolean): Particella {
  const x = Math.random() * larga
  const y = ovunque ? Math.random() * alta : -10
  switch (tipo) {
    case 'goccia':
      return { tipo, x, y, vx: 0, vy: 650 + Math.random() * 300, r: 9 + Math.random() * 7, fase: 0, colore: '' }
    case 'fiocco':
      return { tipo, x, y, vx: 0, vy: 25 + Math.random() * 40, r: 1 + Math.random() * 1.8, fase: Math.random() * 6, colore: '' }
    case 'foglia': {
      const colori = stagione === 'autunno' ? FOGLIE : PETALI
      return {
        tipo,
        x,
        y,
        vx: 0,
        vy: 22 + Math.random() * 25,
        r: 2.5 + Math.random() * 2,
        fase: Math.random() * 6,
        colore: colori[Math.floor(Math.random() * colori.length)],
      }
    }
    case 'lucciola':
      return {
        tipo,
        x,
        // Le lucciole stanno basse, sopra il prato.
        y: alta * (0.35 + Math.random() * 0.55),
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 12,
        r: 1.6 + Math.random(),
        fase: Math.random() * 6,
        colore: '',
      }
  }
}

/** Il canvas delle particelle, sopra la scena e sotto i pannelli. */
export function Particelle({ meteo, stagione, luce, vento }: Props) {
  const tela = useRef<HTMLCanvasElement>(null)
  // Il vento cambia senza ripartire da capo: lo si legge a ogni fotogramma.
  const ventoAttuale = useRef(vento)
  ventoAttuale.current = vento
  const notte = luce.buio > 0.6
  const temporale = meteo.cielo === 'temporale'

  useEffect(() => {
    const canvas = tela.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let larga = 0
    let alta = 0
    let particelle: Particella[] = []
    const ridimensiona = () => {
      const rapporto = Math.min(window.devicePixelRatio || 1, RAPPORTO_MASSIMO)
      larga = canvas.clientWidth
      alta = canvas.clientHeight
      canvas.width = larga * rapporto
      canvas.height = alta * rapporto
      ctx.setTransform(rapporto, 0, 0, rapporto, 0, 0)
      particelle = scegli(meteo, stagione, notte, larga * alta).flatMap(
        ({ tipo, quante }) => Array.from({ length: quante }, () => nuova(tipo, larga, alta, stagione, true)),
      )
    }
    ridimensiona()
    const osservatore = new ResizeObserver(ridimensiona)
    osservatore.observe(canvas)

    let lampo = 0
    let prossimoLampo = performance.now() + 4000 + Math.random() * 8000
    let prima = performance.now()
    let fotogramma = 0

    const disegna = (ora: number) => {
      const dt = Math.min((ora - prima) / 1000, 0.05)
      prima = ora
      const spinta = ventoAttuale.current
      ctx.clearRect(0, 0, larga, alta)

      for (const p of particelle) {
        p.fase += dt
        switch (p.tipo) {
          case 'goccia': {
            p.vx = spinta * 260
            p.x += p.vx * dt
            p.y += p.vy * dt
            const lungo = p.r / p.vy
            ctx.strokeStyle = notte ? 'rgba(170, 190, 220, 0.45)' : 'rgba(205, 220, 235, 0.6)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p.x - p.vx * lungo, p.y - p.vy * lungo)
            ctx.stroke()
            break
          }
          case 'fiocco': {
            p.x += (Math.sin(p.fase * 1.3) * 18 + spinta * 60) * dt
            p.y += p.vy * dt
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
            ctx.fill()
            break
          }
          case 'foglia': {
            p.x += (Math.sin(p.fase * 1.1) * 30 + spinta * 80) * dt
            p.y += p.vy * dt
            ctx.save()
            ctx.translate(p.x, p.y)
            ctx.rotate(Math.sin(p.fase * 2) * 1.2)
            ctx.scale(1, Math.abs(Math.cos(p.fase * 1.7)) * 0.6 + 0.4)
            ctx.fillStyle = p.colore
            ctx.beginPath()
            ctx.ellipse(0, 0, p.r * 1.6, p.r, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
            break
          }
          case 'lucciola': {
            p.vx += (Math.random() - 0.5) * 30 * dt
            p.vy += (Math.random() - 0.5) * 20 * dt
            p.vx = Math.max(-18, Math.min(18, p.vx))
            p.vy = Math.max(-10, Math.min(10, p.vy))
            p.x += p.vx * dt
            p.y += p.vy * dt
            const accesa = Math.max(0, Math.sin(p.fase * 1.6))
            const alone = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5)
            alone.addColorStop(0, `rgba(240, 255, 140, ${0.9 * accesa})`)
            alone.addColorStop(1, 'rgba(240, 255, 140, 0)')
            ctx.fillStyle = alone
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2)
            ctx.fill()
            break
          }
        }
        // Uscita di scena: si ricomincia dall'alto (le lucciole tornano dentro).
        if (p.tipo === 'lucciola') {
          if (p.x < 0 || p.x > larga) p.vx = -p.vx
          if (p.y < alta * 0.3 || p.y > alta) p.vy = -p.vy
        } else if (p.y > alta + 20 || p.x > larga + 40 || p.x < -40) {
          Object.assign(p, nuova(p.tipo, larga, alta, stagione, false), p.x > larga ? { x: Math.random() * larga * 0.3 } : {})
        }
      }

      if (temporale) {
        if (ora > prossimoLampo) {
          lampo = 1
          prossimoLampo = ora + 6000 + Math.random() * 9000
        }
        if (lampo > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${lampo * 0.55})`
          ctx.fillRect(0, 0, larga, alta)
          lampo = Math.max(0, lampo - dt * 3.5)
        }
      }
      fotogramma = requestAnimationFrame(disegna)
    }
    fotogramma = requestAnimationFrame(disegna)

    return () => {
      cancelAnimationFrame(fotogramma)
      osservatore.disconnect()
    }
    // Si riparte solo quando cambia cosa cade; il vento si legge al volo.
  }, [meteo.cielo, meteo.intensita, stagione, notte, temporale])

  return <canvas ref={tela} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true" />
}
