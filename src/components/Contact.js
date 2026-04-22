import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function SectionLabel({ children }) {
  return (
    <div className="font-mono text-xs text-neon uppercase tracking-[3px] font-semibold flex items-center gap-3 mb-4">
      <span className="w-10 h-0.5 bg-neon block"></span>
      {children}
    </div>
  )
}

export default function Contact() {
  const { t } = useLanguage()
  return (
    <section id="contact" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <SectionLabel>{t.contact.label}</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate2-100 mb-3">{t.contact.h2}</h2>
        <p className="text-slate2-400 max-w-2xl mb-10">{t.contact.intro}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-10">
          <Card href="mailto:andresmontoyat@gmail.com" symbol="@" k={t.contact.email} v="andresmontoyat@gmail.com" />
          <Card href="tel:+573244422196" symbol="#" k={t.contact.phone} v="+57 324 442 2196" />
          <Card
            href="https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033"
            symbol="in"
            k="LinkedIn"
            v="carlos-andres-montoya-tobon"
            external
          />
          <Card href="#" symbol="~" k={t.contact.loc} v="Medellín, Colombia" />
        </div>
      </div>
    </section>
  )
}

function Card({ href, symbol, k, v, external }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="block bg-ink-500 border border-ink-400 rounded-xl p-6 text-center transition-all hover:border-neon hover:-translate-y-1"
    >
      <div className="text-2xl text-neon mb-3 font-mono font-bold">
        {symbol}
      </div>
      <div className="text-xs uppercase tracking-wider text-slate2-400 mb-1.5">{k}</div>
      <div className="text-sm font-semibold text-slate2-100 break-all">{v}</div>
    </a>
  )
}
