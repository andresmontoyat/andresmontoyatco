import React, { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import data from '../data/about.json'

function pick(field, lang) {
  if (typeof field === 'string') return field
  return field?.[lang] ?? field?.en ?? ''
}

function reduceMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useCountUp(target, ms = 900) {
  const [n, setN] = useState(target)
  useEffect(() => {
    if (!target || reduceMotion() || typeof requestAnimationFrame === 'undefined') {
      setN(target)
      return undefined
    }
    let raf
    let startTs = null
    function tick(ts) {
      if (startTs === null) startTs = ts
      const p = Math.min(1, (ts - startTs) / ms)
      setN(Math.round(target * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    setN(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return n
}

function AnimatedValue({ text }) {
  const match = text.match(/\d+/)
  const target = match ? Number(match[0]) : 0
  const n = useCountUp(target)
  return match ? text.replace(/\d+/, String(n)) : text
}

function Row({ fact, lang, last }) {
  const k = pick(fact.kLabel, lang)
  const v = pick(fact.value, lang)
  return (
    <li
      className={`group relative -mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-all duration-200 hover:bg-accent/[0.07] motion-safe:hover:translate-x-0.5 ${last ? '' : 'border-b border-border hover:border-transparent'}`}
    >
      <span className="flex items-center gap-2.5 text-muted transition-colors duration-200 group-hover:text-text">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/40 transition-all duration-200 group-hover:scale-150 group-hover:bg-accent group-hover:shadow-[0_0_6px_var(--accent)]" />
        {k}
      </span>
      <span className="text-right font-extrabold text-text transition-colors duration-200 group-hover:text-accent">
        <AnimatedValue text={v} />
      </span>
    </li>
  )
}

export default function About() {
  const { lang } = useLanguage()
  const { facts } = data
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
          <aside className="lg:col-span-2 bg-surface border border-border rounded-xl p-7 transition-colors duration-200 hover:border-accent/40">
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
