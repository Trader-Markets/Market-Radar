# Current Indian Markets provider: DhanHQ

Indian Markets now uses Dhan for stock directories, index/stock quote snapshots, strategy checks, positions, funds, orders, trades and holdings. The previous broker integration and OAuth screens have been removed. Crypto remains unchanged.

Connect in **Indian Markets → Settings** with your Dhan Client ID and access token. Generate the token in Dhan Web → My Profile → Access DhanHQ APIs. Credentials are verified against Dhan profile and encrypted on the server. Data APIs require appropriate Dhan access; manually generated tokens normally last 24 hours.

See [DHAN-MIGRATION.md](DHAN-MIGRATION.md) for source contracts, tests and limitations. TradingView widget charts still use TradingView data and embedding permissions; switching broker does not unlock restricted NSE widget data. Indian order submission is not enabled.

---

# Breakout Radar / Market Radar

Personal market scanner and trading workspace for Delta Exchange India and Shark Exchange, with separate stocks/indices tools, performance calendars, trade learnings, custom alerts, and Telegram news.

## Run on Windows

Install Node.js 24 or later. Download this repository as a ZIP, extract it, and open **Start Market Radar.cmd**. First launch installs pinned Telegram dependencies from npm. The launcher detects an older server on port 8787 and asks you to close its terminal window before retrying.

Open `http://localhost:8787`. Telegram setup is at `/telegram-connect`; incoming posts appear in **Setups → News**. Join @lmwmnews in Telegram first, then enter your own API ID/hash, phone number, login code, and optional two-step password in the local setup page. Photos and captions are displayed with source formatting; albums are grouped. Video, unsupported media, and oversized images link to the original Telegram post. Delivery depends on Telegram and network conditions; the screen checks its local feed every second while visible.

## Development

- `npm ci`
- `npm test`
- `python build-worker.py` (rebuild embedded assets and Worker)
- `node local-trading.mjs --open`

SQLite uses Node's built-in `node:sqlite`. Exchange credentials and Telegram sessions are encrypted in the local user's data directory, outside this source tree. Never commit `.env` files, keys, databases, sessions, account exports, or logs. Withdrawal routes are not implemented. Tests simulate exchange operations; tests do not place trades or send provider messages.

## Hosted Site

The owner-private Site and the local Windows application are separate runtimes. Telegram account sessions and photo downloads remain on the local computer. Hosted news provides only a best-effort public preview; signing in locally does not stream the feed to the hosted Site. See `TELEGRAM-LOCAL.md` for setup and limitations.

## Source and third-party notices

This repository includes application source, generated Worker output, schema/migrations, regression tests, and vendored client libraries with their notices in `dist/vendor/`. No live credentials or user trading records belong in this repository.
