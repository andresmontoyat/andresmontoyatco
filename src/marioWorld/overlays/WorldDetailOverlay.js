import React, { useEffect, useRef } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.js'

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function FocusTrap({ children }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return undefined

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const focusable = node.querySelectorAll(FOCUSABLE_SELECTOR)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (!node.contains(active)) {
        event.preventDefault()
        first.focus()
        return
      }
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div ref={containerRef} className="contents">
      {children}
    </div>
  )
}

function NoContent() {
  return <p className="text-slate2-300">No content available</p>
}

function CompanyBody({ world, lang }) {
  if (!world.levels || world.levels.length === 0) {
    return (
      <>
        <h2 id="overlay-title" className="text-2xl font-bold text-neon">{world.label}</h2>
        <NoContent />
      </>
    )
  }
  return (
    <>
      <h2 id="overlay-title" className="text-2xl font-bold text-neon">{world.label}</h2>
      <div className="mt-4 space-y-6">
        {world.levels.map((level, i) => {
          const title = level.title && level.title[lang]
          const start = level.period && level.period.start
          const end = level.period && level.period.end != null ? level.period.end : 'Present'
          const loc = level.location && level.location[lang]
          const bullets = (level.bullets && level.bullets[lang]) || []
          const tech = level.tech || []
          return (
            <article key={i} className="border-t border-slate2-700 pt-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-slate2-300">
                {start}
                {' – '}
                {end}
                {loc ? ` · ${loc}` : ''}
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
              {tech.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tech.map((t) => (
                    <span key={t} className="rounded-full border border-slate2-700 bg-ink-800 px-2 py-0.5 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}

function SectionBody({ world, lang }) {
  const label = typeof world.label === 'string' ? world.label : (world.label && world.label[lang])
  const content = world.content && world.content[lang]
  const paragraphs = (content && content.paragraphs) || []
  return (
    <>
      <h2 id="overlay-title" className="text-2xl font-bold text-neon">{label}</h2>
      {paragraphs.length === 0 ? (
        <NoContent />
      ) : (
        <div className="mt-4 space-y-3">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
    </>
  )
}

function SecretBody({ world, lang }) {
  const label = typeof world.label === 'string' ? world.label : (world.label && world.label[lang])
  const content = world.content && (typeof world.content === 'string' ? world.content : world.content[lang])
  return (
    <>
      <h2 id="overlay-title" className="text-2xl font-bold text-neon">{label}</h2>
      {content ? <p className="mt-4">{content}</p> : <NoContent />}
    </>
  )
}

function pickBody(type) {
  if (type === 'company') return CompanyBody
  if (type === 'section') return SectionBody
  if (type === 'secret') return SecretBody
  return NoContent
}

export default function WorldDetailOverlay({ world, onClose }) {
  const { lang } = useLanguage()

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && typeof onClose === 'function') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const Body = pickBody(world && world.type)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        data-testid="overlay-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm"
      />
      <FocusTrap>
        <div className="relative z-10 max-h-[85vh] w-[min(720px,90vw)] overflow-y-auto rounded-2xl border border-slate2-700 bg-ink-900 p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-2xl text-slate2-300 hover:text-neon"
          >
            ✕
          </button>
          <Body world={world} lang={lang} />
        </div>
      </FocusTrap>
    </div>
  )
}
