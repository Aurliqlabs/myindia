# Running REPUBLIC: 543 locally

## Windows — easiest method

1. Download or clone the repository.
2. Make sure Node.js LTS is installed.
3. Double-click `START_GAME.bat`.
4. The game opens at `http://localhost:3000`.
5. Keep the terminal window open while playing.
6. Press Ctrl+C in that window to stop the local server.

## Terminal method

```bash
npm run dev
```

Then open:

`http://localhost:3000`

The development server intentionally has no production dependencies. It serves the current browser client directly.

## Core engine tests

```bash
npm install
npm run test:core
```

## Career simulation test

```bash
npm run build:core
node scripts/simulate-career.cjs 365
```
