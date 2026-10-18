# Scanner, account and order-flow repairs — 6 October 2026 IST

Based on source revision 76e523b (published version 33). Earlier unfinished local changes were preserved separately; this release retains the published demo account, theme and background-watchlist implementation.

## Scanner and recommendation checks

One scan still evaluates the four requested strategies. A missing daily or 4H response is reported per timeframe. A valid 1H breakout is no longer discarded merely because the 4H request failed. Missing bars are not invented. A 1H chart can load without 4H history; trades requiring missing 4H chart data remain blocked.

Matches receive a second pass using a new ticker and current contract rules; Shark also reads its order book. Every recommendation must pass: strategy rules, closed-candle confirmation, entry validity window, a source quote no older than 15 seconds, contract limits, valid bid/ask, valid positive stop/target, no breached stop/target, distance from entry at most 0.25R, spread at most 0.15% and 10% of stop distance, estimated net reward/risk at least 1.5, and exchange price increments. Costs use the larger of 0.2% or two taker fees plus a 0.05% allowance, plus observed spread.

These thresholds are conservative product defaults, not an optimized or validated profit model. They are shown as checks, not a confidence percentage. News, market depth at the user's eventual order size, funding and execution slippage are not fully verified. Recommended rows sort first; failed checks remain visible with their entry-check reasons. Rows older than 60 seconds require a recheck. Automatic full-market scan notifications require the second-pass checks to pass. Chart tracking alerts continue to report their explicitly labeled strategy state.

Public-feed transient errors receive bounded delayed retries. Shark scanning uses one worker to reduce queued requests competing with chart updates. Existing source freshness and missing-history safeguards remain in effect.

## Account and order fixes

- Fills/trade-history outages do not by themselves invalidate verified wallet/position/open-order data. Required account components still block trading when missing.
- Shark contract lookup explicitly selects the INR or USDT market. Missing quantity filters fail closed.
- Required Delta position/order responses must be arrays; malformed responses cannot be treated as an empty account.
- Both exchange order preparation paths reject a stop/target already crossed by the current source quote, including on final submission.
- Amount, leverage, direction and prices are captured with the review; changing them requires a new review.
- Order-review and submit request deadlines allow for their sequential exchange checks. No automatic retry is added to order submission.
- Account polls run every 20 seconds instead of 10; returning online/to the page still refreshes immediately. The hosted site no longer calls the localhost-only IP endpoint.

## Evidence and limits

17 automated test files pass, including persisted demo long/short trades, margin and fees, duplicated requests, API signing, owner checks, strategy fixtures, partial history, all recommendation gates, optional history failures and edited reviews.

Production logs were inspected. They showed account 401 responses, localhost-IP 404 responses and cancelled candle requests. They did not expose enough exchange response detail to identify every user-reported live-order failure. A direct public Delta BTCUSD ticker returned its documented microsecond timestamp and bid/ask fields. Direct Shark API access from this execution environment returned HTTP 403. The intended hosted proxy returned HTTP 200 for Shark BTCINR ticker and INR contract metadata. Hosted Delta BTCUSD ticker and 1H/4H/daily candle routes also returned 200. The production data normalized to 77 closed 1H, 332 closed 4H and 999 closed daily bars, and the updated engine evaluated all four strategies without finding a rule match. This is a representative feed check, not an all-market execution test.

No real exchange order was placed, no credentials were changed, and no WhatsApp message was sent. Authenticated desktop/mobile browser testing and funded-account execution remain unverified. The existing background automation was found paused and remains paused; this release does not claim continuous scanning is active. Background watchlist results remain raw candle matches, not the new foreground recommendation pass.


## Follow-up — 6 October 2026, morning IST
- Daily-history downloads are deferred until necessary 1H/4H MTF volume and range conditions pass. This is a necessary-condition filter, not a relaxed strategy. Other strategies continue to run on 1H/4H data.
- Partial results and pending entry checks appear before the entire market completes; recommendation checks update one candidate at a time. Stop scan invalidates the active run and releases controls while retaining only completed results. Already in-flight read requests may finish, but cannot overwrite the stopped/replaced run.
- Range matches without any actionable plan no longer trigger extra quote/contract requests for the second pass.
- A cancelled or replaced order review cannot be restored by a late response. Native Escape dismissal also clears its context. Account text explains that local and hosted credential stores are separate.
- The current production version was confirmed as version 34 before this follow-up. Recent logs show account 401 responses (no saved connection) and cancelled candle requests. Cancellation alone does not prove an exchange failure. No funded credentials were available for execution verification.
- The 17-file suite includes new tests for necessary MTF gates, cancelled review responses, stop-scan control recovery and unverified setup labels. Existing exchange-signature, stale-data, risk, demo, scanner and persistence checks remain in the suite.

