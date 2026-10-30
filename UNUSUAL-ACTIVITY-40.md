# Unusual Activity — build 40

Separate, opt-in review warnings in Crypto → Setups → Top 20 volume. Enable separate early warnings, then Start / refresh volume alerts. The scanner remains limited to the selected venue/quote top 20 by turnover. A coin outside that list is not monitored here.

## Implemented
Closed 5m, 15m, 30m and 1h candle checks, latest 5m volume at least 3× baseline, at least two aligned breakout frames, plus absolute contract-open-interest change at least 5% over a sampled 25–35 minute window or a funding outlier. Funding requires 12 earlier five-minute samples and sufficient elapsed history; its absolute native rate must exceed 3× sampled median and sampled 90th percentile. Funding indicates crowding, not direction. A stricter price/volume-only warning requires 5× volume and three aligned frames. These thresholds are heuristics, not calibrated predictive probabilities.

Delta REST ticker supplies contract OI and native funding. USD notional OI is never substituted. Samples are owner/venue/symbol scoped, retained up to 24h. Tickers older than 15 seconds or invalid/future timestamps cannot trigger warnings. Initial sampling warm-up is normal. Changing top-20 membership can prevent enough historical samples accumulating.

Bold title-only early warnings include direction, partial-data status and IST time. Evidence details explain missing components. Same-symbol/side warnings are deduplicated for 30 minutes. Early warnings contain no order plan and do not enter the existing final-confirmation WhatsApp delivery loop. Existing opted-in browser notifications and in-app alert centre may show them.

## Not completed
No verified market-wide liquidation feed is connected. Liquidation spikes are unavailable, never represented as zero. Shark derivative context is unavailable. Therefore the complete five-component request is not fulfilled. No historical IRYS reconstruction was performed and no Oct 22 detection or rally prediction is claimed. Price/volume frames do not guarantee fakeout elimination. No provider latency guarantee is made.

Closed-browser local operation requires the installed terminal process running and scanner enabled. Turning on early warnings alone does not start scanning. Existing WhatsApp final-hour confirmation settings remain unchanged.

## Verification
119 automated tests passed, zero failures/skips, using controlled providers and isolated storage. Nine targeted tests passed after the final title-format change. Browser preview verified panel visibility and rejected-save checkbox recovery; preview account APIs intentionally return unavailable. One real public BTCUSD ticker read verified presence of oi_contracts, funding_rate and timestamp; this is not end-to-end live signal acceptance. No customer trades, leverage, margin, recipients or keys changed. Prior acceptance blockers in ACCEPTANCE-2-TO-6-39.md remain unless expressly addressed above.
