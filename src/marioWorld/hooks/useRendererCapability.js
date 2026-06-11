import { useState, useEffect } from 'react'

// Phase 17 capability hook — returns 'webgl' | 'svg' based on D-17-CAP-GATES:
//   1. Viewport ≥ 1024px (Tailwind lg:)
//   2. !prefers-reduced-motion: reduce
//   3. !navigator.connection?.saveData
//   4. effectiveType not in ['2g', 'slow-2g']
//   5. WebGL ctx available (getContext('webgl2') || getContext('webgl'))
// URL override (?renderer=svg|webgl) short-circuits all gates per RESEARCH §7
// — debug/UAT only; user accepts responsibility for forcing WebGL on incapable client.
// Reactive to viewport + motion matchMedia changes via addEventListener/addListener
// compat shim mirroring SvgConstellation.js:32-59.

const isServer = typeof window === 'undefined'
const VIEWPORT_QUERY = '(min-width: 1024px)'
const MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function detect() {
  if (isServer) return 'svg'

  // URL override (highest priority — debug/UAT short-circuits all gates).
  const params = new URLSearchParams(window.location.search)
  const override = params.get('renderer')
  if (override === 'svg' || override === 'webgl') return override

  // 4 mandatory gates — any fail routes to svg.
  const viewportOK = window.matchMedia(VIEWPORT_QUERY).matches
  const motionOK = !window.matchMedia(MOTION_QUERY).matches
  const conn = typeof navigator !== 'undefined' ? navigator.connection : undefined
  const saveDataOK = !(conn?.saveData === true)
  const networkOK = !['2g', 'slow-2g'].includes(conn?.effectiveType ?? '')

  if (!viewportOK || !motionOK || !saveDataOK || !networkOK) return 'svg'

  // WebGL feature detect — cheapest after other gates, last.
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('webgl2') || c.getContext('webgl')
    return ctx ? 'webgl' : 'svg'
  } catch (e) {
    return 'svg'
  }
}

export default function useRendererCapability() {
  const [cap, setCap] = useState(detect)

  useEffect(() => {
    if (isServer) return undefined
    const viewport = window.matchMedia(VIEWPORT_QUERY)
    const motion = window.matchMedia(MOTION_QUERY)
    const handler = () => setCap(detect())

    // Safari 13 compat shim — mirror SvgConstellation.js:45-56.
    const attach = (mql) => {
      if (mql.addEventListener) mql.addEventListener('change', handler)
      else mql.addListener(handler)
    }
    const detach = (mql) => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler)
      else mql.removeListener(handler)
    }

    attach(viewport)
    attach(motion)
    return () => {
      detach(viewport)
      detach(motion)
    }
  }, [])

  return cap
}
