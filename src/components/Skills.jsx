import { Braces, Database, FlaskConical, Hammer, Languages } from 'lucide-react'

const categories = [
  {
    title: 'Languages',
    icon: Languages,
    skills: ['Python', 'JavaScript', 'Java', 'C++', 'C', 'R', 'HTML/CSS', 'LaTeX'],
  },
  {
    title: 'Libraries',
    icon: Database,
    skills: ['NumPy', 'SciPy', 'scikit-learn', 'pandas', 'Matplotlib', 'TensorFlow'],
  },
  {
    title: 'Tools',
    icon: Hammer,
    skills: ['Git', 'GitHub', 'Jupyter', 'Linux/Bash', 'REST APIs', 'Optuna'],
  },
  {
    title: 'Technical Areas',
    icon: FlaskConical,
    skills: ['Monte Carlo Simulation', 'ODE Modeling', 'PID Control', 'A* Pathfinding', 'Logistic Regression', 'K-means Clustering'],
  },
  {
    title: 'Public Repo Stack',
    icon: Braces,
    skills: ['Jupyter Notebook', 'Python', 'JavaScript'],
  },
]

export default function Skills() {
  return (
    <section className="section" id="skills">
      <div className="container">
        <p className="lbl">Capabilities</p>
        <h2 className="h2">Skills and Technologies</h2>
        <p className="sub">
          Skills listed from resume technical sections and public GitHub repository metadata.
        </p>

        <div className="skills-grid">
          {categories.map(category => (
            <article className="skill-card" key={category.title}>
              <div className="skill-head">
                <span className="skill-icon">
                  <category.icon size={16} />
                </span>
                <h3>{category.title}</h3>
              </div>
              <div className="sk-tags">
                {category.skills.map(skill => <span className="tag" key={skill}>{skill}</span>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
