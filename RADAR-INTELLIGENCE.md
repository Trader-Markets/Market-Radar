# Radar intelligence v1 (draft, not production)

Adds an independent analytical layer to existing crypto strategy scans. No copied Python implementation, demo accounts, new tabs, broker actions or notifications. Existing strategy rules and order flows remain unchanged.

- Time Machine: 10,000 historical contiguous-window resamples of closed hourly OHLC, fixed seed, stop-first on ambiguous bars, gap stop fill and explicit trading-cost assumption. Not calibrated probability; overlapping windows are not independent. No live/demo orders.
- Historical replay: same mode and side, point-in-time closed candles, existing plan/simulate functions, 30-trade minimum, net R, Wilson interval and drawdown in R. Not walk-forward optimization or evidence of future profitability. Provider history limits can make a result unavailable. Current cost floor 0.2% is an assumption, not a verified execution cost.
- Entry: existing assessed quality is preserved. New freshness helper available. No new alert gate until regression and live tests pass.
- Risk: fail-closed pure policy evaluator; requires verified broker account data, exact contract multiplier, account currency risk, fees, start-of-day equity, existing open risk, loss and trade count. Not wired into order review or confirm; server-side enforcement and atomic exposure reservations are required before use as a safety control.
- Coverage: unique eligible symbols classified complete/partial/failed/unchecked/excluded, scoped to selected crypto exchange/filter. Does not claim NSE/global coverage or per-timeframe completeness beyond existing scanner issue reporting.

UI: expand an existing matching crypto setup and select Validate historical evidence. Uses cached closed-candle requests; no per-market automatic backtest flood. Analytics are advisory and cannot authorize trades. No changes to Dhan, global, background/active radar, broker execution, Telegram, demo or WhatsApp code in this branch. Base GitHub branch is older than latest requested cleanup; do not deploy it as-is.

Validation: run node --test tests/radar-intelligence.mjs and npm test, then python build-worker.py to regenerate embedded hosted assets. Generated worker has not been updated by this commit. Verify actual provider coverage, browser UAT and risk enforcement before merge. Indian and global adapters require market-session-aware history and verified provider inputs.
