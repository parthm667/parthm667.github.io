import test from 'node:test'
import assert from 'node:assert/strict'
import { HOME } from '../src/desktop/filesystem.js'
import { executeCommand } from '../src/desktop/shell.js'
import { PROGRAM_NAMES, createProgram } from '../src/desktop/programs/index.js'
import { createRandom } from '../src/desktop/programs/random.js'
import { visibleWidth } from '../src/desktop/programs/draw.js'
import { SELECTED, TRIALS, forceLimit, sampleTouchdown, simulateLanding } from '../src/desktop/programs/uavModel.js'
import { BUY, OrderBook, RiskManager, SELL, SETTINGS, SimpleMomentum, createMarket } from '../src/desktop/programs/orderBookModel.js'
import { MOVE_COST, TURN_COST, createMaze, findOptimalPath, replay, toActions, wallBlocks } from '../src/desktop/programs/mazeModel.js'

const spec = command => executeCommand(command, HOME).program

test('run parses demo names, aliases, and options', () => {
  assert.deepEqual(spec('run uav'), { name: 'uav', options: SELECTED })
  assert.deepEqual(spec('run uav 12000 300'), { name: 'uav', options: { k: 12000, c: 300 } })
  assert.equal(spec('run order-book').name, 'orderbook')
  assert.equal(spec('demo maze').name, 'maze')
  assert.match(executeCommand('run').lines[0].text, /run uav[\s\S]*run orderbook[\s\S]*run maze/)
  for (const bad of ['run nope', 'run uav 1 2', 'run uav 12000', 'run uav abc def', 'run uav 12000 300 9', 'run maze fast', 'run orderbook 3']) {
    const result = executeCommand(bad)
    assert.equal(result.lines[0].type, 'error', bad)
    assert.equal(result.program, undefined, bad)
  }
})

test('the landing model matches the paper for its chosen suspension', () => {
  assert.ok(Math.abs(forceLimit(SELECTED.k) - 6708.15) < 0.01)
  const random = createRandom(11)
  let passed = 0, force = 0
  for (let trial = 0; trial < TRIALS; trial++) {
    const result = simulateLanding(SELECTED.k, SELECTED.c, sampleTouchdown(random))
    if (result.success) passed++
    force += result.maxForce
    assert.ok(result.minLength > 0.2, 'the chosen spring never bottoms out')
  }
  // The published run: 1,000 of 1,000 and a mean peak force of 5,057 N.
  // Across reruns of the original C++ about 99.6% of landings pass.
  assert.ok(passed >= 985, `${passed} passed`)
  assert.ok(Math.abs(force / TRIALS - 5057) < 120, `mean peak force ${force / TRIALS}`)
})

test('the landing model fails weak and overdamped suspensions for the right reason', () => {
  const tally = (k, c) => {
    const random = createRandom(3), failed = { bottoming: 0, force: 0, attitude: 0, settling: 0 }
    let passed = 0
    for (let trial = 0; trial < 300; trial++) {
      const result = simulateLanding(k, c, sampleTouchdown(random))
      if (result.success) passed++
      for (const mode in failed) if (result.failures[mode]) failed[mode]++
    }
    return { passed, failed }
  }
  const soft = tally(8000, 150)
  assert.ok(soft.passed < 60 && soft.failed.bottoming > 200)
  const stiffDamper = tally(21216, 1500)
  assert.equal(stiffDamper.passed, 0)
  assert.equal(stiffDamper.failed.force, 300)
  assert.equal(stiffDamper.failed.bottoming, 0)
})

test('a traced landing reports the same outcome as an untraced one', () => {
  const touchdown = sampleTouchdown(createRandom(9))
  const plain = simulateLanding(SELECTED.k, SELECTED.c, touchdown)
  const traced = simulateLanding(SELECTED.k, SELECTED.c, touchdown, { trace: true })
  assert.equal(traced.maxForce, plain.maxForce)
  assert.equal(traced.steps.length, 700)
  assert.equal(Math.max(...traced.steps.flatMap(step => step.forces)), plain.maxForce)
})

