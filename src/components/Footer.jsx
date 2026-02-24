export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          Designed and built by{' '}
          <a href="https://github.com/parthm667" target="_blank" rel="noreferrer">
            Parth Mhaske
          </a>
          {' '}| {new Date().getFullYear()} | Built with React + Vite
        </p>
      </div>
    </footer>
  )
}
