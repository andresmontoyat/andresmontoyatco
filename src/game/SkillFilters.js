// Phase 16 Wave 3: Controlled filter bar — chip clusters + dual-thumb year slider + reset.
// Props-driven contract (mirrors SvgConstellation): no internal filter state, no context hooks.
// Parent (GameMode → useConstellation) owns selectedSkills, yearRange, category.
// D-16-FLOW-CLOSE-EMPTY: root carries data-game-interactive so the card's click-outside
// listener treats clicks here as in-bounds.
// YearRangeSlider follows WAI-ARIA APG slider-multithumb (RESEARCH.md §2): two
// role="slider" buttons with DEPENDENT aria-valuemin/max, keyboard-only v1.
import React, { useRef } from 'react'
import { SKILL_CATEGORIES } from '../data/skills.js'

// Shared chip base: 44×44px touch target (WCAG 2.5.5), focus-visible ring, motion-safe colors.
// Mirrors the ViewModeToggle/LangPill triple-class pattern from src/components/_shared/ViewModeToggle.js:9.
const chipBase = 'px-3 py-1.5 rounded-full font-mono text-xs min-h-[44px] min-w-[44px] inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-safe:transition-colors duration-200'
const chipActive = 'bg-chip-activeBg text-chip-activeText font-extrabold'
const chipInactive = 'text-chip-outlineText bg-ink-700 border border-chip-outlineBorder'

function SkillChips({ nodes, selectedSkills, onToggleSkill, label }) {
  return (
    <div role="group" aria-label={label} className="flex gap-2 overflow-x-auto scrollbar-hide md:flex-wrap md:overflow-visible">
      {nodes.map((node) => {
        const isActive = selectedSkills.includes(node.id)
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onToggleSkill(node.id)}
            aria-pressed={isActive}
            aria-label={node.label}
            className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
          >
            {node.label}
          </button>
        )
      })}
    </div>
  )
}

function CategoryChips({ category, onCategoryChange, lang, label }) {
  return (
    <div role="group" aria-label={label} className="flex gap-2 overflow-x-auto scrollbar-hide md:flex-wrap md:overflow-visible">
      {Object.entries(SKILL_CATEGORIES).map(([key, cat]) => {
        const isActive = category === key
        // Category color is a DATA value (cat.color from skills.js) — documented Tailwind-token exception.
        const style = isActive ? { backgroundColor: cat.color, color: '#FFFFFF' } : undefined
        return (
          <button
            key={key}
            type="button"
            onClick={() => onCategoryChange(isActive ? null : key)}
            aria-pressed={isActive}
            aria-label={cat[lang]}
            style={style}
            className={`${chipBase} ${isActive ? 'font-extrabold' : chipInactive}`}
          >
            {cat[lang]}
          </button>
        )
      })}
    </div>
  )
}

function ResetButton({ isFilterActive, onReset, label }) {
  const enabledClasses = 'text-brand border border-brand'
  const disabledClasses = 'text-text-muted border border-ink-400 opacity-60 cursor-not-allowed'
  return (
    <button
      type="button"
      onClick={onReset}
      disabled={!isFilterActive}
      aria-disabled={!isFilterActive}
      aria-label={label}
      className={`${chipBase} ${isFilterActive ? enabledClasses : disabledClasses}`}
    >
      {label}
    </button>
  )
}

