import { motion } from 'framer-motion'

const INTERVENTIONS = [
  {
    n: '01',
    label: 'High-visibility paint',
    title: 'They repainted every crosswalk so drivers had to see them.',
    body: `Continental-style stripes: wide white bars instead of two thin parallel lines. The pattern reads as a stop signal at speed, not a footnote on the asphalt. Hoboken now repaints every crosswalk it passes during routine repaving. The cost is rounding-error.`,
    Illustration: CrosswalkSVG,
  },
  {
    n: '02',
    label: 'Daylighting',
    title: 'Flexible posts at every corner. Drivers can suddenly see kids.',
    body: `Parking removed for ~25 feet before the crosswalk, replaced with vertical posts. The line of sight between a driver and a pedestrian opens up, and neither can hide behind a parked SUV. The interventions cost roughly $200 per corner.`,
    Illustration: DaylightingSVG,
  },
  {
    n: '03',
    label: 'Speed limit',
    title: 'Citywide 20 mph. A ten-percent drop with disproportionate effect.',
    body: `A pedestrian struck at 25 mph has roughly a 1-in-4 chance of dying. At 20 mph it falls to about 1-in-10. Hoboken changed signs, repainted lane widths to match the lower target, and let drivers self-regulate. The street geometry did most of the enforcement.`,
    Illustration: SpeedSVG,
  },
  {
    n: '04',
    label: 'Leading pedestrian intervals',
    title: 'A three-second head start at every signal.',
    body: `When the light changes, the walk signal goes white before the green. Pedestrians enter the crosswalk first; turning drivers see them already in motion. It costs nothing to add (just a software change at the cabinet), and it eliminates one of the deadliest right-hook conflicts.`,
    Illustration: SignalSVG,
  },
]

