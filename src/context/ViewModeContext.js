import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'cam-viewmode'
const VALID_MODES = ['game', 'dev']

function readInitialMode() {
  if (typeof window === 'undefined') return null
  try {
    // ?mode= deep-link wins over stored choice (D5 — query param precedence)
    const url = new URLSearchParams(window.location.search).get('mode')
    if (url && VALID_MODES.includes(url)) return url
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && VALID_MODES.includes(stored)) return stored
  } catch (e) {
    // localStorage / URL blocked — fall through to null
  }
  return null
}

const ViewModeContext = createContext({
  viewMode: null,
  setViewMode: () => {},
  clearViewMode: () => {},
  toggleViewMode: () => {},
})

export function ViewModeProvider({ children }) {
  const [viewMode, setViewModeState] = useState(readInitialMode)

  const setViewMode = useCallback((next) => {
    if (!VALID_MODES.includes(next)) return
    setViewModeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch (e) {
      // localStorage blocked — ignore
    }
  }, [])

  const clearViewMode = useCallback(() => {
    setViewModeState(null)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      // localStorage blocked — ignore
    }
  }, [])

  const toggleViewMode = useCallback(() => {
    setViewModeState((prev) => {
      const next = prev === 'game' ? 'dev' : 'game'
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch (e) {
        // localStorage blocked — ignore
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      viewMode, setViewMode, clearViewMode, toggleViewMode,
    }),
    [viewMode, setViewMode, clearViewMode, toggleViewMode]
  )

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
}

export function useViewMode() {
  return useContext(ViewModeContext)
}
