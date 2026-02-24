import { Bot, ExternalLink, FlaskConical, Github, Rss } from 'lucide-react'

const projects = [
  {
    title: 'Autonomous Maze Navigating Robot',
    kind: 'Robotics',
    description:
      'Built cascaded PID control with odometry plus IMU sensor fusion and an A* pathfinding pipeline with collision checks and turn-cost optimization. Placed 3rd at the 2024 Science Olympiad National Tournament.',
    stack: ['PID Control', 'Sensor Fusion', 'A* Pathfinding'],
    github: 'https://github.com/parthm667/RobotTourMazeSolver',
    live: '',
  },
  {
    title: 'MASS Lab Research - UT Austin',
    kind: 'Research',
    description:
      'Researched UAV landing stability under stochastic conditions and built a parallel Monte Carlo pipeline with 6.2x speedup; invited to present at the 2026 AIAA Aviation Forum.',
    stack: ['UAV Dynamics', 'ODE Modeling', 'Parallel Simulation'],
    github: '',
    live: '',
  },
  {
    title: 'Population Biology Laboratory - IISER Pune',
    kind: 'Research',
    description:
      'Built and tuned literature-classification pipelines (logistic regression and SVM) across 35k+ papers using TF-IDF, cross-validation, and metadata repair tooling.',
    stack: ['Logistic Regression', 'TF-IDF', 'GridSearchCV', 'SVM'],
    github: '',
    live: '',
  },
  {
    title: 'Astronomy Research - UMD',
    kind: 'Research',
    description:
      'Built computational models of light-particle interactions for circumstellar dust and generated synthetic photometric and polarimetric outputs for observational validation.',
    stack: ['Computational Modeling', 'Scientific Computing', 'Machine Learning'],
    github: '',
    live: '',
  },
  {
    title: 'Computational Social Dynamics Lab Research',
    kind: 'Research',
    description:
      'Developed stochastic simulation models for popularity-driven bias in online markets, including large-scale Monte Carlo sweeps and ABC calibration against ranking data.',
    stack: ['Monte Carlo', 'Agent-Based Modeling', 'ABC'],
    github: '',
    live: '',
  },
  {
    title: 'FRC Team 1923 - Electrical Director',
    kind: 'Robotics',
    description:
      'Led electrical system design and diagnostics across CAN and encoder signal integrity, and supported autonomous strategy and match-level decision workflows.',
    stack: ['Electrical Systems', 'Diagnostics', 'Autonomous Strategy'],
    github: '',
    live: '',
  },
  {
    title: 'EVCode',
    kind: 'GitHub',
    description: 'Public EVCode repository.',
    stack: ['Jupyter Notebook', 'Python'],
    github: 'https://github.com/parthm667/EVCode',
    live: '',
  },
  {
    title: 'PolymarketAnalysis',
    kind: 'GitHub',
    description: 'Public repository for Polymarket analysis.',
    stack: ['Jupyter Notebook', 'Python'],
    github: 'https://github.com/parthm667/PolymarketAnalysis',
    live: '',
  },
  {
    title: 'nj-hin-generator',
    kind: 'GitHub',
    description: 'Python repository for NJ HIN generation.',
    stack: ['Python'],
    github: 'https://github.com/parthm667/nj-hin-generator',
    live: '',
  },
]

function KindIcon({ kind }) {
  if (kind === 'Robotics') return <Bot size={14} />
  if (kind === 'Research') return <FlaskConical size={14} />
  if (kind === 'GitHub') return <Github size={14} />
  return <Rss size={14} />
}

export default function Projects() {
  return (
    <section className="section proj" id="projects">
      <div className="container">
        <p className="lbl">Selected Work</p>
        <h2 className="h2">Projects, Robotics, and Research</h2>
        <p className="sub">
          Ordered from coolest to least cool across robotics, research, and public repositories.
        </p>

        <div className="proj-grid">
          {projects.map(project => (
            <article className="proj-card" key={project.title}>
              <div className="proj-head">
                <span className="proj-kind">
                  <KindIcon kind={project.kind} /> {project.kind}
                </span>
                <div className="proj-links">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noreferrer" className="proj-link" aria-label="GitHub link">
                      <Github size={15} />
                    </a>
                  )}
                  {project.live && (
                    <a href={project.live} target="_blank" rel="noreferrer" className="proj-link" aria-label="Live link">
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>

              <h3>{project.title}</h3>
              <p>{project.description}</p>

              <div className="proj-stack">
                {project.stack.map(item => <span className="tag" key={item}>{item}</span>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
