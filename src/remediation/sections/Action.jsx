import { motion } from 'framer-motion'
import { Megaphone, Share2 } from 'lucide-react'
import LetterBuilder from '../interactive/LetterBuilder'

const SHARE_URL = 'https://parthm667.github.io/public_remediation'
const SHARE_TEXT = 'American road design kills 7,500+ pedestrians a year. Hoboken proves the fix is cheap. Read the case:'

export default function Action() {
  return (
    <section id="action" className="rm-section rm-action">
      <div className="rm-action-head">
        <p className="rm-mono rm-section-label">06 / Take action</p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7 }}
        >
          The next move<br />
          is yours.
        </motion.h2>
      </div>

      <div className="rm-action-tracks">
        {/* RESIDENT — letter builder is the centerpiece */}
        <motion.article
          className="rm-track rm-track-resident"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6 }}
        >
          <header>
            <Megaphone size={28} strokeWidth={1.5} />
            <p className="rm-mono">For residents</p>
          </header>
          <h3>Build a public-comment letter in 60 seconds.</h3>
          <p>
            Read it at the next council meeting. Or paste it into an email to
            your council clerk. The arguments and citations are pre-loaded. You
            bring your town and your name. Edit anything you'd like before
            sending.
          </p>
          <LetterBuilder />
        </motion.article>

        {/* EVERYONE — slim share row */}
        <motion.article
          className="rm-track rm-track-share"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <header>
            <Share2 size={28} strokeWidth={1.5} />
            <p className="rm-mono">For everyone</p>
          </header>
          <h3>Share the case. Then write your state rep.</h3>
          <p>
            State action usually moves faster than federal action. New Jersey
            is considering reauthorization of the <em>Sarah Debbink Langenkamp
            Active Transportation Safety Act</em>. Call the office of your
            state senator and assembly member to tell them you support it.
          </p>
          <ul className="rm-share-row">
            <li>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter / X
              </a>
            </li>
            <li>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href={`mailto:?subject=${encodeURIComponent('Designed to Fail')}&body=${encodeURIComponent(SHARE_TEXT + '\n\n' + SHARE_URL)}`}
              >
                Email
              </a>
            </li>
            <li>
              <a
                href="https://www.njleg.state.nj.us/legislative-roster"
                target="_blank"
                rel="noopener noreferrer"
              >
                Find your NJ rep ↗
              </a>
            </li>
          </ul>
        </motion.article>
      </div>
    </section>
  )
}
