import React, { useState, useEffect } from 'react'

export default function FpsCounter() {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    let rafId
    let frames = 0
    let lastT = performance.now()
    function tick(t) {
      frames += 1
      if (t - lastT >= 1000) {
        setFps(Math.round((frames * 1000) / (t - lastT)))
        frames = 0
        lastT = t
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])
  return (
    <div className="fixed bottom-4 left-4 z-[300] font-mono text-xs text-text-secondary bg-ink-900/80 px-2 py-1 rounded">
      {fps} fps
    </div>
  )
}