test('the order book matches by price, then by arrival time', () => {
  const book = new OrderBook()
  book.limit({ id: 1, side: SELL, price: 101, size: 10 })
  book.limit({ id: 2, side: SELL, price: 100, size: 10 })
  book.limit({ id: 3, side: SELL, price: 100, size: 10 })
  assert.deepEqual(book.limit({ id: 4, side: BUY, price: 99, size: 5 }), [])
  const trades = book.market(BUY, 25)
  assert.deepEqual(trades.map(trade => [trade.maker, trade.price, trade.size]), [[2, 100, 10], [3, 100, 10], [1, 101, 5]])
  assert.deepEqual(book.depth(SELL, 3), [{ price: 101, size: 5 }])
  const crossing = book.limit({ id: 5, side: SELL, price: 98, size: 8 })
  assert.deepEqual(crossing.map(trade => [trade.maker, trade.price, trade.size]), [[4, 99, 5]])
  assert.deepEqual(book.depth(SELL, 3), [{ price: 98, size: 3 }, { price: 101, size: 5 }])
  assert.equal(book.cancel(5), true)
  assert.equal(book.cancel(5), false)
  assert.equal(book.best(SELL), 101)
  assert.equal(book.best(BUY), null)
})

test('the momentum strategy signals on moves past its threshold and resets its reference', () => {
  const strategy = new SimpleMomentum(0.015, 10)
  assert.equal(strategy.onTrade(100), null, 'the first print only sets the reference')
  assert.equal(strategy.onTrade(100.01), null)
  const up = strategy.onTrade(100.02)
  assert.deepEqual([up.side, up.quantity], [BUY, 10])
  assert.ok(Math.abs(up.change - 0.02) < 1e-9)
  assert.equal(strategy.onTrade(100.03), null, 'measured from the new reference')
  assert.equal(strategy.onTrade(100.0).side, SELL)
  assert.equal(strategy.tradeCount, 2)
})

test('the risk check applies the engine limits in order, with its rejection reasons', () => {
  const risk = new RiskManager({ maxOrderQuantity: 25, maxOrderNotional: 5000, maxNetPositionAbs: 40 })
  risk.updateQuote(99.99, 100.01)
  assert.deepEqual(risk.checkOrder({ side: BUY, quantity: 0 }), { accepted: false, reason: 'quantity must be positive' })
  assert.deepEqual(risk.checkOrder({ side: BUY, quantity: 30 }), { accepted: false, reason: 'order quantity exceeds limit' })
  assert.deepEqual(risk.checkOrder({ side: BUY, quantity: 20, price: 300 }), { accepted: false, reason: 'order notional exceeds limit' })
  assert.deepEqual(risk.checkOrder({ side: BUY, quantity: 20 }), { accepted: true, reason: '' })
  risk.onFill(BUY, 25)
  assert.deepEqual(risk.checkOrder({ side: BUY, quantity: 20 }), { accepted: false, reason: 'net position exceeds limit' })
  assert.equal(risk.checkOrder({ side: SELL, quantity: 25 }).accepted, true)
  assert.deepEqual(new RiskManager({ allowMarketOrders: false }).checkOrder({ side: BUY, quantity: 1 }), { accepted: false, reason: 'market orders disabled' })
  assert.equal(new RiskManager().checkOrder({ side: BUY, quantity: 1e9 }).accepted, true, 'a limit of zero is off')
})

test('the simulated market stays two-sided, never crosses, and keeps the position inside its limit', () => {
  let signals = 0
  for (const seed of [21, 22, 23, 24, 25, 26]) {
    const market = createMarket(createRandom(seed))
    for (let event = 0; event < 3200; event++) {
      market.step()
      const bid = market.book.best(BUY), ask = market.book.best(SELL)
      assert.ok(bid !== null && ask !== null, `a side emptied at event ${event}, seed ${seed}`)
      assert.ok(bid < ask, `crossed at event ${event}, seed ${seed}`)
      assert.ok(Math.abs(market.risk.position) <= SETTINGS.limits.maxNetPositionAbs)
    }
    assert.equal(market.stats.signals, market.stats.sent + market.stats.rejected)
    assert.equal(market.stats.signals, market.strategy.tradeCount)
    signals += market.stats.signals
  }
  assert.ok(signals / 6 > 100, `${signals / 6} signals a run`)
})

test('the strategy flattens its position at the close, in slices the risk check allows', () => {
  for (const seed of [2, 3, 4, 7, 19]) {
    const market = createMarket(createRandom(seed))
    for (let event = 0; event < 2240; event++) market.step()
    const carried = market.risk.position
    const closing = market.flatten()
    assert.equal(market.risk.position, 0, `seed ${seed}`)
    assert.equal(closing.reduce((total, trade) => total + trade.size, 0), Math.abs(carried))
    assert.equal(market.stats.flattened, Math.abs(carried))
    assert.ok(closing.every(trade => trade.own && trade.side === (carried > 0 ? SELL : BUY)))
    assert.deepEqual(market.flatten(), [], 'a flat book has nothing to close')
  }
  for (const end of ['finish', 'stop']) {
    const program = createProgram({ name: 'orderbook', options: {} }, { seed: 2 })
    program.advance(9000)
    program[end]()
    assert.equal(program.stats.position, 0, end)
    assert.match(program.summary(92), /so it ends flat|already flat at the close/)
    assert.match(program.summary(92), /p99 110 ns/)
  }
})

