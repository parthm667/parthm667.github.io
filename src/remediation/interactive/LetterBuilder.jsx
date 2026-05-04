import { useMemo, useState } from 'react'
import { Copy, Check, Mail } from 'lucide-react'

const ROLES = [
  { v: 'resident', label: 'a resident' },
  { v: 'parent', label: 'a parent' },
  { v: 'commuter', label: 'a cyclist or pedestrian commuter' },
  { v: 'driver', label: 'a driver' },
  { v: 'business', label: 'a small-business owner' },
]

// Builds a council-ready letter from the form inputs.  Falls back to placeholder
// strings so the preview reads as real prose even before anything is typed.
function buildLetter({ town, road, role, name }) {
  const cleanTown = town?.trim() || 'our town'
  const cleanRoad = road?.trim()
  const roleLabel = ROLES.find(r => r.v === role)?.label || 'a resident'
  const cleanName = name?.trim() || '[Your name]'
  const roadClause = cleanRoad ? `, particularly along ${cleanRoad},` : ''

  return [
    `Dear members of the ${cleanTown === 'our town' ? '[your town]' : cleanTown} council,`,
    '',
    `I am writing as ${roleLabel} of ${cleanTown}. I am asking you to treat road safety as a design problem, not a driver-behavior problem${roadClause}. The streets in our town are built in ways that make crashes more likely, and more deadly when they happen.`,
    '',
    `The research is well established. Wide arterials with high design speeds concentrate fatalities; narrower lanes, daylit corners, and slower speed limits dramatically reduce them (Dumbaugh & Li, 2011; Marshall & Ferenchak, 2019). Hoboken, NJ has now gone seven years without a single traffic death using only high-visibility crosswalk paint, flexible posts at corners, a citywide 20 mph speed limit, and leading pedestrian intervals at signals. None of those measures was expensive. None of them was controversial. They were folded into ordinary repaving budgets.`,
    '',
    `I am asking the council to (1) commission a High Injury Network analysis for ${cleanTown}, (2) lower the default urban speed limit to 20 mph where pedestrians are present, and (3) adopt a continental crosswalk standard at the next repaving cycle. I would be glad to attend a future meeting to speak in support of these changes.`,
    '',
    'Sincerely,',
    cleanName,
  ].join('\n')
}

export default function LetterBuilder() {
  const [town, setTown] = useState('')
  const [road, setRoad] = useState('')
  const [role, setRole] = useState('resident')
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)

  const letter = useMemo(
    () => buildLetter({ town, road, role, name }),
    [town, road, role, name]
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(letter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Clipboard API blocked — fall back to selecting the preview text.
      const pre = document.querySelector('.rm-letter-text')
      if (pre) {
        const range = document.createRange()
        range.selectNodeContents(pre)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  }

  const subject = town?.trim()
    ? `Road safety in ${town.trim()}`
    : 'Road safety in our town'
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(letter)}`

  return (
    <div className="rm-letter">
      <div className="rm-letter-form">
        <label className="rm-fld">
          <span>Your town</span>
          <input
            type="text"
            value={town}
            onChange={e => setTown(e.target.value)}
            placeholder="Hoboken, Princeton, Trenton…"
            autoComplete="address-level2"
            spellCheck={false}
          />
        </label>
        <label className="rm-fld">
          <span>A road that worries you <em>(optional)</em></span>
          <input
            type="text"
            value={road}
            onChange={e => setRoad(e.target.value)}
            placeholder="Route 1 near the elementary school"
            spellCheck={false}
          />
        </label>
        <label className="rm-fld">
          <span>I'm writing as</span>
          <select value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => (
              <option key={r.v} value={r.v}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="rm-fld">
          <span>Your name <em>(optional)</em></span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder=""
            autoComplete="name"
            spellCheck={false}
          />
        </label>
      </div>

      <div className="rm-letter-preview">
        <p className="rm-mono rm-letter-preview-label">Live preview</p>
        <pre className="rm-letter-text">{letter}</pre>
      </div>

      <div className="rm-letter-actions">
        <button type="button" className="rm-letter-btn" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copied to clipboard' : 'Copy letter'}</span>
        </button>
        <a className="rm-letter-btn rm-letter-btn-bright" href={mailto}>
          <Mail size={16} />
          <span>Open in email</span>
        </a>
      </div>

      <p className="rm-letter-foot">
        The mail draft opens with no recipient. Paste in your council clerk's
        address (most NJ towns publish it on their public-meetings page).
      </p>
    </div>
  )
}
