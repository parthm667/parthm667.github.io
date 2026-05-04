import { motion } from 'framer-motion'
import LaneWidthSlider from '../interactive/LaneWidthSlider'

export default function History() {
  return (
    <section id="history" className="rm-section rm-history">
      <header className="rm-history-head">
        <p className="rm-mono rm-section-label">03 / How we got here</p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7 }}
        >
          The streets weren't<br />
          always for cars.
        </motion.h2>
      </header>

      <article className="rm-prose">
        <p className="rm-prose-lede">
          <span className="rm-dropcap">I</span>n the 1920s, American streets
          belonged to everyone. Pedestrians, cyclists, streetcars, children, and
          early autos all shared the road. When car ownership started to rise
          and pedestrian deaths began spiking, the public directed its anger at
          drivers.
        </p>

        <p>
          A coalition of car dealers, manufacturers, and auto clubs that the
          historian Peter Norton calls{' '}
          <strong>motordom</strong> spent the next decade changing that. They
          lobbied for new traffic laws that gave cars legal priority on public
          roads. They coined the word <em>jaywalker</em> and pushed it
          relentlessly to shift the blame onto pedestrians for getting hit. By
          the end of the decade, motordom had won. Streets were spaces for
          cars, and cars had legal priority over people on foot.
        </p>

        <figure className="rm-history-photo" aria-label="Monroe Avenue and Cadillac Square, Detroit, c. 1915-1925">
          <div className="rm-history-photo-frame">
            <img
              src="/remediation/detroit-1920s.jpg"
              alt="Monroe Avenue and Cadillac Square, Detroit, around 1915-1925. Pedestrians, streetcars, and cars share the same right-of-way."
              loading="lazy"
            />
          </div>
          <figcaption>
            Monroe Avenue and Cadillac Square, Detroit, c. 1915-1925.
            Pedestrians, streetcars, and cars share the same right-of-way.
            Detroit Publishing Co. / Library of Congress.
          </figcaption>
        </figure>

        <p>
          Once motordom had won control of the streets, the engineering
          profession built its standards around the assumption that roads
          exist to move cars as fast as possible. The American Association of
          State Highway and Transportation Officials (AASHTO) published a
          design manual called the <em>Green Book</em> that became the standard
          reference for road engineers across the country. It set rules for how
          wide lanes should be, how long sight lines had to be, and what speed
          roads should be designed for. All of it was built around one
          assumption: <strong>giving drivers more room to correct their
          mistakes would make roads safer.</strong>
        </p>

        <p>
          The Green Book set rules for lane width, sight lines, design speeds,
          and shoulder size, and all of them were built around the same
          assumption that faster, wider roads are safer. Pedestrians and
          cyclists were not part of the math.
        </p>

        <aside className="rm-history-interactive" aria-label="Interactive lane width demonstrator">
          <header>
            <p className="rm-mono">Interactive · drag to widen</p>
            <h4>Lane width is design speed.</h4>
            <p>
              The Green Book treats wider lanes as safer. In practice, drivers
              treat them as permission to go faster. Move the slider.
            </p>
          </header>
          <LaneWidthSlider />
        </aside>

        <p className="rm-history-close">
          This is the assumption everything else on this page dismantles.
        </p>
      </article>
    </section>
  )
}
