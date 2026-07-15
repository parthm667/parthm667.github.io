import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Portfolio from './Portfolio'
import Remediation from './remediation/Remediation'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/public_remediation" element={<Remediation />} />
      </Routes>
    </BrowserRouter>
  )
}
