import { createRandom } from './random.js'
import { GOAL, SIZE, START, TURN_COST, cellKey, createGrid, measure, search } from './mazeModel.js'
import { STOP_HINT, STYLE, count, fit, headline, paint, wrap } from './draw.js'

const SEARCH_MS = 3600
const TRACE_MS = 700
const CELLS_PER_SECOND = 9
const ROBOT = ['/\\', '>>', '\\/', '<<'] // facing north, east, south, west
const TITLE = 'maze robot · a* on a 16 × 16 grid, turns cost extra'

export function parseMaze(args) {
  return args.length ? { error: 'usage: run maze. it takes no options.' } : { options: {} }
}

export function createMaze(_options, { seed }) {
  const { blocked, planned, shortest } = createGrid(createRandom(seed))
  const expansions = [...search(blocked)] // the order the planner visited cells
  const driveMs = (planned.steps / CELLS_PER_SECOND) * 1000
  const total = SEARCH_MS + TRACE_MS + driveMs
  let elapsed = 0, interrupted = false

  // Cells are two characters wide so they read as squares; large terminals
  // get them at double size.
  function grid({ explored, pathLength, robot }, scale = 1) {
    const seen = new Set(expansions.slice(0, explored).map(cell => cellKey(cell.x, cell.y)))
    const frontier = explored < expansions.length ? expansions[explored] : null
    const onPath = new Map(planned.path.slice(0, pathLength).map((cell, index) => [cellKey(cell.x, cell.y), index]))
    const wide = text => (scale === 1 ? text : `${text[0]} ${text[1]} `)
    const lines = []
    for (let y = 0; y < SIZE; y++) {
      let line = ' ', filler = ' '
      for (let x = 0; x < SIZE; x++) {
        const id = cellKey(x, y)
        let text = '  ', style = ''
        if (robot && robot.x === x && robot.y === y) { text = ROBOT[robot.heading]; style = STYLE.onWhite }
        else if (x === GOAL.x && y === GOAL.y) { text = 'G '; style = STYLE.onGreen }
        else if (x === START.x && y === START.y) { text = 'S '; style = STYLE.onBlue }
        else if (onPath.has(id)) style = STYLE.onBlue
        else if (blocked.has(id)) style = STYLE.onGray
        else if (frontier && frontier.x === x && frontier.y === y) { text = '··'; style = STYLE.yellow }
        else if (seen.has(id)) { text = '· '; style = STYLE.dim }
        const background = style.startsWith('30;') || style === STYLE.onBlue || style === STYLE.onGray
        line += style ? paint(scale === 1 ? text : background && text.trim() ? ` ${text} ` : wide(text), style) : ' '.repeat(2 * scale)
        filler += background ? paint(' '.repeat(2 * scale), style) : ' '.repeat(2 * scale)
      }
      lines.push(line)
      if (scale === 2) lines.push(filler)
    }
    return lines
  }

  const legend = `${paint('  ', STYLE.onGray)} wall  ${paint('· ', STYLE.dim)}searched  ${paint('  ', STYLE.onBlue)} route`

  function view() {
    if (elapsed < SEARCH_MS) {
      const explored = Math.min(expansions.length, Math.floor((elapsed / SEARCH_MS) * expansions.length))
      return { state: { explored, pathLength: 0 }, status: `searching · ${count(explored)} of ${count(expansions.length)} states expanded` }
    }
    if (elapsed < SEARCH_MS + TRACE_MS) {
      const pathLength = Math.ceil(((elapsed - SEARCH_MS) / TRACE_MS) * planned.path.length)
      return { state: { explored: expansions.length, pathLength }, status: `route found · ${planned.steps} steps, ${planned.turns} quarter turns` }
    }
    const index = Math.min(planned.path.length - 1, Math.floor(((elapsed - SEARCH_MS - TRACE_MS) / 1000) * CELLS_PER_SECOND))
    const driven = measure(planned.path.slice(0, index + 1))
    return {
      state: { explored: expansions.length, pathLength: planned.path.length, robot: planned.path[index] },
      status: `driving · step ${driven.steps} of ${planned.steps} · turn ${driven.turns} of ${planned.turns}`,
    }
  }

  return {
    get done() { return elapsed >= total },
    advance(ms) { elapsed += ms },
    finish() { elapsed = total },
    stop() { interrupted = true },
    frame(columns, rows) {
      if (columns < 36 || rows < 21) return null
      const { state, status } = view()
      return [
        headline(columns >= 62 ? TITLE : 'maze robot · a*', STOP_HINT, columns),
        status,
        ...grid(state, columns >= 68 && rows >= 37 ? 2 : 1),
        legend,
      ].map(line => fit(line, columns))
    },
    summary(columns) {
      const saved = shortest.turns - planned.turns
      const extra = planned.steps - shortest.steps
      const plain = [
        `route: ${planned.steps} steps and ${planned.turns} quarter turns, after expanding ${count(planned.expanded)} states.${interrupted ? ' stopped early; this is the finished plan.' : ''}`,
        `a search that counts steps only found ${shortest.steps} steps and ${shortest.turns} turns here, so the turn cost ${extra ? `trades ${extra} extra ${extra === 1 ? 'step' : 'steps'} for` : 'gives the same length with'} ${saved} fewer turns.`,
      ].flatMap(line => wrap(line, columns))
      const note = wrap(`each quarter turn costs as much as ${TURN_COST} steps. this grid is random; the turn-aware search is the same idea as the robot's planner.`, columns).map(line => paint(line, STYLE.dim))
      return [
        TITLE,
        ...grid({ explored: expansions.length, pathLength: planned.path.length }),
        legend,
        ...plain,
        ...note,
        'the real one: view ~/projects/maze-robot',
      ].map(line => fit(line, columns)).join('\r\n')
    },
    get stats() { return { planned: { steps: planned.steps, turns: planned.turns, expanded: planned.expanded }, shortest: { steps: shortest.steps, turns: shortest.turns } } },
  }
}
