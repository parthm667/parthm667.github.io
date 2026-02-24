import { useState } from 'react'
import { FiGithub, FiLinkedin, FiMail, FiSend } from 'react-icons/fi'

const contactLinks = [
  {
    icon: <FiMail />,
    label: 'Email',
    value: 'mhaskep@terpmail.umd.edu',
    href: 'mailto:mhaskep@terpmail.umd.edu',
  },
  {
    icon: <FiLinkedin />,
    label: 'LinkedIn',
    value: 'linkedin.com/in/parthmhaske667',
    href: 'https://linkedin.com/in/parthmhaske667',
  },
  {
    icon: <FiGithub />,
    label: 'GitHub',
    value: 'github.com/parthm667',
    href: 'https://github.com/parthm667',
  },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    const subject = encodeURIComponent(`Portfolio message from ${form.name}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    )
    window.location.href = `mailto:mhaskep@terpmail.umd.edu?subject=${subject}&body=${body}`
    setSent(true)
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <section className="section" id="contact">
      <div className="container">
        <p className="lbl">Get in touch</p>
        <h2 className="h2">Contact</h2>
        <p className="sub">
          Interested in collaboration, quant research, or engineering opportunities? Reach out.
        </p>

        <div className="contact-grid">
          <div className="ct-info">
            <h3>Let&apos;s build something together</h3>
            <p>
              I am currently open to conversations about quant developer roles, software engineering,
              and high-impact data-driven products.
            </p>

            <div className="ct-links">
              {contactLinks.map(cl => (
                <a key={cl.label} href={cl.href} target="_blank" rel="noreferrer" className="ct-link">
                  <span className="ct-icon">{cl.icon}</span>
                  <span>
                    <strong style={{ display: 'block', color: 'var(--txt)', fontSize: '.82rem' }}>{cl.label}</strong>
                    {cl.value}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '300px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '2rem', textAlign: 'center' }}>
              <span style={{ fontSize: '3rem' }}>Sent</span>
              <h3>Email draft opened</h3>
              <p style={{ color: 'var(--txt2)', fontSize: '.9rem' }}>Your default mail app should open with a pre-filled message.</p>
              <button className="btn btn-o" onClick={() => setSent(false)}>Send another</button>
            </div>
          ) : (
            <form className="ct-form" onSubmit={handleSubmit}>
              <div className="fg">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" placeholder="Jane Doe" value={form.name} onChange={handleChange} required />
              </div>
              <div className="fg">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="jane@example.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="fg">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="5" placeholder="Hi Parth, I wanted to chat about..." value={form.message} onChange={handleChange} required />
              </div>
              <button type="submit" className="btn btn-p">
                <FiSend /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
