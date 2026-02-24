import { FiGithub, FiExternalLink } from 'react-icons/fi'

const projects = [
  {
    title: 'Autonomous Maze Navigating Robot',
    description:
      'Built cascaded PID control with odometry plus IMU sensor fusion and an A* pathfinding pipeline with collision checks and turn-cost optimization. Placed 3rd at the 2024 Science Olympiad National Tournament.',
    stack: ['Robotics', 'PID Control', 'A* Pathfinding', 'Sensor Fusion'],
    github: 'https://github.com/parthm667/RobotTourMazeSolver',
    live: '',
  },
  {
    title: 'FRC Team 1923 - Electrical Director',
    description:
      'Led electrical system design and diagnostics across CAN and encoder signal integrity, and contributed to autonomous strategy planning and match-level decision support.',
    stack: ['Robotics', 'Electrical Systems', 'Diagnostics', 'Autonomous Strategy'],
    github: '',
    live: '',
  },
  {
    title: 'Computational Social Dynamics Lab Research',
    description:
      'Developed stochastic simulation models for popularity-driven bias in online markets, including large-scale Monte Carlo sweeps and ABC-based calibration against ranking data.',
    stack: ['Research', 'Monte Carlo', 'Agent-Based Modeling', 'ABC'],
    github: '',
    live: '',
  },
  {
    title: 'Astronomy Research - UMD',
    description:
      'Built computational models of light-particle interactions for circumstellar dust and generated synthetic photometric and polarimetric outputs for observational validation.',
    stack: ['Research', 'Computational Modeling', 'Machine Learning'],
    github: '',
    live: '',
  },
  {
    title: 'MASS Lab Research - UT Austin',
    description:
      'Researched UAV landing stability under stochastic conditions, derived coupled high-order ODE motion models, and built a parallelized Monte Carlo pipeline with 6.2x speedup.',
    stack: ['Research', 'UAV Dynamics', 'ODE Modeling', 'Parallel Monte Carlo'],
    github: '',
    live: '',
  },
  {
    title: 'EVCode',
    description: 'Public EVCode repository.',
    stack: ['Jupyter Notebook', 'Python'],
    github: 'https://github.com/parthm667/EVCode',
    live: '',
  },
  {
    title: 'PolymarketAnalysis',
    description: 'Public repository for Polymarket analysis.',
    stack: ['Jupyter Notebook', 'Python'],
    github: 'https://github.com/parthm667/PolymarketAnalysis',
    live: '',
  },
  {
    title: 'nj-hin-generator',
    description: 'Python repository for NJ HIN generation.',
    stack: ['Python'],
    github: 'https://github.com/parthm667/nj-hin-generator',
    live: '',
  },
  {
    title: 'parthm667.github.io',
    description: 'Source repository for this portfolio site.',
    stack: ['JavaScript', 'React', 'Vite'],
    github: 'https://github.com/parthm667/parthm667.github.io',
    live: 'https://parthm667.github.io',
  },
]

export default function Projects() {
  return (
    <section className="section proj-bg" id="projects">
      <div className="container">
        <p className="lbl">Things I have built and studied</p>
        <h2 className="h2">Projects, Robotics, and Research</h2>
        <p className="sub">
          Selected work across robotics, research labs, and public GitHub repositories.
        </p>

        <div className="proj-grid">
          {projects.map(proj => (
            <div className="proj-card" key={proj.title}>
              <div className="proj-head">
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
