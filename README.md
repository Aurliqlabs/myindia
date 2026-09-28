# REPUBLIC: 543

An Indian political life simulation in two acts. You begin inside the reported 2026 timeline of the Cockroach Janta Party (CJP), then take the movement into an open, simulated future. The name refers to the 543 seats of the Lok Sabha.

## Who you play

- **Act 1 (14 May – 28 September 2026): you play Abhijeet Dipke.** This is historical roleplay. Dated public events follow published reporting, and each links its sources. Dipke's personal money, skills, energy and conversations are game values, not biographical claims. Your responses change your resources; they never change what was reported.
- **Act 2 (from 29 September 2026): you choose.** A handoff screen lets you keep Dipke's name for an alternate history or lead as a character of your own, rename the organisation, and pick a route. Everything from this point is simulated.

Colleagues, rival politicians, school audits, RTI requests, court petitions and election results are fictional composites. Allegations, complaints and investigations in the record keep their attribution and status. A remark that was widely read one way and later clarified is shown with both.

## How the game plays

### Act 1: the historical campaign

Time advances day by day. When a reported event reaches its date, it arrives as a dispatch with its sources and three responses. Each response shows its consequences before you choose: movement funds, credibility, legal pressure and team morale.

| Date | Dispatch |
|---|---|
| 15 May | The 3 May NEET-UG is cancelled over suspected leaks, and a Supreme Court remark about "youngsters like cockroaches" spreads |
| 16 May | Dipke launches the Cockroach Janta Party with a sign-up form on X |
| 16 May – 20 June | Jantar Mantar preparation: 13 tasks covering travel, permissions, lawyers, water, security and more. Water, security and permissions decide whether a crowd is safe |
| 6 June – 25 July | Protest days, the police deadline on 20 June, and a negotiating position with the government |
| 25 July | The Education Minister's reported resignation. It happens regardless of your tactics |
| August – September | Pressure-group strategy, School Thik Karo audits, the Latur FIR, a withdrawn march, the court order on morphed images, the Election Commission ultimatum, a Mumbai permit refusal and campus safety |

### The handoff (29 September 2026)

The handoff screen opens by itself on 29 September. Choose one route:

- **Civic pressure group.** File Right to Information requests and wait up to 30 days for a reply. Appeal refusals, publish investigative reports from the records, and bring public-interest petitions that a court hears about three weeks later. School audits and sourced civic briefings continue.
- **Formal political party.** Track opinion among seven voter groups, run targeted campaign ads, select candidates state by state, found the party and contest all 543 seats. A civic group can switch to this route later; a party cannot switch back.

### Act 2: four career chapters

1. **Put roots in one state:** 120 volunteers and field presence of 10 in any state.
2. **Make a public case:** publish a civic briefing, school audit, RTI report or successful petition.
3. **Earn a national mandate to organise:** 300 volunteers, 60 credibility and 35% public support.
4. **Commit to your route:** found the party (electoral), or three major civic cases and 500 volunteers (civic).

After that, the map, investigations, elections and, if you win, government continue indefinitely.

### Your team

Four founding friends can join as volunteers or paid staff, and you can advertise for more. Candidates show only what an interview reveals. Colleagues have hidden ambition, pride, greed and loyalty. They remember how you treat them, burn out if overworked, and react individually to missed salaries: some leave, some keep working unpaid, some quietly resent it. The best-suited colleague helps with fundraising, recruitment, state visits, research, RTI drafting, petitions, ads and candidate searches, and that work costs them energy.

## Play

Double-click `START_GAME.bat` on Windows, or run:

```bash
npm run dev
```

Then open `http://localhost:3000` on the same computer. Opening `index.html` directly also works. No build step is needed to play, because the compiled engine is committed at `engine/republic-engine.js`.

Saves stay in your browser. **Settings → Export save** downloads the whole game, engine state included, and **Import save** restores it. Saves from earlier versions load automatically: paid advisers from old saves become engine colleagues.

## Architecture

```
index.html
├─ data/reality/historical-scenes.js   dated, sourced dispatches (Act 1)
├─ src/shared/campaign-rules.js        protest rules shared by browser and engine
├─ engine/republic-engine.js           the TypeScript engine, bundled (generated)
└─ game.js                             GameEngine store, actions and UI
```

`game.js` holds one store, `GameEngine`. Its state tree has two parts:

- `state`, the browser campaign: timeline, dispatch responses, Jantar tasks, organisation metrics, routes, cases and elections.
- `state.world`, the TypeScript `WorldState`: characters, relationships, memories, career events, recruitment, payroll debts and voter-group opinion.

Each number has one owner, so nothing is ticked twice:

| Owned by the browser | Owned by the engine (`src/`) |
|---|---|
| Date, historical dispatches, Jantar and protest days | Staff psychology, burnout, forced leave, mistakes |
| Funds, volunteers, credibility, media heat, legal pressure | Relationships and decaying memory |
| Routes, RTI requests, petitions, audits, rival cases | Monthly careers: skill growth, requests, resignations |
| Operating costs (office, travel, PR retainer) | Salaries and each person's response to missed pay |
| Candidate slates and campaign preparation | Voter groups, campaign ads, the seat-by-seat election model |

`GameEngine.dispatch(type, payload)` is the single entry point for every control on the page. Each day, `advanceDay()` runs the browser's steps, then `GameEngine.tick()`. The tick mirrors the organisation metrics into the world, runs the engine's people step and, on the first of each month, its payroll and careers. The engine's results come back as a credibility change and log entries. `GameEngine.save()` writes the whole tree to `localStorage`, and `GameEngine.load()` rehydrates the world through the engine's own save loader.

The browser's entry point into the engine is `src/game/browser-bridge.ts`. It compiles with the rest of `src/` and is exposed to the page as the global `RepublicEngine`.

## Building the engine for the browser

Edit TypeScript under `src/`, then rebuild the bundle and commit it with your change:

```bash
npm install            # once: installs TypeScript
npm run build:engine   # tsc → dist/, then bundles dist/src → engine/republic-engine.js
```

`scripts/bundle-engine.cjs` needs no bundler dependency. It starts at `dist/src/game/browser-bridge.js`, follows every relative `require`, wraps each reachable module in a function, and resolves them through a small shim. The result is one classic script that defines `window.RepublicEngine`. Stale files left in `dist/` are never included.

To confirm the committed bundle matches the source:

```bash
npm run check:engine
```

GitHub Actions runs this check on every push, so a TypeScript change without a rebuilt bundle fails CI.

## Verify

```bash
npm install
npm run test:core      # compiles the engine; core, people and data tests
npm run check:engine   # the committed bundle matches src/
npm run test:browser   # the browser game with the real engine bundle
```

## Not yet connected

- School audits in the browser still use their own rules. The engine's evidence-graph audit (`src/game/school-audit.ts`) is not yet used by the Research page.
- Hidden donations and rival exposés still run in the browser, not through the engine's secrets and evidence model.
- The engine's personal-life day planner (work, movement, delegate, rest) is not in the UI. Personal income is still settled monthly by the browser.
