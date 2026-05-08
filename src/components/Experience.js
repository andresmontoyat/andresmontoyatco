import React, { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import useInView from '../hooks/useInView'
import SectionLabel from './_shared/SectionLabel'
import EXPERIENCE from '../data/experience'

export default function Experience() {
  const { lang, t } = useLanguage()
  const [openCards, setOpenCards] = useState({})
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.25 })
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { threshold: 0.25 })

  function toggle(i) {
    setOpenCards((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <section id="experience" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div ref={headerRef} className={`animate-on-scroll${headerInView ? ' is-visible' : ''}`}>
          <SectionLabel>{t.exp.label}</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3">{t.exp.h2}</h2>
          <p className="text-text-secondary max-w-2xl mb-12">{t.exp.intro}</p>
        </div>

        <div ref={sectionRef} className="relative pl-8 mt-10">
          <span className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-brand opacity-30" aria-hidden="true"></span>
          {EXPERIENCE.map((job, i) => (
            <TimelineCard
              key={`${job.company}-${i}`}
              job={job}
              index={i}
              lang={lang}
              t={t}
              inView={inView}
              isOpen={!!openCards[i]}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineCard({ job, index, lang, t, inView, isOpen, onToggle }) {
  return (
    <div
      className={`relative pb-9 animate-on-scroll${inView ? ' is-visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <span
        aria-hidden="true"
        className="absolute -left-[30px] top-[6px] w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_0_3px_#0D0D1A,0_0_8px_rgba(108,99,255,0.4)]"
      />
      <div className="bg-ink-500 border border-ink-400 rounded-xl p-6 hover:border-brand/50 transition-colors duration-200">
        <div className="flex justify-between items-baseline gap-4 flex-wrap mb-1">
          <span className="font-mono text-xs text-brand">{job.date[lang]}</span>
          <span className="font-mono text-xs text-text-muted bg-ink-700 border border-ink-400 rounded-full px-2 py-1">
            {job.company}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-text-primary mb-1">{job.title[lang]}</h3>
        <div className="text-base text-text-secondary mb-3">{job.location[lang]}</div>

        <div className="flex flex-wrap gap-2 mb-3">
          {job.tech.map((tech) => (
            <span
              key={tech}
              className="font-mono text-xs py-1 px-2 bg-ink-700 border border-ink-400 rounded-full text-text-secondary hover:border-brand transition-colors duration-150"
            >
              {tech}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? t.exp.collapse : t.exp.expand}
          className="flex items-center gap-2 text-xs font-mono text-brand hover:text-brand-light transition-colors duration-150 mt-1"
        >
          <ChevronIcon open={isOpen} />
          {isOpen ? t.exp.collapse : t.exp.expand}
        </button>

        {isOpen && (
          <ul className="mt-4 text-base text-text-secondary leading-relaxed space-y-1 border-t border-ink-400 pt-4">
            {job.bullets[lang].map((b, j) => (
              <li key={j} className="relative pl-6">
                <span className="absolute left-0 text-brand">&#9656;</span>{b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
