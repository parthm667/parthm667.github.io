import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="hero section" id="hero">
      <div className="container hero-layout">
        <div className="hero-copy">
          <p className="lbl">Portfolio</p>
          <h1 className="hero-name">Parth Mhaske</h1>
          <p className="hero-role">
            Software engineer building across quant systems, robotics, and research computing.
          </p>
          <p className="hero-bio">
            I design and build practical systems across trading infrastructure, autonomous robotics, and
            computational research. I am based in College Park, Maryland and currently seeking internship
            opportunities.
          </p>

          <p className="hero-meta">
            <span>College Park, MD</span>
            <span aria-hidden="true">·</span>
            <span>SWE Intern @ Corsha</span>
            <span aria-hidden="true">·</span>
            <span>University of Maryland</span>
          </p>

          <div className="hero-cta">
            <a href="#projects" className="btn btn-p">
              View Work <ArrowRight size={16} />
            </a>
            <a href="#contact" className="hero-link">
              Or get in touch
            </a>
          </div>

          <p className="hero-soc">
            <a href="https://github.com/parthm667" target="_blank" rel="noreferrer">GitHub</a>
            <span aria-hidden="true">·</span>
            <a href="https://linkedin.com/in/parthmhaske667" target="_blank" rel="noreferrer">LinkedIn</a>
            <span aria-hidden="true">·</span>
            <a href="https://parthmhaske.myportfolio.com/" target="_blank" rel="noreferrer">Photography</a>
            <span aria-hidden="true">·</span>
            <a href="mailto:pmhaske@terpmail.umd.edu">Email</a>
          </p>
        </div>
      </div>
    </section>
  )
}
