import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'

const social = [
  { name: 'GitHub', href: 'https://github.com/andresmontoyat', label: 'gh' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033/', label: 'in' },
]

export default function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-ink-400 py-10 mt-10">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="font-mono font-extrabold text-xs mb-3">
          <a
            href="#hero"
            className="inline-block text-text-primary hover:text-brand transition-colors duration-200 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
          >
            &lt;<span className="text-brand">/</span>camt&gt;
          </a>
        </div>
        <p className="text-text-secondary text-base mb-6">{t.footer.tagline}</p>
        <div className="flex justify-center gap-4 mb-6">
          {social.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              title={s.name}
              aria-label={s.name}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-ink-400 text-text-secondary text-sm font-mono uppercase transition-all duration-200 hover:text-brand hover:border-brand hover:shadow-brand motion-safe:hover:-translate-y-1 hover:scale-105"
            >
              {s.label}
            </a>
          ))}
        </div>
        <div className="text-text-muted text-xs">
          © {year} Carlos Andrés Montoya Tobón · {t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
