import { motion } from 'framer-motion'
import DivergenceChart from '../interactive/DivergenceChart'

export default function Pattern() {
  return (
    <section id="pattern" className="rm-section rm-pattern">
      <div className="rm-pattern-head">
        <p className="rm-mono rm-section-label">02 / The pattern</p>
        <motion.h2
          className="rm-pattern-title"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7 }}
        >
          The deaths are not<br />
          <em>spread randomly</em>.
        </motion.h2>
      </div>

      {/* Breakout pull quote — NOT a card. Bleeds left, type does the work. */}
      <motion.blockquote
        className="rm-pullquote"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.8 }}
      >
        <p>
          “Fatal crashes are not distributed randomly across the city.
          They <span>cluster on arterial roads</span> with wide lanes and
          high speeds.”
        </p>
        <cite>Dumbaugh &amp; Li, 2011</cite>
      </motion.blockquote>

      <div className="rm-chart-wrap">
        <DivergenceChart />
        <div className="rm-chart-caption">
          <p>
            In 1990, the United States and the Netherlands killed pedestrians at
            nearly identical rates. By 2018, one country had cut deaths by three
            quarters. The other reversed course.
          </p>
          <p className="rm-mono rm-source">
            Source: Buehler &amp; Pucher (2021), <em>Transport Reviews</em>.
            Rate per 100,000 population.
          </p>
        </div>
      </div>
    </section>
  )
}
