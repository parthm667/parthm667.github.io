import { useEffect } from 'react'

/* Adds .is-in to [data-reveal] elements as they enter the viewport.
   CSS owns the transition; reduced-motion users get everything visible
   immediately via the media-query override in index.css. */
export default function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        }),
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}
