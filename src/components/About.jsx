import { Download, GraduationCap, HeartPulse, MapPin, Radar } from 'lucide-react'

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container about-grid">
        <div className="about-photo">
          <img
            src="https://images.squarespace-cdn.com/content/v1/5eb2c11998fcbd048420afd6/af4e19ac-8943-4aab-80f6-11f12eeeff0f/ParthMhaske.jpg?format=750w"
            alt="Parth Mhaske"
          />
        </div>

        <div className="about-copy">
          <p className="lbl">About</p>
          <h2 className="h2">Who I am</h2>

          <p>
            I am <strong>Parth Mhaske</strong>, a software engineer and student building across quant systems,
            robotics, and simulation-heavy research.
          </p>
          <p>
            I currently work as a Quant Analyst at the <a href="https://www.sifumd.org/our-team" target="_blank" rel="noreferrer">Smith Investment Fund</a>,
            where I focus on strategy research and implementation.
          </p>
          <p>
            My recent work spans low-latency trading infrastructure, autonomous robotics control, and computational
            modeling projects in academic research environments.
          </p>

          <div className="about-meta">
            <div className="meta-item">
              <span className="meta-icon"><MapPin size={15} /></span>
              <div>
                <label>Location</label>
                <span>College Park, Maryland</span>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon"><HeartPulse size={15} /></span>
              <div>
                <label>Status</label>
                <span>Looking for internship opportunities</span>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon"><GraduationCap size={15} /></span>
              <div>
                <label>Education</label>
                <span>University of Maryland - Computer Science</span>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon"><Radar size={15} /></span>
              <div>
                <label>Focus</label>
                <span>Robotics | Research Computing | Quant Systems</span>
              </div>
            </div>
          </div>

          <a href="/resume.pdf" download className="btn btn-p">
            <Download size={16} /> Resume
          </a>
        </div>
      </div>
    </section>
  )
}
