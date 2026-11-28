// The order book demo. The strategy and the pre-trade risk checks are ported
// from the C++ engine in github.com/sujaykonda/crypto-hft: SimpleMomentum in
// include/strategy/example_strategies.hpp and RiskManager::check_order in
// include/risk/risk_manager.hpp. The engine sends its orders to a real
// exchange; here a small price-time priority matching book stands in for the
// exchange, fed by generated order flow.
export const TICK = 0.01
export const BUY = 'buy'
export const SELL = 'sell'
const opposite = side => (side === BUY ? SELL : BUY)

// The simulated exchange: resting limit orders matched by price, then arrival.
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

// SimpleMomentum::on_trade. When the traded price has moved more than the
// threshold from the reference price, send a market order in that direction
// and take the new price as the reference.
export class SimpleMomentum {
  constructor(thresholdPct, orderSize) {
    Object.assign(this, { thresholdPct, orderSize, referencePrice: 0, lastPrice: 0, tradeCount: 0, lastChange: 0 })
  }

  onTrade(price) {
    if (this.referencePrice === 0) { this.referencePrice = price; this.lastPrice = price; return null }
    const change = ((price - this.referencePrice) / this.referencePrice) * 100
    this.lastChange = change
    this.lastPrice = price
    if (Math.abs(change) <= this.thresholdPct) return null
    this.referencePrice = price
    this.tradeCount++
    return { side: change > 0 ? BUY : SELL, quantity: this.orderSize, change }
  }
}

// RiskManager::check_order, with its limits and rejection reasons, and the
// net position bookkeeping from on_fill. A limit of zero is switched off.
export class RiskManager {
  constructor({ maxOrderQuantity = 0, maxOrderNotional = 0, maxNetPositionAbs = 0, allowMarketOrders = true } = {}) {
    this.limits = { maxOrderQuantity, maxOrderNotional, maxNetPositionAbs, allowMarketOrders }
    this.position = 0
    this.mid = 0
  }

  updateQuote(bid, ask) { this.mid = (bid + ask) / 2 }

  checkOrder({ side, quantity, price = 0, market = true }) {
    const reject = reason => ({ accepted: false, reason })
    if (quantity <= 0) return reject('quantity must be positive')
    if (!this.limits.allowMarketOrders && market) return reject('market orders disabled')
    if (this.limits.maxOrderQuantity > 0 && quantity > this.limits.maxOrderQuantity) return reject('order quantity exceeds limit')
    const riskPrice = price > 0 ? price : this.mid
    if (this.limits.maxOrderNotional > 0 && riskPrice * quantity > this.limits.maxOrderNotional) return reject('order notional exceeds limit')
    if (this.limits.maxNetPositionAbs > 0 && Math.abs(this.position + (side === BUY ? quantity : -quantity)) > this.limits.maxNetPositionAbs) return reject('net position exceeds limit')
    return { accepted: true, reason: '' }
  }

  onFill(side, quantity) { this.position += side === BUY ? quantity : -quantity }
}

export const SETTINGS = {
  thresholdPct: 0.015, // momentum threshold: percent move from the reference price
  orderSize: 10,
  limits: { maxOrderQuantity: 25, maxOrderNotional: 5000, maxNetPositionAbs: 40, allowMarketOrders: true },
}

// Generated flow: limit orders near the touch, cancellations, and market
// orders, with buying or selling pressure that drifts so the price trends.
const DRIFT = 0.16 // ticks the resting-order value moves per event at full pressure
const REFILL = 0.3

