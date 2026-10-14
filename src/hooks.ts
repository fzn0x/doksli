import { useEffect, useState } from 'react'
import { makeSpill } from './lib/spill'

export const MOBILE_BREAKPOINT = 900

export interface Layout {
  mobile: boolean
  /** The box a stage may fill, in CSS pixels. */
  avail: { width: number; height: number }
}

function measure(sheetOpen: boolean): Layout {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w >= MOBILE_BREAKPOINT) {
    const side = Math.min(400, Math.max(300, w * 0.24))
    const rail = 76
    const gap = 28
    return {
      mobile: false,
      avail: { width: Math.max(200, w - side * 2 - rail - gap - 32), height: h - 56 },
    }
  }
  const top = 64
  const bottom = 156
  const sheet = sheetOpen ? Math.min(340, h * 0.42) : 0
  return {
    mobile: true,
    avail: {
      width: Math.max(160, w - 16 - 64 - 8),
      height: Math.max(160, h - top - Math.max(bottom, sheet + 24)),
    },
  }
}

export function useLayout(sheetOpen: boolean): Layout {
  const [layout, setLayout] = useState(() => measure(sheetOpen))
  useEffect(() => {
    const update = () => setLayout(measure(sheetOpen))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [sheetOpen])
  return layout
}

export function useSpill(src: string | null): string | null {
  const [spill, setSpill] = useState<{ src: string; url: string | null } | null>(null)
  useEffect(() => {
    if (!src) return
    let live = true
    makeSpill(src).then((url) => {
      if (live) setSpill({ src, url })
    })
    return () => {
      live = false
    }
  }, [src])
  return spill && spill.src === src ? spill.url : null
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

export function isMac(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
}
