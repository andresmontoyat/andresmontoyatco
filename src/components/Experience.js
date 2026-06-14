import React, { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/experience.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
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

function TimelineCard({ entry, lang, isOpen, onToggle, expandLabel, collapseLabel }) {
  return (
    <div className="relative pb-9">
      <span
        aria-hidden="true"
        className="absolute -left-[30px] top-[6px] w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_0_3px_var(--bg)]"
      />
      <div className="bg-surface border border-border rounded-xl p-6 hover:border-accent transition-colors duration-200">
        <div className="flex justify-between items-baseline gap-4 flex-wrap mb-1">
          <span className="font-mono text-xs text-accent">{pick(entry.date, lang)}</span>
          <span className="font-mono text-xs text-muted bg-bg border border-border rounded-full px-2 py-1">
            {entry.company}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-text mb-1">{pick(entry.title, lang)}</h3>
        <div className="text-base text-muted mb-3">{pick(entry.location, lang)}</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {entry.tech.map((t) => (
            <span
              key={t}
              className="font-mono text-xs py-1 px-2 bg-bg border border-border rounded-full text-muted hover:border-accent transition-colors duration-150"
            >
              {t}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? collapseLabel : expandLabel}
          className="flex items-center gap-2 text-xs font-mono text-accent hover:text-text transition-colors duration-150 mt-1"
        >
          <ChevronIcon open={isOpen} />
          {isOpen ? collapseLabel : expandLabel}
        </button>
        {isOpen && (
          <ul className="mt-4 text-base text-muted leading-relaxed space-y-1 border-t border-border pt-4">
            {pick(entry.bullets, lang).map((b, j) => (
              <li key={j} className="relative pl-6">
                <span className="absolute left-0 text-accent">&#9656;</span>{b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function Experience() {
  const { lang } = useLanguage()
  const [openCards, setOpenCards] = useState({})
  const expandLabel = pick(data.expand, lang)
  const collapseLabel = pick(data.collapse, lang)

  function toggle(id) {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <section id="experience" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="font-mono text-xs uppercase tracking-[3px] text-accent flex items-center gap-3 mb-4">
          <span className="block w-10 h-0.5 bg-accent" /> {pick(data.label, lang)}
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-text mb-4 leading-tight">
          {pick(data.h2, lang)}
        </h2>
        <p className="text-muted max-w-[640px] mb-12 text-base">{pick(data.intro, lang)}</p>
        <div className="relative pl-8 mt-6">
          <span className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-accent opacity-30" aria-hidden="true" />
          {data.entries.map((entry) => (
            <TimelineCard
              key={entry.id}
              entry={entry}
              lang={lang}
              isOpen={!!openCards[entry.id]}
              onToggle={() => toggle(entry.id)}
              expandLabel={expandLabel}
              collapseLabel={collapseLabel}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
