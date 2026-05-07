import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * Drag-to-reveal before/after comparison.
 * Pass two image URLs (same dimensions) plus optional captions.
 * Skeleton — wire up real images before enabling.
 */
export default function BeforeAfterSlider({
  beforeSrc = '/remediation/hoboken-before.jpg',
  afterSrc = '/remediation/hoboken-after.jpg',
  beforeAlt = 'Intersection before daylighting: parked cars right up to the crosswalk.',
  afterAlt = 'Same intersection after daylighting: bollards and clear sight lines at the corner.',
  beforeLabel = 'Before',
  afterLabel = 'After',
}) {
  const wrapRef = useRef(null)
  const [pct, setPct] = useState(50)
  const [dragging, setDragging] = useState(false)

  const setFromClientX = useCallback((clientX) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    setPct((x / rect.width) * 100)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const x = e.touches ? e.touches[0].clientX : e.clientX
      setFromClientX(x)
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging, setFromClientX])

  const onKey = (e) => {
    if (e.key === 'ArrowLeft') setPct((p) => Math.max(0, p - 4))
    if (e.key === 'ArrowRight') setPct((p) => Math.min(100, p + 4))
  }

  return (
    <div className="rm-ba" ref={wrapRef}>
      <div className="rm-ba-stage">
        <img className="rm-ba-img rm-ba-after" src={afterSrc} alt={afterAlt} />
        <div className="rm-ba-clip" style={{ width: `${pct}%` }}>
          <img className="rm-ba-img rm-ba-before" src={beforeSrc} alt={beforeAlt} />
        </div>

        <span className="rm-ba-tag rm-ba-tag-before">{beforeLabel}</span>
        <span className="rm-ba-tag rm-ba-tag-after">{afterLabel}</span>

        <button
          type="button"
          className="rm-ba-handle"
          style={{ left: `${pct}%` }}
          onMouseDown={(e) => { e.preventDefault(); setDragging(true) }}
          onTouchStart={() => setDragging(true)}
          onKeyDown={onKey}
          aria-label="Drag to compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          role="slider"
        >
          <span aria-hidden="true">⇆</span>
        </button>
      </div>
    </div>
  )
}
