> Historical release notes. Superseded for Indian Markets by DHAN-MIGRATION.md.

# Chart screen update — chart.23

Indian markets now opens the official TradingView widget with native drawing and indicator toolbars. Stock search, instrument name, Open full TradingView, Expand chart and Strategy checks & plan remain visible. Chart source and help are collapsed; FYERS chart settings are collapsed inside the broker view. The broker OHLC readout remains next to its chart.

The widget uses TradingView data independently of FYERS. NSE/BSE embedding restrictions are controlled by TradingView and cannot be bypassed by this application. Script failure or a missing iframe after 15 seconds switches to the existing FYERS snapshot chart. Restrictions displayed inside an existing cross-origin iframe cannot be detected; use Open full TradingView or select FYERS data under Chart source & help.

FYERS history and quotes are fetched independently. A broker sign-in error no longer occupies the space above a working TradingView widget. Refresh, symbol and timeframe changes, drawing tools, provider switching and navigation cleanup remain available. No trading or account settings changed.

Verification: automated chart journeys cover the default widget, native toolbar configuration, expansion, source switching, missing-widget fallback, independent broker loading and cancellation. Browser rendering and a signed-in FYERS account were not verified in this environment.

For the Windows package, close the old Market Radar server, extract the complete new package and launch Start Market Radar.cmd. Confirm build 2026.10.20.chart.23. Existing account data remains in the existing AppData location.
