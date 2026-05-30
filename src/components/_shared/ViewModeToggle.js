import React from 'react'
import { useViewMode } from '../../context/ViewModeContext'
import { useLanguage } from '../../i18n/LanguageContext'

export default function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode()
  const { t } = useLanguage()

  const base = 'px-3 py-1.5 rounded-full font-mono text-xs min-h-[44px] min-w-[44px] inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-safe:transition-colors duration-200'
  const active = 'bg-brand-gradient text-ink-900 font-extrabold'
  const inactive = 'text-text-secondary font-normal'

  // CR-02: role="group" describes a PURPOSE, not an action. Keep the group
  // aria-label stable across state — per-button aria-pressed + aria-label
  // (see modeGame/modeDev below, and the action-oriented "Switch to..."
  // copy on the buttons themselves) convey the action semantics.
  return (
    <div
      role="group"
      aria-label={t.nav.viewModeGroup}
      className="flex gap-0.5 bg-ink-500 border border-ink-400 rounded-full p-0.5"
    >
      <button
        type="button"
        onClick={() => setViewMode('game')}
        className={`${base} ${viewMode === 'game' ? active : inactive}`}
        aria-label={t.nav.modeGame}
        aria-pressed={viewMode === 'game'}
      >
        {t.nav.modeGame}
      </button>
      <button
        type="button"
        onClick={() => setViewMode('dev')}
        className={`${base} ${viewMode === 'dev' ? active : inactive}`}
        aria-label={t.nav.modeDev}
        aria-pressed={viewMode === 'dev'}
      >
        {t.nav.modeDev}
      </button>
    </div>
  )
}
