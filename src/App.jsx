import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Portfolio from './Portfolio'
import Remediation from './remediation/Remediation'
<<<<<<< HEAD
=======
import './index.css'
>>>>>>> 31c84abe0141aba58f086733873f14baf308cd1e

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
