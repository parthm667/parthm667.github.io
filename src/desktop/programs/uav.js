import { createRandom } from './random.js'
import { SELECTED, SWEEP, TRIALS, WHEELS, forceLimit, sampleTouchdown, simulateLanding } from './uavModel.js'
import { STOP_HINT, STYLE, bar, count, fit, headline, padStart, paint, repeat, wrap } from './draw.js'

const REPLAY_MS = 2600 // the first landing, slowed down
const REPLAY_SECONDS = 1 // of simulated time shown in the replay
const TRIALS_MS = 5200 // the remaining landings
const MODES = ['bottoming', 'force', 'attitude', 'settling']
const degrees = radians => `${radians >= 0 ? '+' : '-'}${Math.abs((radians * 180) / Math.PI).toFixed(1)}°`
const fixed = value => (Number.isInteger(value) ? count(value) : value.toLocaleString('en-US', { maximumFractionDigits: 2 }))

export function parseUav(args) {
  if (!args.length) return { options: { ...SELECTED } }
  const usage = `usage: run uav [k c]. k is spring stiffness, ${count(SWEEP.k[0])} to ${count(SWEEP.k[1])} N/m. c is damping, ${count(SWEEP.c[0])} to ${count(SWEEP.c[1])} N·s/m. try run uav 12000 300.`
  if (args.length !== 2 || args.some(arg => !/^\d+(\.\d+)?$/.test(arg))) return { error: usage }
  const [k, c] = args.map(Number)
  if (k < SWEEP.k[0] || k > SWEEP.k[1] || c < SWEEP.c[0] || c > SWEEP.c[1]) return { error: `those values are outside the range the paper swept. ${usage}` }
  return { options: { k, c } }
}

