import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

// Counts from 0 → target the first time the element scrolls into view.
// Eased curve so the climb feels weighty, not mechanical.
export default function FatalityCounter({ target = 7500, duration = 2200 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView || reduce) return

    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutQuart — fast at first, settles into the final number
      const eased = 1 - Math.pow(1 - t, 4)
      setValue(Math.round(eased * target))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration, reduce])

  // Reduced-motion users skip the climb and read the final number immediately.
  const display = reduce ? target : value

  return (
    <motion.span
      ref={ref}
      className="rm-counter"
      aria-label={`${target.toLocaleString()} pedestrian deaths`}
    >
      {display.toLocaleString()}
    </motion.span>
  )
}
