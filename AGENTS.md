# Working on REPUBLIC: 543

Read this before changing anything. It covers the rules that are not negotiable, where each system lives, how to verify a change, and the traps previous work fell into.

## What the game is

A browser political simulation in plain HTML/JS with a TypeScript simulation engine. Act 1 replays the real, sourced 2026 timeline of the Cockroach Janta Party (CJP) as Abhijeet Dipke. On 29 September 2026 the player hands off to their own path (civic pressure group or political party). Acts 2–4 are simulated: an injustice feed, a fictional corruption network, courts, elections on the real five-year calendar, government, and five endings over ten in-game years. See [README.md](README.md) for the full design.

## Content rules (non-negotiable)

1. **Real people and real events appear only as sourced.** Every real-world fact carries a link to a published source, keeps its attribution, and keeps its status (allegation, complaint, investigation, court finding). A remark that was later clarified is shown with the clarification. Never invent a quote for a real person.
2. **Everyone the player investigates, prosecutes or defeats is fictional.** The network (`NETWORK` in [act3.js](act3.js)), rivals, officials, victims and districts are invented. Never make a real person or real party the target.
3. **Courts convict, not the player.** Nobody is jailed by decree. Convictions come from evidence, protected witnesses and independent institutions.
4. **No anger aimed at a community.** Outrage is directed at fictional antagonists and at documented system failures, never at a caste, religion or region.
5. **Verify facts before adding them.** Search, open the source, and check the exact claim, date and figure. Earlier work found a wrong figure in a search summary; the source said something different.
6. **Alternate history is labelled.** Anything after 28 September 2026 is fiction and must be presented that way, especially if the player keeps Dipke's name.

## Run and verify

```bash
npm install            # once
npm run dev            # http://localhost:3000
npm run test:core      # compiles the engine; core, people and data tests
npm run check:engine   # the committed engine bundle matches src/
npm run test:browser   # the browser game, headless, with the real engine
npm run sim:balance -- 3700                      # ten years, four scripted strategies
npm run sim:balance -- 3700 --seeds=8 --only=champion,routine   # win rates across seeds
```

**Check exit codes.** Do not pipe test output through `tail` or `grep` and assume success: a pipe hides the failure code, and a failing commit was once pushed that way. Run `npm run test:browser; echo $?`.

A change is done when all three test commands pass. If it touches costs, rewards, timing or difficulty, also run the simulator (see Balance).

## Where things live

| File | What it holds |
|---|---|
| [index.html](index.html) | Screens and script order: scenes → injustice data → campaign rules → engine bundle → game.js → act3.js → ui.js |
| [game.js](game.js) | The `GameEngine` store, `ACTIONS` and `WIRING`, Acts 1–2, every desk except Home, elections, the routine |
| [act3.js](act3.js) | Injustice feed, outrage, the fictional network, courts, laws, pride index, endings |
| [ui.js](ui.js) | Popup behaviour, pickers, the resource strip, confirmations, portraits, the Home desk, character dialogs |
| [data/reality/historical-scenes.js](data/reality/historical-scenes.js) | Sourced Act 1 dispatches and their responses |
| [data/reality/injustice-patterns.js](data/reality/injustice-patterns.js) | Sourced background records and the fictional cases modelled on them |
| [src/](src/) | TypeScript engine; the browser's only entry point is [src/game/browser-bridge.ts](src/game/browser-bridge.ts) |
| [engine/republic-engine.js](engine/republic-engine.js) | Generated bundle of `src/`. Never edit by hand |
| [desk.css](desk.css) | Home desk styles, scoped to `.desk` |
| [visual-system.css](visual-system.css), [styles.css](styles.css) | Older shared styles (dark carbon theme) |
| [scripts/](scripts/) | Test harnesses, balance simulator, engine bundler, dev server |

### The store and ownership

`state` is the browser campaign; `state.world` is the TypeScript engine's `WorldState`. Each number has one owner so nothing is ticked twice:

- **Browser owns:** date, dispatches, funds, volunteers, credibility, media heat, legal pressure, cases, elections, laws.
- **Engine owns:** staff psychology, burnout, memory, relationships, careers, recruitment, payroll responses, voter-group opinion, the seat model.

Each day `advanceDay()` runs the browser steps, then `GameEngine.tick()` mirrors organisation numbers into the world and runs the engine's people step (and payroll on the first of the month), then `act3Daily()`. `GameEngine.save()` writes the whole tree to `localStorage`.

### Adding a player action

1. Write the handler (throw `Error` with a player-facing message when it cannot happen; call `advanceDay()` if it takes the day, otherwise `save(); renderPage();`).
2. Add it to `ACTIONS` in game.js, and a selector to `WIRING` if a button triggers it with a `data-*` attribute.
3. If it changes the world, it is confirmed automatically for page clicks when its type is in `ASK_FIRST` in ui.js. For `act` actions, add an `ACT_INFO` entry so the dialog explains the cost and effect.
4. New state fields get defaults in `ensureState()` (game.js) or `ensureAct3State()` (act3.js) so old saves still load.
5. Add a test to [scripts/test-browser.cjs](scripts/test-browser.cjs).

### Changing the engine

Edit TypeScript in `src/`, then `npm run build:engine` and commit `engine/republic-engine.js` with the change. CI fails if the bundle does not match the source.

## Interface conventions

- **No native dropdowns.** Use `pickerButton()` / `openPicker()` for choices and `segmented()` / `segmentRow()` for small number ranges.
- **Popups:** create a `.decision-modal` containing a `.decision-box` and a `.modal-close` button; ui.js adds the ✕, Escape, backdrop click and focus handling automatically. A popup without `.modal-close` cannot be dismissed (use for choices the player must make).
- **No dashboard tiles.** `metric()` renders inline facts; the resource strip is the only place for running totals.
- **Consequences are shown before a choice** with `effectChips()`.
- **People have portraits:** `portrait(name,{mood})`.
- **Motion is paused** globally by a rule in visual-system.css. Do not add animations unless the project owner asks.
- Verify visual changes in a real browser at desktop width and at 400px; the page must not scroll sideways.

## Code style and traps

- game.js and act3.js are written densely, often one function per line. Match the surrounding style; comments explain why, sparingly.
- **Line endings are CRLF** on Windows checkouts. Scripted find-and-replace that assumes `\n` will silently miss; normalise to `\n`, edit, and restore.
- Nested template literals inside shell one-liners break quoting. Put patch scripts in files instead of `node -e`.
- Tests run game.js in a Node `vm` with a stub DOM; code that runs at load time must tolerate a missing `document.body`.
- Some systems use `Math.random` (tips, macro drift); tests must not depend on them (see how the routine test holds a pending tip).

## Balance targets

Measured with the simulator across seeds; keep them roughly true after any change to costs or rewards:

- A disciplined strategy wins about 3 runs in 4, between 2032 and 2035. Unfocused strategies never win.
- A winning game takes about 1,500–2,000 decisions with the weekly routine.
- Early game is tight: the 13 Jantar Mantar tasks are affordable by mid-June 2026 with little to spare.

## Workflow

Work on a branch, run the three test commands, and open a pull request against `main`; GitHub Actions runs the same checks. Commit messages explain what changed and why.

## Open work

- Bring the Home desk treatment ([desk.css](desk.css)) to the People, Research and Party desks. Research is the longest page.
- More injustice case types; ten repeat over ten years.
- New sourced Act 1 dispatches as real events continue after 28 September 2026.
- Move school audits and hidden donations onto the engine's evidence and secrets models.
- The custom-character creator screen is unreachable; link it or remove it.
