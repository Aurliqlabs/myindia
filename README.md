# REPUBLIC: 543

An in-development Indian political life simulation. A custom ordinary citizen starts on 14 May 2026, responds to an examination crisis, joins a youth movement and can help organise the June Jantar Mantar protest. Documented events through 25 September 2026 are historical anchors. Player tactics, resources, relationships and local outcomes are simulated; reported events and allegations are not silently rewritten.

## Play

Open `index.html` locally, or run `npm run dev` and visit `http://localhost:3000` **on the computer running the server**. Browser saves stay local; Settings includes export and import.

## Current development state

- The browser has a personal opening decision, dated historical dispatches with source links and fictional responses, Jantar Mantar logistics, finances, basic organisation actions and later career systems.
- The TypeScript core tracks personal income, savings, living costs, job standing, skill allocation, first-response memory and thirteen protest preparation tasks. Its deterministic operations, school-audit evidence graph and election systems are being connected to the browser.
- The player is a fictional participant, never the real founder Abhijeet Dipke. Staff and numeric starting conditions are gameplay estimates.
- A sourced remark may have both a viral interpretation and a subsequent clarification. Allegations, complaints and investigations keep their attribution and status.

## Verify

Run `npm install`, `npm run test:core` and `npm run test:browser`. GitHub Actions runs both checks on pushes.

## Current game systems

- The June–July protest uses a shared deterministic rules module in the browser and core. Field choices affect crowd safety, student trust, volunteers, evidence, legal pressure and the citizen's job standing. Negotiation terms remain separate from the reported historical outcome.
- The TypeScript school-audit engine opens fictional composite cases as unverified tips. Independent documentation, witnesses, an official response and legal review determine what may be published and how the result is classified. This system is not yet connected to the browser interface.

## Next systems

Make the TypeScript world and browser save a single game state, connect the school-audit engine to the Research screen, and expand staff memory, personal life, elections and long-term outcomes.
