const categories = [
  {
    icon: 'âš›ï¸',
    title: 'Frontend',
    skills: ['React', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind', 'Vite'],
  },
  {
    icon: 'ðŸ› ï¸',
    title: 'Backend',
    skills: ['Node.js', 'Express', 'Python', 'FastAPI', 'REST APIs', 'PostgreSQL', 'MongoDB'],
  },
  {
    icon: 'â˜ï¸',
    title: 'Cloud & DevOps',
    skills: ['AWS', 'Docker', 'GitHub Actions', 'Vercel', 'Linux', 'Nginx'],
  },
  {
    icon: 'ðŸ“Š',
    title: 'Data & Quant',
    skills: ['Python', 'NumPy', 'Pandas', 'Matplotlib', 'SQL', 'MATLAB'],
  },
  {
    icon: 'ðŸ”§',
    title: 'Tools',
    skills: ['Git', 'VS Code', 'Figma', 'Postman', 'Jira', 'Notion'],
  },
  {
    icon: 'ðŸ§ ',
    title: 'CS Fundamentals',
    skills: ['Algorithms', 'Data Structures', 'OOP', 'System Design', 'C/C++', 'Java'],
  },
]

export default function Skills() {
  return (
    <section className="section" id="skills">
      <div className="container">
        <p className="lbl">What I work with</p>
        <h2 className="h2">Skills & Technologies</h2>
        <p className="sub">
          A curated set of tools and technologies I use to bring ideas to life.
        </p>

        <div className="skills-grid">
          {categories.map(cat => (
            <div className="skill-card" key={cat.title}>
              <div className="sk-icon">{cat.icon}</div>
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
