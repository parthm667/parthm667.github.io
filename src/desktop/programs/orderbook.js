import { createRandom } from './random.js'
import { BUY, SELL, SETTINGS, TICK, createMarket } from './orderBookModel.js'
import { STOP_HINT, STYLE, bar, count, fit, headline, padEnd, padStart, paint, repeat, wrap } from './draw.js'

const RUN_MS = 16000
const EVENTS_PER_SECOND = 200
const TOTAL_EVENTS = Math.round((RUN_MS / 1000) * EVENTS_PER_SECOND)
const TITLE = 'order book · market data > strategy > risk > order'
// Internal tick-to-order latency of the C++ engine, from its hot-path
// benchmark. Measured inside the process; network and exchange time excluded.
// Add further percentiles here as [label, nanoseconds] when they are published.
const ENGINE_LATENCY = [['p99', 110]]
const latencyLine = `c++ engine, tick to order: ${ENGINE_LATENCY.map(([label, ns]) => `${label} ${count(ns)} ns`).join(' · ')}`
const latencyNote = 'internal; excludes network and exchange latency'

const price = ticks => (ticks * TICK).toFixed(2)
const signed = value => `${value > 0 ? '+' : ''}${value}`
const percent = value => `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(3)}%`

export function parseOrderBook(args) {
  return args.length ? { error: 'usage: run orderbook. it takes no options.' } : { options: {} }
}

