import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/contact.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function linkProps(card, label) {
  return {
    href: card.href,
    'aria-label': `${label}: ${card.value}`,
    ...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  }
}

function HeroContact({ card, lang }) {
  const label = pick(card.kLabel, lang)
  return (
    <a
      {...linkProps(card, label)}
      data-role="primary"
      className="group flex flex-col gap-6 md:self-start bg-surface border border-accent/40 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent shadow-[0_0_30px_rgba(0,229,168,0.10)] hover:shadow-[0_0_45px_rgba(0,229,168,0.20)]"
    >
      <div className="text-5xl text-accent" aria-hidden="true">{card.icon}</div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted mb-2">{label}</div>
        <div className="text-2xl sm:text-3xl font-extrabold text-text break-all leading-tight">{card.value}</div>
      </div>
      <span className="inline-flex items-center gap-2 text-accent text-sm font-mono transition-transform duration-300 group-hover:translate-x-1">
        {lang === 'es' ? 'Escríbeme' : 'Reach out'} →
      </span>
    </a>
  )
}

function RailItem({ card, lang }) {
  const label = pick(card.kLabel, lang)
  return (
    <a
      {...linkProps(card, label)}
      data-role="rail"
      className="group flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent"
    >
      <span className="text-xl text-accent shrink-0 w-6 text-center" aria-hidden="true">{card.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-widest text-muted">{label}</div>
        <div className="text-sm font-semibold text-text truncate">{card.value}</div>
      </div>
      <span className="text-muted shrink-0 transition-all duration-200 group-hover:text-accent group-hover:translate-x-0.5">→</span>
    </a>
  )
}

export default function Contact() {
  const { lang } = useLanguage()
  const hero = data.cards.find((c) => c.primary)
  const rail = data.cards.filter((c) => !c.primary)
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HeroContact card={hero} lang={lang} />
          <div className="flex flex-col gap-3">
            {rail.map((c) => <RailItem key={c.id} card={c} lang={lang} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
