import React, { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function useCharReveal(target, startOffsetMs, perCharMs) {
  const [text, setText] = useState('')
  const timersRef = useRef([])

  useEffect(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setText('')

    if (typeof window === 'undefined') return undefined
    const reduceMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setText(target)
      return undefined
    }

    for (let i = 1; i <= target.length; i += 1) {
      const id = window.setTimeout(() => {
        setText(target.slice(0, i))
      }, startOffsetMs + i * perCharMs)
      timersRef.current.push(id)
    }

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [target, startOffsetMs, perCharMs])

  return text
}

function Stat({ num, label }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-extrabold leading-none bg-brand-gradient bg-clip-text text-transparent">
        {num}
      </div>
      <div className="mt-1 text-xs font-mono font-normal text-text-secondary uppercase tracking-widest">
        {label}
      </div>
    </div>
  )
}

export default function Hero() {
  const { t } = useLanguage()
  const displayText = useCharReveal(t.hero.h1b, 300, 40)
  const isComplete = displayText.length === t.hero.h1b.length

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center bg-hero-gradient pt-16 pb-16 overflow-hidden"
    >
      <img
        src="/me-1600.webp"
        srcSet="/me-800.webp 800w, /me-1600.webp 1600w"
        sizes="100vw"
        alt=""
        fetchpriority="high"
        decoding="async"
        className="absolute inset-0 z-0 w-full h-full object-cover"
        style={{ objectPosition: 'center 30%', filter: 'var(--hero-photo-filter)' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: 'var(--hero-overlay)' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 border border-ink-400 rounded-full font-mono text-xs text-text-secondary bg-ink-500 mb-6 motion-safe:opacity-0 motion-safe:animate-fade-in"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards', animationDuration: '500ms' }}
        >
          <span className="w-2 h-2 rounded-full bg-brand motion-safe:animate-pulse2 shadow-[0_0_12px_var(--color-brand)]" />
          {t.hero.status}
        </span>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-none mb-5"
          aria-label={`${t.hero.h1a} ${t.hero.h1b} ${t.hero.h1c}`}
          style={{ filter: 'drop-shadow(var(--hero-h1-shadow))' }}
        >
          <span
            className="block text-text-primary motion-safe:opacity-0 motion-safe:animate-slide-up"
            style={{ animationDelay: '150ms', animationFillMode: 'forwards', animationDuration: '600ms' }}
          >
            {t.hero.h1a}
          </span>
          <span
            className="block motion-safe:opacity-0 motion-safe:animate-fade-in"
            style={{ animationDelay: '300ms', animationFillMode: 'forwards', animationDuration: '500ms' }}
            aria-hidden="true"
          >
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              {displayText}
            </span>
            {!isComplete && (
              <span className="motion-safe:animate-pulse2 text-text-primary">|</span>
            )}
          </span>
          <span
            className="block text-text-primary motion-safe:opacity-0 motion-safe:animate-slide-up"
            style={{ animationDelay: '500ms', animationFillMode: 'forwards', animationDuration: '600ms' }}
          >
            {t.hero.h1c}
          </span>
        </h1>

        <p
          className="text-base sm:text-lg text-text-secondary max-w-2xl mb-9 leading-relaxed motion-safe:opacity-0 motion-safe:animate-slide-up"
          style={{ animationDelay: '650ms', animationFillMode: 'forwards', animationDuration: '600ms' }}
        >
          {t.hero.lead}
        </p>

        <div
          className="flex gap-3 flex-wrap motion-safe:opacity-0 motion-safe:animate-slide-up"
          style={{ animationDelay: '800ms', animationFillMode: 'forwards', animationDuration: '600ms' }}
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-full font-extrabold text-xs font-mono bg-brand-gradient text-ink-900 shadow-brand hover:shadow-brand-lg transform hover:-translate-y-0.5 transition-all"
          >
            {t.hero.cta1} →
          </a>
          <a
            href="/CV_Carlos_Montoya_EN.docx"
            download
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-3 rounded-full font-extrabold text-xs font-mono bg-transparent text-text-primary border border-ink-400 hover:border-brand hover:text-brand transition-colors"
          >
            Download CV (EN)
          </a>
          <a
            href="/CV_Carlos_Montoya_ES.docx"
            download
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-3 rounded-full font-extrabold text-xs font-mono bg-transparent text-text-primary border border-ink-400 hover:border-brand hover:text-brand transition-colors"
          >
            Descargar CV (ES)
          </a>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 p-7 bg-gradient-to-b from-ink-500 to-ink-700 border border-ink-400 rounded-xl motion-safe:opacity-0 motion-safe:animate-fade-in backdrop-blur-sm"
          style={{ animationDelay: '950ms', animationFillMode: 'forwards', animationDuration: '500ms' }}
        >
          <Stat num="18+" label={t.stats.years} />
          <Stat num="45+" label={t.stats.team} />
          <Stat num="15+" label={t.stats.companies} />
          <Stat num="8" label={t.stats.industries} />
        </div>
      </div>
    </section>
  )
}
