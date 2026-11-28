// Route planning on a 16 x 16 grid, as in projects/maze-robot: A* over
// (cell, heading) states, where every quarter turn costs extra, so the planner
// accounts for turning instead of counting steps alone.
export const SIZE = 16
export const TURN_COST = 3
export const HEADINGS = [[0, -1], [1, 0], [0, 1], [-1, 0]] // north, east, south, west
export const START = { x: 0, y: SIZE - 1, heading: 0 }
export const GOAL = { x: SIZE - 1, y: 0 }

const key = (x, y) => y * SIZE + x
const quarterTurns = (from, to) => { const turn = Math.abs(from - to); return turn === 3 ? 1 : turn }

class Heap {
  constructor() { this.items = [] }
  get size() { return this.items.length }
  push(item) {
    const items = this.items
    let index = items.push(item) - 1
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (items[parent].priority <= item.priority) break
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
      if (child + 1 < items.length && items[child + 1].priority < items[child].priority) child++
      if (items[child].priority >= last.priority) break
      items[index] = items[child]
      index = child
    }
    items[index] = last
    return top
  }
}

// A* that yields after every expansion so the search can be drawn as it runs.
// With turnCost 0 it is an ordinary shortest-path search.
export function* search(blocked, turnCost = TURN_COST) {
  const stateKey = (x, y, heading) => key(x, y) * 4 + heading
  const best = new Map(), parent = new Map(), closed = new Set()
  const open = new Heap()
  // Admissible: remaining steps, plus one turn if the goal is not straight ahead.
  const estimate = (x, y) => Math.abs(GOAL.x - x) + Math.abs(GOAL.y - y) + (x !== GOAL.x && y !== GOAL.y ? turnCost : 0)
  const first = stateKey(START.x, START.y, START.heading)
  best.set(first, 0)
  open.push({ x: START.x, y: START.y, heading: START.heading, cost: 0, priority: estimate(START.x, START.y), order: 0 })
  let expanded = 0, order = 0
  while (open.size) {
    const node = open.pop()
    const id = stateKey(node.x, node.y, node.heading)
    if (closed.has(id)) continue
    closed.add(id)
    expanded++
    if (node.x === GOAL.x && node.y === GOAL.y) {
      const path = []
      for (let at = id; at !== undefined; at = parent.get(at)) path.unshift({ x: (at >> 2) % SIZE, y: Math.floor((at >> 2) / SIZE), heading: at & 3 })
      return { path, cost: node.cost, expanded, ...measure(path) }
    }
    yield { x: node.x, y: node.y, expanded }
    for (let heading = 0; heading < 4; heading++) {
      const x = node.x + HEADINGS[heading][0], y = node.y + HEADINGS[heading][1]
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || blocked.has(key(x, y))) continue
      const cost = node.cost + 1 + turnCost * quarterTurns(node.heading, heading)
      const next = stateKey(x, y, heading)
      if (cost >= (best.get(next) ?? Infinity)) continue
      best.set(next, cost)
      parent.set(next, id)
      // Ties break toward the most recently found state, which keeps the
      // search from fanning out across equally good cells.
      open.push({ x, y, heading, cost, priority: cost + estimate(x, y) - ++order * 1e-9 })
    }
  }
  return null
}

export function measure(path) {
  let turns = 0
  for (let index = 1; index < path.length; index++) turns += quarterTurns(path[index - 1].heading, path[index].heading)
  return { steps: path.length - 1, turns }
}

export function solve(blocked, turnCost = TURN_COST) {
  const run = search(blocked, turnCost)
  for (;;) {
    const { value, done } = run.next()
    if (done) return value
  }
}

// Scatter short wall segments, then keep the layout only if a route exists and
// the turn penalty actually changes it.
export function createGrid(random) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const blocked = new Set()
    for (let segment = 0; segment < 26; segment++) {
      const horizontal = random() < 0.5
      const length = random.integer(2, 5)
      let x = random.integer(0, SIZE - 1), y = random.integer(0, SIZE - 1)
      for (let step = 0; step < length; step++) {
        if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) blocked.add(key(x, y))
        if (horizontal) x++
        else y++
      }
    }
    for (const [x, y] of [[START.x, START.y], [START.x, START.y - 1], [START.x + 1, START.y], [GOAL.x, GOAL.y], [GOAL.x - 1, GOAL.y], [GOAL.x, GOAL.y + 1]]) blocked.delete(key(x, y))
    const planned = solve(blocked)
    if (!planned || planned.steps < 34) continue
    const shortest = solve(blocked, 0)
    if (shortest.turns - planned.turns < 3) continue
    return { blocked, planned, shortest }
  }
  throw new Error('no usable grid found')
}

export const cellKey = key
