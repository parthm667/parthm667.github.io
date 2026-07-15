export default function Hero() {
  return (
    <section className="hero section" id="hero">
      <span className="hero-mark" aria-hidden="true">※</span>
      <div className="container hero-copy">
        <div className="hero-meta-row">
          <span>Portfolio — working document</span>
          <span>Rev. 2026.07 · 38.99° N, 76.94° W</span>
        </div>

        <h1 className="hero-name">
          Parth Mhaske<span className="dot">.</span>
        </h1>

        <p className="hero-role">
          Software engineer building across quant systems, robotics, and research computing.
        </p>

        <div className="abstract">
          <p className="abstract-label">Abstract</p>
          <p>
            I design and build practical systems across trading infrastructure, autonomous
            robotics, and computational research. Based in College Park, Maryland, and currently
            seeking internship opportunities.
          </p>
        </div>

        <p className="keywords">
          <span className="kw-label">Keywords</span>
          quant systems · robotics · research computing · SWE Intern @ Corsha · University of Maryland
        </p>

        <div className="hero-cta">
          <a href="#projects" className="btn btn-ink">Selected work ↓</a>
          <a href="#contact" className="rlink">Correspondence</a>
        </div>

        <p className="hero-soc">
          <a href="https://github.com/parthm667" target="_blank" rel="noreferrer">GitHub<span className="up">↗</span></a>
          <a href="https://linkedin.com/in/parthmhaske667" target="_blank" rel="noreferrer">LinkedIn<span className="up">↗</span></a>
          <a href="https://parthmhaske.myportfolio.com/" target="_blank" rel="noreferrer">Photography<span className="up">↗</span></a>
          <a href="mailto:pmhaske@terpmail.umd.edu">Email<span className="up">↗</span></a>
        </p>
      </div>
    </section>
  )
}
