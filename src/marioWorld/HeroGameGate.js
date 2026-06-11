import React from 'react'
import Hero from '../components/Hero.js'
import { useLanguage } from '../i18n/LanguageContext.js'

export default function HeroGameGate({ onPick }) {
  const { t } = useLanguage()
  return (
    <>
      <Hero />
      <div className="container mx-auto mt-6 flex justify-center gap-4 px-4 pb-8">
        <button
          type="button"
          onClick={() => onPick('game')}
          aria-label={t.hero.enterGame}
          className="rounded-xl bg-brand px-6 py-3 font-mono text-base text-text-inverse shadow-brand focus:outline-none focus:ring-2 focus:ring-brand"
        >
          ▶ {t.hero.enterGame}
        </button>
        <button
          type="button"
          onClick={() => onPick('dev')}
          aria-label={t.hero.skipToCV}
          className="rounded-xl border border-ink-700 px-6 py-3 font-mono text-base text-text-primary hover:bg-ink-800 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          📄 {t.hero.skipToCV}
        </button>
      </div>
    </>
  )
}
