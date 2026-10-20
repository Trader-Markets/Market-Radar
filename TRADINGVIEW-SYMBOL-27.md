> Historical release notes. Superseded for Indian Markets by DHAN-MIGRATION.md.

# TradingView symbol handoff — 2026.10.20.tv.27

The owner supplied a screenshot of TradingView's notification for NSE:20MICRONS: the symbol is only available on TradingView. This is a provider widget/data restriction, not an unloaded script or the FYERS scanner quota error. It cannot be unlocked by retrying, changing the widget theme, buying a personal TradingView plan, or feeding FYERS data into the free widget.

Updated the chart header's generic external link to open the explicitly named, selected symbol on TradingView's chart page. For NSE:20MICRONS-EQ the URL is https://www.tradingview.com/chart/?symbol=NSE%3A20MICRONS . Manual exact TradingView-symbol entry updates the URL. Unknown broker contracts remain unmapped rather than being substituted. Symbol changes made privately inside TradingView's cross-origin widget cannot update this application shortcut; the link names the application-selected symbol explicitly.

Added a short persistent explanation of the provider's restriction and the stock link. The widget remains available and is not replaced by a custom chart or another exchange's symbol. All scanner fixes from build 26 remain included.

This is an external-chart handoff improvement, not a resolution of restricted NSE data inside the embedded chart. A complete in-app TradingView experience with a FYERS data feed requires access to the separate Advanced Charts library and an approved/licensed data integration. Those approvals/assets are not present here. The existing widget cannot provide that integration.

Reference: https://www.tradingview.com/widget-docs/faq/data/

Verification: 66 automated checks passed, including the exact 20 MICRONS URL, link labeling/security, manual-symbol updates, retained restriction guidance after iframe insertion, existing chart controls and navigation. No live TradingView account or browser rendering was verified. No orders, messages or credential changes.

Windows: close the old server terminal, extract the complete ZIP to a new folder and run Start Market Radar.cmd. Build: 2026.10.20.tv.27. Existing AppData/MarketRadar data stays in place.
