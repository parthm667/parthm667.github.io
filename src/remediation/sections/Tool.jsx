import { motion } from 'framer-motion'
import { ArrowUpRight, MapPin } from 'lucide-react'

export default function Tool() {
  return (
    <section id="tool" className="rm-tool">
      <div className="rm-tool-bg" aria-hidden="true">
        <svg className="rm-tool-grid" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="rm-tool-streets" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(244, 211, 94, 0.16)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1600" height="900" fill="url(#rm-tool-streets)" />
          {/* Suggestive heat-map dots — high-injury cluster */}
          {[
            [220, 240, 80, 0.6],
            [320, 340, 60, 0.45],
            [410, 280, 90, 0.55],
            [620, 460, 110, 0.5],
            [780, 380, 70, 0.4],
            [950, 560, 130, 0.6],
            [1180, 420, 95, 0.5],
            [1300, 620, 75, 0.4],
          ].map(([cx, cy, r, op], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#f4d35e" opacity={op * 0.18} />
          ))}
          {[
            [220, 240, 22],
            [320, 340, 14],
            [410, 280, 28],
            [620, 460, 32],
            [780, 380, 18],
            [950, 560, 36],
            [1180, 420, 26],
            [1300, 620, 20],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#b9442b" opacity="0.85" />
          ))}
        </svg>
      </div>

      <div className="rm-tool-content">
        <motion.p
          className="rm-mono rm-section-label rm-on-dark rm-tool-kicker"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
        >
          06 / The tool · for NJ municipalities
        </motion.p>

        <motion.h2
          className="rm-tool-title"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.85, delay: 0.1 }}
        >
          Find your town's<br />
          <em>most dangerous roads.</em>
        </motion.h2>

        <div className="rm-tool-body">
          <p className="rm-tool-pitch">
            I built a High Injury Network generator for New Jersey that runs the
            full geospatial analysis automatically. Drop in NJ DOT crash data and
            it produces a corridor-by-corridor ranking with Poisson significance
            tests and equity overlays. The output is grant-application ready,
            so municipalities without GIS departments can use it to compete for
            federal Safe Streets and Roads for All funding.
          </p>

          <div className="rm-tool-meta">
            <span className="rm-mono">
              <MapPin size={12} /> NJ-specific · DOT crash data
            </span>
            <span className="rm-mono">Free · open source</span>
            <span className="rm-mono">Built for SS4A grant applications</span>
          </div>

          <motion.a
            className="rm-tool-cta"
            href="https://github.com/parthm667/nj-hin-generator"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <span>Open the HIN Generator</span>
            <span className="rm-tool-cta-icon">
              <ArrowUpRight size={20} />
            </span>
          </motion.a>

          <p className="rm-tool-note">
            Built specifically for NJ municipalities. Free to use. An academic
            paper can't put a tool in your hands. A website can.
          </p>
        </div>
      </div>
    </section>
  )
}