// Printed by robottouroptimalpathtominseconds.py in RobotTourMazeSolver.
const PYTHON_ACTIONS = 'S R F L F R F L F F L F F R R F R F R F F R F L L F L F R F R F F L F L F R R F R F F F R R F F L F F F F R E'

test('the route search reproduces the output of the original python', () => {
  const maze = createMaze()
  const found = findOptimalPath(maze)
  const actions = toActions(found.path)
  assert.equal(actions.join(' '), PYTHON_ACTIONS)
  assert.deepEqual(found.gatesSequence, ['C', 'B', 'D', 'A', 'E'])
  const forward = actions.filter(action => action === 'F' || action === 'E').length
  const turns = actions.filter(action => action === 'L' || action === 'R').length
  assert.deepEqual([forward, turns, actions.length], [30, 24, 55])
  assert.ok(Math.abs(found.cost - (30 * MOVE_COST + 24 * TURN_COST)) < 1e-9)
})

test('replaying the route obeys the walls and the gate rules', () => {
  const maze = createMaze()
  const checked = replay(maze, PYTHON_ACTIONS.split(' '))
  assert.equal(checked.valid, true)
  assert.deepEqual(checked.cleared, ['C', 'B', 'D', 'A', 'E'])
  assert.ok(Math.abs(checked.time - 51.9) < 1e-9)
  assert.deepEqual([checked.steps.at(-1).row, checked.steps.at(-1).col], maze.end)
  assert.equal(wallBlocks(maze, 4, 3, 3), true, 'the barrier between the start and gate A')
  assert.equal(wallBlocks(maze, 4, 3, 1), false)
  assert.equal(replay(maze, ['S', 'L', 'F']).valid, false, 'driving through a wall')
  assert.equal(replay(maze, ['S', 'R', 'F', 'F']).valid, false, 'the barrier before the end square')
  assert.equal(replay(maze, PYTHON_ACTIONS.split(' ').slice(0, -3)).valid, false, 'stopping short of the end')
})

test('every demo draws inside the terminal, finishes, and summarizes', () => {
  for (const name of PROGRAM_NAMES) {
    const options = spec(`run ${name}`).options
    const program = createProgram({ name, options }, { seed: 5 })
    for (const [columns, rows] of [[80, 39], [46, 33], [200, 60]]) {
      const frame = program.frame(columns, rows)
      assert.ok(frame, `${name} draws at ${columns}x${rows}`)
      assert.ok(frame.length <= rows, `${name} fits ${rows} rows`)
      for (const line of frame) assert.ok(visibleWidth(line) <= columns, `${name} line fits ${columns} columns: ${line}`)
    }
    assert.equal(program.frame(30, 8), null, `${name} declines a terminal that is too small`)
    assert.equal(program.frame(80, 12), null, `${name} declines a terminal that is too short`)
    let elapsed = 0
    while (!program.done && elapsed < 60000) {
      program.advance(50)
      elapsed += 50
      const frame = program.frame(46, 24)
      if (frame) for (const line of frame) assert.ok(visibleWidth(line) <= 46, `${name} at ${elapsed} ms: ${line}`)
    }
    assert.ok(program.done, `${name} ends on its own`)
    assert.ok(elapsed >= 5000 && elapsed <= 20000, `${name} ran ${elapsed} ms`)
    for (const columns of [46, 80, 200]) for (const line of program.summary(columns).split('\r\n')) assert.ok(visibleWidth(line) <= columns, `${name} summary: ${line}`)
  }
})

test('demos are reproducible from a seed and can be stopped or finished early', () => {
  for (const name of PROGRAM_NAMES) {
    const make = () => createProgram({ name, options: spec(`run ${name}`).options }, { seed: 42 })
    const first = make(), second = make()
    first.finish()
    second.finish()
    assert.equal(first.summary(80), second.summary(80), name)
    assert.ok(first.done)
    const stopped = make()
    stopped.advance(3500)
    stopped.stop()
    assert.ok(stopped.summary(80).length > 0)
  }
  const uav = createProgram({ name: 'uav', options: SELECTED }, { seed: 42 })
  uav.advance(4000)
  uav.stop()
  assert.match(uav.summary(80), /stopped after \d+ of 1,000 landings/)
  uav.finish()
  assert.equal(uav.stats.total, 1000)
})