## Status clarification — 6 October 2026
The strategy badge now reflects the candle signal independently of entry suitability: Confirmed, Forming, Watch only or Expired. A separate entry label shows pending, failed, stale or passed checks and the failed-check reasons. Passing entry checks cannot promote a forming signal. Regression cases cover those distinctions; recommendation gates and alert eligibility are unchanged.

## Active strategy trade tracking — 6 October 2026

New strategy reviews retain their original strategy level and candle time in the durable intent. Accepted orders are discovered by the monitor; acceptance alone never counts as a fill. Live tracking requires a matching recent fill and verified current position, or an explicit user link from the chart to a verified existing position. Demo trades retain the same strategy context, are clearly labeled, and do not generate live WhatsApp risk alerts. Manual edits preserve the original strategy association unless the side changes.

The tracker evaluates fresh source quotes, actual position entry and size, available liquidation price, protective stop coverage, current protective stop, and closed candles for the original strategy. It does not demand another entry breakout every hour. Breakout/EMA trades use the original level; cross trades use the continuing 50/200 SMA relation. Stop breaches remain flagged after a rebound. Other review prompts cover half-R adverse movement, 1R profit, and 1R retracement from an observed peak of at least 2R. These are explicit product thresholds, not a backtested exit system or profitability promise. No margin, leverage or order mutation occurs in the tracker.

Account failures cannot mark a trade closed. Verified closure ends tracking; an unrelated later position cannot restart it. Changed side, increased size or entry requires a new explicit link. Durable transition alerts suppress repeated stable states; urgent events are prioritized for the existing one-message-per-minute WhatsApp limit. Transitions observed between polls may be missed. A tracker lease serializes browser and background checks.

Alert cards and browser notifications now display titles only. WhatsApp sends exactly one template variable. Older two-variable templates are blocked with a setup instruction until the user saves an approved one-variable template. Recipient, consent, update opt-in, encryption and delivery-uncertainty safeguards remain required.

Hosted checks run every 20 seconds while the page is active. The existing hourly background endpoint also invokes the trade checker, but the linked automation remains paused. Hourly automation cannot provide continuous or timely exit protection. A separate private `/api/trade-monitor/run` endpoint permits the same owner-scoped updater with no browser; it cannot change exchange accounts. Local-server installations run the checker every 20 seconds while the server process remains running, including when the browser is closed.

18 automated test files pass. Added tests cover long/short exits, all four strategies, stale quotes/candles, persistent stop breaches, fill verification, actual fill price, account failures, changed-position relinking, demo linking and closure, Delta and Shark mocked integration, durable deduplication, owner/CSRF isolation, the private updater and title-only rendering/payloads. No funded trade or real WhatsApp message was sent. Authenticated visual browser QA and funded-account delivery remain unverified.

## Top-20 volume surge scanner — 7 October 2026

Added a fifth scanner under Setups. It ranks perpetual contracts by 24-hour quote turnover within the selected exchange and quote currency (a liquidity proxy, not a depth guarantee), then checks only the top 20. Delta uses its all-ticker feed. Shark ranks the complete selected contract list using paced per-symbol turnover reads; an unavailable turnover feed blocks the top-20 claim rather than silently excluding that coin. Scans progress in bounded persistent batches with a shared lease and explicit pause/status controls. Ranking expires after 15 minutes; completed runs are cached for the current 5-minute slot.

5m exchange candles are validated and aggregated into complete 15m, 30m and 1h candles. A final signal requires every timeframe, ending at the same closed hour, to break its own preceding 20-candle range in the same direction with a strong outer-quarter close. Volume must be at least 1.5 times its preceding 20-candle average on 5m/15m/30m and 2 times on 1h. Early checks are visible but never alert. These are explicit, configurable-in-code defaults, not optimized exit/entry or probability claims. A new source-timestamped live quote must still be beyond the hourly breakout level before creating an alert.

Final alerts are saved and deduplicated by exchange, quote, coin, direction and hourly close. Titles include confirmation, side, symbol, volume multiple and dated IST candle close. The scanner and main feed render bold titles; WhatsApp receives a single bold-formatted title variable. Browser notification font remains controlled by the operating system. Opening an alert loads its saved plan on the exchange chart and preserves the volume-surge strategy identity for subsequent trade tracking. An expired saved plan cannot pass the existing live-order gate.

