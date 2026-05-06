import React, { useRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import useInView from '../hooks/useInView'
import SectionLabel from './_shared/SectionLabel'

export default function About() {
  const { t } = useLanguage()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.25 })

  return (
    <section id="about" className="py-20">
      <div ref={sectionRef} className="max-w-6xl mx-auto px-6">
        <div className={`animate-on-scroll${inView ? ' is-visible' : ''}`}>
          <SectionLabel>{t.about.label}</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-text-primary">{t.about.h2}</h2>
        </div>
        <div className="grid lg:grid-cols-5 gap-10 mt-10">
          <div
            className={`animate-on-scroll${inView ? ' is-visible' : ''} lg:col-span-3 space-y-4 text-text-secondary text-base leading-relaxed`}
            style={{ transitionDelay: '100ms' }}
          >
            <p dangerouslySetInnerHTML={{ __html: t.about.p1 }} />
            <p dangerouslySetInnerHTML={{ __html: t.about.p2 }} />
            <p dangerouslySetInnerHTML={{ __html: t.about.p3 }} />
          </div>
          <aside
            className={`animate-on-scroll${inView ? ' is-visible' : ''} lg:col-span-2 bg-ink-500 border border-ink-400 rounded-xl p-7`}
            style={{ transitionDelay: '200ms' }}
          >
            <h3 className="text-base font-extrabold mb-4 flex items-center gap-2 text-text-primary">
              <span className="text-brand">◆</span> {t.about.quick}
            </h3>
            <ul className="text-base">
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
    <li className={`flex justify-between gap-4 py-2 ${last ? '' : 'border-b border-ink-400'}`}>
      <span className="text-text-secondary">{k}</span>
      <span className="text-text-primary font-extrabold text-right">{v}</span>
    </li>
  )
}
