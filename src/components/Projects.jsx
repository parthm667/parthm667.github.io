import { FiGithub, FiExternalLink } from 'react-icons/fi'

const projects = [
  {
    icon: '📈',
    title: 'Fast Crypto Options Pricing',
    description:
      'High-performance options pricing engine for crypto derivatives using Black-Scholes and Monte Carlo simulation. Built in Python with optimized NumPy vectorisation.',
    stack: ['Python', 'NumPy', 'FastAPI', 'React'],
    github: 'https://github.com/parthm667/Fast-Crypto-Options-Pricing',
    live: '',
  },
  {
    icon: '📊',
    title: 'Polymarket Analysis',
    description:
      'Data-driven analysis of prediction market pricing on Polymarket. Explores market efficiency, probability calibration, and trading signals across political and event-based contracts.',
    stack: ['Python', 'Jupyter', 'Pandas', 'Matplotlib'],
    github: 'https://github.com/parthm667/PolymarketAnalysis',
    live: '',
  },
  {
    icon: '🤖',
    title: 'Robot Tour Maze Solver',
    description:
      'Algorithmic maze-solving agent using graph traversal strategies. Implements BFS, DFS, and heuristic-guided search for autonomous robot path planning.',
    stack: ['Python', 'Jupyter', 'Algorithms'],
    github: 'https://github.com/parthm667/RobotTourMazeSolver',
    live: '',
  },
  {
    icon: '🔬',
    title: 'Popularity Bias Sim',
    description:
      'Simulation study of popularity bias in recommendation systems. Models feedback loops and filter-bubble effects.',
    stack: ['Python', 'NumPy', 'Jupyter'],
    github: 'https://github.com/parthm667/popularitybiassim',
    live: '',
  },
  {
    icon: '🛠️',
    title: 'NJ HIN Generator',
    description:
      'Utility tool for generating New Jersey Health Insurance Network identifiers. A practical Python tool built for data processing and compliance workflows.',
    stack: ['Python'],
    github: 'https://github.com/parthm667/nj-hin-generator',
    live: '',
  },
  {
    icon: '🎨',
    title: 'Personal Website',
    description:
      'This site! Built with React + Vite, dark-themed, deployed to GitHub Pages. Fully custom — no templates.',
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
          A selection of projects I&apos;ve worked on &mdash; from quant tools to full-stack apps.
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