Foreground checks run automatically after Start / refresh volume alerts is selected; Pause stops subsequent steps and provider delivery. Local-server installs can continue saved enabled scans while the server process runs. The private bounded `/api/surge/run` writer supports unattended jobs and has a GET readback. Existing hourly scheduling remains paused; continuous hosted delivery is not claimed. WhatsApp still requires its existing saved opt-in, confirmed-alert setting and approved one-variable template, and is limited to one provider message per minute.

19 test files pass. New tests cover exact top-20 ranking, exclusion of lower-ranked coins, positive and negative breakouts, aligned frame closes, no alert before the hour closes, missing/conflicting/stale candles, low volume, wick-only breaks, fresh source gates, durable deduplication, scope isolation, pause, CSRF, private service readback, Shark ranking and incomplete-universe rejection, bold UI titles and one-variable WhatsApp payloads. No actual trade or WhatsApp message was sent. Authenticated visual browser QA and end-to-end phone delivery remain unverified.

Live public-feed check: Delta returned 226 perpetual contracts with usable turnover and a ranked top 20. Delta BTCUSD and Shark BTCUSDT each returned 304 completed 5-minute bars; all four derived frames were available and neither sample passed the final signal. These samples validate feed parsing and aggregation, not profitability or a simultaneous all-market execution test.


## Fakeout filtering and separate liquidity sweeps — 7 October 2026

Added a shared conservative entry gate. A breakout close must clear its original level by the larger of 0.1 prior ATR, two verified exchange ticks where available, and 0.01% of price. Its body must occupy at least half the candle and its close the outer quarter. Two contiguous completed 5-minute candles after the signal are required; any intervening close back inside the original level blocks the entry even if price subsequently recovers. Current follow-through must still clear the buffer. New crossovers use the follow-through timing and sweep checks, with their original SMA confirmation, rather than applying a range-break rule to their entry price. These are explicit product defaults; they are not optimized or proven to eliminate future fakeouts. The existing backtests replay the original strategy rules, not the new live filters.

Liquidity sweep patterns are evaluated independently: a high/low wick beyond the preceding 20-bar range by the volatility buffer, a close back inside, and a rejection wick occupying at least 35% of the candle. Only closed, contiguous history is used; the latest three closed candles are checked. A high sweep opposes a long, and a low sweep opposes a short. The Setups panel reports 1H/4H observations even when no strategy matches. The top-20 scanner reports its four timeframe observations in a separate column. Sweep levels are drawn on the exchange chart. OHLCV evidence cannot establish that particular stop orders were triggered or that institutional intent caused a move.

Foreground recommendations, chart notifications, hourly saved-watchlist alerts and final volume alerts now require the new checks. Chart alerts can no longer bypass entry verification. Raw strategy confirmation remains separate from entry readiness. Entry checks fail closed on missing/stale/gapped or conflicting data. Identical duplicate closed candles are merged; conflicting duplicates are rejected by both foreground and server normalization. Volume alerts also reject breached stops, reached targets and prices more than 0.25R from the reference entry. Final volume alerts arrive no earlier than ten minutes after the hourly close, plus scan/feed delays.

Strategy-linked funded order review and submission independently fetch fresh history and quotes on the server and recheck the filter, original signal window and current entry distance before any leverage/order mutation. This check does not assert that a manually planned trade has a qualifying strategy. Tracked trades now examine completed 5-minute failed breaks and opposing sweeps as well as their original hourly/4H strategy checks. Observed 5-minute failure remains flagged after recovery. Existing stop, liquidation and protection alerts retain priority. Alerts are review prompts; the monitor does not change orders, margin, leverage or position size.

20 automated test files pass. Added coverage includes long/short follow-through, weak bodies, volatility/tick buffers, sweep detection independent of level failure, opposite-direction sweep handling, forming candles, gaps/duplicates/conflicts, stale/missing history, recovery after failure, server entry rechecks, chase distance, expiry, tracked-trade sweep/failure alerts, final notification gating and customer-panel mounting. Existing account, order, demo, source, WhatsApp, scanner and owner-access tests also pass. No funded order or real WhatsApp message was sent. Authenticated visual QA and actual phone delivery remain unverified.

