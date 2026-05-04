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
          early autos all shared the same asphalt. When car ownership began to
          climb and the body count rose with it, the public reaction was outrage.
          At drivers.
        </p>

        <p>
          A coalition of car dealers, manufacturers, and auto clubs that the
          historian Peter Norton calls{' '}
          <strong>motordom</strong> spent the next decade reversing that verdict.
          They lobbied for new traffic laws that gave cars legal priority on
          public roads. They coined the word <em>jaywalker</em> and pushed it
          relentlessly to recast pedestrians as the problem. By the end of the
          decade, the street was no longer a shared place. It was a road, and
          roads were for cars.
        </p>

        <aside className="rm-pullquote rm-pullquote-right">
          <p>
            “Motordom redefined the street as a place where people don't belong.”
          </p>
          <cite>Peter Norton · Fighting Traffic, 2008</cite>
        </aside>

        <figure className="rm-history-photo" aria-label="1920s American street with mixed pedestrian, streetcar, and auto traffic">
          {/* Placeholder — Parth to drop a real 1920s archival photo (Library of Congress / Wikimedia Commons).
              Suggested file: public/remediation/history-1920s-street.webp, ~1600x900. */}
          <div className="rm-history-photo-placeholder" role="img" aria-label="placeholder">
            <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <pattern id="grain1920" width="3" height="3" patternUnits="userSpaceOnUse">
                  <rect width="3" height="3" fill="#1a2522" />
                  <circle cx="1" cy="1" r="0.6" fill="#0d1614" opacity="0.5" />
                </pattern>
              </defs>
              <rect width="800" height="450" fill="url(#grain1920)" />
              {/* Suggestion of streetcar lines + figures */}
              <line x1="0" y1="280" x2="800" y2="280" stroke="#3a4642" strokeWidth="2" />
              <line x1="0" y1="295" x2="800" y2="295" stroke="#3a4642" strokeWidth="2" />
              {[80, 160, 260, 340, 460, 560, 660].map((cx, i) => (
                <g key={i} opacity="0.45">
                  <rect x={cx} y={250 - (i % 2) * 8} width="6" height={i % 2 === 0 ? 30 : 22} fill="#5b6661" />
                  <circle cx={cx + 3} cy={245 - (i % 2) * 8} r="3" fill="#5b6661" />
                </g>
              ))}
              <text
                x="400" y="220"
                textAnchor="middle"
                fontFamily="IBM Plex Mono, monospace"
                fontSize="13"
                fill="#b9b09e"
                letterSpacing="0.2em"
              >
                ARCHIVAL PHOTO PLACEHOLDER
              </text>
              <text
                x="400" y="240"
                textAnchor="middle"
                fontFamily="IBM Plex Mono, monospace"
                fontSize="10"
                fill="#7e8681"
                letterSpacing="0.14em"
              >
                AMERICAN STREET, c. 1920 · LIBRARY OF CONGRESS
              </text>
            </svg>
          </div>
          <figcaption>
            A typical American street before the auto industry's PR campaign.
            Pedestrians, streetcars, cyclists, and cars share the same right-of-way.
          </figcaption>
        </figure>

        <p>
          Once the street was theirs, the engineering profession built its
          standards around it. The American Association of State Highway and
          Transportation Officials (AASHTO) published a thick green design manual,
          the <em>Green Book</em>, that became the reference every state
          engineer was trained on. It told them how wide to make a lane, how
          long the sight lines should be, and how fast to design for. Beneath
          all of it sat one assumption: <strong>the safest road is the one that
          forgives a fast driver's mistakes.</strong>
        </p>

        <p>
          Wider lanes. Longer sight lines. Higher design speeds. Bigger
          shoulders. Every parameter pushed in the same direction. Pedestrians
          and cyclists weren't ignored on purpose. They simply weren't part of
          the math.
        </p>

        <aside className="rm-history-interactive" aria-label="Interactive lane width demonstrator">
          <header>
            <p className="rm-mono">Interactive · drag to widen</p>
            <h4>Lane width is design speed.</h4>
            <p>
              The Green Book treats wider lanes as a safety feature. Driver
              behavior treats them as permission. Move the slider.
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
