import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/contact.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function Card({ card, lang }) {
  const k = pick(card.kLabel, lang)
  const v = card.value
  const classes =
    'block bg-surface border border-border rounded-[14px] p-6 text-center '
    + 'transition-all duration-300 hover:border-accent hover:-translate-y-1 '
    + 'hover:shadow-[0_20px_30px_-20px_rgba(0,229,168,0.3)]'
  const inner = (
    <>
      <div className="text-3xl mb-3 text-accent" aria-hidden="true">{card.icon}</div>
      <div className="text-xs uppercase tracking-widest text-muted mb-1.5">{k}</div>
      <div className="text-sm font-semibold text-text break-all">{v}</div>
    </>
  )
  if (!card.href) {
    return (
      <div className={classes} aria-label={`${k}: ${v}`}>
        {inner}
      </div>
    )
  }
  return (
    <a
      href={card.href}
      title={k}
      {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={classes}
    >
      {inner}
    </a>
  )
}

export default function Contact() {
  const { lang } = useLanguage()
  return (
    <section id="contact" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="font-mono text-xs uppercase tracking-[3px] text-accent flex items-center gap-3 mb-4">
          <span className="block w-10 h-0.5 bg-accent" /> {pick(data.label, lang)}
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-text mb-4 leading-tight">
          {pick(data.h2, lang)}
        </h2>
        <p className="text-muted max-w-[640px] mb-12 text-base">{pick(data.intro, lang)}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {data.cards.map((c) => <Card key={c.id} card={c} lang={lang} />)}
        </div>
      </div>
    </section>
  )
}