Fresh public-feed samples through the private Site at 18:54 IST yielded 307 closed 5m, 77 closed 1H and 332 closed 4H Delta BTCUSD bars; Shark BTCUSDT yielded 307, 77 and 318 after identical duplicates were merged. Both had current closed 5m history at capture time. Both produced separate sweep observations without a qualifying base strategy. These are feed/parser samples, not a full-market simultaneous validation or profitability assessment.

The existing linked cloud schedule was moved from :35 to :45 IST to allow ten minutes after the UTC hourly close (:30 IST). Its paused state is preserved. While open, charts recheck approximately every ten seconds, trade monitoring approximately every twenty seconds and saved enabled scanners refresh on their existing cadences. Local-server checks continue only while that process runs. Closed-app hosted monitoring is not running while the schedule is paused; even if resumed, hourly polling cannot provide continuous exit protection or zero-delay alerts.


## Saved custom in-site alerts — 8 October 2026

Added Custom alerts at the top of Setups. Customers can select a listed coin, write a condition and preview the exact interpretation before saving. Price numbers are used literally in the selected market currency; “BTC below 800” stays 800. Supported conditions are above/below a price or a 2–500 period EMA on 5m/15m/30m/1h/4h/1d. Up to two conditions can use AND or OR. Unsupported phrasing, currencies, indicators, timeframes and formulas are rejected rather than guessed. The original customer wording with “tell me when the BTC price is below 800 or below 200 EMA on 5 min time frame” is covered.

EMA alerts compare a source-timestamped live price (at most 15 seconds old) with the EMA of completed, aligned, contiguous candles. The SMA seed and recursive EMA use loaded history with up to 997 requested candles. This is not a claim that the seed/history exactly matches every TradingView symbol feed. A missing or conflicting history leaves the rule armed with an explicit unavailable state. An independently proven true OR branch can still trigger; an unknown AND branch cannot.

New owner-indexed custom_alerts records preserve rules, status, observed values and triggered titles across reloads. Version checks and compare-and-set updates prevent a late market response from undoing pause/delete/re-arm. Checks use an owner lease and batches of up to four alerts. Twenty saved alerts are permitted with an atomic cap; save request IDs deduplicate retries. Alerts trigger once, including their first check when already true, and may be re-armed, paused or deleted.

Triggered titles appear in the custom-alert history, main site alert feed and a bold dismissible on-screen notification. Existing opted-in browser notifications can also show the title. Custom alerts do not use the WhatsApp path or exchange account/order endpoints. Checks run approximately every 20 seconds while the site is open, including across tabs within the app, and resume on visibility/online events. Multiple batches, background tabs and provider latency may delay checks. There is no closed-app custom-alert scheduler in this change; transient conditions while closed can be missed. Existing scheduled feature settings are preserved.

Twenty-one automated test files pass. Custom-alert coverage includes exact parsing and prices, AND/OR, EMA mathematics, equality, freshness/future timestamps, incomplete/forming/gapped histories, partial OR evidence, Delta/Shark mocked public-feed integration, durable history, save retries, one-shot behavior, pause/re-arm/delete, owner/CSRF isolation, concurrent limits, check leases and late deletion races. A DOM integration test exercises the actual typed preview and Save form through the durable Worker route into the main feed, toast, dismiss and re-arm control. Existing account/trading/scanner tests remain passing. No funded order, real message or real customer alert was created during validation. Authenticated visual browser QA and a real customer alert trigger remain unverified.


## 2026-10-14 feed latency and fixed outbound IP
- Exchange candle display now paints fresh trade ticks immediately for the current known bar; never fabricates missing candle opens/volume.
- Delta order book uses official ob_l2 snapshots; late REST snapshots cannot replace a healthy streaming book.
- Public socket heartbeat watchdog, initial 1s reconnect with bounded exponential backoff, focus/online recovery, REST fallback after 3s without fresh prices. Stale/out-of-order packets rejected.
- Added server-only HTTPS signed-request relay option, authenticated loopback service, route allowlist, replay protection, no API-secret forwarding, no withdrawal path, no automatic order retries. Existing owner-scoped encrypted keys persist.
- Fixed-IP relay is PREPARED ONLY. No cloud server or IP provisioned; DigitalOcean access and one-time Delta IP allowlisting remain required. No runtime relay secrets configured.
- 12-second public BTCUSD WebSocket observation from execution environment: 14 trade packets, observed trade-time-to-receipt lag 75–541ms. This is a small sample using the execution host clock, not a latency guarantee or browser measurement.
- Automated suite: 22 test files passed. No funded trades or provider messages sent. Actual authenticated relay account read and browser visual QA are not completed.
