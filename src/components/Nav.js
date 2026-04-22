import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'

export default function Nav() {
  const { lang, setLang, t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-900 bg-opacity-70 border-b border-ink-400">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="font-mono font-semibold text-sm tracking-tight text-text-primary">
          &lt;<span className="text-brand">/</span>cam&gt;
        </div>
        <nav className="hidden md:flex gap-7 text-sm font-medium">
          <a href="#about"      className="text-text-secondary hover:text-brand transition-colors">{t.nav.about}</a>
          <a href="#skills"     className="text-text-secondary hover:text-brand transition-colors">{t.nav.skills}</a>
          <a href="#experience" className="text-text-secondary hover:text-brand transition-colors">{t.nav.experience}</a>
          <a href="#contact"    className="text-text-secondary hover:text-brand transition-colors">{t.nav.contact}</a>
        </nav>
        <div className="flex gap-2 items-center">
          <div className="flex gap-0.5 bg-ink-500 border border-ink-400 rounded-full p-0.5 font-mono text-xs font-semibold">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-full transition-colors ${lang === 'en' ? 'bg-brand-gradient text-ink-900' : 'text-text-secondary'}`}
              aria-label="English"
            >EN</button>
            <button
              onClick={() => setLang('es')}
              className={`px-3 py-1.5 rounded-full transition-colors ${lang === 'es' ? 'bg-brand-gradient text-ink-900' : 'text-text-secondary'}`}
              aria-label="Español"
            >ES</button>
          </div>
        </div>
      </div>
    </header>
  )
}
