export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p className="colophon">
          Set in STIX Two Text &amp; IBM Plex Mono · Built with React ·
          © {new Date().getFullYear()} Parth Mhaske <span className="mark">※</span>
        </p>
      </div>
    </footer>
  )
}
