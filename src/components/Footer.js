import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'

const social = [
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033/', label: 'in' },
  { name: 'GitHub', href: 'https://github.com/andresmontoyat', label: 'gh' },
  { name: 'Docker', href: 'https://hub.docker.com/u/codehunters', label: 'dk' },
  { name: 'YouTube', href: 'https://www.youtube.com/user/andresmontoyat', label: 'yt' },
]

export default function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-ink-400 py-10 mt-10">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="font-mono font-semibold text-sm text-text-primary mb-3">
          &lt;<span className="text-brand">/</span>cam&gt;
        </div>
        <p className="text-text-secondary text-sm mb-5">{t.footer.tagline}</p>
        <div className="flex justify-center gap-5 mb-5">
          {social.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              title={s.name}
              className="text-text-secondary hover:text-brand transition-colors text-lg font-mono uppercase"
            >
              {s.label}
            </a>
          ))}
        </div>
        <div className="text-text-secondary text-xs">
          © {year} Carlos Andrés Montoya Tobón · {t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
