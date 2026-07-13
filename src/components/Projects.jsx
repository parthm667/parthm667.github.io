import { Bot, ExternalLink, FlaskConical, Github, Rss } from 'lucide-react'

const projects = [
  {
    title: 'MASS Lab Research - UT Austin',
    kind: 'Research',
    description:
      'Researched UAV landing stability under stochastic conditions and built a parallel Monte Carlo pipeline with 6.2x speedup; invited to present at the 2026 AIAA Aviation Forum.',
    stack: ['UAV Dynamics', 'ODE Modeling', 'Parallel Simulation'],
    github: 'https://github.com/parthm667/UAVSuspensionSystem',
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
    title: 'Crypto HFT Infrastructure Project',
    kind: 'GitHub',
    description: 'Public repository for Crypto HFT infrastructure.',
    stack: ['C++', 'Quant', 'HFT'],
    github: 'https://github.com/sujaykonda/crupto-hft',
    live: '',
  },
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
    title: 'Population Biology Laboratory - IISER Pune',
    kind: 'Research',
    description:
      'Built and tuned literature-classification pipelines (logistic regression and SVM) across 35k+ papers using TF-IDF, cross-validation, and metadata repair tooling.',
    stack: ['Logistic Regression', 'TF-IDF', 'GridSearchCV', 'SVM'],
    github: '',
    live: '',
  },
  {
    title: 'nj-hin-generator',
    kind: 'GitHub',
    description:
      'Automated New Jersey High Injury Network generator for SS4A grant workflows with geospatial crash assignment, Poisson significance testing, equity overlays, and map/data exports.',
    stack: ['FastAPI', 'PostGIS', 'GeoPandas', 'React', 'Leaflet'],
    github: 'https://github.com/parthm667/nj-hin-generator',
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
    title: 'PolymarketAnalysis',
    kind: 'GitHub',
    description: 'Trader analysis of 600,000+ traders on Polymarket.',
    stack: ['Jupyter Notebook', 'Python'],
    github: 'https://github.com/parthm667/PolymarketAnalysis',
    live: '',
  },
]

function KindIcon({ kind }) {
  if (kind === 'Robotics') return <Bot size={13} />
  if (kind === 'Research') return <FlaskConical size={13} />
  if (kind === 'GitHub') return <Github size={13} />
  return <Rss size={13} />
}

export default function Projects() {
  return (
    <section className="section proj" id="projects">
      <div className="container">
        <p className="lbl">Selected Work</p>
        <h2 className="h2">Projects, Robotics, and Research</h2>
        <p className="sub">
          A selection of research, robotics, and engineering work across academic labs and personal projects.
        </p>

        <div className="proj-list">
          {projects.map(project => (
            <article className="proj-item" key={project.title}>
              <div className="proj-head">
                <h3>{project.title}</h3>
                <span className="proj-kind">
                  <KindIcon kind={project.kind} /> {project.kind}
                </span>
              </div>
              <p className="proj-desc">{project.description}</p>
              <div className="proj-foot">
                <p className="proj-stack">{project.stack.join('  ·  ')}</p>
                <div className="proj-links">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noreferrer"
                      className="proj-link"
                      aria-label="GitHub link"
                    >
                      <Github size={15} />
                    </a>
                  )}
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noreferrer"
                      className="proj-link"
                      aria-label="Live link"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
