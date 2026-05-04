import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const SECTIONS = [
  ['pattern', 'The Pattern'],
  ['history', 'History'],
  ['hoboken', 'Hoboken'],
  ['counter', 'Counterarguments'],
  ['tool', 'The Tool'],
  ['action', 'Act'],
]

export default function RmNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`rm-nav ${scrolled ? 'is-scrolled' : ''}`} aria-label="Remediation navigation">
      <div className="rm-nav-inner">
        <Link to="/" className="rm-nav-back">
          <ArrowLeft size={14} />
          <span>Parth Mhaske</span>
        </Link>
        <button
          type="button"
          className="rm-nav-toggle"
          aria-expanded={open}
          aria-label="Toggle sections"
          onClick={() => setOpen(o => !o)}
        >
          {open ? 'Close' : 'Sections'}
        </button>
        <ul className={`rm-nav-links ${open ? 'is-open' : ''}`}>
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
