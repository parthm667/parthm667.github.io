import { ArrowUpRight, CheckCircle2, Github, Linkedin, Mail, Send } from 'lucide-react'
import { useState } from 'react'

const contactLinks = [
  {
    icon: Mail,
    label: 'Email',
    value: 'pmhaske@terpmail.umd.edu',
    href: 'mailto:pmhaske@terpmail.umd.edu',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    value: 'linkedin.com/in/parthmhaske667',
    href: 'https://linkedin.com/in/parthmhaske667',
  },
  {
    icon: Github,
    label: 'GitHub',
    value: 'github.com/parthm667',
    href: 'https://github.com/parthm667',
  },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }))

  const handleSubmit = event => {
    event.preventDefault()
    const subject = encodeURIComponent(`Portfolio message from ${form.name}`)
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`)
    window.location.href = `mailto:pmhaske@terpmail.umd.edu?subject=${subject}&body=${body}`
    setSent(true)
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <section className="section contact" id="contact">
      <div className="container">
        <p className="lbl">Contact</p>
        <h2 className="h2">Lets connect</h2>
        <p className="sub">
          Open to internship roles, technical collaboration, and research-aligned engineering projects.
        </p>

        <div className="contact-grid">
          <div className="ct-info">
            <h3>Reach out directly</h3>
            <p>
              If you are hiring for internships or want to discuss work across quant systems, robotics, or research,
              I am happy to connect.
            </p>

            <div className="ct-links">
              {contactLinks.map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="ct-link">
                  <span className="ct-icon"><link.icon size={16} /></span>
                  <span className="ct-text">
                    <strong>{link.label}</strong>
                    {link.value}
                  </span>
                  <ArrowUpRight size={15} />
                </a>
              ))}
            </div>
          </div>

          {sent ? (
            <div className="sent-card">
              <CheckCircle2 size={26} />
              <h3>Email draft opened</h3>
              <p>Your default mail app should open with your message prefilled.</p>
              <button type="button" className="btn btn-o" onClick={() => setSent(false)}>
                Send another
              </button>
            </div>
          ) : (
            <form className="ct-form" onSubmit={handleSubmit}>
              <div className="fg">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="fg">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="fg">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="6" placeholder="What would you like to discuss?" value={form.message} onChange={handleChange} required />
              </div>
              <button type="submit" className="btn btn-p">
                <Send size={16} /> Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
