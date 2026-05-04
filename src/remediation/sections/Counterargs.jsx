import { motion } from 'framer-motion'
import Accordion from '../interactive/Accordion'

const ITEMS = [
  {
    question: 'Aren\u2019t most crashes just bad drivers?',
    answer: (
      <>
        <p>
          Bad drivers exist in every country. So do distractions, fatigue, and
          impairment. The question is why the same human errors produce a
          fatality in one place and a fender-bender in another.
        </p>
        <p>
          Dumbaugh &amp; Li examined fatal crashes across the San Antonio metro
          area and found they cluster on a specific kind of road: wide arterials
          with high design speeds and few pedestrian protections. Streets with
          shorter blocks and narrower lanes had a fraction of the fatalities,
          even though plenty of bad drivers used them too. The road geometry,
          not driver behavior, is what makes a mistake deadly.
        </p>
      </>
    ),
    cite: 'Dumbaugh & Li (2011) · Designing for the Safety of Pedestrians, Cyclists, and Motorists in Urban Environments',
  },
  {
    question: 'Won\u2019t road redesigns cause gridlock?',
    answer: (
      <>
        <p>
          Road diets, which drop a lane to add bike lanes, wider sidewalks, or
          turn pockets, have been studied for two decades. The Federal Highway
          Administration's own review puts the crash reduction at{' '}
          <strong>20 to 60 percent</strong>, with no significant impact on
          throughput.
        </p>
        <p>
          Marshall &amp; Ferenchak studied 12 large U.S. cities over 13 years
          and found that the cities with higher rates of bicycling had{' '}
          <em>lower</em> fatality rates for every road user, including drivers.
          Chicago's Vision Zero corridors saw a 39% drop in killed-or-seriously-injured
          incidents from 2021 to 2024.
        </p>
      </>
    ),
    cite: 'Marshall & Ferenchak (2019) · Federal Highway Administration · Chicago DOT (2024)',
  },
  {
    question: 'Americans love their cars \u2014 change isn\u2019t realistic.',
    answer: (
      <>
        <p>
          The Netherlands was a car-centric country in the 1970s. Public
          pressure forced its national government to invest in protected cycling
          infrastructure, lower urban speed limits, and rebuild streets around
          people. Two decades later it had the lowest pedestrian death rate in
          the wealthy world.
        </p>
        <p>
          The American attachment to driving isn't natural; it was manufactured.
          Norton's history of the 1920s documents how the auto industry spent
          a decade reshaping public opinion to give cars priority on streets
          that had previously been shared. The good news is that what was made
          can be remade.
        </p>
      </>
    ),
    cite: 'Norton (2008) · Buehler & Pucher (2021) · Wesseler (2023) on motonormativity',
  },
]

export default function Counterargs() {
  return (
    <section id="counter" className="rm-section rm-counter-section">
      <div className="rm-counter-head">
        <p className="rm-mono rm-section-label">05 / Counterarguments</p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7 }}
        >
          The objections,<br />
          <em>answered.</em>
        </motion.h2>
        <p className="rm-counter-intro">
          Three rebuttals you'll hear at every council meeting. None of them
          survive contact with the evidence.
        </p>
      </div>
      <div className="rm-counter-body">
        <Accordion items={ITEMS} />
      </div>
    </section>
  )
}
