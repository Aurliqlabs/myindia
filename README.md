# REPUBLIC: 543

A browser-based political life simulation set in a fictional career in India. The Paper/Crimson prototype starts with a movement at Jantar Mantar and lets you build an organisation, make decisions, campaign across states, contest a simulated 543-seat election, and govern or work in opposition.

## Play locally

Open `index.html` in a browser. Saves stay in that browser. For a local development server, run `npm run dev` and open `http://localhost:3000` on the **same computer**.

## Gameplay implemented

- Create a political character and choose a starting trait.
- Decide how to respond to events, recruit volunteers, hire staff and manage monthly costs.
- Start operations with delayed outcomes; track campaign donations and a decision history.
- Found a party after meeting support, finance, credibility and volunteer milestones.
- Target states with field visits and campaign tours. Simulated constituency results use the 543-seat state and union territory allocation recorded in `data/reality/lok-sabha-seats.json`.
- Respond to an election result through government or opposition decisions.
- Export and import a JSON career save.

Election outcomes, parties, events and characters are fictional. The browser gameplay is currently separate from the TypeScript simulation core under `src/core`; integrating them is the next architecture milestone.

## Verification

`npm run test:browser` checks the playable browser rules without dependencies. `npm install && npm run test:core` checks the TypeScript simulation engine and reality data.
