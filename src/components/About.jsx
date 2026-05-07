import { ArrowUpRight, Camera } from 'lucide-react'

const facts = [
  { label: 'Location', value: 'College Park, Maryland' },
  { label: 'Status', value: 'Looking for internship opportunities' },
  { label: 'Education', value: 'University of Maryland — Computer Science and Applied Mathematics' },
  { label: 'Focus', value: 'Robotics · Research Computing · Quant Systems' },
]

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container about-grid">
        <div className="about-photo">
          <img src="/parth-photo.webp" alt="Parth Mhaske" />
        </div>

        <div className="about-copy">
          <p className="lbl">About</p>
          <h2 className="h2">Who I am</h2>

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

          <dl className="dl">
            {facts.map(fact => (
              <div className="dl-row" key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="about-actions">
            <a href="/resume.pdf" target="_blank" rel="noreferrer" className="btn btn-p">
              Resume <ArrowUpRight size={16} />
            </a>
            <a
              href="https://parthmhaske.myportfolio.com/"
              target="_blank"
              rel="noreferrer"
              className="hero-link"
            >
              <Camera size={15} /> Photo Portfolio
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
