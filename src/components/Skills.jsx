const categories = [
  {
    title: 'Languages',
    skills: ['Python', 'JavaScript', 'Java', 'C++', 'C', 'R', 'HTML/CSS', 'LaTeX'],
  },
  {
    title: 'Libraries',
    skills: ['NumPy', 'SciPy', 'scikit-learn', 'pandas', 'Matplotlib', 'TensorFlow'],
  },
  {
    title: 'Tools',
    skills: ['Git', 'GitHub', 'Jupyter', 'Linux/Bash', 'REST APIs', 'Optuna'],
  },
  {
    title: 'Technical Areas',
    skills: ['Monte Carlo Simulation', 'ODE Modeling', 'PID Control', 'A* Pathfinding', 'Logistic Regression', 'K-means Clustering'],
  },
  {
    title: 'GitHub Repo Languages',
    skills: ['Jupyter Notebook', 'Python', 'JavaScript'],
  },
]

export default function Skills() {
  return (
    <section className="section" id="skills">
      <div className="container">
        <p className="lbl">What I work with</p>
        <h2 className="h2">Skills & Technologies</h2>
        <p className="sub">
          Skills listed from resume technical skills and public GitHub repository metadata.
        </p>

        <div className="skills-grid">
          {categories.map(cat => (
            <div className="skill-card" key={cat.title}>
              <h3>{cat.title}</h3>
              <div className="sk-tags">
                {cat.skills.map(s => <span className="tag" key={s}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
