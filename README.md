# Market Radar

Delta Exchange India and Shark Exchange radar with four strategies: 1H high-volume breakouts, five-timeframe breakout watch, 4H 200 EMA consolidation, and golden/death crosses.

## Run locally

Requires Node.js 24 and Python 3. Install dependencies and build:

```bash
npm ci
npm run build
node local-trading.mjs
```

Open http://localhost:8787. On Windows, use `Start Market Radar.cmd` after building.

## Tests

```bash
for test in tests/*.mjs; do node "$test" || exit 1; done
```

## Source map

- `dist/index.html`, `dist/app.js`, `dist/signals.js`: editable frontend and strategy source.
- `delta-desk.js`, `shark-desk.js`: exchange account and reviewed-order handlers.
- `build-worker.py`: packages frontend and handlers into `dist/server/index.js`.
- `local-trading.mjs`, `local-store.mjs`: local HTTP server and encrypted account persistence.
- `db/`, `drizzle/`: database schema and migrations.
- `dist/vendor/`: bundled chart and socket libraries with licenses.
- `tests/`: strategy, risk, account, order, alert and position tests.

See `LOCAL-TRADING.md` for setup details and `VALIDATION.md` for tested behavior and limitations.

## Data and charts

TradingView advanced embed and an exchange-fed TradingView Lightweight Charts view with automatic strategy levels. Literal zero delay is not guaranteed. MTF uses the highest loaded daily price; lifetime ATH is unverified. Scans and alerts require the browser to remain open. No withdrawal action is provided.

## Deployment

`.openai/hosting.json` identifies the existing ChatGPT Site. For an independent deployment, replace this project binding with your own configuration. Hosted account routes require the configured owner identity and session encryption secret; never commit these runtime values or account databases. Credentials are entered in the application, never in source code.
