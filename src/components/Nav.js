import React, { useEffect, useRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

export default function Nav() {
  const { lang, setLang, t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-900/70 border-b border-ink-600">
      <ProgressBar />
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Logomark />
        <DesktopNav t={t} />
        <div className="hidden md:flex">
          <LangPill lang={lang} setLang={setLang} />
        </div>
      </div>
    </header>
  )
}

function Logomark() {
  return (
    <a
      href="#hero"
      className="font-mono text-xs tracking-tight text-text-primary"
    >
      &lt;<span className="text-brand">/</span>cam&gt;
    </a>
  )
}

function DesktopNav({ t }) {
  const links = [
    { href: '#about', label: t.nav.about },
    { href: '#skills', label: t.nav.skills },
    { href: '#experience', label: t.nav.experience },
    { href: '#contact', label: t.nav.contact },
  ]
  return (
    <nav className="hidden md:flex gap-7 text-xs font-mono">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="text-text-secondary font-normal hover:text-brand transition-colors duration-200"
        >
          {l.label}
        </a>
      ))}
    </nav>
  )
}

function LangPill({ lang, setLang }) {
  const base = 'px-3 py-1.5 rounded-full transition-colors duration-150 font-mono text-xs'
  const active = 'bg-brand-gradient text-ink-900 font-extrabold'
  const inactive = 'text-text-secondary font-normal'
  return (
    <div className="flex gap-0.5 bg-ink-500 border border-ink-400 rounded-full p-0.5">
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`${base} ${lang === 'en' ? active : inactive}`}
        aria-label="English"
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('es')}
        className={`${base} ${lang === 'es' ? active : inactive}`}
        aria-label="Español"
        aria-pressed={lang === 'es'}
      >
        ES
      </button>
    </div>
  )
}

function ProgressBar() {
  const ref = useRef(null)

  useEffect(() => {
    let ticking = false
    function update() {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0
      if (ref.current) ref.current.style.width = `${pct}%`
      ticking = false
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update)
        ticking = true
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[200] h-[3px] bg-transparent pointer-events-none"
    >
      <div
        ref={ref}
        className="h-full bg-brand"
        style={{ width: '0%' }}
      />
    </div>
  )
}
