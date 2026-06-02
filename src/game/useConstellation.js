import { useState, useCallback, useMemo } from 'react'

// eslint-disable-next-line no-unused-vars
export default function useConstellation(nodes) {
  const [selectedSkillId, setSelectedSkillId] = useState(null)
  const [hoveredSkillId, setHoveredSkillId] = useState(null)
  // Filter state — Phase 16 fills these; Phase 15 initializes to defaults
  const [highlightedSkillIds] = useState([])
  const [yearRange] = useState(null)

  const onSelectSkill = useCallback((id) => {
    setSelectedSkillId((prev) => (prev === id ? null : id))
  }, [])

  const onHoverSkill = useCallback((id) => {
    setHoveredSkillId(id)
  }, [])

  return useMemo(() => ({
    selectedSkillId,
    hoveredSkillId,
    highlightedSkillIds,
    yearRange,
    onSelectSkill,
    onHoverSkill,
  }), [selectedSkillId, hoveredSkillId, highlightedSkillIds, yearRange, onSelectSkill, onHoverSkill])
}
