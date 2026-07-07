import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/skills.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function maxYears() {
  return Math.max(...data.categories.flatMap((c) => c.chips).map((ch) => ch.years))
}

function MeterRow({ chip, suffix, max }) {
  const fill = Math.max(8, Math.round((chip.years / max) * 100))
  return (
    <div
      data-core={chip.core ? 'true' : 'false'}
      className="group -mx-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-accent/[0.06]"
    >
      <div className="flex items-baseline justify-between mb-1.5 gap-3">
        <span className={`text-sm transition-colors duration-200 ${chip.core ? 'font-bold text-accent' : 'text-text/80 group-hover:text-text'}`}>{chip.label}</span>
        <span className="font-mono text-[11px] text-muted shrink-0 transition-colors duration-200 group-hover:text-accent">{chip.years}{suffix}</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${chip.core ? 'bg-gradient-to-r from-accent to-secondary shadow-[0_0_8px_rgba(0,229,168,0.55)]' : 'bg-accent/55 group-hover:bg-accent group-hover:shadow-[0_0_8px_rgba(0,229,168,0.45)]'}`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  )
}

function Category({ category, lang, suffix, max }) {
  return (
    <div className="group/card bg-surface/40 border border-border rounded-[16px] p-6 transition-colors duration-200 hover:border-accent/40">
      <h3 className="text-base font-extrabold mb-4 flex items-center gap-2 text-text">
        <span className="text-accent transition-transform duration-200 group-hover/card:scale-125">{category.symbol}</span> {pick(category.title, lang)}
      </h3>
      <div className="flex flex-col gap-1">
        {category.chips.map((c) => <MeterRow key={c.label} chip={c} suffix={suffix} max={max} />)}
      </div>
    </div>
  )
}

export default function Skill() {
  const { lang } = useLanguage()
  const suffix = pick(data.yearsSuffix, lang)
  const max = maxYears()
  return (
    <section id="skills" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="font-pixel text-[10px] uppercase tracking-[1px] text-accent flex items-center gap-3 mb-4">
          <span className="block w-10 h-0.5 bg-accent" /> {pick(data.label, lang)}
        </div>
        <h2 className="font-pixel text-lg sm:text-xl md:text-2xl font-extrabold tracking-normal text-text mb-4 leading-tight">
          {pick(data.h2, lang)}
        </h2>
        <p className="text-muted max-w-[640px] mb-12 text-base">{pick(data.intro, lang)}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {data.categories.map((c) => <Category key={c.id} category={c} lang={lang} suffix={suffix} max={max} />)}
        </div>
      </div>
    </section>
  )
}
