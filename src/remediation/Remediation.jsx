import { useEffect } from 'react'
import RmNav from './sections/RmNav'
import Hero from './sections/Hero'
import Pattern from './sections/Pattern'
import History from './sections/History'
import Hoboken from './sections/Hoboken'
import Counterargs from './sections/Counterargs'
import Action from './sections/Action'
import RmFooter from './sections/RmFooter'
import './remediation.css'

// Load the essay's fonts only when this route mounts.
const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,500;1,6..72,600&display=swap'

export default function Remediation() {
  useEffect(() => {
    document.title = 'Designed to be Dangerous / A Public Remediation'

    if (!document.querySelector('link[data-rm-fonts]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = FONTS
      link.dataset.rmFonts = '1'
      document.head.appendChild(link)
    }

    return () => { document.title = 'Parth Mhaske' }
  }, [])

  return (
    <div className="rm">
      <RmNav />
      <main>
        <Hero />
        <Pattern />
        <History />
        <Hoboken />
        <Counterargs />
        <Action />
      </main>
      <RmFooter />
    </div>
  )
}
