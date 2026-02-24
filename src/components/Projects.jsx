import { FiGithub, FiExternalLink } from 'react-icons/fi'

const projects = [
  {
    icon: 'Q1',
    title: 'RobotTourMazeSolver',
    description:
      'Python repository focused on robot tour and maze-solving workflows, including algorithmic path-finding and traversal logic.',
    stack: ['Python', 'Algorithms', 'Path Planning'],
    github: 'https://github.com/parthm667/RobotTourMazeSolver',
    live: '',
  },
  {
    icon: 'Q2',
    title: 'Fast Crypto Options Pricing',
    description:
      'High-performance options pricing engine for crypto derivatives, with implementations based on quantitative finance models.',
    stack: ['Python', 'NumPy', 'Quant Finance'],
    github: 'https://github.com/parthm667/Fast-Crypto-Options-Pricing',
    live: '',
  },
  {
    icon: 'Q3',
    title: 'StockForecasting_with_LSTM',
    description:
      'Time-series stock forecasting experiments using LSTM-based deep learning models and notebook-driven research workflows.',
    stack: ['Jupyter', 'Python', 'LSTM'],
    github: 'https://github.com/parthm667/StockForecasting_with_LSTM',
    live: '',
  },
  {
    icon: 'Q4',
    title: 'Student-Management-System-MERN',
    description:
      'MERN-based student management platform that supports structured records, full-stack CRUD operations, and admin workflows.',
    stack: ['MongoDB', 'Express', 'React', 'Node.js'],
    github: 'https://github.com/parthm667/Student-Management-System-MERN',
    live: '',
  },
  {
    icon: 'Q5',
    title: 'BacktestingEngine',
    description:
      'Rust repository for backtesting financial strategies with an emphasis on speed, determinism, and robust simulation.',
    stack: ['Rust', 'Backtesting', 'Performance Engineering'],
    github: 'https://github.com/parthm667/BacktestingEngine',
    live: '',
  },
  {
    icon: 'Q6',
    title: 'Popularity Bias Simulation',
    description:
      'Simulation study of popularity bias in recommendation systems, modeling feedback loops and ranking amplification.',
    stack: ['Python', 'NumPy', 'Jupyter'],
    github: 'https://github.com/parthm667/popularitybiassim',
    live: '',
  },
]

export default function Projects() {
  return (
    <section className="section proj-bg" id="projects">
      <div className="container">
        <p className="lbl">Things I have built</p>
        <h2 className="h2">Projects</h2>
        <p className="sub">
          Project set compiled from my public GitHub profile and repositories.
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
