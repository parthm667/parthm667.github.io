export const HOME = '/home/parth'

const file = (name, description, content, metadata = {}) => ({ name, type: 'file', description, content, ...metadata })
const link = (name, description, href) => ({ name, type: 'link', description, href })
const folder = (name, description, children) => ({ name, type: 'folder', description, children })
const project = (name, description, content, href, metadata) => folder(name, description, [
  file('readme.md', description, content, metadata),
  ...(href ? [link('source.url', 'view the repository', href)] : []),
])

export const FEATURED_WORK = [
  {
    title: 'uav suspension',
    path: `${HOME}/research/uav-suspension/readme.md`,
    detail: 'choosing a suspension under uncertain touchdown conditions',
    evidence: 'first-author paper · aiaa aviation 2026',
  },
  {
    title: 'polymarket',
    path: `${HOME}/projects/polymarket/readme.md`,
    detail: 'what a snapshot can tell us about trader behavior',
    evidence: '604,578 trader records · analysis + notebook',
  },
  {
    title: 'agent evaluation',
    path: `${HOME}/experience/nuntius.txt`,
    detail: 'checking tool use against actions and actual outcomes',
    evidence: '6 agentic environments · nuntius',
  },
]

export const filesystem = folder('parth', 'parth mhaske', [
  folder('projects', 'things i have built', [
    project('order-book', 'low-latency order book in c++20',
      `c++ trading systems
smith investment fund

the problem
a trading engine has to move market updates through strategy logic and risk checks without letting network handling stall the decision path. it also needs a way to replay the same input when a strategy behaves unexpectedly.

what i built
i worked on a c++ engine for crypto.com using boost.beast and lock-free multi-producer, single-consumer queues. the strategy interface is event-driven: each strategy subclasses strategybase and emits signals. a thread-safe order book maintains market state, while a pre-trade risk manager validates order flow before execution.

how i check it
a jsonl replay backtester feeds recorded events through strategy logic. this gives us a repeatable input stream for checking behavior without depending on a live market.

measurement boundary
110 ns p99 in an internal tick-to-order benchmark. this measures the internal processing path and excludes network and exchange latency.

c++ / boost.beast / concurrent queues / replay testing`,
      'https://github.com/sujaykonda/crypto-hft', {
        links: [{ label: 'source', href: 'https://github.com/sujaykonda/crypto-hft' }],
      }),
    project('maze-robot', 'a* planning, sensor fusion, and pid control',
      'maze-solving robot\nscience olympiad robot tour, 2023–2024\n\ni built a robot that follows a planned route using encoders and an imu, without wall sensors. the a* planner penalizes turns, and the robot runs cascaded pid at 1 khz on a 16 × 16 grid.\n\nthird place at the 2024 national tournament.\n\npython / a* / pid / sensor fusion',
      'https://github.com/parthm667/RobotTourMazeSolver'),
    project('polymarket', '604,578 trader records: behavior, clustering, and limits',
      `polymarket trader analysis
604,578 trader records · september 2025

the question
what separates profitable accounts? i started with 41 features per trader, covering activity, topic concentration, volume, and execution proxies. the first constraint mattered: this was a performance snapshot, not a sequence of trades.

the approach
volume had a pearson correlation of 0.41 with pnl. splitting accounts into volume deciles showed what that summary hid: the top decile had positive average pnl, while the other nine were negative. i then examined topic concentration and trading behavior rather than treating volume as an edge by itself.

the september report uses k-means to group six behavioral features into four clusters, then compares their outcomes. the notebook also explores other specifications and correlation measures. the volume relationship changes sign when measured by ranks rather than raw values—a reason to inspect the distribution before trusting a single coefficient.

what this does not establish
these are descriptive associations, not a validated trading signal. a snapshot cannot establish causality or future returns. a score that already contains profit also cannot independently explain profit. a stronger test would use time-separated data and outcomes the features have not already seen.

python / pandas / scipy / scikit-learn`,
      'https://github.com/parthm667/PolymarketAnalysis', {
        links: [{ label: 'notebook and report', href: 'https://github.com/parthm667/PolymarketAnalysis' }],
      }),
    project('nj-hin-generator', 'mapping serious crashes on new jersey roads',
      'new jersey high injury network generator\n\ni built a tool that assigns crashes to road segments, tests for unusually high crash counts, adds equity data, and exports maps and tables for municipal safety planning and ss4a grant applications.\n\nfastapi / postgis / geopandas / react / leaflet',
      'https://github.com/parthm667/nj-hin-generator'),
  ]),
  folder('research', 'simulation, modeling, and scientific computing', [
    project('uav-suspension', 'first-author aiaa paper on landing-impact dynamics',
      `uav suspension optimization
first-author paper · aiaa aviation 2026

the problem
a heavy paramotor can reach the ground with pitch, roll, and touchdown speed all different from the nominal case. i worked with christian claudel at ut austin to model that impact and choose spring and damping parameters across uncertain conditions.

the modeling decision
wheel contact changes during impact. four wheels produce 16 possible contact configurations. the model tracks vertical motion, pitch, and roll as individual suspensions engage, rather than assuming all four wheels hit together.

the result
the paper evaluates 5,000 spring/damping combinations with 1,000 sampled trials per combination. a trial fails when the suspension bottoms out or exceeds force, attitude, or settling limits. the selected configuration passes 1,000 of 1,000 sampled trials; ties are broken by lower average maximum force.

the limits
that result depends on the model's small-angle approximation, vertical-force assumptions, and sampled touchdown range. it is not a field-tested guarantee. the useful output is a region of suspension settings that balances bottoming-out against impact force—and the assumptions a physical test needs to challenge.

suspension parameter optimization in a paramotor uav using monte carlo analysis
parth mhaske and christian claudel

python / c++ / hybrid dynamics / monte carlo`,
      'https://github.com/parthm667/UAVSuspensionSystem', {
        media: [{
          src: '/work/uav-suspension-sweep.png',
          alt: 'spring stiffness and damping sweep, with a band of moderate damping and higher stiffness producing the most successful simulated landings',
          caption: 'successful trials out of 1,000 per sampled suspension configuration. original figure 7 from mhaske and claudel, aiaa 2026-4336.',
        }],
        links: [
          { label: 'read the paper', href: 'https://doi.org/10.2514/6.2026-4336' },
          { label: 'source and notebooks', href: 'https://github.com/parthm667/UAVSuspensionSystem' },
        ],
      }),
    project('circumstellar-dust', 'light-scattering models at umd',
      'circumstellar dust\nastronomy, university of maryland\n\ni worked on a forward model of light scattered by synthetic dust grains. we compared the predicted photometry and polarimetry with observations to study grain properties.\n\npython / monte carlo / scientific computing'),
    project('popularity-bias', 'modeling how rankings affect online markets',
      'popularity bias in online markets\ncomputational social dynamics lab\n\ni worked on stochastic simulations of choice under social influence. we ran monte carlo parameter sweeps and calibrated the models against ranking data using approximate bayesian computation.\n\nagent-based modeling / monte carlo / abc calibration'),
    project('literature-classification', 'classifying 35,000+ research papers',
      'literature classification\npopulation biology laboratory, iiser pune\n\ni built a classification pipeline for 35,000+ papers using tf-idf features, logistic regression, and an svm. i tuned the models with cross-validation and cleaned missing and duplicated bibliographic metadata.\n\npython / scikit-learn / tf-idf / gridsearchcv'),
  ]),
  folder('experience', 'agent evaluation, backend systems, and robotics', [
    file('nuntius.txt', 'agent environments and tool-use evaluation',
      `agent evaluation at nuntius
software engineer · november 2025–may 2026

the problem
an agent can give a plausible final answer while leaving the environment in the wrong state. i built agentic environments, synthetic data, and automatic evaluation pipelines for multi-step tool use. my work covered six environments, with custom rewards for tool-call correctness and failure analysis.

the evaluation decision
in the browser environment, the reward checks two things separately: did the agent complete the essential actions, and did it reach the required final state? missing either makes the attempt fail. after those checks, extra tool calls reduce the score, keeping correctness and efficiency distinct.

checking the benchmark itself
i also worked on multi-turn tasks and their validation. an oracle run checks that a task is solvable before an agent's failure is treated as useful evidence. an inconsistent task or a broken evaluator can otherwise make a capable model look bad.

scope
the work lives in private team repositories. this summary describes my environment and evaluation contributions without exposing internal tasks or treating results on one task set as a universal model failure rate.

python / synthetic environments / tool-use evaluation / failure analysis`),
    file('corsha.txt', 'software engineering intern',
      `corsha
software engineering intern · may–august 2026

partner integration
i built and tested a go service that infers partner api versions during handshake, removing manual version setup across deployments.

ingestion under load
i built a separate real-time data-ingestion service with disk-backed queues. buffering incoming logs separates traffic spikes from core api processing and gives queued data a durable home.

deployment
i automated strongswan ipsec deployment with kubernetes helm, including certificate rotation without manual restarts.

results
80 ms handshake across 6+ deployments. in testing, the ingestion service sustained 10,000+ logs per second with no data loss.

go / disk-backed queues / kubernetes / helm / ipsec`),
    file('frc-1923.txt', 'electrical director, frc team 1923',
      'frc team 1923\nelectrical director\n\ni led electrical system design and diagnostics, including can wiring, encoder signals, and connectors. i also worked on autonomous routines and match strategy.'),
  ]),
  folder('writing', 'an essay on street design', [
    link('road_design.url', 'street design and road safety', '/public_remediation'),
  ]),
  file('about.txt', 'a little about me',
    'hey, i’m parth.\n\ncomputer science + applied mathematics at the university of maryland. class of 2028.\n\ni build systems and study how they fail: uav suspension models, trading infrastructure, and evaluations for agents that use tools. my work includes a first-author aiaa paper, an analysis of 604,578 polymarket trader records, and six agentic environments at nuntius.\n\ni’m looking for summer 2027 internships in software engineering, quantitative research, or systems engineering. outside of that, i ride bikes and photograph birds.'),
  file('contact.txt', 'email, github, and linkedin',
    'email: mailto:pmhaske@umd.edu\ngithub: https://github.com/parthm667\nlinkedin: https://linkedin.com/in/pmhaske/\n\nfeel free to reach out.'),
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
