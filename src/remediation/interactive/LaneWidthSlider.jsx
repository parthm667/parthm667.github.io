import { useState, useId } from 'react'
import { motion } from 'framer-motion'

// Wider lanes correlate with higher driver speeds.  Roughly 1.5 mph faster
// per foot above the 10 ft baseline, per FHWA observations and Dewar/Olson summaries.
const BASE_FT = 10
const BASE_MPH = 22
const MPH_PER_FT = 1.5

function speedFor(width) {
  return Math.round(BASE_MPH + (width - BASE_FT) * MPH_PER_FT)
}

// Approximate fatality risk for a struck pedestrian as a smooth ramp:
// 25 mph ≈ 25%, 30 mph ≈ 45%, 35 mph ≈ 65%, 40 mph ≈ 85%
function fatalityRisk(mph) {
  return Math.max(0, Math.min(95, Math.round((mph - 18) * 4.5)))
}

export default function LaneWidthSlider() {
  const [width, setWidth] = useState(11)
  const id = useId()
  const speed = speedFor(width)
  const risk = fatalityRisk(speed)
  const t = (width - 9) / (14 - 9) // 0..1 along the range

  return (
    <div className="rm-lane">
      <div className="rm-lane-graphic" aria-hidden="true">
        <svg viewBox="0 0 800 280" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`${id}-asphalt`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#1c2a26" />
              <stop offset="1" stopColor="#0d1614" />
            </linearGradient>
          </defs>
          <rect width="800" height="280" fill={`url(#${id}-asphalt)`} />

          {/* Lane lines bracket a centered lane that widens with the input */}
          {(() => {
            const cx = 400
            const px = (width / 14) * 360 // pixels half-width
            const left = cx - px
            const right = cx + px
            return (
              <>
                <motion.line
                  y1="20" y2="260"
                  stroke="#f4d35e" strokeWidth="3"
                  initial={{ x1: left, x2: left }}
                  animate={{ x1: left, x2: left }}
                  transition={{ duration: 0.25 }}
                />
                <motion.line
                  y1="20" y2="260"
                  stroke="#f4d35e" strokeWidth="3"
                  initial={{ x1: right, x2: right }}
                  animate={{ x1: right, x2: right }}
                  transition={{ duration: 0.25 }}
                />
                {/* Center dashed line */}
                <line x1={cx} x2={cx} y1="20" y2="260" stroke="#f4d35e" strokeWidth="1.5" strokeDasharray="14 12" opacity="0.5" />
                {/* Lane width annotation */}
                <motion.line
                  y1="40" y2="40"
                  stroke="#f6f1e4" strokeWidth="1"
                  initial={{ x1: left + 8, x2: right - 8 }}
                  animate={{ x1: left + 8, x2: right - 8 }}
                  transition={{ duration: 0.25 }}
                />
                <text
                  x={cx} y="34"
                  textAnchor="middle"
                  fontFamily="IBM Plex Mono, monospace"
                  fontSize="13"
                  fill="#f6f1e4"
                  letterSpacing="0.12em"
                >
                  {width.toFixed(0)} FT
                </text>
                {/* Vehicle silhouette in lane */}
                <motion.g
                  animate={{ x: 0, scale: 1 + (width - 10) * 0.04 }}
                  transition={{ duration: 0.25 }}
                  style={{ transformOrigin: '400px 170px' }}
                >
                  <rect x="362" y="120" width="76" height="120" rx="10" fill="#b9442b" />
                  <rect x="370" y="130" width="60" height="36" rx="4" fill="#0d1614" opacity="0.7" />
                  <rect x="370" y="200" width="60" height="20" rx="3" fill="#0d1614" opacity="0.55" />
                  <circle cx="376" cy="120" r="3" fill="#f4d35e" />
                  <circle cx="424" cy="120" r="3" fill="#f4d35e" />
                </motion.g>
              </>
            )
          })()}
        </svg>
      </div>

      <div className="rm-lane-controls">
        <label htmlFor={`${id}-input`} className="rm-mono rm-lane-label">
          Lane width
        </label>
        <div className="rm-lane-row">
          <span className="rm-lane-min">9 ft</span>
          <input
            id={`${id}-input`}
            type="range"
            min="9" max="14" step="1"
            value={width}
            onChange={e => setWidth(Number(e.target.value))}
            aria-valuemin={9}
            aria-valuemax={14}
            aria-valuenow={width}
            aria-label="Lane width in feet"
            className="rm-lane-input"
            style={{ '--p': `${t * 100}%` }}
          />
          <span className="rm-lane-max">14 ft</span>
        </div>

        <div className="rm-lane-readout">
          <div>
            <p className="rm-mono">Driver speed (free-flow)</p>
            <p className="rm-lane-stat">
              <span className="rm-lane-num">{speed}</span>
              <span className="rm-lane-unit">mph</span>
            </p>
          </div>
          <div>
            <p className="rm-mono">Pedestrian risk if struck</p>
            <p className="rm-lane-stat rm-lane-risk">
              <span className="rm-lane-num">{risk}</span>
              <span className="rm-lane-unit">% killed</span>
            </p>
          </div>
        </div>

        <p className="rm-lane-source">
          Approximation. Speed/lane-width relationship from FHWA guidance and
          Dewar &amp; Olson summaries; risk curve from AAA Foundation
          pedestrian-impact research.
        </p>
      </div>
    </div>
  )
}
