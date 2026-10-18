# Performance & Learnings calendar

Open `/learnings`. Choose Today, 7/15/30 days, 3 or 6 calendar months, 1 calendar year, or enter custom dates. Click **Update history** to import missing dates. Saved selections within the imported range update instantly. Long imports use 30-day windows with durable cursors and can be paused/resumed. The last day is capped at the import start time. Refresh history for newer trades.

## Calendar and review

Choose a currency, browse calendar months, and select a day. Dates show signed realized P&L and executed order-days. Dates outside the imported span are disabled; dashes mean no realized trading entries were returned. Green/red is reinforced by explicit plus/minus amounts. Select a duration with the date controls or Whole synced period. The selected day/duration has a single summary, not feedback per trade.

Review includes high-activity days, narrow-range repeated execution groups, and orders shortly after same-product realized losses. Counts include eligible explicitly non-reduce-only orders only; these may still be exits. Unknown intent is omitted. Manual labels and notes do not change automatic findings. Partial fills group by order ID and IST day. A multi-day order counts on each day it receives fills. Burst checks use fixed IST hours, at least 3 eligible orders and a 0.5% average-executed-price band. Comparisons need at least three realized-result days in each activity group and explicitly do not establish causation.

Rules and evidence are the same on winning and losing days. There is no diagnosis, invented discipline score, inferred trade win rate, or external AI processing. Results alone do not establish good/bad decisions. Daily evidence includes P&L components, positive/negative/flat days, average and median realized day, best/worst dates, daily realized-ledger drawdown, and reconciled instrument contributions. No generic advice is generated. Notes are optional and collapsed. Changing selection with unsaved edits asks before discarding them. Old order notes remain stored, but manual labels do not alter the automatic calendar analysis.

## Calculation and limits

Realized P&L = product-linked cashflow/settlement + signed commission/rebate/liquidation fees + funding. Deposits, withdrawals and unrelated credits are excluded. Each currency stays separate. Open-position P&L, equity returns, leverage and stop discipline are not inferred. Totals depend on history returned by Delta and its history availability. ID-less wallet rows are retained as separate import rows; repeated imports are isolated, but cross-page identity for those rows cannot be verified.

Calendar reports aggregate in SQLite, removing the old 20,000-record full-history analysis ceiling. Queries return daily aggregates and pattern counts. Instrument breakdowns are withheld if either grouped query exceeds 10,000 rows or totals fail reconciliation; daily totals remain available. Orders spanning hours are excluded from fixed-hour range checks. A 30-day source window is capped at 2,000 pages; an interactive import session pauses at 15 minutes with saved progress. A fresh import never displays partial P&L. Existing unfinished long imports restart their current source with safe windows and isolate obsolete ledger rows.

## Verification

Automated tests cover currency separation, signed daily P&L, deposits excluded, partial fills, legacy recovery, ID-less rows, >20,000 records, 90/180/365-day window coverage, calendar selection, duration feedback, profitable/losing-day rule symmetry, notes, escaping and failure recovery. No real trades are placed and no messages sent. Live account history and visual browser QA require the user environment.

## Personal chart and risk companion

The selected day or duration shows a simple calendar review first. Open the optional charts section and choose Review charts to start a read-only historical chart review. Each batch checks four executed order-days, saves the evidence under the import and API-account hash, and reports progress. Pause/continue is supported; each interactive run stops after 200 batches or 15 minutes and explicitly labels incomplete coverage. Saved checks survive page reloads. Retry unavailable charts rechecks failed/gapped chart evidence without replacing imported account history.

The review compares the first execution-time price with closed 5-minute candles and the closed hourly EMA 200. Its descriptive breakout check is a close beyond the prior 20-candle high/low with volume at least 1.5 times their mean, aligned with the buy/sell direction. Extension is measured in the prior 14 true ranges. These checks do not certify all four scanner strategies or infer which strategy the trader intended. EMA 200 uses an initial 200-close mean followed by the EMA recurrence, with 260 bars requested. A forming candle, duplicate bar, invalid OHLC or missing pre-execution candle cannot establish a finding. Simultaneous first-timestamp fills use their quantity-weighted price.

An expandable TradingView Lightweight Charts view shows the actual fills, prior range, volume and a recorded planned stop where available. It defaults to candles closed before the first fill. Later candles are an explicit retrospective mode; their 60-minute favourable/adverse path is not trade-level MFE/MAE, exit capture or profit. Exact fill timestamps use IST; arrows fall in the containing five-minute bucket. Chart controls include zoom, reset, crosshair and later-candle visibility. This is the embedded chart engine, not the complete TradingView terminal.

Money evidence compares contract quantities within each instrument, and flags increases over 1.5 times a previous completed same-product/same-side order-day after an intervening negative cashflow within 30 minutes. It does not equate contracts with margin or assume non-reduce-only orders are entries. Accepted original opening plans are matched by exchange order ID, product, side, owner and a still-verifiable encrypted session for the same API account. Their stop distance, planned price loss and submitted leverage remain labelled as plans, not proof of active protection. Repeated fill-days do not duplicate a plan in risk summaries. Missing historical equity, position baselines, stop changes and real leverage are not invented. Quote units are not assigned an unstored currency.

Day-level P&L comparisons for chart extension require a completed review, chart evidence for every eligible order on the included day, and at least three realized-result days in each group. They are descriptive associations, not P&L attribution or causation. Personal wording is deterministic: actions and evidence are facts, intentions remain unknown, and no emotional labels or personality scores are generated. No extra manual input or external AI service is required.

Historical candle reference: https://docs.delta.exchange/ (GET /v2/history/candles; seconds-based start/end, 5m and 1h resolutions). Only public historical candle requests are made by the companion; it cannot place orders or change margin, leverage, keys or recipients.

## Simplified review and recovery

The default page shows the P&L calendar and up to three concise record-based observations. Full calculations, exact dates, journal notes and chart/risk analysis are collapsed. Chart requests no longer start on page load or calendar selection. One primary action loads, refreshes, resumes or retries as appropriate. History requests have a 45-second timeout, failures keep saved progress, and Error details provides a copyable message with the UI build identifier. Tests do not verify errors on a user computer without its exact error message.

## Import repair: unusable execution rows

An execution with missing, non-numeric or non-positive price/quantity no longer blocks the whole import. Its original normalized fields and a validation reason are retained as an invalid_fills record. Any other fills belonging to that order are excluded from execution counts, pattern checks and chart reviews, with an explicit incomplete-analysis warning. Wallet P&L is calculated independently from the imported wallet ledger. Missing identity or timestamps still stop an import because those records cannot be safely placed in a date range. A corrected version of the same fill ID replaces its held record on a later import.

Regression test reproduces the reported batch 9 / row 15 failure, resumes the three-month import, verifies the held record, excludes its valid partial fills, and checks that wallet P&L is unchanged. Existing 90/180/365-day window coverage tests continue to pass. This does not establish that the actual missing source values were recovered.

## Telegram News

News includes a fixed read-only public preview for https://t.me/lmwmnews with direct post links and a 60-second check interval while the page is visible. No Telegram login, bot token, account scraping or message sending is used. Telegram preview availability is not guaranteed. An inaccessible or changed preview shows a source failure and the direct channel link; previously fetched posts are marked stale. Headlines are displayed as unverified channel content and never drive trade execution or strategy confirmation. Live Telegram access could not be verified in the development environment.
