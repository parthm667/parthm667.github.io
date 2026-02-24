const categories = [
  {
    title: 'Quant & Data',
    skills: ['Python', 'NumPy', 'Pandas', 'Statistical Modeling', 'Backtesting', 'Time Series'],
  },
  {
    title: 'Software Engineering',
    skills: ['Data Structures', 'Algorithms', 'OOP', 'System Design', 'Testing', 'Debugging'],
  },
  {
    title: 'Web Development',
    skills: ['React', 'JavaScript', 'Node.js', 'Express', 'REST APIs', 'MongoDB'],
  },
  {
    title: 'Programming Languages',
    skills: ['Python', 'Rust', 'JavaScript', 'SQL', 'C++', 'MATLAB'],
  },
  {
    title: 'Machine Learning',
    skills: ['LSTM', 'Feature Engineering', 'Model Evaluation', 'Jupyter', 'Data Visualization'],
  },
  {
    title: 'Tools',
    skills: ['Git', 'GitHub', 'Vite', 'VS Code', 'Linux', 'Docker'],
  },
]

export default function Skills() {
  return (
    <section className="section" id="skills">
      <div className="container">
        <p className="lbl">What I work with</p>
        <h2 className="h2">Skills & Technologies</h2>
        <p className="sub">
          Core technologies and methods I use across quant research and software delivery.
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
