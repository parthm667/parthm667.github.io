import { motion } from 'framer-motion'

const SOURCES = [
  {
    cite: 'Buehler, R. & Pucher, J. (2021). “The growing gap in pedestrian and cyclist fatality rates between the United States and the United Kingdom, Germany, Denmark, and the Netherlands, 1990–2018.” Transport Reviews, 41(1).',
    why: 'The international comparison that anchors the chart at the top of this page.',
  },
  {
    cite: 'Dumbaugh, E. & Li, W. (2011). “Designing for the Safety of Pedestrians, Cyclists, and Motorists in Urban Environments.” Journal of the American Planning Association, 77(1).',
    why: 'Why crashes cluster on wide arterials and not on shorter, narrower streets.',
  },
  {
    cite: 'Norton, P. (2008). Fighting Traffic: The Dawn of the Motor Age in the American City. MIT Press.',
    why: 'The 1920s history. How motordom redefined the American street as a place for cars.',
  },
  {
    cite: 'Marshall, W. & Ferenchak, N. (2019). “Why cities with high bicycling rates are safer for all road users.” Journal of Transport & Health, 13.',
    why: 'Cities that build bike infrastructure are safer for drivers too. The road-diet evidence.',
  },
  {
    cite: 'Marohn, C. (2021). Confessions of a Recovering Engineer. Wiley.',
    why: 'A traffic engineer\u2019s account of why the profession keeps building dangerous roads even when they know better.',
  },
  {
    cite: 'Smart Growth America (2024). Dangerous by Design 2024.',
    why: 'The current US fatality data: 7,500+ pedestrian deaths in 2022, the worst year in four decades.',
  },
  {
    cite: 'Wesseler, M. (2023). “The unconscious bias that drives car culture.” Yale Climate Connections.',
    why: 'The Swansea motonormativity study: why car-centric design feels like the default.',
  },
]

export default function About() {
  return (
    <section id="about" className="rm-section rm-about">
      <div className="rm-about-personal">
        <motion.p
          className="rm-mono rm-section-label"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.5 }}
        >
          08 / About
        </motion.p>

        <motion.p
          className="rm-about-body"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7 }}
        >
          I'm Parth Mhaske, a student at the University of Maryland. In March
          2022 I was hit by a car on a road that didn't have a bike lane or a
          shoulder, designed for traffic moving 45 mph. I walked away with
          broken bones and a busted wheel. Most people who get hit on roads like
          that don't walk away. This site is a remediation of an academic paper
          I wrote about why.
        </motion.p>

        <motion.p
          className="rm-about-back"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <a href="/" rel="home">parthm667.github.io ↗</a>
          <span> · the rest of my work.</span>
        </motion.p>
      </div>

      <div className="rm-sources">
        <h3 className="rm-sources-head">
          <span className="rm-mono">Further reading</span>
          <em>The seven sources this page rests on.</em>
        </h3>

        <ol className="rm-sources-list">
          {SOURCES.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <span className="rm-source-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="rm-source-cite">{s.cite}</p>
                <p className="rm-source-why">{s.why}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
