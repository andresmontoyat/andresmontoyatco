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
    if (!meta) return

    if (meta.title) document.title = meta.title
    const descTag = document.querySelector('meta[name="description"]')
    if (descTag && meta.description) descTag.setAttribute('content', meta.description)

    const setMeta = (selector, content) => {
      const el = document.querySelector(selector)
      if (el && content) el.setAttribute('content', content)
    }
    setMeta('meta[property="og:title"]', meta.title)
    setMeta('meta[property="og:description"]', meta.description)
    setMeta('meta[name="twitter:title"]', meta.title)
    setMeta('meta[name="twitter:description"]', meta.description)
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
