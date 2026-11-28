import { MOVE_COST, TURN_COST, createMaze, findOptimalPath, replay, toActions } from './mazeModel.js'
import { STOP_HINT, STYLE, count, fit, headline, paint, repeat, wrap } from './draw.js'

const SEARCH_MS = 3000
const DRIVE_SPEED = 6 // the route is replayed at six times real speed
const ROBOT = ['/\\', '>>', '\\/', '<<'] // facing north, east, south, west
const TITLE = 'robot tour · fastest route through every gate'
const FIELD = { top: 1, left: 1, rows: 4, cols: 5 } // the playable part of the track
const JUNCTIONS = { lr: '─', ud: '│', dr: '┌', dl: '┐', ur: '└', ul: '┘', udr: '├', udl: '┤', dlr: '┬', ulr: '┴', udlr: '┼', l: '─', r: '─', u: '│', d: '│' }

export function parseMaze(args) {
  return args.length ? { error: 'usage: run maze. it takes no options.' } : { options: {} }
}

export function createMazeProgram() {
  const maze = createMaze()
  const found = findOptimalPath(maze, { trace: true })
  const actions = toActions(found.path)
  const checked = replay(maze, actions)
  const { steps } = checked
  const total = checked.time
  const driveMs = (total / DRIVE_SPEED) * 1000
  const gateNames = Object.keys(maze.gates)
  let elapsed = 0, interrupted = false

  const cellAt = (row, col) => maze.cells[FIELD.top + row][FIELD.left + col]
  // Wall segments on the lattice around the field.
  const across = (line, col) => (line < FIELD.rows ? cellAt(line, col).walls.N : cellAt(line - 1, col).walls.S)
  const down = (row, line) => (line < FIELD.cols ? cellAt(row, line).walls.W : cellAt(row, line - 1).walls.E)

  function junction(line, post) {
    const arms = `${line > 0 && down(line - 1, post) ? 'u' : ''}${line < FIELD.rows && down(line, post) ? 'd' : ''}${post > 0 && across(line, post - 1) ? 'l' : ''}${post < FIELD.cols && across(line, post) ? 'r' : ''}`
    return arms ? JUNCTIONS[arms] : paint('·', STYLE.dim)
  }

  const center = (text, width) => {
    const left = Math.floor((width - text.length) / 2)
    return `${' '.repeat(left)}${text}${' '.repeat(width - text.length - left)}`
  }

  // large: each square is five characters wide and two rows tall, with its
  // label above the robot. Otherwise three wide and one row, robot on top.
  function field({ robot, cleared = '', touched = null }, large) {
    const width = large ? 5 : 3
    const lines = []
    for (let line = 0; line <= FIELD.rows; line++) {
      let edge = ' '
      for (let post = 0; post <= FIELD.cols; post++) {
        edge += junction(line, post)
        if (post < FIELD.cols) edge += across(line, post) ? repeat('─', width) : ' '.repeat(width)
      }
      lines.push(edge)
      if (line === FIELD.rows) break
      const label = [' '], lower = [' ']
      for (let col = 0; col <= FIELD.cols; col++) {
        const wall = down(line, col) ? '│' : ' '
        label.push(wall)
        lower.push(wall)
        if (col === FIELD.cols) break
        const row = FIELD.top + line, column = FIELD.left + col
        const here = robot && robot.row === row && robot.col === column
        const gate = maze.cells[row][column].gate
        const isStart = row === maze.start[0] && column === maze.start[1], isEnd = row === maze.end[0] && column === maze.end[1]
        const seen = touched?.has(row * maze.cols + column)
        let name = gate ? paint(center(gate, width), cleared.includes(gate) ? STYLE.green : `${STYLE.bold};${STYLE.yellow}`)
          : isStart ? paint(center(large ? 'start' : 'go', width), STYLE.dim)
          : isEnd ? paint(center('end', width), STYLE.cyan)
          : seen && !large ? paint(center('·', width), STYLE.dim) : ' '.repeat(width)
        const marker = `${' '.repeat(Math.floor((width - 2) / 2))}${paint(ROBOT[robot?.direction ?? 0], STYLE.onWhite)}${' '.repeat(Math.ceil((width - 2) / 2))}`
        if (here && !large) name = marker
        label.push(name)
        lower.push(here ? marker : seen ? paint(center('·', width), STYLE.dim) : ' '.repeat(width))
      }
      lines.push(label.join(''))
      if (large) lines.push(lower.join(''))
    }
    return lines
  }

  function tape(columns, current) {
    const lines = []
    let line = '', used = 0
    actions.forEach((action, index) => {
      if (used + 2 > columns) { lines.push(line); line = ''; used = 0 }
      line += `${paint(action, index < current ? STYLE.dim : index === current ? STYLE.onWhite : '')} `
      used += 2
    })
    return [...lines, line]
  }

  // Gates in the order they were cleared, then a dot for each one left.
  const gateLine = cleared => [...cleared, ...Array(gateNames.length - cleared.length).fill('·')].join(' ')

  function view() {
    if (elapsed < SEARCH_MS) {
      const expanded = Math.min(found.expanded, Math.floor((elapsed / SEARCH_MS) * found.expanded))
      const touched = new Set(found.log.squares.slice(0, expanded))
      let mostGates = 0
      for (let index = 0; index < expanded; index++) if (found.log.gates[index] > mostGates) mostGates = found.log.gates[index]
      return {
        state: { touched }, current: -1,
        status: `searching · ${count(expanded)} states · routes up to ${(found.log.times[Math.max(0, expanded - 1)] ?? 0).toFixed(1)} s`,
        detail: `${mostGates} of ${gateNames.length} gates cleared by the best route so far`,
      }
    }
    const clock = Math.min(total, ((elapsed - SEARCH_MS) / 1000) * DRIVE_SPEED)
    // The action in progress is the first one that has not finished yet.
    let current = steps.findIndex(step => step.time > clock)
    if (current < 0) current = steps.length - 1
    const done = steps[Math.max(0, current - 1)]
    return {
      state: { robot: done, cleared: done.cleared }, current,
      status: `driving · ${clock.toFixed(1)} of ${total.toFixed(2)} s`,
      detail: `gates cleared  ${gateLine(done.cleared)}`,
    }
  }

  const totals = () => {
    const forward = actions.filter(action => action === 'F' || action === 'E').length
    const turns = actions.filter(action => action === 'L' || action === 'R').length
    return `${forward} forward moves and ${turns} quarter turns: ${total.toFixed(2)} s at ${MOVE_COST} s a square and ${TURN_COST} s a turn.`
  }

  return {
    get done() { return elapsed >= SEARCH_MS + driveMs },
    advance(ms) { elapsed += ms },
    finish() { elapsed = SEARCH_MS + driveMs },
    stop() { interrupted = true },
    frame(columns, rows) {
      if (columns < 40 || rows < 18) return null
      const { state, status, detail, current } = view()
      const large = columns >= 46 && rows >= 23
      return [
        headline(columns >= 60 ? TITLE : 'robot tour', STOP_HINT, columns),
        status,
        detail,
        ...field(state, large),
        ...tape(columns, current),
      ].map(line => fit(line, columns))
    },
    summary(columns) {
      const last = steps.at(-1)
      return [
        TITLE,
        ...field({ cleared: last.cleared }, columns >= 46),
        ...tape(columns, -1),
        ...wrap(totals(), columns),
        ...wrap(`gates cleared in order ${found.gatesSequence.join(' ')}. replaying the actions against the walls and gate rules: ${checked.valid ? 'valid' : 'not valid'}.${interrupted ? ' stopped early; this is the finished plan.' : ''}`, columns),
        ...wrap(`i ported the track, the costs, and the search from the python in the repo. the search expanded ${count(found.expanded)} states. a gate counts when the robot drives out of it, and gate ${maze.lastGate} has to be cleared last.`, columns).map(line => paint(line, STYLE.dim)),
        'the real one: view ~/projects/maze-robot',
      ].map(line => fit(line, columns)).join('\r\n')
    },
    get stats() { return { actions: actions.join(' '), time: total, gates: found.gatesSequence.join(''), expanded: found.expanded, valid: checked.valid } },
  }
}
