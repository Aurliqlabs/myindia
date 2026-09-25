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

## Data layers

1. Reality — sourced India data and real events.
2. Simulation — future/generated state.
3. Player history — decisions, secrets, relationships, laws, elections and outcomes inside one save.

The UI must not own simulation rules. It should call game commands and render returned state.
