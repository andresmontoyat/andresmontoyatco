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

function CvMenuItem({ href, label, onSelect }) {
  return (
    <a
      role="menuitem"
      href={href}
      download
      onClick={onSelect}
      className="block px-4 py-2 rounded-lg text-xs font-mono text-text-secondary hover:bg-ink-500 hover:text-brand transition-colors"
    >
      {label}
    </a>
  )
}

function CvDownload({ t }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 min-h-[44px] px-4 py-3 rounded-full font-extrabold text-xs font-mono bg-transparent text-text-primary border border-ink-400 hover:border-brand hover:text-brand transition-colors"
      >
        <span aria-hidden="true">⬇</span> {t.hero.cv}
        <span aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 mt-2 min-w-[160px] rounded-xl border border-ink-400 bg-ink-900/95 backdrop-blur-md p-1 z-50 shadow-brand-lg"
        >
          <CvMenuItem href="/CarlosMontoya_CV_EN.pdf" label={t.hero.cvEn} onSelect={() => setOpen(false)} />
          <CvMenuItem href="/CarlosMontoya_CV_ES.pdf" label={t.hero.cvEs} onSelect={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

export default function Hero() {
  const { lang, t } = useLanguage()
  const displayText = useCharReveal(t.hero.h1b, 300, 40)
  const isComplete = displayText.length === t.hero.h1b.length
  const liAria = lang === 'es' ? 'Perfil de LinkedIn' : 'LinkedIn profile'
  const ghAria = lang === 'es' ? 'Perfil de GitHub' : 'GitHub profile'

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center pt-16 pb-16 overflow-hidden"
    >
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <img
          src="/me-800.webp"
          srcSet="/me-400.webp 400w, /me-800.webp 800w, /me-1600.webp 1600w"
          sizes="100vw"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 30%', filter: 'var(--hero-photo-filter)' }}
        />
        <div className="absolute inset-0" style={{ background: 'var(--hero-overlay)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 border border-ink-400 rounded-full font-mono text-xs text-text-secondary bg-ink-500 mb-6 motion-safe:opacity-0 motion-safe:animate-fade-in"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards', animationDuration: '500ms' }}
        >
          <span className="w-2 h-2 rounded-full bg-brand motion-safe:animate-pulse2 shadow-[0_0_12px_var(--color-brand)]" />
          {t.hero.status}
        </span>

        <h1
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[0.95] mb-5"
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
          style={{ animationDelay: '600ms', animationFillMode: 'forwards', animationDuration: '600ms' }}
        >
          {t.hero.lead}
        </p>

        <div
          className="relative z-30 flex items-center gap-3 flex-wrap motion-safe:opacity-0 motion-safe:animate-slide-up"
          style={{ animationDelay: '800ms', animationFillMode: 'forwards', animationDuration: '600ms' }}
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-full font-extrabold text-xs font-mono bg-brand-gradient text-ink-900 shadow-brand hover:shadow-brand-lg transform hover:-translate-y-0.5 transition-all"
          >
            {t.hero.cta1} →
          </a>
          <CvDownload t={t} />
          <div className="flex items-center gap-2 ml-1">
            <a
              href="https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={liAria}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-ink-400 text-text-secondary hover:border-brand hover:text-brand transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://github.com/andresmontoyat"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ghAria}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-ink-400 text-text-secondary hover:border-brand hover:text-brand transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 p-7 bg-gradient-to-b from-ink-500 to-ink-700 border border-ink-400 rounded-xl motion-safe:opacity-0 motion-safe:animate-fade-in backdrop-blur-sm shadow-brand"
          style={{ animationDelay: '850ms', animationFillMode: 'forwards', animationDuration: '500ms' }}
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
