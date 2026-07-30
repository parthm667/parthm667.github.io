import { useEffect, useRef } from 'react'
import { initNoir } from './noir.js'

/* ════════════════════ NIGHT WORK ════════════════════
   A short film you scrub with your scroll. Everything is a pure
   function of scroll position, which is why it plays backward too.
   Under reduced motion the stage never mounts and the fallback
   below carries the same story in prose. */
export default function Film() {
  const filmRef = useRef(null)

  useEffect(() => {
    const handle = initNoir(filmRef.current)
    return () => handle?.stop?.()
  }, [])

  const skip = () => {
    document.getElementById('after-film')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="film"
      className="dr-film"
      ref={filmRef}
      aria-label="Night work: a short film about the roll. Scroll to play."
    >
      <div className="stage" aria-hidden="true">
        <canvas id="noir-bg"></canvas>

        <div className="world">
          {/* the roll arriving */}
          <svg className="n-canister" viewBox="0 0 120 74" fill="none">
            <rect x="14" y="8" width="86" height="58" rx="10" stroke="#8e8577" strokeWidth="2.5" fill="#14100d" />
            <rect x="100" y="22" width="10" height="30" rx="2" stroke="#8e8577" strokeWidth="2" fill="#14100d" />
            <rect x="24" y="18" width="66" height="38" rx="4" stroke="#5a5349" strokeWidth="1.5" />
            <text x="57" y="34" textAnchor="middle" fontFamily="Bebas, Impact" fontSize="13" fill="#ded7c9" letterSpacing="2">HP5 PLUS</text>
            <text x="57" y="48" textAnchor="middle" fontFamily="DrMono, monospace" fontSize="8" fill="#c1272d" letterSpacing="2">400</text>
          </svg>

          {/* the tray */}
          <div className="n-tray">
            <div className="n-liquid"></div>
            <div className="n-print"><canvas data-noir=""></canvas></div>
            <span className="n-tray-tag">PATTERSON TRAY · 8×10 · RC GLOSSY</span>
          </div>

          {/* finale: the night's prints on the line */}
          <div className="n-line">
            <i className="n-wire"></i>
            <div className="n-mini" style={{ '--d': '0s' }}>
              <canvas data-gen="heron" data-instant="" data-noir-mini=""></canvas>
            </div>
            <div className="n-mini" style={{ '--d': '-2.3s' }}>
              <canvas data-gen="rainwindow" data-instant="" data-noir-mini=""></canvas>
            </div>
            <div className="n-mini" style={{ '--d': '-4.1s' }}>
              <canvas data-gen="nightroad" data-instant="" data-noir-mini=""></canvas>
            </div>
          </div>
        </div>

        <div className="card" aria-hidden="true"></div>
        <div className="narr"></div>

        <div className="film-hud">
          <span className="dr-data">REEL 01</span>
          <span className="hud-scene dr-data"></span>
          <button className="hud-skip" type="button" onClick={skip}>Skip the night ↓</button>
        </div>

        <div className="n-leader"><canvas id="leader-cv"></canvas></div>
      </div>

      {/* the same story, for readers, crawlers and reduced motion */}
      <div className="dr-film-fallback dr-wrap">
        <p className="dr-stock">NIGHT WORK · INT. DARKROOM · 2:47 A.M.</p>
        <h1>Parth<br />Mhaske</h1>
        <p className="dr-lede">
          One night in the darkroom, developing a roll: lights out, eight seconds under the
          enlarger, then developer, stop, fix, wash, and the clothesline.
        </p>
        <p>
          Sixteen frames made it out of the tank. Nine of them are research and engineering work,
          from UAV landing simulations at UT Austin&rsquo;s MASS Lab to a High Injury Network
          generator that New Jersey towns use for federal safety grants. The data sheet and the
          contact sheet are both below.
        </p>
      </div>
    </section>
  )
}
