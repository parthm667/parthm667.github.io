import { SHEET_META, DATA_SHEET, RESULTS, BENCH, CHANNELS } from './content.js'
import { WORK, byId } from './roll.js'

/* DATA SHEET — the plain version.

   Every box of film ships with one of these, and this page needs one
   more than most: the rest of it is a photograph, and a stranger
   deciding whether to email should not have to interpret a
   photograph first. Facts in the order people ask for them, then
   five numbers, then the two links that matter. */
export function DataSheet() {
  return (
    <section className="dr-room dr-wrap" id="data">
      <div className="dr-room-head">
        <p className="dr-stock">{SHEET_META}</p>
        <h2>Data sheet</h2>
      </div>

      <dl className="dr-datasheet">
        {DATA_SHEET.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="dr-sr">Selected results</h3>
      <ol className="dr-results">
        {RESULTS.map(([figure, what, note]) => (
          <li key={figure}>
            <span className="dr-res-n">{figure}</span>
            <span className="dr-res-w">{what}</span>
            <span className="dr-res-note">{note}</span>
          </li>
        ))}
      </ol>

      <p className="dr-self-links">
        <a className="dr-btn" href="/resume.pdf" target="_blank" rel="noreferrer">Résumé ↗</a>
        <a className="dr-btn ghost" href="mailto:pmhaske@umd.edu">Email me</a>
        <a className="dr-btn ghost" href="#work">The nine work frames ↓</a>
      </p>
    </section>
  )
}

/* SELF — frame 1, printed inline rather than in the enlarger, plus
   what is actually on the bench this month. The paragraphs come
   from the roll so there is one copy of the text. */
export function Self() {
  const self = byId('self')

  return (
    <section className="dr-room dr-wrap" id="self">
      <div className="dr-room-head">
        <p className="dr-stock">FRAME 1 · SELF · {self.role}</p>
        <h2>Who is holding the camera</h2>
      </div>

      <div className="dr-self">
        <div>
          <div className="dr-print-mount dr-tilt">
            <canvas data-gen="portrait" data-slow="" aria-label="Parth Mhaske"></canvas>
            <p className="cap"><span>FRAME 1</span><span>HP5+ · f/2 · 1/60</span></p>
            <span className="dr-hand dr-tag" aria-hidden="true">the only one<br />I didn&rsquo;t take</span>
          </div>
        </div>

        <div>
          <p className="dr-lede">{self.print.deck}</p>
          {self.print.body.map((para) => <p key={para.slice(0, 24)}>{para}</p>)}

          <h3 className="dr-sr">On the bench, July 2026</h3>
          <dl className="dr-bench">
            {BENCH.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {/* The apparatus list used to live here too, word for word
              the same as "Works in" and "Methods" on the data sheet
              two screens up. One copy, in the place people scan. */}

          <p className="dr-self-links">
            <a className="dr-btn" href="/resume.pdf" target="_blank" rel="noreferrer">Résumé ↗</a>
            <a className="dr-btn ghost" href="mailto:pmhaske@umd.edu">Email</a>
            <a className="dr-btn ghost" href="https://github.com/parthm667" target="_blank" rel="noreferrer">GitHub ↗</a>
          </p>
        </div>
      </div>
    </section>
  )
}

/* WORK — the nine research and engineering frames, written out.
   The contact sheet is for looking; this is the table a recruiter
   reads. Each row leads with what the work was and who it was for,
   and enlarges into the numbers and the part that went wrong. */
export function Work({ onOpen }) {
  return (
    <section className="dr-room dr-wrap" id="work">
      <div className="dr-room-head">
        <p className="dr-stock">ROLL 01 · NINE FRAMES · RESEARCH AND ENGINEERING</p>
        <h2>The work on this roll</h2>
      </div>
      <p>
        Nine of the sixteen exposures are research or engineering work, listed in the order they
        happened. Enlarge any row for the method, the numbers, and what went wrong.
      </p>

      <div className="dr-ledger">
        {WORK.map((f) => (
          <button className="dr-entry" type="button" key={f.id} onClick={() => onOpen(f.id)}>
            <span className="dr-entry-n">{f.n}</span>
            <span>
              <span className="dr-entry-t">{f.subject}</span>
              <span className="dr-entry-when">{f.role}</span>
            </span>
            <span>
              <span className="dr-entry-deck">{f.print.deck}</span>
              {f.stack && <span className="dr-entry-stack">{f.stack.join(' · ')}</span>}
            </span>
            <span className="dr-entry-go">Enlarge ↗</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/* CORRESPONDENCE. */
export function Correspondence() {
  return (
    <section className="dr-room dr-wrap" id="contact">
      <div className="dr-room-head">
        <p className="dr-stock">FRAME 16 · UNEXPOSED · OPEN</p>
        <h2>Correspondence</h2>
      </div>
      <p className="dr-lede">
        I am looking for a summer 2028 internship in quantitative research or systems
        engineering, and I am happy to talk before then.
      </p>
      <p>
        Email is the fastest way to reach me and the one I actually answer. The résumé is in the
        rail, and the nine work frames above have the numbers in them.
      </p>
      <p>
        <a className="dr-mail-big" href="mailto:pmhaske@umd.edu">pmhaske@umd.edu</a>
      </p>

      <ul className="dr-channels">
        {CHANNELS.map(([label, value, href]) => (
          <li key={label}>
            <a href={href} target="_blank" rel="noreferrer">
              <span className="dr-ch-label">{label}</span>
              <span className="dr-ch-value">{value}</span>
              <span className="dr-ch-arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
