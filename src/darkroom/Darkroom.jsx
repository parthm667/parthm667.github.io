import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import './darkroom.css'
import Film from './Film.jsx'
import Hero from './Hero.jsx'
import Easel from './Easel.jsx'
import { Reel, Sheet, Index } from './Sheet.jsx'
import { DataSheet, Self, Work, Correspondence } from './Rooms.jsx'
import { ROLL_META } from './roll.js'
import {
  REDUCE,
  useConsoleNote,
  useDevelop,
  useDust,
  useLights,
  useLoupe,
  useNote,
  usePerf,
  useTilt,
} from './engine.js'

/* `keep` marks the three a stranger on a phone actually needs. The
   rest drop out of the rail below 560px. */
const NAV = [
  { href: '#data', label: 'Data' },
  { href: '#sheet', label: 'Sheet' },
  { href: '#work', label: 'Work', keep: true },
  { href: '#self', label: 'Self' },
  { href: '#contact', label: 'Contact', keep: true },
]

export default function Darkroom() {
  const rootRef = useRef(null)
  const sheetRef = useRef(null)
  const loupeRef = useRef(null)
  const dustRef = useRef(null)
  const trigger = useRef(null)

  const [openId, setOpenId] = useState(null)
  const [active, setActive] = useState('#data')
  const [lightsOn, toggleLights] = useLights()
  const note = useNote()

  /* The room is dark, and only this route is. Scoping it to the
     document element keeps /public_remediation on its own paper. */
  useEffect(() => {
    const root = document.documentElement
    root.dataset.room = 'darkroom'
    document.title = 'Parth Mhaske — Darkroom'
    return () => {
      delete root.dataset.room
      delete root.dataset.scroll
    }
  }, [])

  useDevelop(rootRef)
  useLoupe(sheetRef, loupeRef)
  usePerf(rootRef)
  useDust(dustRef)
  useTilt(rootRef)
  useConsoleNote()

  /* Which room the rail is pointing at. */
  useEffect(() => {
    const sections = [...document.querySelectorAll('#data, #sheet, #self, #work, #contact')]
    if (!sections.length) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: '-40% 0px -55% 0px' }
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  /* Opening a frame is an enlargement, so it gets a view transition:
     the negative on the sheet scales into the print and then
     develops. flushSync is what makes the DOM swap happen inside the
     transition rather than after it. */
  const open = useCallback((id) => {
    trigger.current = document.activeElement
    if (REDUCE() || !document.startViewTransition) return setOpenId(id)
    document.startViewTransition(() => flushSync(() => setOpenId(id)))
  }, [])

  const close = useCallback(() => {
    if (REDUCE() || !document.startViewTransition) return setOpenId(null)
    document.startViewTransition(() => flushSync(() => setOpenId(null)))
  }, [])

  /* Hold the page still behind the easel, and hand focus back to the
     frame that was clicked when it closes. */
  useEffect(() => {
    const root = document.documentElement
    if (openId) {
      root.dataset.scroll = 'lock'
      return
    }
    delete root.dataset.scroll
    const back = trigger.current
    trigger.current = null
    if (back && document.contains(back)) back.focus({ preventScroll: true })
  }, [openId])

  return (
    <div className="dr" ref={rootRef}>
      <a className="dr-skip" href="#sheet">Skip to the frames</a>

      <div className="dr-safelight" aria-hidden="true"></div>
      <div className="dr-grain" aria-hidden="true"></div>
      <div className="dr-vignette" aria-hidden="true"></div>
      <div className="dr-dust" ref={dustRef} aria-hidden="true"></div>

      <header className="dr-rail">
        <a className="dr-rail-id" href="#after-film">
          <b>PARTH MHASKE</b><span>DARKROOM</span>
        </a>

        <nav aria-label="Rooms">
          <ul className="dr-rail-nav">
            {NAV.map(({ href, label, keep }) => (
              <li key={href} className={keep ? 'keep' : undefined}>
                <a href={href} aria-current={active === href ? 'true' : undefined}>{label}</a>
              </li>
            ))}
            <li className="keep">
              <a href="/resume.pdf" target="_blank" rel="noreferrer">Résumé&thinsp;↗</a>
            </li>
          </ul>
        </nav>

        <button
          className="dr-switch"
          type="button"
          onClick={toggleLights}
          aria-pressed={lightsOn}
        >
          <span className="bulb" aria-hidden="true"></span>
          <span className="txt">{lightsOn ? 'Safelight' : 'Lights on'}</span>
        </button>
      </header>

      <main id="main">
        <Film />
        <Hero />
        <DataSheet />
        <Reel onOpen={open} />
        <Sheet onOpen={open} openId={openId} sheetRef={sheetRef} />
        <Index onOpen={open} />
        <Self />
        <Work onOpen={open} />
        <Correspondence />
      </main>

      <footer className="dr-foot">
        <div className="dr-wrap dr-foot-in">
          <p className="dr-data">
            {ROLL_META.shooter} · {ROLL_META.place} · ROLL 01 · {ROLL_META.frames} FRAMES ·
            DEVELOPED {ROLL_META.developed}
          </p>
          <p className="dr-data">
            Every photograph here was drawn in a canvas · no stock, no CDN, no analytics
          </p>
        </div>
      </footer>

      <canvas className="dr-loupe" ref={loupeRef} aria-hidden="true"></canvas>
      <p className={`dr-note${note ? ' show' : ''}`} aria-hidden="true">{note}</p>

      {openId && <Easel id={openId} onClose={close} onOpen={open} />}
    </div>
  )
}
