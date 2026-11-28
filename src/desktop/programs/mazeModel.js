// Robot Tour route search, ported from robottouroptimalpathtominseconds.py in
// github.com/parthm667/RobotTourMazeSolver: the same track, action costs, gate
// rules, and search order. The robot may turn left, turn right, turn around,
// or drive forward one square. It must leave every gate, the last gate last,
// and finish on the end square in the least total time.
export const MOVE_COST = 1.21 // seconds to drive one square
export const TURN_COST = 0.65 // seconds for a quarter turn
export const UTURN_COST = 2 * TURN_COST
export const DIRECTIONS = [[-1, 0], [0, 1], [1, 0], [0, -1]] // north, east, south, west
const LABELS = ['N', 'E', 'S', 'W']
const OPPOSITE = { N: 'S', E: 'W', S: 'N', W: 'E' }

// The track from create_maze(): a 4 x 5 field inside a one-square border.
export function createMaze() {
  const rows = 6, cols = 7
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ walls: { N: false, E: false, S: false, W: false }, gate: null })))
  const gates = { A: [4, 2], B: [1, 3], C: [2, 5], D: [1, 2], E: [1, 1] }
  const barriers = [
    // The border that keeps the robot on the field; the gap is where it enters.
    [0, 1, 'S'], [0, 2, 'S'], [0, 3, 'S'], [0, 4, 'S'], [0, 5, 'S'],
    [5, 1, 'N'], [5, 2, 'N'], [5, 4, 'N'], [5, 5, 'N'],
    [1, 0, 'E'], [2, 0, 'E'], [3, 0, 'E'], [4, 0, 'E'],
    [1, 6, 'W'], [2, 6, 'W'], [3, 6, 'W'], [4, 6, 'W'],
    // Barriers on the field.
    [4, 2, 'N'], [4, 2, 'E'], [4, 3, 'N'], [4, 4, 'E'], [2, 2, 'W'],
    [2, 2, 'S'], [2, 3, 'N'], [2, 4, 'E'], [1, 1, 'E'], [1, 2, 'E'],
  ]
  for (const [row, col, side] of barriers) {
    cells[row][col].walls[side] = true
    const [dr, dc] = DIRECTIONS[LABELS.indexOf(side)]
    const next = cells[row + dr]?.[col + dc]
    if (next) next.walls[OPPOSITE[side]] = true
  }
  for (const [label, [row, col]] of Object.entries(gates)) cells[row][col].gate = label
  return { rows, cols, cells, gates, start: [4, 3], end: [4, 5], lastGate: 'E', initialDirection: 0 }
}

const inBounds = (maze, row, col) => row >= 0 && row < maze.rows && col >= 0 && col < maze.cols

export function wallBlocks(maze, row, col, direction) {
  const [dr, dc] = DIRECTIONS[direction]
  const toRow = row + dr, toCol = col + dc
  if (!inBounds(maze, toRow, toCol)) return true
  const side = LABELS[direction]
  return maze.cells[row][col].walls[side] || maze.cells[toRow][toCol].walls[OPPOSITE[side]]
}

class Heap {
  constructor() { this.items = [] }
  get size() { return this.items.length }
  static before(a, b) { return a.cost < b.cost || (a.cost === b.cost && a.order < b.order) }
  push(item) {
    const items = this.items
    let index = items.push(item) - 1
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (!Heap.before(item, items[parent])) break
      items[index] = items[parent]
      index = parent
    }
    items[index] = item
  }
  pop() {
    const items = this.items, top = items[0], last = items.pop()
    if (!items.length) return top
    let index = 0
    for (;;) {
      let child = index * 2 + 1
      if (child >= items.length) break
      if (child + 1 < items.length && Heap.before(items[child + 1], items[child])) child++
      if (!Heap.before(items[child], last)) break
      items[index] = items[child]
      index = child
    }
    items[index] = last
    return top
  }
}

