import test from 'node:test'
import assert from 'node:assert/strict'
import { HOME } from '../src/desktop/filesystem.js'
import { executeCommand } from '../src/desktop/shell.js'
import { PROGRAM_NAMES, createProgram } from '../src/desktop/programs/index.js'
import { createRandom } from '../src/desktop/programs/random.js'
import { visibleWidth } from '../src/desktop/programs/draw.js'
import { SELECTED, TRIALS, forceLimit, sampleTouchdown, simulateLanding } from '../src/desktop/programs/uavModel.js'
import { BUY, OrderBook, RiskManager, SELL, createMarket } from '../src/desktop/programs/orderBookModel.js'
import { GOAL, START, cellKey, createGrid, solve } from '../src/desktop/programs/mazeModel.js'

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

test('the synthetic market never leaves a crossed book and respects the risk limits', () => {
  const market = createMarket(createRandom(21))
  for (let event = 0; event < 4000; event++) {
    market.step()
    const bid = market.book.best(BUY), ask = market.book.best(SELL)
    if (bid !== null && ask !== null) assert.ok(bid < ask, `crossed at event ${event}`)
    assert.ok(Math.abs(market.risk.position) <= market.risk.maxPosition)
  }
  assert.equal(market.stats.signals, market.stats.sent + market.stats.rejected)
  assert.ok(market.stats.trades > 500 && market.book.orders.size > 20)
  const risk = new RiskManager({ maxPosition: 20, maxOrder: 15 })
  assert.deepEqual(risk.check({ side: BUY, size: 30 }), { ok: false, reason: 'order size limit' })
  risk.fill(BUY, 15)
  assert.deepEqual(risk.check({ side: BUY, size: 10 }), { ok: false, reason: 'position limit' })
  assert.deepEqual(risk.check({ side: SELL, size: 10 }), { ok: true })
})

test('the planner returns a legal route and takes fewer turns than a step-only search', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const { blocked, planned, shortest } = createGrid(createRandom(seed))
    const { path } = planned
    assert.deepEqual([path[0].x, path[0].y], [START.x, START.y])
    assert.deepEqual([path.at(-1).x, path.at(-1).y], [GOAL.x, GOAL.y])
    for (let index = 1; index < path.length; index++) {
      assert.equal(Math.abs(path[index].x - path[index - 1].x) + Math.abs(path[index].y - path[index - 1].y), 1)
      assert.ok(!blocked.has(cellKey(path[index].x, path[index].y)))
    }
    assert.ok(planned.steps >= shortest.steps)
    assert.ok(planned.turns < shortest.turns)
    assert.deepEqual(solve(blocked).path, path, 'the search is deterministic')
  }
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
