import { useState, useRef, useCallback } from 'react'

const ZOOM_IN_MS = 600
const ZOOM_OUT_MS = 400

export default function useCinematicZoom() {
  const [state, setState] = useState('idle')
  const [activeWorldId, setActiveWorldId] = useState(null)
  const timerRef = useRef(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const start = useCallback((worldId) => {
    if (state === 'zoomingIn' || state === 'zoomingOut') return
    clearTimer()
    if (state === 'inWorld') {
      setState('zoomingOut')
      timerRef.current = setTimeout(() => {
        setActiveWorldId(worldId)
        setState('zoomingIn')
        timerRef.current = setTimeout(() => setState('inWorld'), ZOOM_IN_MS)
      }, ZOOM_OUT_MS)
      return
    }
    setActiveWorldId(worldId)
    setState('zoomingIn')
    timerRef.current = setTimeout(() => setState('inWorld'), ZOOM_IN_MS)
  }, [state])

  const stop = useCallback(() => {
    clearTimer()
    if (state === 'idle') return
    setState('zoomingOut')
    timerRef.current = setTimeout(() => {
      setState('idle')
      setActiveWorldId(null)
    }, ZOOM_OUT_MS)
  }, [state])

  return { state, activeWorldId, start, stop }
}
