import { useEffect, useState } from 'react'

export default function useActiveSection(ids) {
  const [active, setActive] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return undefined

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    if (elements.length === 0) return undefined

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id)
        }
      })
    }, {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    })

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [ids.join('|')])

  return active
}
