import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/about.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function Row({ fact, lang, last }) {
  const k = pick(fact.kLabel, lang)
  const v = pick(fact.value, lang)
  return (
    <li className={`flex justify-between gap-4 py-2 ${last ? '' : 'border-b border-border'}`}>
      <span className="text-muted">{k}</span>
      <span className="text-text font-extrabold text-right">{v}</span>
    </li>
  )
}

export default function About() {
  const { lang } = useLanguage()
  const facts = data.facts
  return (
    <section id="about" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="font-mono text-xs uppercase tracking-[3px] text-accent flex items-center gap-3 mb-4">
          <span className="block w-10 h-0.5 bg-accent" /> {pick(data.label, lang)}
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-text mb-4 leading-tight">
          {pick(data.h2, lang)}
        </h2>
        <div className="grid lg:grid-cols-5 gap-10 mt-6">
          <div className="lg:col-span-3 space-y-4 text-muted text-base leading-relaxed">
            {data.paragraphs.map((p, i) => (
              <p key={i}>{pick(p, lang)}</p>
            ))}
          </div>
          <aside className="lg:col-span-2 bg-surface border border-border rounded-xl p-7">
            <h3 className="text-base font-extrabold mb-4 flex items-center gap-2 text-text">
              <span className="text-accent">◆</span> {pick(data.quick, lang)}
            </h3>
            <ul className="text-base">
              {facts.map((f, i) => (
                <Row key={f.id} fact={f} lang={lang} last={i === facts.length - 1} />
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
