import { Camera, Download, GraduationCap, HeartPulse, MapPin, Radar } from 'lucide-react'

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container about-grid">
        <div className="about-photo">
          <img
            src="/parth-photo.webp"
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
            I currently work as an SWE @ Stealth Startup (YC-backed), where I focus on AI Safety and Alignment.
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
                <span>University of Maryland - Computer Science and Applied Mathematics</span>
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

          <div className="about-actions">
            <a href="/resume.pdf" download className="btn btn-p">
              <Download size={16} /> Resume
            </a>
            <a href="https://parthmhaske.myportfolio.com/" target="_blank" rel="noreferrer" className="btn btn-o">
              <Camera size={16} /> Photo Portfolio
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
