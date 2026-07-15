const channels = [
  {
    label: 'Email',
    value: 'pmhaske@terpmail.umd.edu',
    href: 'mailto:pmhaske@terpmail.umd.edu',
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/parthmhaske667',
    href: 'https://linkedin.com/in/parthmhaske667',
  },
  {
    label: 'GitHub',
    value: 'github.com/parthm667',
    href: 'https://github.com/parthm667',
  },
  {
    label: 'Photography',
    value: 'parthmhaske.myportfolio.com',
    href: 'https://parthmhaske.myportfolio.com/',
  },
]

export default function Contact() {
  return (
    <section className="section contact" id="contact">
      <div className="container">
        <div className="sec-head" data-reveal>
          <p className="lbl">§ 04 · Contact</p>
          <h2 className="h2">Correspondence<span className="dot">.</span></h2>
        </div>
        <p className="sub" data-reveal>
          Open to internship roles, technical collaboration, and research-aligned engineering
          projects.
        </p>

        <div className="contact-grid">
          <div className="ct-lead" data-reveal>
            <p>
              Happy to talk about quant systems, robotics, or research engineering. The fastest way
              to reach me is a plain email:
            </p>
            <a className="mail-big" href="mailto:pmhaske@terpmail.umd.edu">
              pmhaske@terpmail.umd.edu
            </a>
          </div>

          <ul className="channel-list" data-reveal style={{ '--i': 1 }}>
            {channels.map(channel => (
              <li key={channel.label}>
                <a href={channel.href} target="_blank" rel="noreferrer">
                  <span className="ch-label">{channel.label}</span>
                  <span className="ch-value">{channel.value}</span>
                  <span className="ch-arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
