import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'

// I gesti sulla Foresta (doc/08-interfaccia.md, "Foresta"): un dito (o il
// mouse) trascina il prato, con un po' di inerzia; due dita lo ingrandiscono
// attorno al punto in mezzo; con la rotella o il pinch del trackpad si
// ingrandisce attorno al puntatore. Sulla Foresta il browser non ingrandisce la pagina.

export const ZOOM_MINIMO = 1
export const ZOOM_MASSIMO = 4
/** Di quanto ingrandiscono + e −. */
const PASSO = 1.5
/** Oltre questi px un trascinamento non è più un tocco. */
const SOGLIA = 6
/** Quanto rallenta l'inerzia a ogni ms. */
const ATTRITO = 0.995

export const limitaZoom = (z: number) => Math.min(Math.max(z, ZOOM_MINIMO), ZOOM_MASSIMO)

/**
 * Lo scorrimento che tiene fermo un punto mentre si ingrandisce: `scorri` è lo
 * scorrimento attuale, `punto` dove sta il punto nel riquadro visibile, `da` e
 * `a` gli ingrandimenti prima e dopo. Il contenuto cresce in proporzione.
 */
export function scorriDopoZoom(scorri: number, punto: number, da: number, a: number): number {
  return ((scorri + punto) * a) / da - punto
}

