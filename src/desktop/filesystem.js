export const HOME = '/home/parth'

const file = (name, description, content) => ({ name, type: 'file', description, content })
const link = (name, description, href) => ({ name, type: 'link', description, href })
const folder = (name, description, children) => ({ name, type: 'folder', description, children })
const project = (name, description, content, href) => folder(name, description, [
  file('readme.md', description, content),
  ...(href ? [link('source.url', 'view the repository', href)] : []),
])

export const filesystem = folder('parth', 'parth mhaske', [
  folder('projects', 'things i have built', [
    project('order-book', 'low-latency order book in c++20',
      'c++ order book\nsmith investment fund\n\ni work on a c++20 order book targeting the crypto.com exchange. i have been working through data structures, allocation, and cache behavior, with a focus on p99 latency.\n\nc++20 / profiling / low-latency systems',
      'https://github.com/sujaykonda/crypto-hft'),
    project('maze-robot', 'a* planning, sensor fusion, and pid control',
      'maze-solving robot\nscience olympiad robot tour, 2023–2024\n\ni built a robot that follows a planned route using encoders and an imu, without wall sensors. the a* planner penalizes turns, and the robot runs cascaded pid at 1 khz on a 16 × 16 grid.\n\nthird place at the 2024 national tournament.\n\npython / a* / pid / sensor fusion',
      'https://github.com/parthm667/RobotTourMazeSolver'),
    project('polymarket', 'analysis of 600,000+ trader accounts',
      'polymarket trader analysis\n\ni analyzed a snapshot of 600,000+ trader accounts to understand what separated profitable traders from the rest. i compared volume deciles, specialization, exit behavior, and profit per dollar traded, then used k-means to group similar traders.\n\npython / pandas / jupyter / k-means / hypothesis testing',
      'https://github.com/parthm667/PolymarketAnalysis'),
    project('nj-hin-generator', 'mapping serious crashes on new jersey roads',
      'new jersey high injury network generator\n\ni built a tool that assigns crashes to road segments, tests for unusually high crash counts, adds equity data, and exports maps and tables for municipal safety planning and ss4a grant applications.\n\nfastapi / postgis / geopandas / react / leaflet',
      'https://github.com/parthm667/nj-hin-generator'),
  ]),
  folder('research', 'simulation, modeling, and scientific computing', [
    project('uav-suspension', 'landing-gear optimization at ut austin',
      'uav suspension optimization\nmass lab, ut austin · research intern, 2025–2026\n\ni modeled landing impacts with a spring-mass-damper system and ran 4,000 monte carlo trials across touchdown conditions. 74.9% stayed within the compression and force limits. the parallel pipeline ran 6.2× faster than my serial version.\n\npublication: suspension parameter optimization in a paramotor uav using monte carlo analysis. 2026 aiaa aviation forum. doi: 10.2514/6.2026-4336.\n\npython / c++ / ode modeling / monte carlo',
      'https://github.com/parthm667/UAVSuspensionSystem'),
    project('circumstellar-dust', 'light-scattering models at umd',
      'circumstellar dust\nastronomy, university of maryland\n\ni worked on a forward model of light scattered by synthetic dust grains. we compared the predicted photometry and polarimetry with observations to study grain properties.\n\npython / monte carlo / scientific computing'),
    project('popularity-bias', 'modeling how rankings affect online markets',
      'popularity bias in online markets\ncomputational social dynamics lab\n\ni worked on stochastic simulations of choice under social influence. we ran monte carlo parameter sweeps and calibrated the models against ranking data using approximate bayesian computation.\n\nagent-based modeling / monte carlo / abc calibration'),
    project('literature-classification', 'classifying 35,000+ research papers',
      'literature classification\npopulation biology laboratory, iiser pune\n\ni built a classification pipeline for 35,000+ papers using tf-idf features, logistic regression, and an svm. i tuned the models with cross-validation and cleaned missing and duplicated bibliographic metadata.\n\npython / scikit-learn / tf-idf / gridsearchcv'),
  ]),
  folder('experience', 'internships and robotics', [
    file('corsha.txt', 'software engineering intern',
      'corsha\nsoftware engineering intern\n\ni work on backend machine-identity authentication for operational technology networks.'),
    file('frc-1923.txt', 'electrical director, frc team 1923',
      'frc team 1923\nelectrical director\n\ni led electrical system design and diagnostics, including can wiring, encoder signals, and connectors. i also worked on autonomous routines and match strategy.'),
  ]),
  folder('writing', 'an essay on street design', [
    link('road_design.url', 'street design and road safety', '/public_remediation'),
  ]),
  file('about.txt', 'a little about me',
    'hey, i’m parth.\n\ni study computer science and applied mathematics at the university of maryland, college park. class of 2027.\n\ni work on systems, robotics, and simulation. outside of that, i ride bikes and photograph birds.\n\ni’m looking for summer 2027 internships in software engineering, quantitative research, or systems engineering.'),
  file('contact.txt', 'email, github, and linkedin',
    'email: mailto:pmhaske@umd.edu\ngithub: https://github.com/parthm667\nlinkedin: https://linkedin.com/in/parthmhaske667\n\nfeel free to reach out.'),
  link('resume.pdf', 'my résumé', '/resume.pdf'),
  link('photography.url', 'birds and other photos', 'https://parthmhaske.myportfolio.com/'),
])

function relativeParts(path) {
  if (typeof path !== 'string') return null
  if (path === HOME) return []
  if (!path.startsWith(`${HOME}/`)) return null
  return path.slice(HOME.length + 1).split('/').filter(Boolean)
}

export function resolvePath(input = '.', cwd = HOME) {
  if (typeof input !== 'string') return null
  let path = input.trim()
  if ((path.startsWith('"') && path.endsWith('"')) || (path.startsWith("'") && path.endsWith("'"))) path = path.slice(1, -1)
  if (path.includes('\0')) return null
  let parts
  if (path === '~' || path.startsWith('~/')) {
    parts = []
    path = path.slice(1)
  } else if (path.startsWith('/')) {
    parts = relativeParts(path)
    if (!parts) return null
    path = parts.join('/')
    parts = []
  } else {
    parts = relativeParts(cwd)
    if (!parts) return null
  }
  for (const part of path.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') {
      if (!parts.length) return null
      parts.pop()
    } else parts.push(part)
  }
  return [HOME, ...parts].join('/')
}

export function getNode(path = HOME) {
  const normalized = resolvePath(path)
  if (!normalized) return null
  let node = filesystem
  for (const part of relativeParts(normalized)) {
    node = node.children?.find(child => child.name === part)
    if (!node) return null
  }
  return node
}

export function listDirectory(path = HOME) {
  return [...(getNode(path)?.children ?? [])]
}

export function parentPath(path) {
  const normalized = resolvePath(path)
  if (!normalized || normalized === HOME) return HOME
  return normalized.slice(0, normalized.lastIndexOf('/'))
}

export function breadcrumbs(path) {
  const normalized = resolvePath(path) ?? HOME
  const parts = relativeParts(normalized)
  return [{ name: 'parth', path: HOME }, ...parts.map((name, index) => ({
    name, path: [HOME, ...parts.slice(0, index + 1)].join('/'),
  }))]
}
