import React, { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import useInView from '../hooks/useInView'
import SectionLabel from './_shared/SectionLabel'

const EMAIL = 'andresmontoyat@gmail.com'

export default function Contact() {
  const { t } = useLanguage()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.25 })

  return (
    <section id="contact" className="py-20">
      <div ref={sectionRef} className="max-w-6xl mx-auto px-6">
        <div className={`animate-on-scroll${inView ? ' is-visible' : ''}`}>
          <SectionLabel>{t.contact.label}</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3">{t.contact.h2}</h2>
          <p className="text-text-secondary max-w-2xl mb-10">{t.contact.intro}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          <EmailHeroCard
            t={t}
            inView={inView}
            className="sm:col-span-3"
            style={{ transitionDelay: '100ms' }}
          />
          <SecondaryCard
            href="tel:+573244422196"
            symbol="#"
            label={t.contact.phone}
            value="+57 324 442 2196"
            inView={inView}
            style={{ transitionDelay: '200ms' }}
          />
          <SecondaryCard
            href="https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033"
            symbol="in"
            label="LinkedIn"
            value="carlos-andres-montoya-tobon"
            external
            inView={inView}
            style={{ transitionDelay: '300ms' }}
          />
          <SecondaryCard
            href="https://github.com/andresmontoyat"
            symbol="gh"
            label="GitHub"
            value="andresmontoyat"
            external
            inView={inView}
            style={{ transitionDelay: '400ms' }}
          />
        </div>
      </div>
    </section>
  )
}

function EmailHeroCard({ t, inView, className = '', style }) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e) {
    e.preventDefault()
    if (!navigator.clipboard || !navigator.clipboard.writeText) return
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }

  return (
    <a
      href={`mailto:${EMAIL}`}
      className={`block bg-ink-500 border border-ink-400 rounded-xl p-6 hover:border-brand hover:-translate-y-1 transition-all duration-200 animate-on-scroll${inView ? ' is-visible' : ''} ${className}`}
      style={style}
    >
      <div className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">
        {t.contact.email}
      </div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-3xl sm:text-4xl font-extrabold text-text-primary break-all">
          {EMAIL}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy email to clipboard"
          className="flex-shrink-0 font-mono text-xs text-brand border border-brand/30 hover:border-brand rounded-full px-3 py-2 transition-colors duration-150 min-h-[44px] min-w-[80px] text-center"
        >
          <span aria-live="polite">
            {copied ? 'Copied!' : 'Copy email'}
          </span>
        </button>
      </div>
    </a>
  )
}

function SecondaryCard({ href, symbol, label, value, external, inView, style }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`block bg-ink-500 border border-ink-400 rounded-xl p-6 text-center hover:border-brand hover:-translate-y-1 transition-all duration-200 animate-on-scroll${inView ? ' is-visible' : ''}`}
      style={style}
    >
      <div className="font-mono text-3xl text-brand mb-3 font-extrabold">{symbol}</div>
      <div className="text-xs uppercase tracking-wider text-text-secondary mb-2">{label}</div>
      <div className="text-base font-extrabold text-text-primary break-all">{value}</div>
    </a>
  )
}
