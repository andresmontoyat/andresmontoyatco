import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'cam-viewmode'
const DEFAULT_MODE = 'game'
const VALID_MODES = ['game', 'dev']

function readInitialMode() {
  if (typeof window === 'undefined') return DEFAULT_MODE
  try {
    // ?mode= deep-link wins over stored choice (D5 — query param precedence)
    const url = new URLSearchParams(window.location.search).get('mode')
    if (url && VALID_MODES.includes(url)) return url
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && VALID_MODES.includes(stored)) return stored
  } catch (e) {
    // localStorage / URL blocked — fall through to default
  }
  return DEFAULT_MODE
}

const ViewModeContext = createContext({
  viewMode: DEFAULT_MODE,
  setViewMode: () => {},
  toggleViewMode: () => {},
})

export function ViewModeProvider({ children }) {
  const [viewMode, setViewModeState] = useState(readInitialMode)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, viewMode)
    } catch (e) {
      // localStorage blocked — ignore
    }
  }, [viewMode])

  const setViewMode = useCallback((next) => {
    if (!VALID_MODES.includes(next)) return
    setViewModeState(next)
  }, [])

  const toggleViewMode = useCallback(() => {
    setViewModeState((prev) => (prev === 'game' ? 'dev' : 'game'))
  }, [])

  const value = useMemo(
    () => ({ viewMode, setViewMode, toggleViewMode }),
    [viewMode, setViewMode, toggleViewMode]
  )

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
}

export function useViewMode() {
  return useContext(ViewModeContext)
}
