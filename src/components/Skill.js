import React, { useRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import useInView from '../hooks/useInView'
import SectionLabel from './_shared/SectionLabel'

export default function Skill() {
  const { t } = useLanguage()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.25 })

  return (
    <section id="skills" className="py-20">
      <div ref={sectionRef} className="max-w-6xl mx-auto px-6">
        <div className={`animate-on-scroll${inView ? ' is-visible' : ''}`}>
          <SectionLabel>{t.skills.label}</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3">{t.skills.h2}</h2>
          <p className="text-text-secondary max-w-2xl mb-12">{t.skills.intro}</p>
        </div>

        <div className="space-y-8">
          {t.skills.categories.map((cat, ci) => (
            <div
              key={cat.title}
              className={`animate-on-scroll${inView ? ' is-visible' : ''}`}
              style={{ transitionDelay: `${ci * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-brand font-mono text-base font-extrabold">{cat.symbol}</span>
                <h3 className="text-base font-extrabold text-text-primary tracking-tight">{cat.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.chips.map((chip, i) => (
                  <ChipBadge key={chip.label} chip={chip} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ChipBadge({ chip, index }) {
  return (
    <span
      className="inline-flex items-baseline gap-1 font-mono text-xs py-1 px-2 bg-ink-700 border border-ink-400 rounded-full text-text-secondary hover:border-brand hover:text-text-primary transition-colors duration-200 cursor-default animate-on-scroll is-visible"
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {chip.label}
      <span className="text-xs text-text-muted">{chip.years}y</span>
    </span>
  )
}
