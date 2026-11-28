// A small price-time priority limit order book with a synthetic order flow, a
// signal-emitting strategy, and a pre-trade risk check. It mirrors the shape of
// the C++ engine described in projects/order-book; it is not that engine and
// the flow is generated, not market data.
export const TICK = 0.01
export const BUY = 'buy'
export const SELL = 'sell'
const opposite = side => (side === BUY ? SELL : BUY)

export class OrderBook {
  constructor() {
    this.levels = { [BUY]: new Map(), [SELL]: new Map() } // price (ticks) -> { size, queue }
    this.prices = { [BUY]: [], [SELL]: [] } // sorted best-first
    this.orders = new Map()
  }

  best(side) { return this.prices[side][0] ?? null }

  depth(side, levels) {
    return this.prices[side].slice(0, levels).map(price => ({ price, size: this.levels[side].get(price).size }))
  }

  volume(side, levels) { return this.depth(side, levels).reduce((total, level) => total + level.size, 0) }

  #insertPrice(side, price) {
    const prices = this.prices[side]
    let low = 0, high = prices.length
    while (low < high) {
      const middle = (low + high) >> 1
      if (side === BUY ? prices[middle] > price : prices[middle] < price) low = middle + 1
      else high = middle
    }
    prices.splice(low, 0, price)
  }

  #removeLevel(side, price) {
    this.levels[side].delete(price)
    this.prices[side].splice(this.prices[side].indexOf(price), 1)
  }

  // Match against the other side while the price crosses; the oldest order at
  // each price fills first. Returns the trades.
  #match(side, size, limit) {
    const other = opposite(side), trades = []
    while (size > 0) {
      const price = this.best(other)
      if (price === null || (limit !== null && (side === BUY ? price > limit : price < limit))) break
      const level = this.levels[other].get(price)
      while (size > 0 && level.queue.length) {
        const resting = level.queue[0]
        const filled = Math.min(size, resting.size)
        resting.size -= filled
        level.size -= filled
        size -= filled
        trades.push({ side, price, size: filled, maker: resting.id })
        if (!resting.size) { level.queue.shift(); this.orders.delete(resting.id) }
      }
      if (!level.queue.length) this.#removeLevel(other, price)
    }
    return { trades, remaining: size }
  }

  limit({ id, side, price, size }) {
    const { trades, remaining } = this.#match(side, size, price)
    if (remaining > 0) {
      let level = this.levels[side].get(price)
      if (!level) { level = { size: 0, queue: [] }; this.levels[side].set(price, level); this.#insertPrice(side, price) }
      const order = { id, side, price, size: remaining }
      level.queue.push(order)
      level.size += remaining
      this.orders.set(id, order)
    }
    return trades
  }

  market(side, size) { return this.#match(side, size, null).trades }

  cancel(id) {
    const order = this.orders.get(id)
    if (!order) return false
    const level = this.levels[order.side].get(order.price)
    level.queue.splice(level.queue.indexOf(order), 1)
    level.size -= order.size
    if (!level.queue.length) this.#removeLevel(order.side, order.price)
    this.orders.delete(id)
    return true
  }
}

// Strategies see the book after every market event and may emit one signal.
export class StrategyBase {
  onBook() { return null }
}

// Buys when resting bids outweigh asks near the touch and sells in the
// opposite case. A toy: it exists to exercise the path from signal to order.
export class ImbalanceStrategy extends StrategyBase {
  constructor({ levels = 2, threshold = 0.5, size = 10, cooldown = 30 } = {}) {
    super()
    Object.assign(this, { levels, threshold, size, cooldown, wait: 0, imbalance: 0 })
  }

  onBook(book) {
    const bids = book.volume(BUY, this.levels), asks = book.volume(SELL, this.levels)
    this.imbalance = bids + asks ? (bids - asks) / (bids + asks) : 0
    if (this.wait > 0) { this.wait--; return null }
    if (Math.abs(this.imbalance) < this.threshold) return null
    this.wait = this.cooldown
    return { side: this.imbalance > 0 ? BUY : SELL, size: this.size, imbalance: this.imbalance }
  }
}

// Every strategy order passes here before it can reach the book.
export class RiskManager {
  constructor({ maxPosition = 40, maxOrder = 20 } = {}) {
    Object.assign(this, { maxPosition, maxOrder, position: 0 })
  }

  check({ side, size }) {
    if (size > this.maxOrder) return { ok: false, reason: 'order size limit' }
    const next = this.position + (side === BUY ? size : -size)
    if (Math.abs(next) > this.maxPosition) return { ok: false, reason: 'position limit' }
    return { ok: true }
  }

  fill(side, size) { this.position += side === BUY ? size : -size }
}

// Limit orders near the touch, cancellations, and market orders, in the usual
// zero-intelligence proportions. Enough to keep a two-sided book moving.
export function createMarket(random, { start = 10000 } = {}) {
  const book = new OrderBook()
  const strategy = new ImbalanceStrategy()
  const risk = new RiskManager()
  const resting = [] // ids that may still be live, for cancellation
  const stats = { events: 0, trades: 0, volume: 0, signals: 0, sent: 0, rejected: 0, rejectReasons: {}, fills: 0, flattened: 0 }
  let nextId = 1, last = start
  const lots = () => 10 * random.integer(1, 9)

  const addLimit = (side, price) => {
    const id = nextId++
    const trades = book.limit({ id, side, price, size: lots() })
    if (book.orders.has(id)) resting.push(id)
    return trades
  }
  for (let offset = 1; offset <= 12; offset++) for (let n = 0; n < 3; n++) { addLimit(BUY, start - offset); addLimit(SELL, start + offset) }

  function step() {
    stats.events++
    const event = { tape: [], signal: null }
    const bid = book.best(BUY) ?? last - 1, ask = book.best(SELL) ?? last + 1
    // Cancellations scale with the number of resting orders, so the book
    // settles around a steady depth instead of draining or piling up.
    const roll = random()
    const cancelShare = Math.min(0.9, Math.max(0.05, book.orders.size / 260))
    let trades = []
    if (roll < 0.12) trades = book.market(random() < 0.5 ? BUY : SELL, lots())
    else if (random() < cancelShare) {
      while (resting.length) {
        const index = Math.floor(random() * resting.length)
        const id = resting[index]
        resting[index] = resting[resting.length - 1]
        resting.pop()
        if (book.cancel(id)) break
      }
    } else {
      const side = random() < 0.5 ? BUY : SELL
      // Mostly passive, sometimes inside the spread or through it.
      const distance = Math.floor(-Math.log(1 - random()) * 2.2) - (random() < 0.12 ? 1 : 0)
      trades = addLimit(side, side === BUY ? ask - 1 - distance : bid + 1 + distance)
    }
    for (const trade of trades) { stats.trades++; stats.volume += trade.size; last = trade.price; event.tape.push({ ...trade, own: false }) }

    const signal = strategy.onBook(book)
    if (signal) {
      stats.signals++
      const verdict = risk.check(signal)
      event.signal = { ...signal, ...verdict }
      if (verdict.ok) {
        stats.sent++
        for (const trade of book.market(signal.side, signal.size)) {
          risk.fill(signal.side, trade.size)
          stats.trades++; stats.fills++; stats.volume += trade.size; last = trade.price
          event.tape.push({ ...trade, own: true })
        }
      } else {
        stats.rejected++
        stats.rejectReasons[verdict.reason] = (stats.rejectReasons[verdict.reason] ?? 0) + 1
      }
    }
    return event
  }

  // End of session: the strategy does not carry inventory out. The position is
  // worked off in slices that pass the same risk check as any other order.
  function flatten() {
    const tape = []
    while (risk.position !== 0) {
      const side = risk.position > 0 ? SELL : BUY
      const order = { side, size: Math.min(Math.abs(risk.position), risk.maxOrder) }
      if (!risk.check(order).ok) break
      const trades = book.market(side, order.size)
      if (!trades.length) break // nothing left to trade against
      for (const trade of trades) {
        risk.fill(side, trade.size)
        stats.trades++; stats.fills++; stats.volume += trade.size; stats.flattened += trade.size; last = trade.price
        tape.push({ ...trade, own: true })
      }
    }
    return tape
  }

  return { book, strategy, risk, stats, step, flatten, get last() { return last } }
}
