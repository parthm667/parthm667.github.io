import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Darkroom from './darkroom/Darkroom'
import Remediation from './remediation/Remediation'

/* Both routes are long, and each is reachable from the other by a
   client-side link: the cycling frames go to the essay, and the
   essay's back-link returns. React Router does not reset the scroll
   offset on navigation, so without this you leave the darkroom nine
   thousand pixels down and arrive at the essay's footer.

   Two things it deliberately does not do. It skips the first mount,
   so a reload keeps the browser's own scroll restoration; and it
   skips any navigation carrying a hash, so the rail's #work and the
   essay's #history anchors still land where they point. The inline
   scroll-behavior override is there because the darkroom sets smooth
   scrolling on <html>, and a smooth trip back up from 9,000px is a
   long one. */
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
        <Route path="/" element={<Darkroom />} />
        <Route path="/public_remediation" element={<Remediation />} />
      </Routes>
    </BrowserRouter>
  )
}
