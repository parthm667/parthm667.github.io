import { FiGithub, FiExternalLink } from 'react-icons/fi'

const projects = [
  {
    title: 'EVCode',
    description: 'Public EVCode project repository.',
    stack: ['Jupyter Notebook'],
    github: 'https://github.com/parthm667/EVCode',
    live: '',
  },
  {
    title: 'RobotTourMazeSolver',
    description: 'Maze solver and robot tour project repository.',
    stack: ['Jupyter Notebook'],
    github: 'https://github.com/parthm667/RobotTourMazeSolver',
    live: '',
  },
  {
    title: 'PolymarketAnalysis',
    description: 'Polymarket analysis project repository.',
    stack: ['Jupyter Notebook'],
    github: 'https://github.com/parthm667/PolymarketAnalysis',
    live: '',
  },
  {
    title: 'nj-hin-generator',
    description: 'Python project repository for NJ HIN generation.',
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
  {
    title: 'Insulin-Dosage-Model',
    description: 'Forked repository for insulin dosage modeling work.',
    stack: ['Forked Project'],
    github: 'https://github.com/parthm667/Insulin-Dosage-Model',
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
          Real projects from my public GitHub profile.
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
