import { Link } from 'react-router-dom'

export default function RmFooter() {
  return (
    <footer className="rm-footer">
      <div className="rm-footer-inner">
        <p className="rm-footer-mark">
          <span className="rm-mono">Designed to Fail</span>
          <span className="rm-footer-rule" aria-hidden="true" />
          <span className="rm-footer-byline">
            Built &amp; written by Parth Mhaske · {new Date().getFullYear()}
          </span>
        </p>
        <p className="rm-footer-context">
          A public remediation of an academic position paper on American road
          safety. ENGL 101, Spring 2026 · University of Maryland.
        </p>
        <p className="rm-footer-links">
          <Link to="/">← parthm667.github.io</Link>
        </p>
      </div>
    </footer>
  )
}
