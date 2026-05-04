import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

// Single-open accordion. Index 0 starts expanded so the section reads as content,
// not as a row of empty buttons.
export default function Accordion({ items }) {
  const [open, setOpen] = useState(0)

  return (
    <div className="rm-acc">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} className={`rm-acc-row ${isOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="rm-acc-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="rm-acc-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="rm-acc-question">{item.question}</span>
              <span className="rm-acc-icon" aria-hidden="true">
                {isOpen ? <Minus size={20} /> : <Plus size={20} />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  className="rm-acc-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="rm-acc-body-inner">
                    {item.answer}
                    {item.cite && <p className="rm-acc-cite">{item.cite}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
