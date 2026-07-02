import React from 'react'

export default function SectionLabel({ children }) {
  return (
    <div className="font-mono text-xs text-brand uppercase tracking-[3px] font-extrabold flex items-center gap-3 mb-4">
      <span className="w-10 h-0.5 bg-brand block"></span>
      {children}
    </div>
  )
}
