import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/skills.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function Chip({ chip, suffix }) {
  return (
    <span className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5 text-sm">
      <span className="text-text">{chip.label}</span>
      <span className="text-xs text-muted font-mono">{chip.years}{suffix}</span>
    </span>
  )
}

function Category({ category, lang, suffix }) {
  return (
    <div className="bg-surface border border-border rounded-[14px] p-6">
      <h3 className="text-base font-extrabold mb-4 flex items-center gap-2 text-text">
        <span className="text-accent">{category.symbol}</span> {pick(category.title, lang)}
      </h3>
      <div className="flex flex-wrap gap-2">
        {category.chips.map((c) => <Chip key={c.label} chip={c} suffix={suffix} />)}
      </div>
    </div>
  )
}

export default function Skill() {
  const { lang } = useLanguage()
  const suffix = pick(data.yearsSuffix, lang)
  return (
    <section id="skills" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="font-mono text-xs uppercase tracking-[3px] text-accent flex items-center gap-3 mb-4">
          <span className="block w-10 h-0.5 bg-accent" /> {pick(data.label, lang)}
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-text mb-4 leading-tight">
          {pick(data.h2, lang)}
        </h2>
        <p className="text-muted max-w-[640px] mb-12 text-base">{pick(data.intro, lang)}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.categories.map((c) => <Category key={c.id} category={c} lang={lang} suffix={suffix} />)}
        </div>
      </div>
    </section>
  )
}
