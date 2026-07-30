import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useOneShot, useTilt } from './engine.js'
import { ROLL, byId } from './roll.js'

/* Three kinds of destination: another site, a file, and the one
   internal route this page links to (the street-design essay, which
   frames 4, 6 and 8 all point at). Only the first two open a tab. */
const isSite = (href) => /^https?:/.test(href) || href.endsWith('.pdf')
const isRoute = (href) => href.startsWith('/') && !href.endsWith('.pdf')

function PrintLink({ label, href }) {
  if (isRoute(href)) {
    return <Link className="dr-btn ghost" to={href}>{label} →</Link>
  }
  return (
    <a
      className="dr-btn ghost"
      href={href}
      {...(isSite(href) ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {label}{isSite(href) ? ' ↗' : ''}
    </a>
  )
}

/* THE ENLARGEMENT.

   A frame on the sheet is 3 cm across; this is what the enlarger is
   for. The negative grows into the print — that morph is a view
   transition on a shared name — and only then develops, slowly,
   because a big print takes longer than a contact sheet. */
export default function Easel({ id, onClose, onOpen }) {
  const frame = byId(id)
  const canvasRef = useRef(null)
  const easelRef = useRef(null)
  const closeRef = useRef(null)
  const scrollerRef = useRef(null)

  useOneShot(canvasRef, frame?.gen, { slow: true, key: id })
  useTilt(easelRef, [id])

  const idx = ROLL.indexOf(frame)
  const prev = ROLL[(idx - 1 + ROLL.length) % ROLL.length]
  const next = ROLL[(idx + 1) % ROLL.length]

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [id])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key === 'ArrowLeft') onOpen(prev.id)
      if (e.key === 'ArrowRight') onOpen(next.id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onOpen, prev.id, next.id])

  if (!frame) return null
  const p = frame.print

  return (
    <div
      className="dr-overlay"
      ref={scrollerRef}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <article
        className="dr-easel"
        ref={easelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dr-easel-title"
      >
        <button className="dr-easel-close" type="button" onClick={onClose} ref={closeRef}>
          Back to the sheet ✕
        </button>

        <p className="dr-stock">FRAME {frame.n} · {frame.kind} · {frame.role}</p>
        <h2 id="dr-easel-title">{frame.subject}</h2>
        <p className="dr-lede">{p.deck}</p>

        <figure className="dr-big-print dr-tilt" style={{ viewTransitionName: `vt-${frame.id}` }}>
          <canvas ref={canvasRef} data-gen={frame.gen} aria-label={frame.title}></canvas>
          <figcaption>
            <span>&ldquo;{frame.title}&rdquo;</span>
            <span>{frame.exposure}</span>
          </figcaption>
        </figure>

        <dl className="dr-stats">
          {p.stat.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <div className="dr-easel-body">
          {p.body.map((para) => <p key={para.slice(0, 24)}>{para}</p>)}
        </div>

        {p.wrong && (
          <section className="dr-wrong">
            <h3>What went wrong</h3>
            <p>{p.wrong}</p>
          </section>
        )}

        {p.links.length > 0 && (
          <p className="dr-easel-links">
            {p.links.map(([label, href]) => (
              <PrintLink key={href} label={label} href={href} />
            ))}
          </p>
        )}

        <nav className="dr-easel-nav" aria-label="Other frames">
          <button type="button" onClick={() => onOpen(prev.id)}>
            <span className="dr-data">← FRAME {prev.n}</span>
            <span>{prev.title}</span>
          </button>
          <button type="button" className="r" onClick={() => onOpen(next.id)}>
            <span className="dr-data">FRAME {next.n} →</span>
            <span>{next.title}</span>
          </button>
        </nav>
      </article>
    </div>
  )
}
