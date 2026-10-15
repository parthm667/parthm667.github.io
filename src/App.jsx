import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Desktop from './desktop/Desktop'
import Remediation from './remediation/Remediation'

const ResumePicker = lazy(() => import('./resume-picker/ResumePicker'))

// Reset scroll between pages, preserving reload position and anchor links.
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const firstMount = useRef(true)

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false
      return
    }
    if (hash) return

    const root = document.documentElement
    const previous = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    root.style.scrollBehavior = previous
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Desktop />} />
        <Route path="/public_remediation" element={<Remediation />} />
        <Route path="/resume-picker" element={<Suspense fallback={<p role="status">Loading resume picker…</p>}><ResumePicker /></Suspense>} />
      </Routes>
    </BrowserRouter>
  )
}
