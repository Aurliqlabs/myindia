# REPUBLIC: 543

An in-development Indian political life simulation. A custom ordinary citizen starts on 14 May 2026, responds to an examination crisis, joins a youth movement and can help organise the June Jantar Mantar protest. Documented events through 25 September 2026 are historical anchors. Player tactics, resources, relationships and local outcomes are simulated; reported events and allegations are not silently rewritten.

## Play

Open `index.html` locally, or run `npm run dev` and visit `http://localhost:3000` **on the computer running the server**. Browser saves stay local; Settings includes export and import.

## Current development state

- The browser has a personal opening decision, dated historical dispatches with source links and fictional responses, Jantar Mantar logistics, finances, basic organisation actions and later career systems.
- The TypeScript core tracks personal income, savings, living costs, job standing, skill allocation, first-response memory and thirteen protest preparation tasks. Its deterministic operations, evidence and election systems are being connected to the browser.
- The player is a fictional participant, never the real founder Abhijeet Dipke. Staff and numeric starting conditions are gameplay estimates.
- A sourced remark may have both a viral interpretation and a subsequent clarification. Allegations, complaints and investigations keep their attribution and status.

## Verify

Run `npm install`, `npm run test:core` and `npm run test:browser`. GitHub Actions runs both checks on pushes.

## Next systems

Integrate the TypeScript simulation as the browser's single game engine, deepen multi-day protest scheduling and negotiation, build school-audit evidence graphs, and expand personal life, staff memory, elections and long-term outcomes.
