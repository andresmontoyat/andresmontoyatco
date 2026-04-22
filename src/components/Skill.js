import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function SectionLabel({ children }) {
  return (
    <div className="font-mono text-xs text-brand uppercase tracking-[3px] font-semibold flex items-center gap-3 mb-4">
      <span className="w-10 h-0.5 bg-brand block"></span>
      {children}
    </div>
  )
}

export default function Skill() {
  const { t } = useLanguage()
  return (
    <section id="skills" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <SectionLabel>{t.skills.label}</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3">{t.skills.h2}</h2>
        <p className="text-text-secondary max-w-2xl mb-12">{t.skills.intro}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.skills.cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-ink-500 border border-ink-400 rounded-xl p-6 transition-all duration-300 hover:border-brand hover:-translate-y-1 hover:shadow-brand"
            >
              <div className="w-11 h-11 rounded-lg bg-brand bg-opacity-10 text-brand grid place-items-center text-xl mb-3.5">
                {card.icon}
              </div>
              <h4 className="text-base font-bold text-text-primary mb-1.5">{card.title}</h4>
              <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {card.chips.map((chip) => (
                  <span key={chip} className="font-mono text-xs py-1 px-2.5 bg-ink-700 border border-ink-400 rounded-full text-text-secondary">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
