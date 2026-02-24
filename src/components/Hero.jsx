import { useState, useEffect } from 'react'
import { FiGithub, FiLinkedin, FiMail, FiArrowRight } from 'react-icons/fi'

const roles = [
  'Quant Analyst at Smith Investment Fund',
  "Master's in Financial Risk Management",
  'Aspiring Quant Developer',
  'Seeking Summer Internship Roles',
]

export default function Hero() {
  const [roleIdx, setRoleIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const target = roles[roleIdx]
    let timeout

    if (!deleting && displayed.length < target.length) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 70)
    } else if (!deleting && displayed.length === target.length) {
      timeout = setTimeout(() => setDeleting(true), 2000)
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setRoleIdx(i => (i + 1) % roles.length)
    }

    return () => clearTimeout(timeout)
  }, [displayed, deleting, roleIdx])

  return (
    <section className="hero" id="hero">
      <div className="hero-grid" />
      <div className="hero-glow" />

      <div className="container hero-content">
        <p className="hero-hi">Hi, my name is</p>
        <h1 className="hero-name">Parth Mhaske.</h1>
        <div className="hero-role">
          <span>{displayed}</span>
          <span className="cursor" />
        </div>
        <p className="hero-bio">
          I build data-driven software across quant finance and full-stack engineering,
          from backtesting and options pricing to production web applications.
          I am based in College Park, Maryland and currently looking for internship opportunities.
        </p>

        <div className="hero-btns">
          <a href="#projects" className="btn btn-p">
            View Projects <FiArrowRight />
          </a>
          <a href="#contact" className="btn btn-o">
            Get in Touch
          </a>
        </div>

        <div className="hero-soc">
          <a href="https://github.com/parthm667" target="_blank" rel="noreferrer" className="soc-link" aria-label="GitHub">
            <FiGithub />
          </a>
          <a href="https://linkedin.com/in/parthmhaske667" target="_blank" rel="noreferrer" className="soc-link" aria-label="LinkedIn">
            <FiLinkedin />
          </a>
          <a href="mailto:mhaskep@terpmail.umd.edu" className="soc-link" aria-label="Email">
            <FiMail />
          </a>
        </div>
      </div>

      <div className="scroll-hint">
        <div className="mouse"><div className="wheel" /></div>
        <span>scroll</span>
      </div>
    </section>
  )
}
