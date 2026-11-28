import { createUav, parseUav } from './uav.js'
import { createOrderBook, parseOrderBook } from './orderbook.js'
import { createMaze, parseMaze } from './maze.js'

// Live demos started with `run <name>`. Each one is a small real model that is
// advanced by wall time, drawn as a text frame, and summarized when it ends.
export const PROGRAMS = {
  uav: { describe: 'monte carlo landings from the aiaa paper', parse: parseUav, create: createUav },
  orderbook: { describe: 'a matching engine with a strategy and risk check', parse: parseOrderBook, create: createOrderBook },
  maze: { describe: 'a* route planning where turns cost extra', parse: parseMaze, create: createMaze },
}

const ALIASES = { 'order-book': 'orderbook', 'uav-suspension': 'uav', 'maze-robot': 'maze' }
export const PROGRAM_NAMES = Object.keys(PROGRAMS)
export const resolveProgram = name => (Object.hasOwn(PROGRAMS, name) ? name : Object.hasOwn(ALIASES, name) ? ALIASES[name] : null)

// Wide terminals get a readable measure instead of bars a screen long.
const MAX_COLUMNS = 92

export function createProgram({ name, options }, context) {
  const program = PROGRAMS[name].create(options, context)
  return {
    get done() { return program.done },
    get stats() { return program.stats },
    advance: ms => program.advance(ms),
    finish: () => program.finish(),
    stop: () => program.stop(),
    frame: (columns, rows) => program.frame(Math.min(columns, MAX_COLUMNS), rows),
    summary: columns => program.summary(Math.min(columns, MAX_COLUMNS)),
  }
}
