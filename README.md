# REPUBLIC: 543

A political career simulation that begins inside the real Cockroach Janta Party story. The reported timeline through 25 September 2026 is locked. On 26 September, the player enters as a **fictional organiser**; all subsequent actions and outcomes are alternate history.

## Play

Open `index.html` locally, or run `npm run dev` and open `http://localhost:3000` on the same computer. Saves stay in the browser; export and import are available in Settings.

## Reality and simulation

- `data/reality/historical-scenes.js` contains dated records with source links and status labels. It includes CJP's formation, Jantar Mantar protest, pressure-group decision, school campaigns, reported FIR and September Election Commission demand, as well as relevant national events.
- A reported complaint or political allegation is explicitly attributed; it is not treated as a finding.
- The player character, staff, finances, public-support gauges, post-handoff events and election outcomes are **simulated**. Starting amounts are gameplay estimates, not claims about CJP's accounts or membership.
- The browser game and TypeScript simulation core are separate implementations for now. Integrating them is a development milestone.

## Current systems

Build operations and a team, manage funds and legal risk, respond to conditional future events, organise across states, and choose whether the pressure group should pursue electoral politics. Government and opposition phases open after a simulated election.

## Verification

Run `npm install && npm run test:core` for the TypeScript engine, and `npm run test:browser` for the playable rules and timeline boundary.
