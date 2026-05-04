import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

// Compact viewBox for narrow viewports — labels sit above the line endpoints,
// right margin shrinks so the curves themselves get the available width.
function useIsCompact(breakpoint = 640) {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [breakpoint])
  return compact
}

// Pedestrian fatality rate per 100,000, 1990-2018.
// Source: Buehler & Pucher (2021), figures aligned with the academic paper.
const SERIES = {
  us: {
    label: 'United States',
    color: '#b9442b',
    points: [
      { year: 1990, rate: 3.5 },
      { year: 2000, rate: 2.5 },
      { year: 2010, rate: 2.2 },
      { year: 2018, rate: 2.6 },
    ],
  },
  nl: {
    label: 'Netherlands',
    color: '#2f5d54',
    points: [
      { year: 1990, rate: 3.2 },
      { year: 2000, rate: 1.8 },
      { year: 2010, rate: 1.0 },
      { year: 2018, rate: 0.8 },
    ],
  },
}

// Catmull-Rom -> cubic Bezier so 4 data points read as a real curve, not a polyline.
function pathFromPoints(pts) {
  if (pts.length < 2) return ''
  const cmds = [`M ${pts[0].x},${pts[0].y}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    cmds.push(`C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`)
  }
  return cmds.join(' ')
}

const VB_DESKTOP = { w: 940, h: 460, ml: 64, mr: 160, mt: 36, mb: 60 }
const VB_COMPACT = { w: 720, h: 600, ml: 60, mr: 30, mt: 90, mb: 70 }
const Y_MAX = 4
const Y_TICKS = [0, 1, 2, 3, 4]
const X_TICKS = [1990, 2000, 2010, 2018]

export default function DivergenceChart() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const [hover, setHover] = useState(null) // { series, point }
  const compact = useIsCompact(640)
  const VB = compact ? VB_COMPACT : VB_DESKTOP
  const PLOT = { w: VB.w - VB.ml - VB.mr, h: VB.h - VB.mt - VB.mb }
  const xs = (year) => VB.ml + ((year - 1990) / 28) * PLOT.w
  const ys = (rate) => VB.mt + (1 - rate / Y_MAX) * PLOT.h

  const series = useMemo(() => {
    return Object.entries(SERIES).map(([key, s]) => {
      const projected = s.points.map(p => ({ ...p, x: xs(p.year), y: ys(p.rate) }))
      return { key, ...s, projected, d: pathFromPoints(projected) }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact])

  const drawDuration = reduce ? 0 : 2.0

  return (
    <figure className="rm-chart" ref={ref}>
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        role="img"
        aria-labelledby="rm-chart-title rm-chart-desc"
        preserveAspectRatio="xMidYMid meet"
      >
        <title id="rm-chart-title">Pedestrian fatality rate, US vs. Netherlands, 1990–2018</title>
        <desc id="rm-chart-desc">
          Both countries started near 3.3 deaths per 100,000 in 1990. The Netherlands fell to 0.8 by 2018; the US fell, then climbed back to 2.6.
        </desc>

        {/* y-axis gridlines */}
        {Y_TICKS.map(t => (
          <g key={t}>
            <line
              x1={VB.ml} x2={VB.w - VB.mr}
              y1={ys(t)} y2={ys(t)}
              stroke="#d4cbb9" strokeWidth="1"
              strokeDasharray={t === 0 ? '0' : '2 4'}
            />
            <text
              x={VB.ml - 12} y={ys(t)}
              textAnchor="end" dominantBaseline="middle"
              fontFamily="IBM Plex Mono, monospace"
              fontSize="14" fill="#7e8681"
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {/* y-axis label */}
        <text
          x={VB.ml - 44} y={VB.mt + PLOT.h / 2}
          textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace"
          fontSize="13" fill="#5b6661"
          letterSpacing="0.16em"
          transform={`rotate(-90 ${VB.ml - 44} ${VB.mt + PLOT.h / 2})`}
        >
          DEATHS PER 100K
        </text>

        {/* x-axis ticks */}
        {X_TICKS.map(year => (
          <g key={year}>
            <line
              x1={xs(year)} x2={xs(year)}
              y1={VB.mt + PLOT.h} y2={VB.mt + PLOT.h + 6}
              stroke="#7e8681" strokeWidth="1"
            />
            <text
              x={xs(year)} y={VB.mt + PLOT.h + 22}
              textAnchor="middle"
              fontFamily="IBM Plex Mono, monospace"
              fontSize="14" fill="#5b6661"
            >
              {year}
            </text>
          </g>
        ))}

        {/* lines */}
        {series.map(s => (
          <motion.path
            key={s.key}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={inView ? { pathLength: 1 } : { pathLength: reduce ? 1 : 0 }}
            transition={{ duration: drawDuration, ease: [0.65, 0, 0.35, 1] }}
          />
        ))}

        {/* End-of-line labels.
            Desktop: to the right of the curve endpoint (italic country, value below).
            Compact: above the curve endpoints, anchored to right edge of plot, so the
            chart itself can use the full width. */}
        {series.map((s, i) => {
          const last = s.projected[s.projected.length - 1]
          if (compact) {
            // Two-row legend above the plot: dot · country · value (right-aligned).
            const xDot = VB.ml + 6
            const xLabel = VB.ml + 22
            const xRight = VB.ml + PLOT.w
            const ly = 30 + i * 30
            return (
              <motion.g
                key={`${s.key}-label`}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <circle cx={xDot} cy={ly - 6} r="6" fill={s.color} />
                <text
                  x={xLabel} y={ly}
                  fontFamily="Newsreader, serif"
                  fontSize="20"
                  fontWeight="600"
                  fill={s.color}
                  fontStyle="italic"
                >
                  {s.label}
                </text>
                <text
                  x={xRight} y={ly}
                  textAnchor="end"
                  fontFamily="IBM Plex Mono, monospace"
                  fontSize="14"
                  fill="#5b6661"
                  letterSpacing="0.06em"
                >
                  {last.rate.toFixed(1)} · {last.year}
                </text>
              </motion.g>
            )
          }
          return (
            <motion.g
              key={`${s.key}-label`}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: drawDuration * 0.95 }}
            >
              <text
                x={last.x + 14} y={last.y + 5}
                fontFamily="Newsreader, serif"
                fontSize="22"
                fontWeight="600"
                fill={s.color}
                fontStyle="italic"
              >
                {s.label}
              </text>
              <text
                x={last.x + 14} y={last.y + 26}
                fontFamily="IBM Plex Mono, monospace"
                fontSize="13"
                fill="#5b6661"
                letterSpacing="0.06em"
              >
                {last.rate.toFixed(1)} ({last.year})
              </text>
            </motion.g>
          )
        })}

        {/* Hover dots — drawn after labels so they sit on top */}
        {series.flatMap(s =>
          s.projected.map(p => (
            <g key={`${s.key}-${p.year}`}>
              <motion.circle
                cx={p.x} cy={p.y} r="5"
                fill="#f3efe6"
                stroke={s.color}
                strokeWidth="2.5"
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ duration: 0.4, delay: drawDuration * 0.6 }}
              />
              <circle
                cx={p.x} cy={p.y} r="22"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover({ s, p })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ s, p })}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${s.label}, ${p.year}: ${p.rate.toFixed(1)} per 100,000`}
              />
            </g>
          ))
        )}

        {/* Tooltip */}
        {hover && (
          <g style={{ pointerEvents: 'none' }}>
            <line
              x1={hover.p.x} x2={hover.p.x}
              y1={VB.mt} y2={VB.mt + PLOT.h}
              stroke={hover.s.color} strokeWidth="1"
              strokeDasharray="3 3" opacity="0.5"
            />
            <rect
              x={hover.p.x - 70} y={hover.p.y - 64}
              width="140" height="48"
              rx="6" fill="#0d1614"
            />
            <text
              x={hover.p.x} y={hover.p.y - 44}
              textAnchor="middle"
              fontFamily="IBM Plex Mono, monospace"
              fontSize="10" fill="#f4d35e"
              letterSpacing="0.14em"
            >
              {hover.s.label.toUpperCase()} · {hover.p.year}
            </text>
            <text
              x={hover.p.x} y={hover.p.y - 25}
              textAnchor="middle"
              fontFamily="Newsreader, serif"
              fontSize="18" fontWeight="600"
              fill="#f6f1e4"
            >
              {hover.p.rate.toFixed(1)} per 100k
            </text>
          </g>
        )}
      </svg>
    </figure>
  )
}
