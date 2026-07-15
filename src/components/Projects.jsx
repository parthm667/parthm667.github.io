const projects = [
  {
    title: 'MASS Lab Research - UT Austin',
    kind: 'Research',
    description:
      'Researched UAV landing stability under stochastic conditions and built a parallel Monte Carlo pipeline with 6.2x speedup; invited to present at the 2026 AIAA Aviation Forum.',
    stack: ['UAV Dynamics', 'ODE Modeling', 'Parallel Simulation'],
    github: 'https://github.com/parthm667/UAVSuspensionSystem',
  },
  {
    title: 'Astronomy Research - UMD',
    kind: 'Research',
    description:
      'Built computational models of light-particle interactions for circumstellar dust and generated synthetic photometric and polarimetric outputs for observational validation.',
    stack: ['Computational Modeling', 'Scientific Computing', 'Machine Learning'],
    github: '',
  },
  {
    title: 'Computational Social Dynamics Lab Research',
    kind: 'Research',
    description:
      'Developed stochastic simulation models for popularity-driven bias in online markets, including large-scale Monte Carlo sweeps and ABC calibration against ranking data.',
    stack: ['Monte Carlo', 'Agent-Based Modeling', 'ABC'],
    github: '',
  },
  {
    title: 'Crypto HFT Infrastructure Project',
    kind: 'GitHub',
    description: 'Public repository for Crypto HFT infrastructure.',
    stack: ['C++', 'Quant', 'HFT'],
    github: 'https://github.com/sujaykonda/crupto-hft',
  },
  {
    title: 'Autonomous Maze Navigating Robot',
    kind: 'Robotics',
    description:
      'Built cascaded PID control with odometry plus IMU sensor fusion and an A* pathfinding pipeline with collision checks and turn-cost optimization. Placed 3rd at the 2024 Science Olympiad National Tournament.',
    stack: ['PID Control', 'Sensor Fusion', 'A* Pathfinding'],
    github: 'https://github.com/parthm667/RobotTourMazeSolver',
  },
  {
    title: 'Population Biology Laboratory - IISER Pune',
    kind: 'Research',
    description:
      'Built and tuned literature-classification pipelines (logistic regression and SVM) across 35k+ papers using TF-IDF, cross-validation, and metadata repair tooling.',
    stack: ['Logistic Regression', 'TF-IDF', 'GridSearchCV', 'SVM'],
    github: '',
  },
  {
    title: 'nj-hin-generator',
    kind: 'GitHub',
    description:
      'Automated New Jersey High Injury Network generator for SS4A grant workflows with geospatial crash assignment, Poisson significance testing, equity overlays, and map/data exports.',
    stack: ['FastAPI', 'PostGIS', 'GeoPandas', 'React', 'Leaflet'],
    github: 'https://github.com/parthm667/nj-hin-generator',
  },
  {
    title: 'FRC Team 1923 - Electrical Director',
    kind: 'Robotics',
    description:
      'Led electrical system design and diagnostics across CAN and encoder signal integrity, and supported autonomous strategy and match-level decision workflows.',
    stack: ['Electrical Systems', 'Diagnostics', 'Autonomous Strategy'],
    github: '',
  },
  {
    title: 'PolymarketAnalysis',
    kind: 'GitHub',
    description: 'Trader analysis of 600,000+ traders on Polymarket.',
    stack: ['Jupyter Notebook', 'Python'],
    github: 'https://github.com/parthm667/PolymarketAnalysis',
  },
]

export default function Projects() {
  return (
    <section className="section proj" id="projects">
      <div className="container">
        <div className="sec-head" data-reveal>
          <p className="lbl">§ 03 · Projects &amp; Research</p>
          <h2 className="h2">Selected work<span className="dot">.</span></h2>
        </div>
        <p className="sub" data-reveal>
          A selection of research, robotics, and engineering work across academic labs and personal
          projects. Nine entries, ordered loosely by recency.
        </p>

        <div className="ledger">
          {projects.map((project, index) => (
            <article className="entry" data-reveal style={{ '--i': index % 3 }} key={project.title}>
              <span className="entry-num">{String(index + 1).padStart(2, '0')}</span>
              <div className="entry-title">
                <h3>{project.title}</h3>
                <p className="entry-kind">{project.kind}</p>
              </div>
              <div className="entry-body">
                <p className="entry-desc">{project.description}</p>
                <p className="entry-stack">{project.stack.join(' · ')}</p>
              </div>
              {project.github ? (
                <a
                  className="entry-link"
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.title} on GitHub`}
                >
                  Code ↗
                </a>
              ) : (
                <span className="entry-link is-empty" aria-hidden="true">—</span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
