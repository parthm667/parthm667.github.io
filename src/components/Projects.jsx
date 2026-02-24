import { FiGithub, FiExternalLink } from 'react-icons/fi'

const projects = [
  {
    icon: 'ðŸ“ˆ',
    title: 'Fast Crypto Options Pricing',
    description:
      'High-performance options pricing engine for crypto derivatives using Black-Scholes and Monte Carlo simulation. Built in Python with optimized NumPy vectorisation.',
    stack: ['Python', 'NumPy', 'FastAPI', 'React'],
    github: 'https://github.com/parthm667/Fast-Crypto-Options-Pricing',
    live: '',
  },
  {
    icon: 'ðŸ¤–',
    title: 'Tau-Bench Agent',
    description:
      'Autonomous task-completion agent evaluated on the tau-bench benchmark. Implements tool-use, multi-step planning, and self-correction for real-world tasks.',
    stack: ['Python', 'LLM APIs', 'Docker'],
    github: 'https://github.com/parthm667',
    live: '',
  },
  {
    icon: 'ðŸŒ',
    title: 'Full-Stack App',
    description:
      'Production-ready full-stack web application with authentication, real-time updates, and a clean component-driven UI.',
    stack: ['React', 'Node.js', 'PostgreSQL', 'Express'],
    github: 'https://github.com/parthm667',
    live: '',
  },
  {
    icon: 'ðŸ“¡',
    title: 'Alpha Competition Model',
    description:
      'Quantitative alpha signal research for competition. Explores cross-sectional momentum, statistical arbitrage, and factor models.',
    stack: ['Python', 'Pandas', 'SciPy', 'Matplotlib'],
    github: 'https://github.com/parthm667',
    live: '',
  },
  {
    icon: 'ðŸ”¬',
    title: 'Popularity Bias Sim',
    description:
      'Simulation study of popularity bias in recommendation systems. Models feedback loops and filter-bubble effects.',
    stack: ['Python', 'NumPy', 'Jupyter'],
    github: 'https://github.com/parthm667/popularitybiassim',
    live: '',
  },
  {
    icon: 'ðŸ ',
    title: 'Personal Website',
    description:
      'This site! Built with React + Vite, dark-themed, deployed to GitHub Pages. Fully custom â€” no templates.',
    stack: ['React', 'Vite', 'CSS', 'GitHub Pages'],
    github: 'https://github.com/parthm667/parthm667.github.io',
    live: 'https://parthm667.github.io',
  },
]

export default function Projects() {
  return (
    <section className="section proj-bg" id="projects">
      <div className="container">
        <p className="lbl">Things I have built</p>
        <h2 className="h2">Projects</h2>
        <p className="sub">
          A selection of projects I&apos;ve worked on â€” from quant tools to full-stack apps.
        </p>

        <div className="proj-grid">
          {projects.map(proj => (
            <div className="proj-card" key={proj.title}>
              <div className="proj-head">
                <span className="proj-icon">{proj.icon}</span>
                <div className="proj-links">
                  {proj.github && (
                    <a href={proj.github} target="_blank" rel="noreferrer" className="proj-link" aria-label="GitHub">
                      <FiGithub />
                    </a>
                  )}
                  {proj.live && (
                    <a href={proj.live} target="_blank" rel="noreferrer" className="proj-link" aria-label="Live">
                      <FiExternalLink />
                    </a>
                  )}
                </div>
              </div>
              <h3>{proj.title}</h3>
              <p>{proj.description}</p>
              <div className="proj-stack">
                {proj.stack.map(s => <span className="tag" key={s}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