export function createOrderBook(_options, { seed }) {
  const market = createMarket(createRandom(seed))
  const { book, strategy, risk, stats } = market
  const tape = [], signals = []
  let elapsed = 0, interrupted = false, closed = false, carried = 0

  const keep = (list, item, most) => { list.unshift(item); if (list.length > most) list.pop() }
  const step = () => {
    const event = market.step()
    for (const trade of event.tape) keep(tape, trade, 24)
    for (const signal of event.signals) keep(signals, signal, 8)
  }
  const runTo = total => { while (stats.events < Math.min(TOTAL_EVENTS, total)) step() }
  const close = () => {
    if (closed) return
    closed = true
    carried = risk.position
    for (const trade of market.flatten()) keep(tape, trade, 24)
  }

  function ladder(levels, width) {
    const asks = book.depth(SELL, levels), bids = book.depth(BUY, levels)
    const most = Math.max(1, ...asks.map(level => level.size), ...bids.map(level => level.size))
    const room = Math.max(4, width - 16)
    const row = (level, style) => level
      ? `${padStart(count(level.size), 6)}  ${paint(padStart(price(level.price), 7), style)} ${paint(bar(level.size, most, room), style)}`
      : ''
    const bid = book.best(BUY), ask = book.best(SELL)
    const moved = ((market.last - market.start) / market.start) * 100
    const middle = bid !== null && ask !== null ? `spread ${price(ask - bid)} · last ${price(market.last)} (${moved >= 0 ? '+' : '-'}${Math.abs(moved).toFixed(2)}%)` : 'one side is empty'
    return [
      paint(`${padStart('size', 6)}  ${padStart('price', 7)}`, STYLE.dim),
      ...Array.from({ length: levels }, (_, index) => row(asks[levels - 1 - index], STYLE.red)),
      paint(`${repeat('─', 6)} ${middle} ${repeat('─', Math.max(2, width - middle.length - 8))}`, STYLE.dim),
      ...Array.from({ length: levels }, (_, index) => row(bids[index], STYLE.green)),
    ]
  }

  const tapeLine = trade => `${paint(padEnd(trade.side, 4), trade.side === BUY ? STYLE.green : STYLE.red)} ${padStart(count(trade.size), 4)} @ ${price(trade.price)}${trade.own ? paint('  ours', STYLE.cyan) : ''}`

  function signalLine(signal, wide) {
    const order = `${paint(padEnd(signal.side, 4), signal.side === BUY ? STYLE.green : STYLE.red)} ${signal.quantity}`
    const outcome = !signal.accepted ? paint(wide ? `rejected: ${signal.reason}` : 'rejected: position', STYLE.yellow)
      : signal.filled ? `${paint('risk ok', STYLE.green)}${wide ? ` · filled ${signal.filled} @ ${price(signal.price)}` : ` @ ${price(signal.price)}`}`
      : paint('risk ok', STYLE.green)
    return `  ${padStart(percent(signal.change), 8)}  ${order}  ${outcome}`
  }

  function status(wide, signalRows) {
    const shown = Array.from({ length: signalRows }, (_, index) => (signals[index] ? signalLine(signals[index], wide) : ''))
    const position = `position ${padStart(signed(risk.position), 3)} of ±${risk.limits.maxNetPositionAbs}`
    const counts = `signals ${count(stats.signals)} · sent ${count(stats.sent)} · rejected ${count(stats.rejected)}`
    return [
      paint(wide ? `signals · momentum, ${SETTINGS.thresholdPct}% move from the reference price, ${SETTINGS.orderSize} lots` : `signals · momentum, ${SETTINGS.thresholdPct}% threshold`, STYLE.dim),
      ...shown,
      ...(wide ? [`${position} · ${counts} · events ${count(stats.events)} of ${count(TOTAL_EVENTS)}`] : [`${position} · events ${count(stats.events)} of ${count(TOTAL_EVENTS)}`, counts]),
      wide ? `${latencyLine} ${paint(`(${latencyNote})`, STYLE.dim)}` : latencyLine,
    ]
  }

  return {
    get done() { return stats.events >= TOTAL_EVENTS },
    advance(ms) { elapsed += ms; runTo(Math.floor((elapsed / 1000) * EVENTS_PER_SECOND)) },
    finish() { runTo(TOTAL_EVENTS); close() },
    stop() { interrupted = true; close() },
    frame(columns, rows) {
      if (columns < 40 || rows < 17) return null
      const wide = columns >= 76
      const levels = rows >= 27 ? 6 : rows >= 22 ? 4 : 3
      const signalRows = rows >= 27 ? 5 : rows >= 20 ? 3 : 2
      const ladderWidth = wide ? columns - 30 : columns
      const left = ladder(levels, ladderWidth)
      const body = wide
        ? left.map((line, index) => `${padEnd(fit(line, ladderWidth - 2), ladderWidth)}${index === 0 ? paint('trades', STYLE.dim) : tape[index - 1] ? tapeLine(tape[index - 1]) : ''}`)
        : left
      return [
        headline(wide ? TITLE : 'order book', STOP_HINT, columns),
        paint(wide ? 'simulated exchange and order flow · strategy and risk checks from the c++ engine' : 'simulated exchange, generated flow', STYLE.dim),
        ...body,
        ...status(wide, signalRows),
      ].slice(0, rows).map(line => fit(line, columns))
    },
    summary(columns) {
      const reasons = Object.entries(stats.rejectReasons).map(([reason, total]) => `${count(total)}: ${reason}`).join(', ')
      const closing = carried === 0 ? 'it was already flat at the close.'
        : `at the close it ${carried > 0 ? 'sold' : 'bought back'} the ${count(Math.abs(carried))} lots it was ${carried > 0 ? 'long' : 'short'}${risk.position === 0 ? ', so it ends flat' : `, as far as the book allowed; ${signed(risk.position)} remains`}.`
      const moved = ((market.last - market.start) / market.start) * 100
      const plain = [
        `${interrupted && stats.events < TOTAL_EVENTS ? 'stopped after ' : ''}${count(stats.events)} generated events · ${count(stats.trades)} trades · ${count(stats.volume)} lots · price ${price(market.start)} to ${price(market.last)} (${moved >= 0 ? '+' : '-'}${Math.abs(moved).toFixed(2)}%)`,
        `momentum strategy: ${count(stats.signals)} signals · ${count(stats.sent)} orders sent · ${count(stats.rejected)} rejected by the risk check${reasons ? ` (${reasons})` : ''}`,
        closing,
        `${latencyLine} (${latencyNote})`,
      ].flatMap(line => wrap(line, columns))
      return [
        TITLE,
        ...plain,
        ...wrap('i ported the strategy (SimpleMomentum) and the risk checks from the c++ engine. the exchange is a small simulator with generated order flow, so these fills do not show how the strategy would do in a real market.', columns).map(line => paint(line, STYLE.dim)),
        'the real one: view order-book',
      ].map(line => fit(line, columns)).join('\r\n')
    },
    get stats() { return { ...stats, position: risk.position, resting: book.orders.size } },
    book, strategy,
  }
}
