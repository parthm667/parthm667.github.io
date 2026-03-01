export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          <a href="https://github.com/parthm667" target="_blank" rel="noreferrer">Parth Mhaske</a>
          {' | '}
          <a href="https://parthmhaske.myportfolio.com/" target="_blank" rel="noreferrer">Photography Portfolio</a>
          {' | '}
          {new Date().getFullYear()} | Built with React and Vite
        </p>
      </div>
    </footer>
  )
}