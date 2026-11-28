// Small seeded generator so every demo run is reproducible in tests and
// freshly sampled for visitors.
export function createRandom(seed = 1) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  next.between = (low, high) => low + (high - low) * next()
  next.integer = (low, high) => low + Math.floor(next() * (high - low + 1))
  next.pick = items => items[Math.floor(next() * items.length)]
  return next
}

export const freshSeed = () => (Math.random() * 0x100000000) >>> 0
