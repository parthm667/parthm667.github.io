import { createRandom } from './random.js'
import { BUY, SELL, TICK, createMarket } from './orderBookModel.js'
import { STOP_HINT, STYLE, bar, count, fit, headline, padEnd, padStart, paint, repeat, wrap } from './draw.js'

const RUN_MS = 16000
const EVENTS_PER_SECOND = 140
const TOTAL_EVENTS = Math.round((RUN_MS / 1000) * EVENTS_PER_SECOND)
const price = ticks => (ticks * TICK).toFixed(2)
const decimal = value => `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}`
const TITLE = 'order book · market data > book > strategy > risk > order'
const signed = value => `${value > 0 ? '+' : ''}${value}`

export function parseOrderBook(args) {
  return args.length ? { error: 'usage: run orderbook. it takes no options.' } : { options: {} }
}

export function createOrderBook(_options, { seed }) {
  const market = createMarket(createRandom(seed))
  const { book, strategy, risk, stats } = market
  const tape = []
  let elapsed = 0, lastSignal = null, interrupted = false

  const step = () => {
    const event = market.step()
    for (const trade of event.tape) { tape.unshift(trade); if (tape.length > 24) tape.pop() }
    if (event.signal) lastSignal = event.signal
  }
  const runTo = total => { while (stats.events < Math.min(TOTAL_EVENTS, total)) step() }

  function ladder(levels, width) {
    const asks = book.depth(SELL, levels), bids = book.depth(BUY, levels)
    const most = Math.max(1, ...asks.map(level => level.size), ...bids.map(level => level.size))
    const room = Math.max(4, width - 16)
    const row = (level, style) => level
      ? `${padStart(count(level.size), 6)}  ${paint(padStart(price(level.price), 7), style)} ${paint(bar(level.size, most, room), style)}`
      : ''
    const bid = book.best(BUY), ask = book.best(SELL)
    const spread = bid !== null && ask !== null ? `spread ${price(ask - bid)} · mid ${((bid + ask) / 2 * TICK).toFixed(3)}` : 'one side is empty'
    return [
      paint(`${padStart('size', 6)}  ${padStart('price', 7)}`, STYLE.dim),
      ...Array.from({ length: levels }, (_, index) => row(asks[levels - 1 - index], STYLE.red)),
      paint(`${repeat('─', 6)} ${spread} ${repeat('─', Math.max(2, width - spread.length - 8))}`, STYLE.dim),
      ...Array.from({ length: levels }, (_, index) => row(bids[index], STYLE.green)),
    ]
  }

  const tapeLine = trade => `${paint(padEnd(trade.side, 4), trade.side === BUY ? STYLE.green : STYLE.red)} ${padStart(count(trade.size), 4)} @ ${price(trade.price)}${trade.own ? paint('  strategy', STYLE.cyan) : ''}`

  function pipeline(wide) {
    const signal = lastSignal
    const verdict = signal && (signal.ok ? paint('risk ok', STYLE.green) : paint(`stopped: ${signal.reason}`, STYLE.yellow))
    const latest = signal ? `${signal.side} ${signal.size} on imbalance ${decimal(signal.imbalance)}, ${verdict}` : 'none yet'
    const imbalance = decimal(strategy.imbalance)
    const progress = paint(`events ${count(stats.events)} of ${count(TOTAL_EVENTS)} · trades ${count(stats.trades)} · resting orders ${count(book.orders.size)}`, STYLE.dim)
    if (wide) return [
      `strategy  imbalance ${imbalance}   last signal: ${latest}`,
      `risk      position ${padStart(signed(risk.position), 4)} of ±${risk.maxPosition}   orders sent ${count(stats.sent)}   stopped ${count(stats.rejected)}`,
      progress,
    ]
    return [
      `strategy  imbalance ${imbalance}`,
      `signal    ${signal ? `${signal.side} ${signal.size} on imbalance ${decimal(signal.imbalance)}` : 'none yet'}`,
      `          ${signal ? verdict : ''}`,
      `risk      position ${signed(risk.position)} of ±${risk.maxPosition}`,
      `orders    sent ${count(stats.sent)} · stopped ${count(stats.rejected)}`,
      paint(`events ${count(stats.events)} of ${count(TOTAL_EVENTS)} · trades ${count(stats.trades)}`, STYLE.dim),
    ]
  }

  return {
    get done() { return stats.events >= TOTAL_EVENTS },
    advance(ms) { elapsed += ms; runTo(Math.floor((elapsed / 1000) * EVENTS_PER_SECOND)) },
    finish() { runTo(TOTAL_EVENTS) },
    stop() { interrupted = true },
    frame(columns, rows) {
      if (columns < 40 || rows < 14) return null
      const levels = rows >= 24 ? 6 : rows >= 19 ? 4 : 3
      const wide = columns >= 76
      const ladderWidth = wide ? columns - 30 : columns
      const left = ladder(levels, ladderWidth)
      const body = wide
        ? left.map((line, index) => `${padEnd(fit(line, ladderWidth - 2), ladderWidth)}${index === 0 ? paint('trades', STYLE.dim) : tape[index - 1] ? tapeLine(tape[index - 1]) : ''}`)
        : [...left, tape[0] ? `last trade  ${tapeLine(tape[0])}` : '']
      return [
        headline(wide ? TITLE : 'order book', STOP_HINT, columns),
        paint('synthetic order flow, matched in your browser', STYLE.dim),
        '',
        ...body,
        '',
        ...pipeline(wide),
      ].slice(0, rows).map(line => fit(line, columns))
    },
    summary(columns) {
      const bid = book.best(BUY), ask = book.best(SELL)
      const reasons = Object.entries(stats.rejectReasons).map(([reason, total]) => `${count(total)} by the ${reason}`).join(', ')
      return [
        TITLE,
        `${interrupted && stats.events < TOTAL_EVENTS ? 'stopped after ' : ''}${count(stats.events)} synthetic events · ${count(stats.trades)} trades · ${count(stats.volume)} lots traded`,
        `book at the end: ${count(book.orders.size)} resting orders${bid !== null && ask !== null ? `, ${price(bid)} bid / ${price(ask)} ask` : ''}`,
        `strategy: ${count(stats.signals)} signals, ${count(stats.sent)} orders sent, ${count(stats.rejected)} stopped by the risk check${reasons ? ` (${reasons})` : ''}. final position ${signed(risk.position)}.`,
        ...wrap('this is a small javascript sketch of the pipeline in the c++ engine: a price-time priority book, a strategy that emits signals, and a pre-trade risk check in front of every order. the order flow is generated, and the strategy is a toy that only exists to exercise that path.', columns).map(line => paint(line, STYLE.dim)),
        'the real one: view order-book',
      ].flatMap(line => (line.includes('\x1b') ? [line] : wrap(line, columns))).map(line => fit(line, columns)).join('\r\n')
    },
    get stats() { return { ...stats, position: risk.position, resting: book.orders.size } },
    book,
  }
}
