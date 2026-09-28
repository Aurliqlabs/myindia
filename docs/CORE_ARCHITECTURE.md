# REPUBLIC: 543 — Core Architecture

The simulation core is independent from the UI. Browser/mobile clients issue commands to the engine and render resulting state.

## Implemented in V0.3

- deterministic seeded simulation
- versioned save state
- player energy, health, stress and sleep debt
- staff skills, morale, salary, health and psychology
- relationship + long-term memory records
- organisation cash, recurring donations, payroll and fixed burn
- operations with staff, volunteers, budget, progress and legal/media pressure
- secrets + evidence records with delayed exposure checks
- procedural future-event pressure model after the real-world snapshot date
- generic constituency election simulation and seat tally

## Implemented in V0.4

- fixed organisation role hierarchy (`roles.ts`) with per-role skill weighting
- decaying, queryable character memory (`memory.ts`): high-salience events persist for years, routine ones fade in weeks
- psychology- and history-driven relationship events: public defence, humiliation, legal protection, founding-member recognition (`relationships.ts`)
- differentiated missed-payroll response per character — resign, temporarily volunteer, or grow privately resentful, based on loyalty, greed and bond history (`finance.ts` + `careers.ts`)
- autonomous monthly character evolution: skill growth, raise/promotion/ticket requests, resignation probability (`careers.ts`)
- daily burnout ticks: sustained exhaustion forces leave; sustained stress risks visible mistakes (`careers.ts`)
- recruitment with incomplete information: candidates carry hidden true stats and expose only qualitative interview impressions (`recruitment.ts`)
- human-readable relationship/wellbeing signals that never expose raw hidden numbers (`signals.ts`)

All of the above is deterministic: every random branch consumes the same seeded `Rng` the rest of the engine already uses.

## Connected to the browser in V0.5

- `src/game/browser-bridge.ts` is the browser's only entry point. `npm run build:engine` bundles it and everything it imports into `engine/republic-engine.js` (global `RepublicEngine`).
- `game.js` keeps one `GameEngine` store. The engine `WorldState` lives at `state.world` and is saved, exported and imported with the rest of the game.
- The engine owns people (psychology, burnout, memory, relationships, careers, recruitment, payroll responses), voter-group opinion and the seat-by-seat election model. The browser owns the dated timeline, campaign actions and organisation metrics, which it mirrors into the world before each engine step.
- Still browser-only: school audits, hidden donations, rival exposés and personal-life day planning.

## Data layers

1. Reality — sourced India data and real events.
2. Simulation — future/generated state.
3. Player history — decisions, secrets, relationships, laws, elections and outcomes inside one save.

The UI must not own simulation rules. It should call game commands and render returned state.
