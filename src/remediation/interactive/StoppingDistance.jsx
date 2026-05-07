import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Stopping-distance visualizer.
 * Pick a speed → see reaction distance + braking distance, scaled to a
 * crosswalk-width reference so the number lands viscerally.
 * Skeleton — adjust constants and styling before enabling.
 */
const SPEEDS = [20, 25, 30, 35, 40]

// Reaction time 1.5s; deceleration ~15 ft/s^2 (dry pavement, average driver).
function distances(mph) {
  const fps = mph * 1.467
  const reaction = fps * 1.5
  const braking = (fps * fps) / (2 * 15)
  return { reaction, braking, total: reaction + braking }
}

// Pedestrian fatality risk by impact speed (Tefft 2011, AAA Foundation).
function fatalityRisk(mph) {
  if (mph <= 20) return 7
  if (mph <= 25) return 12
  if (mph <= 30) return 19
  if (mph <= 35) return 31
  if (mph <= 40) return 50
  return 70
}

export default function StoppingDistance() {
  const [mph, setMph] = useState(30)
  const { reaction, braking, total } = useMemo(() => distances(mph), [mph])
  const risk = fatalityRisk(mph)

  // Scale: 1 ft = 4 px up to ~250 ft, then compress.
  const scale = 3.2
  const reactionPx = reaction * scale
  const brakingPx = braking * scale

  return (
    <div className="rm-sd">
      <div className="rm-sd-controls">
        <p className="rm-mono">Design speed</p>
        <div className="rm-sd-buttons" role="radiogroup" aria-label="Speed in mph">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={mph === s}
              className={mph === s ? 'is-active' : ''}
              onClick={() => setMph(s)}
            >
              {s} mph
            </button>
          ))}
        </div>
      </div>

      <div className="rm-sd-track" aria-hidden="true">
        <div className="rm-sd-road">
          <motion.div
            className="rm-sd-bar rm-sd-bar-reaction"
            animate={{ width: reactionPx }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="rm-sd-bar rm-sd-bar-braking"
            animate={{ width: brakingPx }}
            transition={{ duration: 0.5, delay: 0.05 }}
          />
          <span className="rm-sd-ped" title="Pedestrian in crosswalk">🚶</span>
        </div>
      </div>

      <dl className="rm-sd-readout">
        <div>
          <dt>Reaction</dt>
          <dd>{Math.round(reaction)} ft</dd>
        </div>
        <div>
          <dt>Braking</dt>
          <dd>{Math.round(braking)} ft</dd>
        </div>
        <div className="rm-sd-total">
          <dt>Total stopping distance</dt>
          <dd>{Math.round(total)} ft</dd>
        </div>
        <div className="rm-sd-risk">
          <dt>If a pedestrian is hit</dt>
          <dd>~{risk}% chance of death</dd>
        </div>
      </dl>

      <p className="rm-sd-note">
        At {mph} mph, a driver covers <strong>{Math.round(reaction)} feet</strong>{' '}
        before they even hit the brakes. A standard crosswalk is 10 feet wide.
      </p>
    </div>
  )
}
