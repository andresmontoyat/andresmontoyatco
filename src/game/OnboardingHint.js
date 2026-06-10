import React, { useEffect, useState } from 'react'

// D-20-CONTEXT-HINT — bilingual onboarding hint pill for the WebGL 3D
// constellation. Telegraphs "drag to rotate" to recruiters who otherwise see
// the auto-rotating constellation without realising it is grabbable.
//
// Lifecycle (Pattern S2 + Pattern S3 + Pattern S1):
//   mount → setTimeout(FADE_IN_DELAY_MS, () => setVisible(true)) →
//   pill renders with motion-safe:animate-fade-in →
//   setTimeout(AUTO_DISMISS_MS, () => writeFlag + setSeen) → unmount.
// OR click → writeFlag + setSeen → unmount.
//
// Suppression: localStorage cam-3d-hint-seen='true' at mount → return null.
// Plan 20-02a's onFirstDrag callback in GameMode already writes this flag, so
// a recruiter who drags during the 800ms pre-pill window correctly suppresses
// the pill on the NEXT page mount.
//
// Defensive RM gate (Alert A9 / Pattern S1) — useRendererCapability already
// routes prefers-reduced-motion users to SVG before WebGL mounts, but this
// belt-and-braces gate prevents the pill from rendering if matchMedia flips
// post-mount (rare but possible via DevTools emulation).

const STORAGE_KEY = 'cam-3d-hint-seen'
const FADE_IN_DELAY_MS = 800
const AUTO_DISMISS_MS = 5000
const RM_QUERY = '(prefers-reduced-motion: reduce)'

const isServer = typeof window === 'undefined'

// hasMatchMedia computed lazily at render-time, not module-load, so tests that
// install matchMedia via Object.defineProperty in beforeEach are seen by the
// component (module-load capture would freeze the absence of matchMedia).
function hasMatchMedia() {
  return !isServer && typeof window.matchMedia === 'function'
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (isServer || !hasMatchMedia()) return false
    return window.matchMedia(RM_QUERY).matches
  })
  useEffect(() => {
    if (isServer || !hasMatchMedia()) return undefined
    const mql = window.matchMedia(RM_QUERY)
    const handler = (e) => setReduced(e.matches)
    if (mql.addEventListener) mql.addEventListener('change', handler)
    else if (mql.addListener) mql.addListener(handler)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler)
      else if (mql.removeListener) mql.removeListener(handler)
    }
  }, [])
  return reduced
}

function readSeenFlag() {
  try {
    if (isServer) return false
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch (e) {
    return false
  }
}

function writeSeenFlag() {
  try {
    if (isServer) return
    window.localStorage.setItem(STORAGE_KEY, 'true')
  } catch (e) { /* Safari private mode SecurityError — swallow */ }
}

export default function OnboardingHint({ t }) {
  const [visible, setVisible] = useState(false)
  const [seen, setSeen] = useState(readSeenFlag)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (seen || reduced) return undefined
    const showTimer = setTimeout(() => setVisible(true), FADE_IN_DELAY_MS)
    return () => clearTimeout(showTimer)
  }, [seen, reduced])

  useEffect(() => {
    if (!visible) return undefined
    const dismissTimer = setTimeout(() => {
      writeSeenFlag()
      setSeen(true)
      setVisible(false)
    }, AUTO_DISMISS_MS)
    return () => clearTimeout(dismissTimer)
  }, [visible])

  if (seen || reduced || !visible) return null

  const copy = t?.game?.hint?.drag ?? ''
  const onClick = () => {
    writeSeenFlag()
    setSeen(true)
    setVisible(false)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copy}
      className="
        absolute left-1/2 -translate-x-1/2 bottom-[88px] z-10
        px-4 py-2 min-h-[44px]
        text-xs font-mono
        text-hintPill-text bg-hintPill-bg
        rounded-full
        motion-safe:animate-fade-in
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neon
        outline-none
      "
    >
      {copy}
    </button>
  )
}
