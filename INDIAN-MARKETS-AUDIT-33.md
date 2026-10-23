# Indian Markets audit — 23 October 2026

Build: 2026.10.23.india.33

## Reproduced and repaired
1. Account freshness: retrying holdings previously replaced the account-wide fetch time while retaining old positions. Responses and the UI now keep independent fetch times for positions, funds, orders, trades and holdings. A successful retry does not relabel other sections as refreshed.
2. Crossover history: a 50/200 SMA crossover needs 201 closed 4H candles to calculate both current and previous 200 SMA. Exactly 200 candles previously reported “No setup”; now the check is explicitly unavailable with the correct requirement.
3. One-hour confirmation: the shortened 15:15–15:30 Indian session-close candle could confirm a full 1H breakout. It is now excluded, and volume baselines use full hourly candles only. This is not a guarantee against all fakeouts.
4. Setup clarity: Settings now includes “Check market-data access”, separate from account/profile verification. It checks saved profile/client ID, historical candles and quotes, with an appropriate 60-second frontend deadline. Missing-plan/authentication errors are actionable; retry can recover after activation without deleting saved progress.

## Testing
- Baseline: 92 existing automated checks passed.
- Three new regression tests failed before the fixes and passed after them.
- Final full suite: 97 passed; zero failures, skipped or cancelled tests.
- Coverage includes owner/CSRF boundaries, encrypted connection persistence, Dhan error classification, directory parsing/redirect safety, exact instruments, scan pacing/cooldown/pause/resume, partial accounts and retries, source freshness, stock search/navigation, chart configuration/lifecycle, alerts, performance/learnings and other existing application journeys.
- Provider/account fixtures and isolated local HTTP tests were used. These results do not establish that all real-world failures are fixed. No real trades, token rotation, subscription purchases or outbound messages were performed.

## Remaining external checks
- Activate Dhan Data APIs, then use Indian Markets → More → Settings → Check market-data access in the updated app. The successful data-access check is distinct from fresh prices and individual strategy confirmations.
- Customer localhost tokens/data are not available to this workspace. Live account verification remains pending.
- TradingView widget restrictions remain: Nifty and TCS were previously browser-tested and rejected by TradingView. Sensex daily end-of-day candles, EMA and trend-line tools worked; no live intraday coverage is claimed for that feed. Buying Dhan Data APIs does not unlock TradingView widget data.
- Indian order submission, closed-app stock alerts, lifetime ATH confirmation and complete multi-timeframe alignment remain unavailable in this integration. Do not interpret them as tested/enabled features.

## Installation
Close the old Market Radar terminal. Extract the new ZIP to a new folder and run Start Market Radar.cmd. Confirm build 2026.10.23.india.33. Keep AppData/MarketRadar, which retains saved connections and history. Hosted and localhost connections remain separate.
