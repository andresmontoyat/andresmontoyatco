import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/skills.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function CoreTile({ chip, suffix }) {
  return (
    <div
      data-core="true"
      className="col-span-2 group flex flex-col justify-between gap-3 bg-surface border border-accent/40 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent shadow-[0_0_30px_rgba(0,229,168,0.10)] hover:shadow-[0_0_40px_rgba(0,229,168,0.18)]"
    >
      <span className="text-lg font-extrabold text-text tracking-tight">{chip.label}</span>
      <span className="text-xs font-mono text-accent">{chip.years}{suffix}</span>
    </div>
  )
}

function SmallTile({ chip, suffix }) {
  return (
    <div
      data-core="false"
      className="flex items-center justify-between gap-2 bg-surface border border-border rounded-xl px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50"
    >
      <span className="text-sm text-text truncate">{chip.label}</span>
      <span className="text-xs font-mono text-muted shrink-0">{chip.years}{suffix}</span>
    </div>
  )
}

function Tile({ chip, suffix }) {
  return chip.core
    ? <CoreTile chip={chip} suffix={suffix} />
    : <SmallTile chip={chip} suffix={suffix} />
}

function Category({ category, lang, suffix }) {
  return (
    <div className="bg-surface/40 border border-border rounded-[16px] p-5">
      <h3 className="text-base font-extrabold mb-4 flex items-center gap-2 text-text">
        <span className="text-accent">{category.symbol}</span> {pick(category.title, lang)}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 auto-rows-fr">
        {category.chips.map((c) => <Tile key={c.label} chip={c} suffix={suffix} />)}
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
