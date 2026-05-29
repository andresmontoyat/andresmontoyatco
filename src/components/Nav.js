import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'
import useActiveSection from '../hooks/useActiveSection'
import ThemeToggle from './_shared/ThemeToggle'
import ViewModeToggle from './_shared/ViewModeToggle'

// Single source of truth for primary navigation (Phase 9 review WR-07).
// SECTION_IDS (scroll-spy), DesktopNav and MobileMenu all derive from this list.
const NAV_ITEMS = [
  { id: 'about',       labelKey: 'about' },
  { id: 'skills',      labelKey: 'skills' },
  { id: 'experience',  labelKey: 'experience' },
  { id: 'projects',    labelKey: 'projects' },
  { id: 'claude-code', labelKey: 'claudeCode' },
  { id: 'contact',     labelKey: 'contact' },
]
const SECTION_IDS = NAV_ITEMS.map((item) => item.id)

export default function Nav() {
  const { lang, setLang, t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const activeSection = useActiveSection(SECTION_IDS)

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-900/70 border-b border-ink-600">
      <ProgressBar />
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Logomark />
        <DesktopNav t={t} activeSection={activeSection} />
        <div className="hidden md:flex items-center gap-2">
          <ViewModeToggle />
          <ThemeToggle />
          <LangPill lang={lang} setLang={setLang} />
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="md:hidden inline-flex items-center justify-center w-11 h-11 text-text-primary"
          aria-label={t.nav.menuOpen}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </div>
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        t={t}
        lang={lang}
        setLang={setLang}
        activeSection={activeSection}
      />
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

function DesktopNav({ t, activeSection }) {
  return (
    <nav className="hidden md:flex gap-7 text-xs font-mono">
      {NAV_ITEMS.map((item) => {
        const isActive = activeSection === item.id
        const cls = isActive
          ? 'text-brand font-normal border-b-2 border-brand pb-0.5 transition-colors duration-200'
          : 'text-text-secondary font-normal hover:text-brand transition-colors duration-200'
        return (
          <a key={item.id} href={`#${item.id}`} className={cls}>
            {t.nav[item.labelKey]}
          </a>
        )
      })}
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

function MobileMenu({ open, onClose, t, lang, setLang, activeSection }) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    document.body.style.overflow = open ? 'hidden' : ''
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  const overlay = (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] bg-ink-950/95 transition-opacity duration-200 md:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none invisible'}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-6 inline-flex items-center justify-center w-11 h-11 text-text-secondary hover:text-text-primary transition-colors"
        aria-label={t.nav.menuClose}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>
      <div className="h-full flex flex-col items-center justify-center gap-8 px-6">
        <div className="mb-10 flex items-center gap-2">
          <ViewModeToggle />
          <ThemeToggle />
          <LangPill lang={lang} setLang={setLang} />
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id
          const cls = isActive
            ? 'text-2xl font-extrabold text-brand border-b-2 border-brand pb-0.5'
            : 'text-2xl font-extrabold text-text-primary'
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={onClose}
              className={cls}
            >
              {t.nav[item.labelKey]}
            </a>
          )
        })}
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
