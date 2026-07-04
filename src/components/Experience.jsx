import React, { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/experience.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function isActiveRole(dateField) {
  const en = typeof dateField === 'string' ? dateField : dateField?.en ?? ''
  return /present/i.test(en)
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

function ActiveBadge({ lang }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[2px] text-accent">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
      {lang === 'es' ? 'En curso' : 'Active'}
    </span>
  )
}

function HeroMetric({ metric, lang }) {
  if (!metric) return null
  const label = pick(metric.label, lang)
  return (
    <div className="mb-5 flex items-baseline gap-3">
      {metric.value && (
        <span className="text-4xl sm:text-5xl font-extrabold leading-none text-accent">{metric.value}</span>
      )}
      <span className="font-mono text-xs uppercase tracking-[2px] text-muted">{label}</span>
    </div>
  )
}

function TechChips({ tech }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {tech.map((t) => (
        <span
          key={t}
          className="font-mono text-[11px] py-1 px-2.5 bg-bg border border-border rounded-full text-muted hover:border-accent hover:text-accent transition-colors duration-150"
        >
          {t}
        </span>
      ))}
    </div>
  )
}

function ToggleButton({ isOpen, onToggle, expandLabel, collapseLabel }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? collapseLabel : expandLabel}
      className="flex items-center gap-2 text-xs font-mono text-accent hover:text-text transition-colors duration-150"
    >
      <ChevronIcon open={isOpen} />
      {isOpen ? collapseLabel : expandLabel}
    </button>
  )
}

function Bullets({ entry, lang }) {
  return (
    <ul className="mt-5 text-base text-text/85 leading-relaxed space-y-2.5 border-t border-border pt-5">
      {pick(entry.bullets, lang).map((b, j) => (
        <li key={j} className="relative pl-6">
          <span className="absolute left-0 top-[2px] text-accent font-bold">→</span>{b}
        </li>
      ))}
    </ul>
  )
}

function FeaturedCard({ entry, lang, isOpen, onToggle, expandLabel, collapseLabel }) {
  const active = isActiveRole(entry.date)

  return (
    <div className="relative pb-9 group" data-variant="featured">
      <span
        aria-hidden="true"
        className={`absolute -left-[32px] top-[8px] w-3 h-3 rounded-full ${active ? 'bg-accent' : 'bg-accent/80 group-hover:bg-accent'} shadow-[0_0_0_3px_var(--bg),0_0_12px_2px_var(--accent)] transition-colors duration-200`}
      />
      <span
        aria-hidden="true"
        className="absolute -left-[36px] top-[4px] w-5 h-5 rounded-full bg-accent/25 motion-safe:animate-ping"
      />
      <div className="relative overflow-hidden rounded-xl border border-accent/40 bg-surface p-7 shadow-[0_8px_30px_-12px_var(--accent)] hover:border-accent hover:-translate-y-0.5 transition-all duration-200">
        <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent to-secondary" />
        <div className="flex justify-between items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-accent">{pick(entry.date, lang)}</span>
            {active && <ActiveBadge lang={lang} />}
          </div>
          <span className="font-mono text-xs text-muted bg-bg border border-border rounded-full px-3 py-1">
            {entry.company}
          </span>
        </div>
        <HeroMetric metric={entry.metric} lang={lang} />
        <h3 className="text-lg sm:text-xl font-extrabold text-text mb-1 leading-tight">
          {pick(entry.title, lang)}
        </h3>
        <div className="text-sm text-muted mb-4">{pick(entry.location, lang)}</div>
        <TechChips tech={entry.tech} />
        <ToggleButton isOpen={isOpen} onToggle={onToggle} expandLabel={expandLabel} collapseLabel={collapseLabel} />
        {isOpen && <Bullets entry={entry} lang={lang} />}
      </div>
    </div>
  )
}

function CompactRow({ entry, lang, isOpen, onToggle, expandLabel, collapseLabel }) {
  const active = isActiveRole(entry.date)

  return (
    <div className="relative pb-5 group" data-variant="compact">
      <span
        aria-hidden="true"
        className={`absolute -left-[27px] top-[9px] w-2 h-2 rounded-full ${active ? 'bg-accent' : 'bg-accent/60 group-hover:bg-accent'} shadow-[0_0_0_3px_var(--bg)] transition-colors duration-200`}
      />
      <div className="border-b border-border/60 pb-4 hover:border-accent/40 transition-colors duration-200">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? collapseLabel : expandLabel}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="font-mono text-xs text-accent shrink-0">{pick(entry.date, lang)}</span>
          <span className="text-sm sm:text-base font-bold text-text leading-tight">{pick(entry.title, lang)}</span>
          <span className="hidden sm:inline font-mono text-xs text-muted">· {entry.company}</span>
          <span className="ml-auto shrink-0 text-accent">
            <ChevronIcon open={isOpen} />
          </span>
        </button>
        <div className="mt-0.5 sm:hidden font-mono text-xs text-muted">{entry.company}</div>
        {isOpen && (
          <>
            <div className="mt-3 text-sm text-muted">{pick(entry.location, lang)}</div>
            <TechChips tech={entry.tech} />
            <Bullets entry={entry} lang={lang} />
          </>
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
          <span
            aria-hidden="true"
            className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-accent/50 via-accent/30 to-transparent"
          />
          {data.entries
            .filter((entry) => entry.visible !== false)
            .map((entry) => {
              const Card = entry.featured ? FeaturedCard : CompactRow
              return (
                <Card
                  key={entry.id}
                  entry={entry}
                  lang={lang}
                  isOpen={!!openCards[entry.id]}
                  onToggle={() => toggle(entry.id)}
                  expandLabel={expandLabel}
                  collapseLabel={collapseLabel}
                />
              )
            })}
        </div>
      </div>
    </section>
  )
}
