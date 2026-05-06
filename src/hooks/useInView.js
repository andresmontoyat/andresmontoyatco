import { useEffect, useState } from 'react'

export default function useInView(ref, { threshold = 0.25 } = {}) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }
    const el = ref && ref.current
    if (!el) return undefined

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(entry.target)
        }
      })
    }, {
      root: null,
      rootMargin: '0px',
      threshold,
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, threshold])

  return inView
}
