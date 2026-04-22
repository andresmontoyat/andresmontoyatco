import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function SectionLabel({ children }) {
  return (
    <div className="font-mono text-xs text-brand uppercase tracking-[3px] font-semibold flex items-center gap-3 mb-4">
      <span className="w-10 h-0.5 bg-brand block"></span>
      {children}
    </div>
  )
}

export default function About() {
  const { t } = useLanguage()
  return (
    <section id="about" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <SectionLabel>{t.about.label}</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-text-primary">{t.about.h2}</h2>
        <div className="grid lg:grid-cols-5 gap-10 mt-10">
          <div className="lg:col-span-3 space-y-4 text-text-secondary text-base leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t.about.p1 }} />
            <p dangerouslySetInnerHTML={{ __html: t.about.p2 }} />
            <p dangerouslySetInnerHTML={{ __html: t.about.p3 }} />
          </div>
          <aside className="lg:col-span-2 bg-ink-500 border border-ink-400 rounded-xl p-7">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2.5 text-text-primary">
              <span className="text-brand">◆</span> {t.about.quick}
            </h3>
            <ul className="text-sm">
              <Row k={t.about.loc}  v="Medellín, CO" />
              <Row k={t.about.role} v={t.about.roleV} />
              <Row k={t.about.exp}  v={t.about.expV} />
              <Row k={t.about.lang} v={t.about.langV} />
              <Row k={t.about.work} v={t.about.workV} last />
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}

function Row({ k, v, last }) {
  return (
    <li className={`flex justify-between gap-4 py-2.5 ${last ? '' : 'border-b border-ink-400'}`}>
      <span className="text-text-secondary">{k}</span>
      <span className="text-text-primary font-medium text-right">{v}</span>
    </li>
  )
}
