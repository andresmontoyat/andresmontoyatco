import { useRef, useCallback } from 'react'

// D-20-CLICK-DRAG-THRESHOLD — locked values per UI-SPEC §Click-vs-Drag.
// CRIT-02 mitigation: OrbitControls swallows the raw 'click' event when the
// gesture passes its drag threshold; this hook arbitrates click vs drag in
// pointer-space BEFORE onSelectSkill fires.
// MOD-03 mitigation: capacitive touchscreen 1-3px jitter — touch pointers
// bump to an 8px threshold.
const DIST_THRESHOLD_MOUSE = 5
const DIST_THRESHOLD_TOUCH = 8
const TIME_THRESHOLD_MS = 250

export default function useClickVsDrag({ onClick } = {}) {
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startT: 0,
    pointerType: 'mouse',
  })

  const onPointerDown = useCallback((e) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startT: typeof performance !== 'undefined' ? performance.now() : Date.now(),
      pointerType: e.pointerType || 'mouse',
    }
  }, [])

  const onPointerUp = useCallback((e) => {
    const ref = dragRef.current
    const dx = e.clientX - ref.startX
    const dy = e.clientY - ref.startY
    const dist = Math.hypot(dx, dy)
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const dt = now - ref.startT
    const distThreshold = ref.pointerType === 'touch'
      ? DIST_THRESHOLD_TOUCH
      : DIST_THRESHOLD_MOUSE
    const isClick = dist < distThreshold && dt < TIME_THRESHOLD_MS
    if (isClick && onClick) onClick(e)
  }, [onClick])

  return { onPointerDown, onPointerUp, isDragRef: dragRef }
}
