import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Module-level focusable-query helper. Re-queries on every keydown so the
// trap stays correct when chip lists render/re-render conditionally (Pitfall 3).
function getFocusable(container) {
  if (!container) return []
  return container.querySelectorAll(
    'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  )
}

export default function ExperienceCard({
  selectedNode,
  jobs,
  selectedSkills,
  lang,
  t,
  onClose,
  onToggleSkill,
  position = null,
}) {
  const cardRef = useRef(null)
  const headingRef = useRef(null)

  // Viewport-based desktop detection — the RED test mocks matchMedia to
  // return `false` for non-reduced-motion queries, so rely on innerWidth
  // (which the test seeds via setViewport(width)) rather than matchMedia.
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
  const desktopStyle = isDesktop && position
    ? { left: `${position.x + 24}px`, top: `${position.y - 60}px` }
    : undefined

  // Effect 1 — body-overflow lock (mirrors Nav.js MobileMenu lines 168-179)
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Effect 2 — initial focus + Esc close + Tab focus trap (RESEARCH §3)
  useEffect(() => {
    headingRef.current?.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable(cardRef.current)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Effect 3 — click-outside close (Pitfall 2: defer one frame so the opening click doesn't immediately close)
  useEffect(() => {
    let registered = false

    function onMouseDown(e) {
      if (!e.target.closest('[data-game-interactive]')) onClose()
    }

    const rafId = requestAnimationFrame(() => {
      document.addEventListener('mousedown', onMouseDown)
      registered = true
    })

    return () => {
      cancelAnimationFrame(rafId)
      if (registered) document.removeEventListener('mousedown', onMouseDown)
    }
  }, [onClose])

  if (typeof document === 'undefined') return null

  const dialog = (
    <>
      <div
        className="fixed inset-0 z-[199] bg-card-overlay motion-safe:transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-skill-heading"
        data-game-interactive
        style={desktopStyle}
        className="fixed bottom-0 left-0 right-0 z-[200] bg-card-bg rounded-t-2xl max-h-[75vh]
                   md:bottom-auto md:left-auto md:right-auto md:max-w-[360px] md:rounded-xl
                   flex flex-col motion-safe:animate-card-slide-up md:motion-safe:animate-card-fade-in"
      >
        <div
          className="md:hidden h-1 w-8 bg-chip-outlineBorder rounded-full mx-auto mt-3 mb-2"
          aria-hidden="true"
        />
        <div key={selectedNode.id} className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-card-border">
            <h2
              id="card-skill-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-bold text-text-primary focus:outline-none"
            >
              {selectedNode.label}
              <span className="ml-2 text-xs font-mono text-text-secondary">
                {jobs.length === 1
                  ? t.game.cardJobsCountSingular
                  : t.game.cardJobsCount.replace('{n}', String(jobs.length))}
              </span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.game.cardClose}
              className="inline-flex items-center justify-center w-11 h-11 text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-safe:transition-colors duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </header>

          {jobs.length === 0 ? (
            <p
              role="status"
              className="text-text-secondary text-sm px-4 py-8 text-center"
            >
              {t.game.filterEmpty}
            </p>
          ) : (
            <ol
              className="overflow-y-auto px-4 pb-4 pt-3 space-y-4"
              aria-label={t.game.cardJobsListLabel.replace('{skill}', selectedNode.label)}
            >
              {jobs.map((job, i) => (
                <li key={`${job.company}-${i}`}>
                  <article>
                    <div className="flex justify-between items-baseline gap-4 flex-wrap mb-1">
                      <span className="font-mono text-xs text-brand">{job.date[lang]}</span>
                      <span className="font-mono text-xs text-text-muted bg-ink-700 border border-ink-400 rounded-full px-2 py-1">
                        {job.company}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {job.title[lang]}
                    </h3>
                    <div className="text-xs font-mono text-text-secondary mb-3">
                      {job.location[lang]}
                    </div>
                    <ul className="text-sm text-text-secondary leading-relaxed space-y-1 mb-3">
                      {job.bullets[lang].map((b, j) => (
                        <li key={j} className="relative pl-6">
                          <span className="absolute left-0 text-brand">&#9656;</span>{b}
                        </li>
                      ))}
                    </ul>
                    <div
                      role="group"
                      aria-label={t.game.techChipsLabel}
                      className="flex flex-wrap gap-2"
                    >
                      {job.tech.map((tech) => {
                        const isActive = selectedSkills.includes(tech)
                        const isLocked = tech === selectedNode.id
                        return (
                          <button
                            key={tech}
                            type="button"
                            onClick={isLocked ? undefined : () => onToggleSkill(tech)}
                            aria-pressed={isActive}
                            aria-disabled={isLocked}
                            className={`px-3 py-1 rounded-full font-mono text-xs min-h-[44px] inline-flex items-center
                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
                                        ${isActive
                              ? 'bg-chip-activeBg text-chip-activeText'
                              : 'bg-ink-700 border border-ink-400 text-text-secondary'}
                                        ${isLocked
                              ? 'opacity-75 cursor-default'
                              : 'motion-safe:transition-colors duration-150 hover:border-brand'}`}
                          >
                            {tech}
                          </button>
                        )
                      })}
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          )}

          <footer className="px-4 py-3 border-t border-card-border">
            <a
              href={`/CV_Carlos_Montoya_${lang === 'en' ? 'EN' : 'ES'}.docx`}
              download
              aria-label={t.game.cvCtaLabel}
              className="w-full h-11 rounded-lg bg-cvCta-bg text-cvCta-text text-sm font-semibold
                         flex items-center justify-center hover:bg-cvCta-hoverBg
                         motion-safe:transition-colors duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {t.game.cvCtaLabel}
            </a>
          </footer>
        </div>
      </div>
    </>
  )

  return createPortal(dialog, document.body)
}