export function createMarket(random, { start = 10000 } = {}) {
  const book = new OrderBook()
  const strategy = new SimpleMomentum(SETTINGS.thresholdPct, SETTINGS.orderSize)
  const risk = new RiskManager(SETTINGS.limits)
  const resting = [] // ids that may still be live, for cancellation
  const stats = { events: 0, trades: 0, volume: 0, signals: 0, sent: 0, rejected: 0, rejectReasons: {}, fills: 0, flattened: 0 }
  let nextId = 1, last = start, pressure = 0, regime = 0, fair = start
  const lots = () => 10 * random.integer(1, 9)

  const addLimit = (side, price) => {
    const id = nextId++
    const trades = book.limit({ id, side, price, size: lots() })
    if (book.orders.has(id)) resting.push(id)
    return trades
  }
  for (let offset = 1; offset <= 12; offset++) for (let n = 0; n < 3; n++) { addLimit(BUY, start - offset); addLimit(SELL, start + offset) }

  const quote = () => {
    const bid = book.best(BUY), ask = book.best(SELL)
    if (bid !== null && ask !== null) risk.updateQuote(bid * TICK, ask * TICK)
  }

  // Signal -> risk check -> market order on the simulated exchange.
  function act(signal, event) {
    stats.signals++
    const decision = risk.checkOrder({ side: signal.side, quantity: signal.quantity })
    const record = { ...signal, ...decision, filled: 0, price: null }
    event.signals.push(record)
    if (!decision.accepted) {
      stats.rejected++
      stats.rejectReasons[decision.reason] = (stats.rejectReasons[decision.reason] ?? 0) + 1
      return
    }
    stats.sent++
    for (const trade of book.market(signal.side, signal.quantity)) {
      risk.onFill(signal.side, trade.size)
      stats.trades++; stats.fills++; stats.volume += trade.size; last = trade.price
      record.filled += trade.size
      record.price = trade.price
      event.tape.push({ ...trade, own: true })
    }
  }

  function step() {
    stats.events++
    const event = { tape: [], signals: [] }
    if (--regime <= 0) { regime = random.integer(90, 240); pressure = random.between(-0.38, 0.38) }
    // The value that resting orders gather around drifts with the pressure.
    fair += DRIFT * pressure + random.between(-0.12, 0.12)
    const bid = book.best(BUY) ?? last - 1, ask = book.best(SELL) ?? last + 1
    const buys = random() < 0.5 + pressure
    // Cancellations scale with the number of resting orders, so the book
    // settles around a steady depth instead of draining or piling up.
    const cancelShare = Math.min(0.9, Math.max(0.05, book.orders.size / 300))
    let trades = []
    if (random() < 0.2) trades = book.market(buys ? BUY : SELL, lots())
    else if (random() < cancelShare) {
      while (resting.length) {
        const index = Math.floor(random() * resting.length)
        const id = resting[index]
        resting[index] = resting[resting.length - 1]
        resting.pop()
        if (book.cancel(id)) break
      }
    } else {
      // Liquidity comes back to whichever side has been thinned out, so the
      // book stays two-sided while the price trends.
      const bids = book.volume(BUY, 5), asks = book.volume(SELL, 5)
      const refill = bids + asks ? (asks - bids) / (bids + asks) : 0
      const side = random() < 0.5 + REFILL * refill ? BUY : SELL
      // Orders rest a few ticks from the drifting value; when it has moved
      // through the old quotes they cross and trade, which moves the price.
      const distance = Math.floor(-Math.log(1 - random()) * 2.2)
      const anchor = Math.round(fair)
      trades = addLimit(side, side === BUY ? Math.min(anchor - distance, ask + 1) : Math.max(anchor + distance, bid - 1))
    }
    // A side that has been swept is requoted behind the last trade, as market
    // makers would, so there is always a bid and an offer.
    for (const side of [BUY, SELL]) {
      for (let missing = 3 - book.prices[side].length; missing > 0; missing--) {
        const other = book.best(side === BUY ? SELL : BUY) ?? last
        // One tick beyond the deepest quote left, or just behind the last trade.
        const edge = book.prices[side].at(-1) ?? (side === BUY ? Math.min(other, last + 1) - 1 : Math.max(other, last - 1) + 1)
        addLimit(side, book.prices[side].length ? (side === BUY ? edge - 1 : edge + 1) : edge)
      }
    }
    quote()
    for (const trade of trades) {
      stats.trades++; stats.volume += trade.size; last = trade.price
      event.tape.push({ ...trade, own: false })
      // Every print on the feed reaches the strategy, as on_trade does.
      const signal = strategy.onTrade(trade.price * TICK)
      if (signal) act(signal, event)
    }
    return event
  }

  // End of session: the position is worked off in slices that pass the same
  // risk check as any other order.
  function flatten() {
    const tape = []
    while (risk.position !== 0) {
      const side = risk.position > 0 ? SELL : BUY
      const quantity = Math.min(Math.abs(risk.position), risk.limits.maxOrderQuantity || Infinity)
      if (!risk.checkOrder({ side, quantity }).accepted) break
      const trades = book.market(side, quantity)
      if (!trades.length) break // nothing left to trade against
      for (const trade of trades) {
        risk.onFill(side, trade.size)
        stats.trades++; stats.fills++; stats.volume += trade.size; stats.flattened += trade.size; last = trade.price
        tape.push({ ...trade, own: true })
      }
    }
    return tape
  }

  return { book, strategy, risk, stats, step, flatten, get last() { return last }, start }
}
