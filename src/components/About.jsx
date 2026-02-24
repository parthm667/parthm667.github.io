import { FiDownload } from 'react-icons/fi'

export default function About() {
  return (
    <section className="section about-bg" id="about">
      <div className="container">
        <div className="about-grid">

          <div className="av-wrap">
            <div className="av-frame">
              <img
                src="https://images.squarespace-cdn.com/content/v1/5eb2c11998fcbd048420afd6/af4e19ac-8943-4aab-80f6-11f12eeeff0f/ParthMhaske.jpg?format=750w"
                alt="Parth Mhaske"
              />
            </div>
            <div className="av-corner" />
          </div>

          <div className="about-txt">
            <p className="lbl">About Me</p>
            <h2 className="h2">Who I am</h2>

            <p>
              I am <strong>Parth Mhaske</strong>, a quant-focused software engineer and student with
              strong interests in systematic trading, market microstructure, and production-grade systems.
            </p>
            <p>
              I currently work as a Quant Analyst at the{' '}
              <a href="https://www.sifumd.org/our-team" target="_blank" rel="noreferrer">Smith Investment Fund</a>,
              where I contribute to strategy research and portfolio analytics.
            </p>
            <p>
              My work focuses on quant development and practical engineering,
              and I actively build projects spanning backtesting engines, forecasting models, and web apps.
            </p>

            <div className="meta-grid">
              <div className="meta-item">
                <label>Location</label>
                <span>College Park, Maryland</span>
              </div>
              <div className="meta-item">
                <label>Status</label>
                <span>Looking for internship opportunities</span>
              </div>
              <div className="meta-item">
                <label>Education</label>
                <span>University of Maryland (Computer Science)</span>
              </div>
              <div className="meta-item">
                <label>Interests</label>
                <span>Quant Research | Trading Systems | Full-Stack</span>
              </div>
            </div>

            <a href="/resume.pdf" download className="btn btn-p">
              <FiDownload /> Download Resume
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}

