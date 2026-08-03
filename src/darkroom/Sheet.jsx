import { useRef } from 'react'
import { useReel } from './engine.js'
import { ROLL, STRIPS, ROLL_META } from './roll.js'

/* The reel: the whole roll as negatives, scrubbing sideways with
   the page scroll and going positive under the cursor. Decorative —
   every frame in it is reachable from the sheet and the index
   below, so it stays out of the accessibility tree. */
export function Reel({ onOpen }) {
  const trackRef = useRef(null)
  useReel(trackRef)

  return (
    <section className="dr-reel" aria-hidden="true">
      <div className="dr-reel-perf top"></div>
      <div className="dr-reel-track" ref={trackRef}>
        {ROLL.map((f) => (
          <button className="dr-neg" key={f.id} type="button" tabIndex={-1} onClick={() => onOpen(f.id)}>
            <canvas data-gen={f.gen} data-instant="" width="140" height="93"></canvas>
            <span className="dr-neg-n">{f.n}</span>
          </button>
        ))}
        <span className="dr-reel-edge">MHASKE SAFETY FILM · ROLL 01 · →</span>
      </div>
      <div className="dr-reel-perf"></div>
    </section>
  )
}

/* The contact sheet. Four strips of four, sprocket holes above and
   below each, keepers circled in grease pencil once they finish
   developing. Clicking a frame does not navigate so much as
   enlarge it. */
export function Sheet({ onOpen, openId, sheetRef }) {
  return (
    <section className="dr-sheet dr-wrap" id="sheet" aria-labelledby="sheet-h" ref={sheetRef}>
      {/* People read these strips as photographs of things and then
          find out they are not, which reads as a bait rather than as
          the drawing it is. Saying so up front costs four lines and
          buys the whole conceit back. */}
      <div className="dr-room-head dr-sheet-head">
        <p className="dr-stock">CONTACT SHEET · ROLL 01 · {ROLL_META.frames} FRAMES</p>
        <h2 id="sheet-h">The roll</h2>
        <p>
          Sixteen frames in the order they happened. Click any of them and it enlarges into the
          full write-up: what the work was, the numbers, and the part that went wrong.
        </p>
        <p className="dr-sheet-disclosure">
          None of these are photographs. Every frame is drawn from scratch in a canvas when the
          page loads — no image files, no stock, no CDN. The photographs I actually take are at{' '}
          <a href="https://parthmhaske.myportfolio.com/" target="_blank" rel="noreferrer">
            parthmhaske.myportfolio.com&nbsp;↗
          </a>
        </p>
      </div>

      {STRIPS.map((strip, si) => (
        <div className="dr-strip" key={si}>
          <div className="dr-perf" aria-hidden="true"></div>
          <div className="dr-strip-frames">
            {strip.map((f) => (
              <button
                className="frame"
                type="button"
                key={f.id}
                data-frame={f.id}
                onClick={() => onOpen(f.id)}
                style={{ viewTransitionName: openId === f.id ? 'none' : `vt-${f.id}` }}
                aria-label={`Frame ${f.n}, ${f.kind}: ${f.title}. Print it larger.`}
              >
                <span className="frame-n" aria-hidden="true">{f.n}</span>
                <canvas className="frame-canvas" data-gen={f.gen} aria-hidden="true"></canvas>
                {f.keeper && (
                  <svg className="china" viewBox="0 0 100 68" aria-hidden="true" preserveAspectRatio="none">
                    <path />
                  </svg>
                )}
                {f.damaged && <span className="frame-x" aria-hidden="true"></span>}
                <span className="frame-label">
                  <span className="frame-kind">{f.kind}</span>
                  <span className="frame-title">{f.title}</span>
                  <span className="frame-exp">{f.exposure}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="dr-perf" aria-hidden="true"></div>
          <p className="dr-strip-edge" aria-hidden="true">
            <span>{ROLL_META.stock}</span>
            <span>{strip.map((f) => f.n).join(' · ')}</span>
            <span>ROLL 01 · STRIP {si + 1}</span>
          </p>
          {strip.map((f, fi) =>
            f.note ? (
              <span
                className="dr-china-note dr-hand"
                data-for={f.id}
                key={f.id}
                style={{ '--col': fi }}
                aria-hidden="true"
              >
                {f.note}
              </span>
            ) : null
          )}
        </div>
      ))}
    </section>
  )
}

/* The same roll, written out. A contact sheet is for looking; this
   is for reading, and for anything that cannot see the canvases.

   Folded shut by default. It is the third listing of the same
   sixteen frames — after the sheet and the work ledger — and a
   reader who has scrolled this far has met them twice already.
   <details> keeps the text in the document for screen readers and
   crawlers while costing a sighted reader one line. */
export function Index({ onOpen }) {
  return (
    <details className="dr-wrap dr-index">
      <summary>Index of exposures — all sixteen, as a list</summary>
      <ol className="dr-exposures">
        {ROLL.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => onOpen(f.id)}>
              <span className="dr-ex-n">{f.n}</span>
              <span className="dr-ex-t">{f.title}</span>
              <span className="dr-ex-k">{f.kind}</span>
              <span className="dr-ex-e">{f.exposure}</span>
            </button>
          </li>
        ))}
      </ol>
    </details>
  )
}