export function createUav({ k, c }, { seed }) {
  const random = createRandom(seed)
  const limit = forceLimit(k)
  const first = sampleTouchdown(random)
  const replay = simulateLanding(k, c, first, { trace: true })
  const results = []
  const failed = { bottoming: 0, force: 0, attitude: 0, settling: 0 }
  let passed = 0, forceSum = 0, elapsed = 0, interrupted = false

  const add = result => {
    results.push(result.maxForce)
    forceSum += result.maxForce
    if (result.success) passed++
    for (const mode of MODES) if (result.failures[mode]) failed[mode]++
  }
  const runTo = total => { while (results.length < Math.min(TRIALS, total)) add(results.length ? simulateLanding(k, c, sampleTouchdown(random)) : replay) }

  const settings = `k ${fixed(k)} N/m · c ${fixed(c)} N·s/m`
  const heading = `uav landing · monte carlo · ${settings}`
  const header = columns => (columns >= heading.length + 10 ? [headline(heading, STOP_HINT, columns)] : [headline('uav landing · monte carlo', STOP_HINT, columns), settings])

  // Peak leg force, binned as a share of the structural limit.
  function histogram(columns, step) {
    const edges = []
    for (let share = 0.5; share < 1.3001; share += step) edges.push(share)
    const bins = [{ label: `under ${count(limit * 0.5)}`, low: -Infinity, high: 0.5 }, ...edges.map((share, index) => ({ label: count(limit * share), low: share, high: edges[index + 1] ?? Infinity }))]
    for (const bin of bins) bin.count = 0
    for (const force of results) {
      const share = force / limit
      const bin = bins.find(candidate => share >= candidate.low && share < candidate.high)
      if (bin) bin.count++
    }
    const labelWidth = Math.max(...bins.map(bin => bin.label.length), `${count(limit)} limit`.length)
    const most = Math.max(1, ...bins.map(bin => bin.count))
    const room = Math.max(8, columns - labelWidth - 9)
    const lines = []
    for (const bin of bins) {
      if (Math.abs(bin.low - 1) < 1e-9) lines.push(paint(`${padStart(`${count(limit)} limit`, labelWidth)} ┼${repeat('─', room + 1)}`, STYLE.yellow))
      const over = bin.low >= 1 - 1e-9
      const drawn = bar(bin.count, most, room)
      lines.push(`${paint(padStart(bin.label, labelWidth), STYLE.dim)} ${paint('│', STYLE.dim)}${paint(drawn, over ? STYLE.red : STYLE.blue)}${bin.count ? paint(` ${count(bin.count)}`, STYLE.dim) : ''}`)
    }
    // Leading and trailing empty rows are noise; keep the limit line in view.
    const used = bins.map(bin => bin.count > 0)
    const firstUsed = Math.max(0, Math.min(used.indexOf(true) < 0 ? 0 : used.indexOf(true), bins.findIndex(bin => Math.abs(bin.low - 1) < 1e-9) - 1))
    const limitRow = bins.findIndex(bin => Math.abs(bin.low - 1) < 1e-9)
    const lastUsed = Math.max(limitRow + 1, used.lastIndexOf(true) + 1) // +1 accounts for the limit line
    return lines.slice(firstUsed, lastUsed + 1)
  }

  function tally(columns) {
    const total = results.length
    const reasons = MODES.filter(mode => failed[mode]).map(mode => `${mode} ${count(failed[mode])}`).join(', ')
    const mean = total ? forceSum / total : 0
    const margin = ((limit - mean) / limit) * 100
    return [
      `${paint(`${count(passed)} passed`, passed === total ? STYLE.green : '')} · ${total - passed ? paint(`${count(total - passed)} failed`, STYLE.red) : '0 failed'}${reasons ? ` (${reasons})` : ''}`,
      ...wrap(`mean peak leg force ${count(mean)} N, ${margin >= 0 ? `${margin.toFixed(1)}% under` : `${(-margin).toFixed(1)}% over`} the ${count(limit)} N limit`, columns),
    ]
  }

  // The first landing as a strip chart of the hardest-loaded leg.
  function replayFrame(columns, rows) {
    const shown = Math.min(1, elapsed / REPLAY_MS)
    const stepsShown = Math.round((REPLAY_SECONDS / replay.dt) * shown)
    const chartRows = Math.max(4, Math.min(8, rows - 9))
    const chartColumns = Math.max(16, Math.min(64, columns - 12))
    const total = Math.round(REPLAY_SECONDS / replay.dt)
    const peaks = Array.from({ length: chartColumns }, (_, column) => {
      const from = Math.floor((column / chartColumns) * total), to = Math.max(from + 1, Math.floor(((column + 1) / chartColumns) * total))
      if (from >= stepsShown) return null
      let peak = 0
      for (let step = from; step < Math.min(to, stepsShown, replay.steps.length); step++) peak = Math.max(peak, ...replay.steps[step].forces)
      return peak
    })
    const top = Math.max(limit, replay.maxForce) * 1.08
    const limitRow = chartRows - 1 - Math.min(chartRows - 1, Math.floor((limit / top) * chartRows))
    const axisWidth = count(top).length
    const lines = []
    for (let row = 0; row < chartRows; row++) {
      const low = ((chartRows - 1 - row) / chartRows) * top, high = ((chartRows - row) / chartRows) * top
      let cells = ''
      for (const peak of peaks) {
        const fill = peak === null ? -1 : (peak - low) / (high - low)
        cells += fill > 0.02 ? paint(fill >= 0.75 ? '█' : fill >= 0.5 ? '▓' : fill >= 0.25 ? '▒' : '░', STYLE.blue) : row === limitRow ? paint('─', STYLE.yellow) : ' '
      }
      const label = row === limitRow ? paint(padStart(count(limit), axisWidth), STYLE.yellow) : padStart(row === 0 ? count(top) : '', axisWidth)
      lines.push(`${paint(label, row === limitRow ? '' : STYLE.dim)} ${paint(row === limitRow ? '┼' : '│', row === limitRow ? STYLE.yellow : STYLE.dim)}${cells}${row === limitRow ? paint(' limit', STYLE.yellow) : ''}`)
    }
    lines.push(paint(`${padStart('0', axisWidth)} └${repeat('─', chartColumns)}`, STYLE.dim))
    lines.push(paint(`${' '.repeat(axisWidth + 2)}0 s${' '.repeat(Math.max(1, chartColumns - 8))}${REPLAY_SECONDS.toFixed(1)} s`, STYLE.dim))
    const now = replay.steps[Math.min(replay.steps.length - 1, stepsShown)]
    const legs = WHEELS.map((wheel, index) => `${wheel} ${padStart(count(Math.max(0, now.forces[index])), 5)}`).join('  ')
    return [
      ...header(columns),
      '',
      ...wrap(`landing 1 of ${count(TRIALS)} · touchdown ${first.speed.toFixed(2)} m/s · roll ${degrees(first.roll)} · pitch ${degrees(first.pitch)}`, columns),
      paint('highest leg force (N), slowed down', STYLE.dim),
      ...lines,
      ...(columns >= 60 ? [`leg force now (N)  ${legs}`] : ['leg force now (N)', legs]),
    ]
  }

  function trialsFrame(columns, rows) {
    const done = results.length
    const meter = Math.max(8, Math.min(40, columns - 28))
    const filled = Math.round((done / TRIALS) * meter)
    return [
      ...header(columns),
      '',
      `landing ${padStart(count(done), 5)} of ${count(TRIALS)}  ${paint(repeat('█', filled), STYLE.blue)}${paint(repeat('░', meter - filled), STYLE.dim)}`,
      paint('peak leg force in each landing (N)', STYLE.dim),
      ...histogram(columns, rows >= 24 ? 0.05 : 0.1),
      ...tally(columns),
    ]
  }

  return {
    get done() { return results.length >= TRIALS && elapsed >= REPLAY_MS + TRIALS_MS },
    advance(ms) {
      elapsed += ms
      if (elapsed >= REPLAY_MS) runTo(1 + Math.floor(((elapsed - REPLAY_MS) / TRIALS_MS) * (TRIALS - 1)))
    },
    finish() { elapsed = REPLAY_MS + TRIALS_MS; runTo(TRIALS) },
    stop() { interrupted = true; if (!results.length) runTo(1) },
    frame(columns, rows) {
      if (columns < 44 || rows < 16) return null
      const lines = elapsed < REPLAY_MS ? replayFrame(columns, rows) : trialsFrame(columns, rows)
      return lines.slice(0, rows).map(line => fit(line, columns))
    },
    summary(columns) {
      const total = results.length
      const note = interrupted && total < TRIALS ? `stopped after ${count(total)} of ${count(TRIALS)} landings.` : `these are ${count(total)} new landings sampled in your browser.`
      const custom = k !== SELECTED.k || c !== SELECTED.c
      return [
        ...(columns >= heading.length ? [heading] : ['uav landing · monte carlo', settings]),
        paint('peak leg force in each landing (N)', STYLE.dim),
        ...histogram(columns, 0.05),
        ...tally(columns),
        ...wrap(`${note} the model is the one from the paper: heave, roll, and pitch on four one-way spring-dampers, integrated with rk4. a landing fails if a spring bottoms out, a leg exceeds the force limit, roll or pitch passes 0.2 rad, or the uav is still bouncing after 2 s.`, columns).map(line => paint(line, STYLE.dim)),
        ...wrap(custom ? `the paper's choice is run uav (k ${fixed(SELECTED.k)}, c ${fixed(SELECTED.c)}).` : 'try a softer spring: run uav 12000 300', columns),
      ].map(line => fit(line, columns)).join('\r\n')
    },
    get stats() { return { total: results.length, passed, failed: { ...failed }, meanForce: results.length ? forceSum / results.length : 0, limit } },
  }
}
