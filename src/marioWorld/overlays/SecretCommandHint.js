// src/marioWorld/overlays/SecretCommandHint.js
//
// Phase 24 Task 24.4 — discreet bottom-right hint that telegraphs the
// existence of secret commands without spoiling them. Closed-by-default
// pulsing underscore button; click toggles a small panel that renders
// the bilingual `t.world.secretHint` string. Pure UI; no command handling
// (that lives in useSecretCommand at WorldMap level).

import React, { useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.js'

export default function SecretCommandHint() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  const label = t?.world?.secretHint ?? 'Try typing a command…'
  return (
    <div className="fixed bottom-4 right-4 z-30 font-mono text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={label}
        className="text-slate2-500 hover:text-slate2-100 focus:outline-none focus:ring-2 focus:ring-neon"
      >
        <span className="animate-pulse">_</span>
      </button>
      {open && (
        <div
          role="status"
          className="absolute bottom-6 right-0 w-56 rounded bg-ink-900 p-2 text-slate2-200 shadow-lg"
        >
          {label}
        </div>
      )}
    </div>
  )
}
