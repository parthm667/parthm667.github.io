import { motion } from 'framer-motion'
import FatalityCounter from '../interactive/FatalityCounter'

export default function Hero() {
  return (
    <section className="rm-hero" aria-label="Designed to fail">
      <div className="rm-hero-bg" aria-hidden="true">
        {/* Photographic backdrop slot — replaced by Parth with a real arterial-road image. */}
        <div className="rm-hero-photo" />
        {/* Layered tint + lane-paint motif keeps the section weighty even with no photo. */}
        <div className="rm-hero-tint" />
        <svg className="rm-hero-lanes" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="laneFade" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#f4d35e" stopOpacity="0" />
              <stop offset="0.55" stopColor="#f4d35e" stopOpacity="0.15" />
              <stop offset="1" stopColor="#f4d35e" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          {/* Two converging dashed lane lines drawn in vanishing perspective */}
          <line x1="640" y1="380" x2="-200" y2="900" stroke="url(#laneFade)" strokeWidth="6" strokeDasharray="40 32" />
          <line x1="960" y1="380" x2="1800" y2="900" stroke="url(#laneFade)" strokeWidth="6" strokeDasharray="40 32" />
          <line x1="800" y1="395" x2="800" y2="900" stroke="url(#laneFade)" strokeWidth="3" strokeDasharray="14 26" opacity="0.6" />
        </svg>
      </div>

      <div className="rm-hero-content">
        <motion.p
          className="rm-mono rm-hero-kicker"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          A public remediation · 2026
        </motion.p>

        <motion.h1
          className="rm-hero-title"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
        >
          In March 2022 I was hit by a car<br />
          <em>on a road that was designed</em><br />
          to be dangerous.
        </motion.h1>

        <motion.div
          className="rm-hero-after"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <p className="rm-hero-survived">
            I survived. <span><FatalityCounter target={7500} /> Americans</span> last year did not.
          </p>
          <p className="rm-hero-source">
            Pedestrian fatalities, 2022. Smart Growth America, <em>Dangerous by Design 2024</em>.
          </p>
        </motion.div>

        <motion.div
          className="rm-hero-scroll"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.7 }}
        >
          <span className="rm-mono">scroll</span>
          <span className="rm-hero-scroll-line" />
        </motion.div>
      </div>
    </section>
  )
}