// WAI-ARIA APG slider-multithumb (RESEARCH.md §2). Two role="slider" buttons,
// DEPENDENT aria-valuemin/max (Pitfall 4: strict start<end via ±1 opposite-thumb bound),
// keyboard-only v1 (pointer-drag deferred to v2). Inline pseudo-pad gives 44×44px touch
// area while the visual thumb stays w-4 h-4.
function YearRangeSlider({ value, bounds, onChange, t }) {
  const [yearMin, yearMax] = bounds
  const [start, end] = value
  const startRef = useRef(null)
  const endRef = useRef(null)

  // Pitfall 4: strict start < end — opposite thumb is ±1 from the other.
  const startValueMax = end - 1
  const endValueMin = start + 1

  const span = yearMax - yearMin
  const startPct = span === 0 ? 0 : ((start - yearMin) / span) * 100
  const endPct = span === 0 ? 100 : ((end - yearMin) / span) * 100

  function handleKey(thumb, e) {
    const isStart = thumb === 'start'
    const current = isStart ? start : end
    const lo = isStart ? yearMin : endValueMin
    const hi = isStart ? startValueMax : yearMax
    let next = current
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(current + 1, hi)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(current - 1, lo)
        break
      case 'Home':
        next = lo
        break
      case 'End':
        next = hi
        break
      default:
        return
    }
    // preventDefault on every handled key so page does not scroll, even when
    // the thumb is already at its dependent bound (no-op move).
    e.preventDefault()
    if (next === current) return
    onChange(isStart ? [next, end] : [start, next])
  }

  const thumbVisual = 'w-4 h-4 bg-slider-thumb border-2 border-slider-thumbBorder rounded-full'
  const thumbHit = "before:absolute before:content-[''] before:inset-[-14px] before:rounded-full"
  const thumbPosition = 'absolute top-1/2 -translate-x-1/2 -translate-y-1/2'
  const thumbFocus = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand'

  return (
    <div role="group" aria-label={t.game.yearLabel} className="relative w-full max-w-[220px] py-3">
      <div className="relative h-1 bg-slider-track rounded-full">
        <div
          className="absolute h-1 bg-slider-range rounded-full"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          aria-hidden="true"
        />
        <button
          ref={startRef}
          type="button"
          role="slider"
          aria-orientation="horizontal"
          aria-valuemin={yearMin}
          aria-valuemax={startValueMax}
          aria-valuenow={start}
          aria-valuetext={`${t.game.yearFrom} ${start}`}
          aria-label={t.game.yearStartLabel}
          onKeyDown={(e) => handleKey('start', e)}
          style={{ left: `${startPct}%` }}
          className={`${thumbPosition} ${thumbVisual} ${thumbHit} ${thumbFocus}`}
        />
        <button
          ref={endRef}
          type="button"
          role="slider"
          aria-orientation="horizontal"
          aria-valuemin={endValueMin}
          aria-valuemax={yearMax}
          aria-valuenow={end}
          aria-valuetext={`${t.game.yearTo} ${end}`}
          aria-label={t.game.yearEndLabel}
          onKeyDown={(e) => handleKey('end', e)}
          style={{ left: `${endPct}%` }}
          className={`${thumbPosition} ${thumbVisual} ${thumbHit} ${thumbFocus}`}
        />
      </div>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {`${start} — ${end}`}
      </span>
      <div className="mt-2 flex justify-between text-xs font-mono text-text-secondary">
        <span aria-hidden="true">{yearMin}</span>
        <span className="text-text-primary">{`${start} — ${end}`}</span>
        <span aria-hidden="true">{yearMax}</span>
      </div>
    </div>
  )
}

export default function SkillFilters({
  nodes,
  selectedSkills,
  yearRange,
  yearBounds,
  category,
  isFilterActive,
  onToggleSkill,
  onYearRangeChange,
  onCategoryChange,
  onReset,
  lang,
  t,
}) {
  // null yearRange = "no range filter active" → render slider at full bounds.
  // Parent (useConstellation) treats null and full-range as equivalent "no filter".
  const sliderValue = yearRange ?? yearBounds

  return (
    <div
      role="group"
      aria-label={t.game.filterBarLabel}
      data-game-interactive
      className="w-full max-w-3xl bg-ink-900/80 backdrop-blur-sm border-t border-ink-600 px-4 py-4 flex flex-wrap items-center gap-4 rounded-b-xl"
    >
      <SkillChips
        nodes={nodes}
        selectedSkills={selectedSkills}
        onToggleSkill={onToggleSkill}
        label={t.game.filterSkillsLabel}
      />
      <CategoryChips
        category={category}
        onCategoryChange={onCategoryChange}
        lang={lang}
        label={t.game.filterCategoryLabel}
      />
      <YearRangeSlider
        value={sliderValue}
        bounds={yearBounds}
        onChange={onYearRangeChange}
        t={t}
      />
      <ResetButton
        isFilterActive={isFilterActive}
        onReset={onReset}
        label={t.game.filterReset}
      />
    </div>
  )
}
