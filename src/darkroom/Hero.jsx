import { useRef } from 'react'
import { useMotes } from './engine.js'
import { ROLL_META } from './roll.js'

/* The enlarger: line art, throwing its beam down and to the left
   across the title. Everything in it is on a slow loop — the lamp
   LED, the beam's breath, the crank turning once every nine
   seconds — because a room that is perfectly still reads as a
   picture of a room. */
export default function Hero() {
  const motesRef = useRef(null)
  useMotes(motesRef)

  return (
    <section className="dr-hero dr-wrap" id="top">
      <svg className="dr-enlarger" viewBox="-560 0 985 660" aria-hidden="true" fill="none">
        <defs>
          <linearGradient id="dr-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd9b8" stopOpacity=".34" />
            <stop offset=".55" stopColor="#ffcfae" stopOpacity=".11" />
            <stop offset="1" stopColor="#ffcfae" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dr-beamcore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3e2" stopOpacity=".5" />
            <stop offset="1" stopColor="#fff3e2" stopOpacity="0" />
          </linearGradient>
          <clipPath id="dr-beamclip"><polygon points="250,266 294,266 250,660 -500,660" /></clipPath>
        </defs>

        {/* column + base arm */}
        <line x1="366" y1="34" x2="366" y2="660" stroke="#5a5349" strokeWidth="3" />
        <line x1="366" y1="100" x2="300" y2="100" stroke="#5a5349" strokeWidth="3" />
        <circle cx="366" cy="100" r="7" stroke="#5a5349" strokeWidth="2" />
        <g className="crank">
          <circle cx="392" cy="158" r="9" stroke="#5a5349" strokeWidth="2" />
          <line x1="392" y1="149" x2="392" y2="167" stroke="#5a5349" strokeWidth="2" />
        </g>

        {/* lamphouse */}
        <g className="head">
          <rect x="196" y="48" width="152" height="86" rx="8" stroke="#8e8577" strokeWidth="2.5" />
          <path d="M212 48 v-14 h24" stroke="#8e8577" strokeWidth="2" />
          <line x1="214" y1="68" x2="330" y2="68" stroke="#5a5349" strokeWidth="1.5" />
          <line x1="214" y1="80" x2="330" y2="80" stroke="#5a5349" strokeWidth="1.5" />
          <circle cx="336" cy="122" r="3.5" fill="#c1272d" className="led" />
          {/* negative carrier */}
          <rect x="216" y="134" width="112" height="14" stroke="#8e8577" strokeWidth="2" />
          <line x1="204" y1="141" x2="216" y2="141" stroke="#8e8577" strokeWidth="2" />
          {/* bellows */}
          <path
            d="M224 148 L232 172 L228 190 L236 208 L232 224 L312 224 L308 208 L316 190 L312 172 L320 148"
            stroke="#8e8577"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* lens */}
          <rect x="252" y="224" width="40" height="26" rx="4" stroke="#8e8577" strokeWidth="2.5" />
          <circle cx="272" cy="258" r="7" stroke="#8e8577" strokeWidth="2" />
          {/* red filter, swung in under the lens */}
          <g className="filter-arm">
            <line x1="296" y1="246" x2="314" y2="236" stroke="#8e8577" strokeWidth="2" />
            <circle cx="294" cy="254" r="12" stroke="#c1272d" strokeWidth="2.5" fill="rgba(193,39,45,.28)" />
          </g>
        </g>

        {/* the throw: down and left, across the title */}
        <g className="beamwrap">
          <polygon className="beam-poly" points="250,266 294,266 250,660 -500,660" fill="url(#dr-beam)" />
          <polygon className="beam-poly core" points="258,266 286,266 120,660 -260,660" fill="url(#dr-beamcore)" opacity=".35" />
          <g clipPath="url(#dr-beamclip)" className="motes" ref={motesRef}></g>
        </g>
      </svg>

      {/* The eyebrow used to be film stock and ISO. Charming, and no
          help at all to someone who does not yet know whose page this
          is — so the plain facts go first and the stock goes to the
          data line underneath. */}
      <div className="dr-hero-copy">
        <p className="dr-stock">
          SOFTWARE ENGINEERING INTERN AT CORSHA · UMD, CS + APPLIED MATH, CLASS OF 2028
        </p>
        <h1 className="lit">Parth<br />Mhaske</h1>
        <p className="dr-lede">
          I build simulations for systems that have to decide before they know enough — drones
          landing in wind they can only estimate, robots driving mazes they cannot see, order books
          with microseconds to commit.
        </p>
        <p>
          Right now: backend work on machine-identity authentication at <strong>Corsha</strong>.
          Before that, UAV landing dynamics at UT Austin&rsquo;s MASS Lab, stochastic ranking models
          in a computational social dynamics lab, and circumstellar dust scattering in
          Maryland&rsquo;s astronomy department. Looking for <strong>summer 2028 internships</strong> in
          quantitative research or systems engineering.
        </p>

        <p className="dr-self-links">
          <a className="dr-btn" href="#work">The nine work frames ↓</a>
          <a className="dr-btn ghost" href="/resume.pdf" target="_blank" rel="noreferrer">Résumé ↗</a>
          <a className="dr-btn ghost" href="mailto:pmhaske@umd.edu">pmhaske@umd.edu</a>
        </p>

        {/* Friends who opened this cold could not tell what they were
            looking at, and the answer was buried at the bottom of the
            page. It is two sentences. It goes at the top. */}
        <p className="dr-premise">
          <b>What this is:</b> a portfolio built as one roll of black-and-white film — sixteen
          exposures in the order they happened, which is why a heron sits next to an order book.
          Every image on it is drawn in code at the moment you load it, not photographed; the real
          photographs live at{' '}
          <a href="https://parthmhaske.myportfolio.com/" target="_blank" rel="noreferrer">
            parthmhaske.myportfolio.com
          </a>.
        </p>

        <p className="dr-sheet-hint dr-data">
          {ROLL_META.stock} · ISO {ROLL_META.iso} · DEVELOPED {ROLL_META.developed} · hover a frame
          for the loupe · click one and it enlarges
        </p>
      </div>
    </section>
  )
}
