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

export default function Remediation() {
  useEffect(() => {
    document.title = 'Designed to Fail / A Public Remediation'
    return () => { document.title = 'parthm667.github.io' }
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
