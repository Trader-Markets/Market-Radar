# Market Radar

## Start on Windows
1. Extract this ZIP into a folder. Node.js 24 must be installed.
2. Double-click `Start Market Radar.cmd`. It opens http://localhost:8787.
3. **Trade** opens first. The wallet amount available for a selected contract and current open positions appear with the chart. If an account is not connected, click **Connect / view account** and connect it under **My trades** once. Saved connections are restored on this Windows login.
4. On **Setups & alerts**, enter your balance, risk per trade and estimated costs. Choose the exchange and turnover filter above. Auto scan is on by default. Click **Enable browser alerts** and allow the browser request.

Leave the app window and browser open for scans and notifications. A sleeping or closed computer/browser cannot deliver timely alerts. Large Shark scans take longer because requests are paced to avoid rate limits. Closed-candle data is reused until the next candle closes.

## Saved accounts
Connections no longer expire after one hour. Restarting or extracting a newer version into another folder preserves saved accounts for the same computer user. On Windows, credentials are encrypted and the encryption key is protected by Windows DPAPI under your Windows login. Data is in `%LOCALAPPDATA%\MarketRadar`. Do not share this folder. On non-Windows systems the key and database are in `~/.market-radar` with restricted file permissions.

**Disconnect** removes the saved account credentials. It does not close positions or cancel orders on the exchange. Revoked keys, changed permissions or changed public IPs can interrupt access. Delta's allowed IP list must match the address used by this computer. Delta requires Trading permission for its positions/orders endpoints; the separate reviewed-order toggle in the app can remain off for viewing.

If upgrading from the old in-memory version, reconnect once after this update. Subsequent starts restore both accounts automatically. The hosted website and this local app are separate connections; use the local app for Delta's allowed-IP requirement.

## Trading and alerts
The **Place trade** button opens a final exchange review, then the confirmation sends a real limit order. The ticket reads available margin from the account wallet and calculates required margin from order value and leverage. You can leave order value empty for 0.5% risk sizing or use a preset. Set entry, stop and target; check the risk estimate. Review accepted orders and protective stops after submission. The app also supports stop/target requests, closing positions and cancelling orders under My trades. Turn on reviewed order actions in Connection settings to use those buttons. There is no withdrawal endpoint.

Setup alerts show forming versus confirmed setups, entry/stop/target and a risk calculation when a balance and valid contract rules are available. These are calculations, not guaranteed profits or win probabilities. Open trade plan to check the current price and order size before confirmation. Position alerts report when no stop is visible in returned open orders; verify actual coverage with the exchange.

The main sections are Trade, My trades, Setups & alerts, and All listings. Detailed calculations are collapsed below the trading screen. News, manual tracking and detailed calculation notes remain available in expandable sections. Account data refreshes every 10 seconds. There is no zero-delay or full broker parity guarantee.
