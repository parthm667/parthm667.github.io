import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// Start with the hero rather than waiting for a viewport-dependent scroll trigger.
export default function FatalityCounter({ target = 7500, duration = 2200 }) {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (reduce) return

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
  }, [target, duration, reduce])

  // Reduced-motion users skip the climb and read the final number immediately.
  const display = reduce ? target : value

  return (
    <span
      className="rm-counter"
      aria-label={`${target.toLocaleString()} pedestrian deaths`}
    >
      {display.toLocaleString()}
    </span>
  )
}