/** Distanza e punto di mezzo di due dita. */
export function pinza(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { distanza: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function useGesti(zoomIniziale: number) {
  const contenitore = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(zoomIniziale)
  const zoomAttuale = useRef(zoom)
  zoomAttuale.current = zoom
  // Il punto da tenere fermo al prossimo cambio di zoom, nel riquadro visibile.
  const ancora = useRef<{ x: number; y: number; da: number } | null>(null)

  /** Ingrandisce a `a`, tenendo fermo il punto (x, y) del riquadro (di default il centro). */
  const zoomA = useCallback((a: number, x?: number, y?: number) => {
    const c = contenitore.current
    const nuovo = limitaZoom(a)
    if (!c || nuovo === zoomAttuale.current) return
    ancora.current = { x: x ?? c.clientWidth / 2, y: y ?? c.clientHeight / 2, da: zoomAttuale.current }
    zoomAttuale.current = nuovo
    setZoom(nuovo)
  }, [])

  // Appena il prato ha la nuova grandezza, si scorre per tenere fermo il punto.
  useLayoutEffect(() => {
    const c = contenitore.current
    const a = ancora.current
    if (!c) return
    if (!a) {
      // Prima volta: al centro.
      c.scrollLeft = (c.scrollWidth - c.clientWidth) / 2
      c.scrollTop = (c.scrollHeight - c.clientHeight) / 2
      return
    }
    c.scrollLeft = scorriDopoZoom(c.scrollLeft, a.x, a.da, zoom)
    c.scrollTop = scorriDopoZoom(c.scrollTop, a.y, a.da, zoom)
    ancora.current = null
  }, [zoom])

  // Le dita (o il mouse) appoggiate, e il gesto in corso.
  const dita = useRef(new Map<number, { x: number; y: number }>())
  const gesto = useRef<{
    inizio: { x: number; y: number }
    mosso: boolean
    pinza?: { distanza: number; zoom: number }
  } | null>(null)
  const velocita = useRef({ x: 0, y: 0, t: 0 })
  const inerzia = useRef(0)

  const fermaInerzia = () => cancelAnimationFrame(inerzia.current)

  const giu = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    fermaInerzia()
    dita.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (dita.current.size === 1) gesto.current = { inizio: { x: e.clientX, y: e.clientY }, mosso: false }
    if (dita.current.size === 2) {
      const [a, b] = [...dita.current.values()]
      gesto.current = { inizio: a, mosso: true, pinza: { distanza: pinza(a, b).distanza, zoom: zoomAttuale.current } }
    }
    velocita.current = { x: 0, y: 0, t: e.timeStamp }
  }

  const muovi = (e: PointerEvent<HTMLDivElement>) => {
    const c = contenitore.current
    const prima = dita.current.get(e.pointerId)
    const g = gesto.current
    if (!c || !prima || !g) return
    const ora = { x: e.clientX, y: e.clientY }
    dita.current.set(e.pointerId, ora)

    if (g.pinza && dita.current.size >= 2) {
      const [a, b] = [...dita.current.values()]
      const p = pinza(a, b)
      const riquadro = c.getBoundingClientRect()
      zoomA((g.pinza.zoom * p.distanza) / g.pinza.distanza, p.x - riquadro.left, p.y - riquadro.top)
      return
    }

    // Finché il dito resta vicino al punto di partenza è ancora un tocco.
    if (!g.mosso) {
      if (Math.hypot(ora.x - g.inizio.x, ora.y - g.inizio.y) < SOGLIA) return
      g.mosso = true
      c.setPointerCapture(e.pointerId)
    }
    const dx = ora.x - prima.x
    const dy = ora.y - prima.y
    c.scrollLeft -= dx
    c.scrollTop -= dy
    const dt = Math.max(e.timeStamp - velocita.current.t, 1)
    velocita.current = { x: dx / dt, y: dy / dt, t: e.timeStamp }
  }

  const su = (e: PointerEvent<HTMLDivElement>) => {
    dita.current.delete(e.pointerId)
    const g = gesto.current
    if (dita.current.size === 1 && g?.pinza) {
      // Da due dita a una: si continua a trascinare con quella rimasta.
      gesto.current = { inizio: [...dita.current.values()][0], mosso: true }
      return
    }
    if (dita.current.size > 0) return
    // L'inerzia, solo per un trascinamento veloce appena finito.
    let { x: vx, y: vy } = velocita.current
    if (g?.mosso && !g.pinza && e.timeStamp - velocita.current.t < 60 && Math.hypot(vx, vy) > 0.2) {
      let prima = performance.now()
      const scivola = (ora: number) => {
        const c = contenitore.current
        const dt = ora - prima
        prima = ora
        if (!c) return
        c.scrollLeft -= vx * dt
        c.scrollTop -= vy * dt
        vx *= ATTRITO ** dt
        vy *= ATTRITO ** dt
        if (Math.hypot(vx, vy) > 0.02) inerzia.current = requestAnimationFrame(scivola)
      }
      inerzia.current = requestAnimationFrame(scivola)
    }
    // Il clic arriva dopo il rilascio: lo si ignora solo se c'è stato un trascinamento.
    window.setTimeout(() => {
      if (dita.current.size === 0) gesto.current = null
    })
  }

  // Rotella e pinch del trackpad (che arriva come rotella con Ctrl): zoom
  // attorno al puntatore; per spostarsi si trascina. Safari ingrandisce la
  // pagina coi suoi eventi "gesture": qui non deve.
  useEffect(() => {
    const c = contenitore.current
    if (!c) return
    const rotella = (e: WheelEvent) => {
      e.preventDefault()
      // Il pinch manda passi piccoli e fitti, la rotella scatti da ~100 px (o in righe).
      const px = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY
      const sensibilita = e.ctrlKey ? 0.01 : 0.0015
      const riquadro = c.getBoundingClientRect()
      zoomA(zoomAttuale.current * Math.exp(-px * sensibilita), e.clientX - riquadro.left, e.clientY - riquadro.top)
    }
    const blocca = (e: Event) => e.preventDefault()
    c.addEventListener('wheel', rotella, { passive: false })
    c.addEventListener('gesturestart', blocca)
    c.addEventListener('gesturechange', blocca)
    return () => {
      c.removeEventListener('wheel', rotella)
      c.removeEventListener('gesturestart', blocca)
      c.removeEventListener('gesturechange', blocca)
      fermaInerzia()
    }
  }, [zoomA])

  return {
    contenitore,
    zoom,
    piu: () => zoomA(zoomAttuale.current * PASSO),
    meno: () => zoomA(zoomAttuale.current / PASSO),
    gestori: { onPointerDown: giu, onPointerMove: muovi, onPointerUp: su, onPointerCancel: su },
    /** Vero se il clic appena arrivato chiude un trascinamento o un pinch: va ignorato. */
    trascinato: () => gesto.current?.mosso ?? false,
  }
}
