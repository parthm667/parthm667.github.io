export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          Designed &amp; built by{' '}
          <a href="https://github.com/parthm667" target="_blank" rel="noreferrer">
            Parth Mhaske
          </a>
          {' '}Â· {new Date().getFullYear()} Â· Built with React + Vite
        </p>
      </div>
    </footer>
  )
}
