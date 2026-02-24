import {
  ArrowRight,
  BriefcaseBusiness,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react'

export default function Hero() {
  return (
    <section className="hero section" id="hero">
      <div className="container hero-layout">
        <div className="hero-copy">
          <p className="lbl">Portfolio</p>
          <h1 className="hero-name">Parth Mhaske</h1>
          <p className="hero-role">Software Engineer focused on quant systems, robotics, and research computing.</p>
          <p className="hero-bio">
            I design and build practical systems across trading infrastructure, autonomous robotics, and
            computational research. I am based in College Park, Maryland and currently seeking internship opportunities.
          </p>

          <div className="hero-facts">
            <span className="fact"><MapPin size={16} /> College Park, Maryland</span>
            <span className="fact"><BriefcaseBusiness size={16} /> Quant Analyst at Smith Investment Fund</span>
            <span className="fact"><GraduationCap size={16} /> University of Maryland</span>
          </div>

          <div className="hero-btns">
            <a href="#projects" className="btn btn-p">
              View Work <ArrowRight size={16} />
            </a>
            <a href="#contact" className="btn btn-o">
              Contact
            </a>
          </div>

          <div className="hero-soc">
            <a href="https://github.com/parthm667" target="_blank" rel="noreferrer" className="soc-link">
              <Github size={16} /> GitHub
            </a>
            <a href="https://linkedin.com/in/parthmhaske667" target="_blank" rel="noreferrer" className="soc-link">
              <Linkedin size={16} /> LinkedIn
            </a>
            <a href="mailto:pmhaske@terpmail.umd.edu" className="soc-link">
              <Mail size={16} /> Email
            </a>
          </div>
        </div>

        <aside className="hero-panel" aria-label="Current focus">
          <p className="panel-label">Current Focus</p>
          <ul className="panel-list">
            <li>
              <span className="panel-icon"><Sparkles size={15} /></span>
              <div>
                <h3>Quant Infrastructure</h3>
                <p>Low-latency trading systems, strategy interfaces, and market data pipelines.</p>
              </div>
            </li>
            <li>
              <span className="panel-icon"><Sparkles size={15} /></span>
              <div>
                <h3>Robotics + Control</h3>
                <p>PID control loops, sensor fusion, and deterministic path planning workflows.</p>
              </div>
            </li>
            <li>
              <span className="panel-icon"><Sparkles size={15} /></span>
              <div>
                <h3>Research Computing</h3>
                <p>Simulation, Monte Carlo methods, and model calibration against empirical data.</p>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
