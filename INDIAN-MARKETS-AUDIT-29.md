# Indian Markets audit — 2026.10.20.india.29

## Result
80 automated checks passed; zero failed or skipped. This includes the existing suite plus 12 new regressions for the Dhan backend and Indian-market customer journeys. Browser pixel rendering, the owner's live Dhan session, actual private positions/funds and TradingView provider availability remain unverified. No real orders or messages were sent.

## Reproduced bugs fixed
- Dhan open/high/low values were dropped by quote normalization, leaving overview columns blank. Preserve provided values; absent data stays unknown.
- Account refresh could time out in the browser before five bounded broker requests finished. Give account reads a 60-second browser deadline.
- Malformed position quantities could vanish from the open-position filter and look like an empty account. Validate account rows by section; malformed sections are unavailable with a clear error. Valid empty arrays remain empty accounts.
- Authentication and Data API access failures could repeat across all scan history requests. Stop immediately on those blocking failures. Generic partial source failures retain their explicit error status.
- A missing/delisted stock could reject quote loading for every other stock in its batch. Return an unavailable row for that instrument and continue valid instruments.
- Supported stock/index quote aliases could produce null rows after resolving to canonical symbols. Match normalized responses to the resolved instrument.
- Retry-After HTTP dates were ignored. Honor dates as well as numeric delays, including non-JSON 429 responses.
- Candle validation accepted booleans as numeric prices; returned history could include out-of-range candles. Reject booleans and constrain history to its requested range.
- Directory reload could overlap scope changes or a scan and reset running progress. Lock those actions during the directory request; failed reloads retain the prior usable universe.
- Changing screener pages/filters during quote loading could leave the visible page unloaded. Queue a refresh for the final visible page after the current operation.
- Saved-list search results did not retain company names. Preserve them for table display.
- Price alert input did not canonicalize shorthand symbols, which could prevent a saved rule from matching quotes. Resolve against Dhan before saving, reject duplicate waiting rules, use the selected instrument by default and discard late lookup replies after navigation.
- Correct the ATH explanation: this scanner has not verified lifetime history/monthly alignment, rather than claiming all retrieved Dhan history is limited to 90 days.

## Feature coverage
| Area | Checked | Remaining boundary |
|---|---|---|
| Dhan connection | Profile verification, encrypted storage, owner/CSRF checks, bad credentials, preservation on failure, disconnect and late responses | Owner must connect a real account; tokens expire under Dhan policy |
| Accounts | Positions, funds, orders, trades, holdings, valid empty and partial/malformed responses, deadline and duplicate refresh | Broker reads only; no Indian order submission |
| Market overview | Exact index IDs, source times, OHLC, missing/stale values | Quote snapshots, not WebSocket streaming |
| Stock search | NSE/BSE directory contracts, exact security IDs, shorthand/index aliases, escaped names and late searches | Dhan directory classifications and availability |
| NSE screener | Full universe, pagination, filters, saved list, quote batches, pause/resume, quota cooldown, reload locks and page races | Keep app open; process-scoped pacing; provider limits still apply |
| Strategy checks | Closed candles, 1H volume/range gates, 4H session aggregation, EMA/SMA requirements, separate sweeps and incomplete evidence | Lifetime ATH/full monthly alignment unavailable; no guaranteed fakeout elimination |
| Local alerts | Exact instrument, above/below threshold, duplicate prevention, fresh-only single trigger, persistence, clear and navigation races | Selected instrument on Strategy plans with auto-refresh; no closed-app/WhatsApp Indian alerts |
| Charts | Widget configuration, symbol mapping, native tool settings, expansion/Escape, retry and direct-symbol links | Restricted TradingView NSE data cannot be unlocked by this release; native browser rendering unverified |
| Other workspaces | Crypto, performance/learnings, Telegram, Japa and existing alerts regression suite | Tests use controlled provider responses |

## Install
Close the old Market Radar terminal, extract the complete ZIP into a new folder, then run Start Market Radar.cmd. Confirm build 2026.10.20.india.29. Dhan settings and crypto accounts/history stay in AppData/MarketRadar. Do not delete that data folder.
