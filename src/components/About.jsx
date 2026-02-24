import { FiDownload } from 'react-icons/fi'

export default function About() {
  return (
    <section className="section about-bg" id="about">
      <div className="container">
        <div className="about-grid">

          {/* Avatar */}
          <div className="av-wrap">
            <div className="av-frame">
              <img
                src="https://github.com/parthm667.png"
                alt="Parth Mhaske"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
              />
            </div>
            <div className="av-corner" />
          </div>

          {/* Text */}
          <div className="about-txt">
            <p className="lbl">About Me</p>
            <h2 className="h2">Who I am</h2>

            <p>
              Hey! I&apos;m <strong>Parth Mhaske</strong>, a software engineer and student who loves
              building full-stack web applications, quantitative tools, and anything
              that sits at the intersection of code and creativity.
            </p>
            <p>
              I enjoy working across the stack &mdash; designing clean UIs in React, building
              robust APIs, and digging into data. When I&apos;m not coding, you&apos;ll
              find me reading about markets, working on side projects, or cycling.
            </p>
            <p>
              I&apos;m currently open to <strong>internship and new grad roles</strong> in
              software engineering and fintech.
            </p>

            <div className="meta-grid">
              <div className="meta-item">
                <label>Location</label>
                <span>College Park, MD</span>
              </div>
              <div className="meta-item">
                <label>Status</label>
                <span>Open to work ✅</span>
              </div>
              <div className="meta-item">
                <label>Education</label>
                <span>B.S. CS &amp; Math &middot; UMD</span>
              </div>
              <div className="meta-item">
                <label>Interests</label>
                <span>Fintech &middot; OSS &middot; Cycling</span>
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
