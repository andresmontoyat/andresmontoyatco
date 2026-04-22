import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'

export default function Hero() {
  const { lang, t } = useLanguage()
  const cvFile = lang === 'es' ? 'CV_Carlos_Montoya_ES.docx' : 'CV_Carlos_Montoya_EN.docx'

  return (
    <section className="relative pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-ink-400 rounded-full font-mono text-xs text-text-secondary bg-ink-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-brand motion-safe:animate-pulse2 shadow-[0_0_12px_#6C63FF]"></span>
          {t.hero.status}
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-none mb-5">
          <span className="text-text-primary">{t.hero.h1a}</span><br />
          <span className="bg-brand-gradient bg-clip-text text-transparent">{t.hero.h1b}</span><br />
          <span className="text-text-primary">{t.hero.h1c}</span>
        </h1>
        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mb-9 leading-relaxed">
          {t.hero.lead}
        </p>
        <div className="flex gap-3 flex-wrap">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm bg-brand-gradient text-ink-900 shadow-brand hover:shadow-brand-lg transform hover:-translate-y-0.5 transition-all"
          >
            {t.hero.cta1} →
          </a>
          <a
            href={`/${cvFile}`}
            download
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm bg-transparent text-text-primary border border-ink-400 hover:border-brand hover:text-brand transition-all"
          >
            {t.hero.cta2}
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 p-7 bg-gradient-to-b from-ink-500 to-ink-700 border border-ink-400 rounded-xl">
          <Stat num="18+" label={t.stats.years} />
          <Stat num="45+" label={t.stats.team} />
          <Stat num="15+" label={t.stats.companies} />
          <Stat num="8" label={t.stats.industries} />
        </div>
      </div>
    </section>
  )
}

function Stat({ num, label }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-extrabold bg-brand-gradient bg-clip-text text-transparent">{num}</div>
      <div className="text-xs text-text-secondary uppercase tracking-widest mt-1 font-semibold">{label}</div>
    </div>
  )
}
