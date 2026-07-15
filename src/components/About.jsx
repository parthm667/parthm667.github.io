const facts = [
  { label: 'Location', value: 'College Park, Maryland' },
  { label: 'Status', value: 'Looking for internship opportunities' },
  { label: 'Education', value: 'University of Maryland — Computer Science and Applied Mathematics' },
  { label: 'Focus', value: 'Robotics · Research Computing · Quant Systems' },
]

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container">
        <div className="sec-head" data-reveal>
          <p className="lbl">§ 01 · About</p>
          <h2 className="h2">The author<span className="dot">.</span></h2>
        </div>

        <div className="about-grid">
          <figure className="plate" data-reveal>
            <img src="/parth-photo.webp" alt="Parth Mhaske" />
            <figcaption>Plate I — the author. College Park, MD.</figcaption>
          </figure>

          <div className="about-copy" data-reveal style={{ '--i': 1 }}>
            <p>
              I am <strong>Parth Mhaske</strong>, a software engineer and student building across quant systems,
              robotics, and simulation-heavy research.
            </p>
            <p>
              Currently <strong>SWE Intern @ Corsha</strong>, where I work on backend development for OT
              authentication systems.
            </p>
            <p>
              My recent work spans low-latency trading infrastructure, autonomous robotics control, and
              computational modeling projects in academic research environments.
            </p>

            <dl className="doc-table">
              {facts.map(fact => (
                <div className="doc-row" key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="about-actions">
              <a href="/resume.pdf" target="_blank" rel="noreferrer" className="btn btn-ink">
                Resume ↗
              </a>
              <a href="https://parthmhaske.myportfolio.com/" target="_blank" rel="noreferrer" className="rlink">
                Photo portfolio
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