// Least-time search over (square, heading, gates left so far in order). The
// original leaves the A* heuristic at zero, so states come off the queue in
// order of elapsed time, earliest pushed first among ties. With trace set, the
// state and time of every expansion are kept so the search can be replayed.
export function findOptimalPath(maze, { trace = false } = {}) {
  const gateCount = Object.keys(maze.gates).length
  const key = state => `${state.row},${state.col},${state.direction},${state.sequence}`
  const start = { row: maze.start[0], col: maze.start[1], direction: maze.initialDirection, sequence: '', move: null, parent: null }
  const best = new Map([[key(start), 0]])
  const queue = new Heap()
  let order = 0, expanded = 0
  queue.push({ cost: 0, order: order++, state: start })
  const log = trace ? { states: [], times: [] } : null

  while (queue.size) {
    const { cost, state } = queue.pop()
    expanded++
    if (log) { log.states.push(state); log.times.push(cost) }
    if (state.row === maze.end[0] && state.col === maze.end[1] && state.sequence.length === gateCount) {
      const path = []
      for (let at = state; at; at = at.parent) path.unshift({ row: at.row, col: at.col, direction: at.direction, move: at.move })
      return { path, gatesSequence: state.sequence.split(''), cost, expanded, log }
    }
    const next = []
    const turn = (quarters, turnCost, move) => next.push([{ ...state, direction: (state.direction + quarters + 4) % 4 }, turnCost, move])
    turn(-1, TURN_COST, 'L')
    turn(1, TURN_COST, 'R')
    turn(2, UTURN_COST, 'U')
    if (!wallBlocks(maze, state.row, state.col, state.direction)) {
      const [dr, dc] = DIRECTIONS[state.direction]
      const row = state.row + dr, col = state.col + dc
      // A gate counts once the robot drives out of it.
      const leaving = maze.cells[state.row][state.col].gate
      const sequence = leaving && leaving !== maze.cells[row][col].gate && !state.sequence.includes(leaving) ? state.sequence + leaving : state.sequence
      // The last gate may only be cleared after all the others.
      if (!sequence.includes(maze.lastGate) || sequence.length === gateCount) next.push([{ ...state, row, col, sequence }, MOVE_COST, 'F'])
    }
    for (const [candidate, stepCost, move] of next) {
      const total = cost + stepCost
      const id = key(candidate)
      if (best.has(id) && total >= best.get(id)) continue
      best.set(id, total)
      candidate.move = move
      candidate.parent = state
      queue.push({ cost: total, order: order++, state: candidate })
    }
  }
  return null
}

// The action list the original prints: S to start, a U-turn as two right
// turns, and E for the final drive onto the end square.
export function toActions(path) {
  const actions = ['S']
  for (const step of path.slice(1)) actions.push(...(step.move === 'U' ? ['R', 'R'] : [step.move]))
  if (actions.length > 1 && actions.at(-1) === 'F') actions[actions.length - 1] = 'E'
  else actions.push('E')
  return actions
}

export const actionCost = action => (action === 'F' || action === 'E' ? MOVE_COST : action === 'L' || action === 'R' ? TURN_COST : 0)

// Replay an action list against the walls and gate rules, as verify_path() does.
export function replay(maze, actions) {
  let [row, col] = maze.start, direction = maze.initialDirection, time = 0
  const cleared = []
  const steps = [{ action: 'S', row, col, direction, time, cleared: '' }]
  for (const action of actions.slice(1)) {
    if (action === 'L') direction = (direction + 3) % 4
    else if (action === 'R') direction = (direction + 1) % 4
    else if (action === 'F' || action === 'E') {
      if (wallBlocks(maze, row, col, direction)) return { valid: false, steps, reason: `a wall blocks the move from ${row},${col}` }
      const gate = maze.cells[row][col].gate
      if (gate && !cleared.includes(gate)) cleared.push(gate)
      row += DIRECTIONS[direction][0]
      col += DIRECTIONS[direction][1]
    } else return { valid: false, steps, reason: `unknown action ${action}` }
    time += actionCost(action)
    steps.push({ action, row, col, direction, time, cleared: cleared.join('') })
  }
  const gates = Object.keys(maze.gates)
  const valid = row === maze.end[0] && col === maze.end[1] && gates.every(gate => cleared.includes(gate)) && cleared.at(-1) === maze.lastGate
  return { valid, steps, cleared, time, reason: valid ? null : 'the route does not clear every gate and finish on the end square' }
}
