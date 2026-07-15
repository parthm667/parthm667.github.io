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
    title: 'Public Repo Stack',
    skills: ['Jupyter Notebook', 'Python', 'JavaScript'],
  },
]

export default function Skills() {
  return (
    <section className="section" id="skills">
      <div className="container">
        <div className="sec-head" data-reveal>
          <p className="lbl">§ 02 · Skills &amp; Tools</p>
          <h2 className="h2">Apparatus<span className="dot">.</span></h2>
        </div>
        <p className="sub" data-reveal>
          Skills listed from resume technical sections and public GitHub repository metadata.
        </p>

        <dl className="doc-table skills-table" data-reveal style={{ '--i': 1 }}>
          {categories.map(category => (
            <div className="doc-row" key={category.title}>
              <dt>{category.title}</dt>
              <dd>{category.skills.join('  ·  ')}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