export default function Hoboken() {
  return (
    <section id="hoboken" className="rm-hoboken">
      {/* Full-bleed counterfactual headline over a dark photo placeholder */}
      <div className="rm-hoboken-banner">
        <div className="rm-hoboken-bg" aria-hidden="true">
          <div className="rm-hoboken-photo" />
          <div className="rm-hoboken-tint" />
        </div>
        <div className="rm-hoboken-banner-content">
          <p className="rm-mono rm-section-label rm-on-dark">04 / The counterfactual · Hoboken, NJ</p>
          <motion.h2
            className="rm-hoboken-headline"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.9 }}
          >
            <span>7+ years.</span>
            <span><em>Zero traffic deaths.</em></span>
            <span>One mile from Manhattan.</span>
          </motion.h2>
          <p className="rm-hoboken-credit">
            Hoboken, New Jersey · pop. 60,419
          </p>
        </div>
      </div>

      {/* Interventions — alternating left/right magazine vignettes, NOT a card grid */}
      <div className="rm-interventions">
        <p className="rm-interventions-intro">
          None of what Hoboken did was expensive. None of it was technically
          complicated. The four interventions below were paid for through
          ordinary repaving budgets and signal-software updates, and rolled
          out citywide over the course of a few years.
        </p>
        {INTERVENTIONS.map((iv, i) => (
          <motion.article
            key={iv.n}
            className={`rm-iv ${i % 2 === 0 ? 'rm-iv-left' : 'rm-iv-right'}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.7, delay: 0.05 }}
          >
            <div className="rm-iv-illo" aria-hidden="true">
              <iv.Illustration />
            </div>
            <div className="rm-iv-text">
              <p className="rm-mono rm-iv-num">{iv.n} · {iv.label}</p>
              <h3>{iv.title}</h3>
              <p>{iv.body}</p>
            </div>
          </motion.article>
        ))}

        <motion.blockquote
          className="rm-hoboken-objection"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.8 }}
        >
          <p>
            Cars still drive on Hoboken streets. People still get to work.
            <br />
            <em>The roads were just redesigned so they don't kill anyone.</em>
          </p>
        </motion.blockquote>
      </div>
    </section>
  )
}

/* ---------- Inline SVG illustrations (no stock photos) ---------- */

function CrosswalkSVG() {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="High-visibility crosswalk">
      <rect width="220" height="220" fill="none" />
      <rect x="0" y="40" width="220" height="140" fill="#11201c" />
      {[20, 50, 80, 110, 140, 170].map(x => (
        <rect key={x} x={x} y="50" width="20" height="120" fill="#f4d35e" rx="2" />
      ))}
      {/* curb edge */}
      <line x1="0" y1="40" x2="220" y2="40" stroke="#5b6661" strokeWidth="3" />
      <line x1="0" y1="180" x2="220" y2="180" stroke="#5b6661" strokeWidth="3" />
    </svg>
  )
}

function DaylightingSVG() {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="Corner daylighting with flexible posts">
      <rect width="220" height="220" fill="none" />
      {/* Curb corner */}
      <path d="M 10 120 L 10 30 Q 10 10 30 10 L 210 10" fill="none" stroke="#5b6661" strokeWidth="3" />
      <path d="M 30 120 L 30 50 Q 30 30 50 30 L 210 30" fill="none" stroke="#11201c" strokeWidth="2" strokeDasharray="3 6" />
      {/* Flex posts */}
      {[55, 85, 115, 145, 175, 205].map((cx) => (
        <g key={cx}>
          <rect x={cx - 2} y="58" width="4" height="36" fill="#b9442b" rx="1" />
          <rect x={cx - 4} y="56" width="8" height="3" fill="#f4d35e" />
        </g>
      ))}
      {/* Crosswalk */}
      <rect x="10" y="125" width="200" height="50" fill="#11201c" />
      {[20, 48, 76, 104, 132, 160, 188].map(x => (
        <rect key={x} x={x} y="132" width="14" height="36" fill="#f4d35e" rx="1" />
      ))}
    </svg>
  )
}

function SpeedSVG() {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="20 mph speed limit sign">
      <rect width="220" height="220" fill="none" />
      <rect x="60" y="20" width="100" height="160" rx="8" fill="#f6f1e4" stroke="#11201c" strokeWidth="4" />
      <text
        x="110" y="60"
        textAnchor="middle"
        fontFamily="Manrope, sans-serif"
        fontSize="14"
        fontWeight="700"
        letterSpacing="0.08em"
        fill="#11201c"
      >SPEED</text>
      <text
        x="110" y="80"
        textAnchor="middle"
        fontFamily="Manrope, sans-serif"
        fontSize="14"
        fontWeight="700"
        letterSpacing="0.08em"
        fill="#11201c"
      >LIMIT</text>
      <text
        x="110" y="142"
        textAnchor="middle"
        fontFamily="Newsreader, serif"
        fontSize="68"
        fontWeight="700"
        fill="#b9442b"
      >20</text>
      <line x1="76" y1="158" x2="144" y2="158" stroke="#11201c" strokeWidth="2" />
      <text
        x="110" y="172"
        textAnchor="middle"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="9"
        letterSpacing="0.18em"
        fill="#5b6661"
      >M·P·H</text>
    </svg>
  )
}

function SignalSVG() {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="Walk signal with leading pedestrian interval">
      <rect width="220" height="220" fill="none" />
      <rect x="55" y="20" width="110" height="180" rx="8" fill="#11201c" />
      {/* WALK lit */}
      <circle cx="110" cy="70" r="34" fill="#f6f1e4" opacity="0.95" />
      {/* Walking figure */}
      <g transform="translate(91 46)" fill="#11201c">
        <circle cx="20" cy="6" r="6" />
        <path d="M 14 14 L 24 14 L 28 32 L 22 36 L 18 28 L 12 36 L 8 32 Z" />
        <path d="M 8 32 L 4 44 L 8 46 L 12 36 Z" />
        <path d="M 22 36 L 28 46 L 32 44 L 28 32 Z" />
      </g>
      {/* Countdown / WAIT (off) */}
      <circle cx="110" cy="155" r="34" fill="#1a2522" />
      <text
        x="110" y="161"
        textAnchor="middle"
        fontFamily="Manrope, sans-serif"
        fontSize="14"
        fontWeight="700"
        letterSpacing="0.18em"
        fill="#3a4642"
      >WAIT</text>
      {/* +3s indicator */}
      <text
        x="184" y="80"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="14"
        fill="#f4d35e"
        letterSpacing="0.06em"
      >+3s</text>
      <line x1="148" y1="74" x2="178" y2="74" stroke="#f4d35e" strokeWidth="2" />
    </svg>
  )
}
