// Phase 16 Wave 3: Controlled filter bar — chip clusters + reset.
// Props-driven contract (mirrors SvgConstellation): no internal filter state, no context hooks.
// Parent (GameMode → useConstellation) owns selectedSkills, yearRange, category.
// D-16-FLOW-CLOSE-EMPTY: root carries data-game-interactive so the card's click-outside
// listener treats clicks here as in-bounds.
// NOTE: YearRangeSlider is a Task-1 placeholder — full WAI-ARIA APG dual-thumb implementation
// lands in Task 2 within this same file.
import React from 'react'
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

// Task-1 placeholder. Task 2 replaces this with a full WAI-ARIA APG dual-thumb slider:
// two role="slider" buttons with dependent aria-valuemin/max, ArrowLeft/Right ±1 year,
// Home/End jump, sr-only live region. Keyboard-only v1.
function YearRangeSlider({ value, bounds, onChange, t }) { // eslint-disable-line no-unused-vars
  return (
    <div role="group" aria-label={t.game.yearLabel} className="relative w-full max-w-[220px] py-3">
      <span className="sr-only">{t.game.yearLabel}</span>
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
