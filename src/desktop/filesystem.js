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
    detail: '1,000/1,000 sampled landings passed; mean peak force 24.6% below the modeled limit.',
    evidence: 'first-author paper · aiaa aviation 2026',
  },
  {
    title: 'polymarket',
    path: `${HOME}/projects/polymarket/readme.md`,
    detail: 'top volume decile: positive mean pnl. lower nine: negative mean pnl. volume/pnl correlation flips sign when ranked.',
    evidence: '604,578 trader records · analysis + notebook',
  },
  {
    title: 'c++ trading systems',
    path: `${HOME}/projects/order-book/readme.md`,
    detail: '110 ns p99 internal tick-to-order benchmark; excludes network and exchange latency.',
    evidence: 'c++ · smith investment fund',
  },
]

export const MORE_WORK = [
  { title: 'corsha', path: `${HOME}/experience/corsha.txt`, detail: '10,000+ logs/sec in testing' },
  { title: 'nuntius (yc s25)', path: `${HOME}/experience/nuntius.txt`, detail: 'agent environments and evaluation' },
]

export const filesystem = folder('parth', 'parth mhaske', [
  folder('projects', 'things i have built', [
    project('order-book', 'low-latency order book in c++20',
      `c++ trading systems
smith investment fund

i worked on a c++ engine for crypto.com that takes market updates, runs strategy logic, and checks orders before execution. these parts need to exchange data without making the strategy wait on network handling, so the engine uses boost.beast and lock-free multi-producer, single-consumer queues.

i built an event-driven strategy interface in which each strategy subclasses strategybase and emits signals. a thread-safe order book maintains market state, and a pre-trade risk manager checks order flow before execution. this gives each strategy the same path from market data to an order.

to check strategy behavior on repeatable inputs, i used a jsonl replay backtester. the internal tick-to-order benchmark reached 110 ns p99, excluding network and exchange latency. replay testing checks what the strategy does; the benchmark measures how long that internal processing takes.

c++ / boost.beast / concurrent queues / replay testing`,
      'https://github.com/sujaykonda/crypto-hft', {
        links: [{ label: 'source', href: 'https://github.com/sujaykonda/crypto-hft' }],
      }),
    project('maze-robot', 'a* planning, sensor fusion, and pid control',
      `maze-solving robot
science olympiad robot tour, 2023–2024

i built a robot to follow a planned route through a maze without wall sensors. since it could not use the walls to correct its position, the route planner and motion controller had to work from encoders and an imu.

i used a* to plan routes on a 16 × 16 grid, with an added cost for turns. this let the planner account for turning instead of considering only the number of steps. the robot then followed the route using sensor fusion and cascaded pid control at 1 khz.

we placed third at the 2024 national tournament. the project brought the planning and control problems together: finding a route was only useful if the robot could follow it.

python / a* / pid / sensor fusion`,
      'https://github.com/parthm667/RobotTourMazeSolver'),
    project('polymarket', '604,578 trader records: behavior, clustering, and limits',
      `polymarket trader analysis
604,578 trader records · september 2025

given 604,578 trader records with 41 features each, i wanted to figure out what separated profitable traders from everyone else. however, the data was a snapshot of performance, so i couldn't use it to predict what an account would do next. instead, i looked at which behaviors were associated with profit in this dataset.

the first thing i did was look at correlations. volume had a pearson correlation of 0.41 with pnl, which seemed like the obvious place to start. i then split traders into volume deciles: the top decile had positive average pnl, while the lower nine lost money on average. so the overall correlation wasn't enough to explain what worked across the rest of the accounts.

i moved to topic concentration, activity, and execution proxies. to see whether these appeared together in the same traders, the september report groups six behavioral features into four clusters using k-means and compares their outcomes. the notebook also tests other specifications. for volume, even the correlation changes sign when using ranks instead of raw values, so the choice of measure matters.

the remaining question is whether these patterns predict later performance. the rebalancing score already includes profit per volume, so correlating it with that same quantity doesn't independently test an edge. that needs time-separated data, with behavior measured before the outcome.

python / pandas / scipy / scikit-learn`,
      'https://github.com/parthm667/PolymarketAnalysis', {
        links: [{ label: 'notebook and report', href: 'https://github.com/parthm667/PolymarketAnalysis' }],
      }),
    project('nj-hin-generator', 'mapping serious crashes on new jersey roads',
      `new jersey high injury network generator

i built this tool to help municipalities identify road segments with unusually high crash counts. a list of crash locations does not directly answer that question, so i joined njdot crash records to openstreetmap road geometries in postgis and aggregated the crashes by segment.

i then used poisson tests to flag high-crash corridors across 568 new jersey municipalities, combining five open data sources. the tool also adds equity data and exports maps and tables for municipal safety planning and safe streets and roads for all grant applications.

the output gives a municipality specific corridors to examine and the crash data behind each one. deciding which street changes to make still requires looking at the conditions on those roads.

fastapi / postgis / geopandas / react / leaflet`,
      'https://github.com/parthm667/nj-hin-generator'),
  ]),
  folder('research', 'simulation, modeling, and scientific computing', [
    project('uav-suspension', 'first-author aiaa paper on landing-impact dynamics',
      `uav suspension optimization
first-author paper · aiaa aviation 2026

a heavy paramotor can carry large payloads, but the forces during a harsh landing can damage its frame. i worked with christian claudel at ut austin to determine which spring and damping settings would keep the suspension within its limits across uncertain touchdown conditions.

we modeled vertical motion, pitch, and roll with a spring-mass-damper system. since the wheels can touch down at different times, the model switches between 16 possible wheel-contact configurations. this lets us calculate the force on each suspension as it engages, using a small-angle approximation and vertical forces.

we then evaluated 5,000 spring/damping combinations with 1,000 sampled trials per combination. a trial fails if the suspension bottoms out or exceeds the force, attitude, or settling limits. several configurations passed 1,000 of 1,000 sampled trials, so success count alone did not determine which one to choose.

we selected a spring constant of 21,216 newtons per meter and damping coefficient of 484.56 newton-seconds per meter using the lowest average maximum force as the tie-break. its average maximum force was 5,057 newtons, below the modeled threshold of 6,708 newtons. this gives a suspension choice with more force margin under the sampled conditions. physical testing is still needed to check those modeled outcomes.

suspension parameter optimization in a paramotor uav using monte carlo analysis
parth mhaske and christian claudel

python / c++ / hybrid dynamics / monte carlo`,
      'https://github.com/parthm667/UAVSuspensionSystem', {
        media: [{
          src: '/work/uav-suspension-sweep.png',
          alt: 'spring stiffness and damping sweep, with a band of moderate damping and higher stiffness producing the most successful simulated landings',
          caption: 'spring stiffness and damping, colored by successful trials out of 1,000 for each sampled configuration. figure 7, mhaske and claudel, aiaa 2026-4336.',
        }],
        links: [
          { label: 'read the paper', href: 'https://doi.org/10.2514/6.2026-4336' },
          { label: 'source and notebooks', href: 'https://github.com/parthm667/UAVSuspensionSystem' },
        ],
      }),
    project('circumstellar-dust', 'light-scattering models at umd',
      `circumstellar dust
astronomy, university of maryland

we use scattered light to study dust grains that we cannot examine directly. to connect those observations to grain properties, i worked on a forward model that calculates how synthetic grains scatter light.

we compared the predicted photometry and polarimetry, or brightness and polarization, with observations. this lets us test whether a proposed set of grain properties produces the light we actually measure.

python / monte carlo / scientific computing`),
    project('popularity-bias', 'modeling how rankings affect online markets',
      `popularity bias in online markets
computational social dynamics lab

when people choose from a ranked list, the existing ranking can affect what they choose next. i worked on stochastic simulations to study how this social influence changes the rankings that emerge.

we ran monte carlo sweeps across the model parameters, then used approximate bayesian computation to calibrate the simulations against observed ranking data. this compares simulated outcomes with the data to find parameter settings that reproduce its patterns.

the comparison connects a proposed choice process to an observed ranking. matching that ranking is a test of the model, rather than proof that the same process caused it.

agent-based modeling / monte carlo / abc calibration`),
    project('literature-classification', 'classifying 35,000+ research papers',
      `literature classification
population biology laboratory, iiser pune

i built a classification pipeline for a collection of more than 35,000 research papers. the records included missing and duplicated bibliographic metadata, so i cleaned those records as part of preparing the corpus for classification.

to represent the text, i used tf-idf features, which weight terms by how often they appear in a paper relative to the collection. i then trained logistic regression and svm models and tuned them with cross-validation. this let me compare model settings on held-out examples rather than only on the papers used to fit them.

python / scikit-learn / tf-idf / gridsearchcv`),
  ]),
  folder('experience', 'agent evaluation, backend systems, and robotics', [
    file('nuntius.txt', 'evaluation infrastructure and agent behavior',
      `agent evaluation at nuntius (yc s25)
software engineer · november 2025–may 2026

at nuntius (yc s25), i built agentic environments with synthetic data generation and automatic evaluation pipelines. the goal was to test whether models could use tools correctly over multiple turns, where a mistake in one step can affect the steps that follow.

to evaluate that behavior, i designed a reward signal for tool-call correctness in multi-turn settings. the work combined building the environments and test data with checking how the models used tools across a full task.

i also analyzed failures in frontier models and conducted penetration testing to find edge cases. those results gave us specific failures to investigate and use in hardening work.

python / synthetic data / agentic environments / tool-call evaluation / failure analysis`),
    file('corsha.txt', 'software engineering intern',
      `corsha
software engineering intern · may–august 2026

i worked on backend services and deployment automation at corsha. partner integrations required manual api version setup, so i built a go service that infers the version during handshake. the handshake took 80 ms, removing that configuration step across 6+ deployments.

log ingestion raised a different problem: incoming traffic could spike while the core api still needed to serve requests. i built a separate ingestion service with disk-backed queues to buffer those spikes. in testing, it sustained 10,000+ logs per second with no data loss, keeping incoming data in durable storage while it waited to be processed.

i also automated strongswan ipsec deployment using kubernetes helm. this removed the need for manual restarts during certificate rotation, so routine certificate changes no longer required that deployment step.

go / disk-backed queues / kubernetes / helm / ipsec`),
    file('frc-1923.txt', 'electrical director, frc team 1923',
      `frc team 1923
electrical director

i led electrical system design and diagnostics for the robot, including can wiring, encoder signals, and connectors. these connections carry the commands and measurements that the control code depends on, so checking the electrical system was part of finding why the robot behaved differently from what the code requested.

i also worked on autonomous routines and match strategy, connecting the robot's hardware and control behavior to what we planned to attempt in a match.`),
  ]),
  folder('writing', 'an essay on street design', [
    link('road_design.url', 'street design and road safety', '/public_remediation'),
  ]),
  file('about.txt', 'a little about me',
    'hey, i’m parth.\n\ni study computer science and applied mathematics at the university of maryland. class of 2028.\n\ni work on trading systems, simulations, and agent evaluation. i wrote a first-author aiaa paper on uav suspension design, analyzed 604,578 polymarket trader records, and contributed to agent evaluation at nuntius (yc s25).\n\ni’m looking for summer 2027 internships in software engineering, quantitative research, or systems engineering. outside of that, i ride bikes and photograph birds.'),
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
