// Landing model from "Suspension Parameter Optimization in a Paramotor UAV
// Using Monte Carlo Analysis" (Mhaske and Claudel, AIAA 2026-4336). This is a
// line-for-line port of the C++ in github.com/parthm667/UAVSuspensionSystem:
// the same equations of motion, RK4 grid, touchdown sampling, and four failure
// checks. Only the random number generator differs.
export const VEHICLE = {
  mass: 140, // kg
  freeLength: 0.5, // m
  solidLength: 0.2, // m
  wheelRadius: 0.2, // m
  width: 0.6, // m
  length: 1.5, // m
  gravity: 9.81,
  drag: 32.17, // 0.5 · rho · C_P · A_P
}
export const SELECTED = { k: 21216, c: 484.56 }
export const SWEEP = { k: [5000, 30000], c: [100, 1500] }
export const TRIALS = 1000
export const DURATION = 2 // s
export const STEPS = 700
export const WHEELS = ['FL', 'FR', 'BL', 'BR']

const { mass: M, freeLength: L_FREE, solidLength: L_SOLID, wheelRadius: R, width: W, length: L, gravity: G, drag: DRAG } = VEHICLE
const DT = DURATION / (STEPS - 1)
const IX = (M * W * W) / 12
const IY = (M * L * L) / 12
const ROLL = [1, -1, 1, -1]
const PITCH = [1, 1, -1, -1]
const ATTITUDE_LIMIT = 0.2 // rad
const SETTLE_LIMIT = 0.3 // m/s

export const forceLimit = k => (M * G) / 4 + (L_FREE - L_SOLID) * k

// state = [roll, roll rate, pitch, pitch rate, cg height, cg velocity]
function derivative(x, k, c, out) {
  let total = 0, rollMoment = 0, pitchMoment = 0
  for (let wheel = 0; wheel < 4; wheel++) {
    const length = x[4] - R + ROLL[wheel] * (W / 2) * x[0] + PITCH[wheel] * (L / 2) * x[2]
    if (length > L_FREE) continue // airborne: a one-way spring carries no load
    const rate = x[5] + ROLL[wheel] * (W / 2) * x[1] + PITCH[wheel] * (L / 2) * x[3]
    const force = -k * (length - L_FREE) - c * rate
    total += force
    rollMoment += ROLL[wheel] * force
    pitchMoment += PITCH[wheel] * force
  }
  out[0] = x[1]
  out[1] = ((W / 2) * rollMoment) / IX
  out[2] = x[3]
  out[3] = ((L / 2) * pitchMoment) / IY
  out[4] = x[5]
  out[5] = (total - DRAG * Math.abs(x[5]) * x[5]) / M - G
}

export function sampleTouchdown(random) {
  return {
    roll: random.between(-0.2, 0.2),
    pitch: random.between(-0.2, 0.2),
    rollRate: random.between(-0.1, 0.1),
    pitchRate: random.between(-0.1, 0.1),
    speed: random.between(4, 7.5), // m/s, downward
  }
}

const k1 = new Float64Array(6), k2 = new Float64Array(6), k3 = new Float64Array(6), k4 = new Float64Array(6), scratch = new Float64Array(6)

// One landing, starting at first contact of the lowest wheel. With trace set,
// the per-step leg forces, leg lengths and attitude are kept for drawing.
export function simulateLanding(k, c, touchdown, { trace = false } = {}) {
  const x = new Float64Array([
    touchdown.roll, touchdown.rollRate, touchdown.pitch, touchdown.pitchRate,
    L_FREE + R + Math.abs(touchdown.roll) * (W / 2) + Math.abs(touchdown.pitch) * (L / 2), -touchdown.speed,
  ])
  let minLength = Infinity, maxForce = 0, contact = false, attitude = false
  const steps = trace ? [] : null
  const observe = () => {
    if (Math.abs(x[0]) > ATTITUDE_LIMIT || Math.abs(x[2]) > ATTITUDE_LIMIT) attitude = true
    const forces = trace ? [0, 0, 0, 0] : null
    const lengths = trace ? [0, 0, 0, 0] : null
    for (let wheel = 0; wheel < 4; wheel++) {
      const length = x[4] - R + ROLL[wheel] * (W / 2) * x[0] + PITCH[wheel] * (L / 2) * x[2]
      if (lengths) lengths[wheel] = length
      if (length > L_FREE) continue
      contact = true
      const rate = x[5] + ROLL[wheel] * (W / 2) * x[1] + PITCH[wheel] * (L / 2) * x[3]
      const force = -k * (length - L_FREE) - c * rate
      if (forces) forces[wheel] = force
      if (force > maxForce) maxForce = force
      if (length < minLength) minLength = length
    }
    steps?.push({ forces, lengths, roll: x[0], pitch: x[2], height: x[4], velocity: x[5] })
  }
  observe()
  for (let step = 1; step < STEPS; step++) {
    derivative(x, k, c, k1)
    for (let i = 0; i < 6; i++) scratch[i] = x[i] + 0.5 * DT * k1[i]
    derivative(scratch, k, c, k2)
    for (let i = 0; i < 6; i++) scratch[i] = x[i] + 0.5 * DT * k2[i]
    derivative(scratch, k, c, k3)
    for (let i = 0; i < 6; i++) scratch[i] = x[i] + DT * k3[i]
    derivative(scratch, k, c, k4)
    for (let i = 0; i < 6; i++) x[i] += (DT / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
    observe()
  }
  const failures = contact ? {
    bottoming: minLength < L_SOLID,
    force: maxForce > forceLimit(k),
    attitude,
    settling: Math.abs(x[5]) > SETTLE_LIMIT,
  } : { bottoming: false, force: false, attitude: false, settling: false, noContact: true }
  return {
    success: contact && !failures.bottoming && !failures.force && !failures.attitude && !failures.settling,
    contact, minLength: contact ? minLength : 0, maxForce, failures, ...(trace ? { steps, dt: DT } : {}),
  }
}
