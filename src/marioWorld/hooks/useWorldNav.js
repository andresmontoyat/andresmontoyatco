import { useState, useRef, useEffect, useCallback } from 'react'

const ARROW_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])

function clamp(value, min, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}

function isEditableTarget() {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  return false
}

function nextPosition(prev, key, step, bbox) {
  let { x, y } = prev
  if (key === 'ArrowRight') x += step
  else if (key === 'ArrowLeft') x -= step
  else if (key === 'ArrowUp') y -= step
  else if (key === 'ArrowDown') y += step
  return {
    x: clamp(x, bbox.minX, bbox.maxX),
    y: clamp(y, bbox.minY, bbox.maxY),
  }
}

export default function useWorldNav({ bbox, step }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 })
  const [isWalking, setIsWalking] = useState(false)
  const dragRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(e) {
      if (!ARROW_KEYS.has(e.key)) return
      if (isEditableTarget()) return
      e.preventDefault()
      setIsWalking(true)
      setPosition((prev) => nextPosition(prev, e.key, step, bbox))
    }
    function handleKeyUp(e) {
      if (!ARROW_KEYS.has(e.key)) return
      setIsWalking(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [bbox, step])

  const onPointerDown = useCallback((e) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseOffsetX: cameraOffset.x,
      baseOffsetY: cameraOffset.y,
      pointerId: e.pointerId,
    }
    if (e.currentTarget && typeof e.currentTarget.setPointerCapture === 'function') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch (err) {
        // ignore — capture not supported in this env
      }
    }
  }, [cameraOffset.x, cameraOffset.y])

  const onPointerMove = useCallback((e) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setCameraOffset({
      x: drag.baseOffsetX - dx,
      y: drag.baseOffsetY - dy,
    })
  }, [])

  const onPointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  return {
    position,
    cameraOffset,
    isWalking,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
