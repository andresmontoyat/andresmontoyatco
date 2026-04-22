import React, { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import EXPERIENCE from '../data/experience'

function SectionLabel({ children }) {
  return (
    <div className="font-mono text-xs text-brand uppercase tracking-[3px] font-semibold flex items-center gap-3 mb-4">
      <span className="w-10 h-0.5 bg-brand block"></span>
      {children}
    </div>
  )
}

export default function Experience() {
  const { lang, t } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  return (
    <section id="experience" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <SectionLabel>{t.exp.label}</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3">{t.exp.h2}</h2>
        <p className="text-text-secondary max-w-2xl mb-12">{t.exp.intro}</p>

        <div className="relative pl-8">
          <span className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-brand to-transparent"></span>
          {EXPERIENCE.map((job, i) => {
            if (!job.featured && !expanded) return null
            return (
              <div key={i} className={`relative pb-9 ${!job.featured ? 'animate-fadein' : ''}`}>
                <span className="absolute -left-[30px] top-2 w-3.5 h-3.5 rounded-full bg-ink-900 border-2 border-brand shadow-[0_0_0_4px_#0B1020,0_0_16px_#6C63FF]"></span>
                <div className="flex justify-between items-baseline gap-4 flex-wrap mb-1">
                  <h4 className="text-base font-bold text-text-primary">{job.title[lang]}</h4>
                  <span className="font-mono text-xs text-brand whitespace-nowrap">{job.date[lang]}</span>
                </div>
                <div className="text-sm text-text-secondary mb-2.5">
                  <strong className="text-text-primary">{job.company}</strong> · {job.location[lang]}
                </div>
                <ul className="text-sm text-text-secondary leading-relaxed space-y-1">
                  {job.bullets[lang].map((b, j) => (
                    <li key={j} className="relative pl-5">
                      <span className="absolute left-0 text-brand">▸</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-5 py-2.5 border border-ink-400 rounded-full text-sm font-semibold text-text-primary bg-transparent cursor-pointer transition-all hover:border-brand hover:text-brand"
          >
            {expanded ? t.exp.less : t.exp.more}
          </button>
        </div>
      </div>
    </section>
  )
}
