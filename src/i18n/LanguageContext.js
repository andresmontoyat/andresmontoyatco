import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import translations from './translations'

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
})

function readInitialLang() {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem('cam-lang')
  if (saved === 'es' || saved === 'en') return saved
  const nav = (window.navigator && window.navigator.language) || 'en'
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = lang
    const meta = translations[lang] && translations[lang].meta
    if (meta) {
      if (meta.title) document.title = meta.title
      const tag = document.querySelector('meta[name="description"]')
      if (tag && meta.description) tag.setAttribute('content', meta.description)
    }
  }, [lang])

  const setLang = useCallback((next) => {
    if (next !== 'en' && next !== 'es') return
    setLangState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cam-lang', next)
    }
  }, [])

  const value = useMemo(() => ({
    lang,
    setLang,
    t: translations[lang],
  }), [lang, setLang])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
