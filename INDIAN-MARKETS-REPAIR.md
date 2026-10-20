> Historical release notes. Superseded for Indian Markets by DHAN-MIGRATION.md.

# Indian markets usability repair — india.15

19 October 2026 (IST)

## Customer journey

1. Open Indian markets. The connection bar remains visible across chart, account, strategy and settings views.
2. Connect / reconnect FYERS opens a numbered three-step setup. The exact App ID (-200 or -100), matching secret and registered redirect URL are used.
3. Save app, start sign-in and open the FYERS login link. Paste the full redirected URL into step 3 and complete connection.
4. A Connection ready button opens the FYERS-fed chart. The connection bar also opens the chart or account directly.
5. Check connection verifies profile access now. Failures keep the saved app and leave reconnect accessible. A saved token is not described as proof that every permission or live feed works.

## Changes

- Persistent connection/reconnect/check/chart/account actions on every Indian panel, including failed chart/account views.
- Local server build and environment shown so customers can see whether they are using an old local process or the separate hosted connection.
- Three-step setup and a direct chart handoff after successful connection.
- Nifty 50, Nifty Bank and Sensex overview shortcuts open the matching broker chart instrument.
- Index source-age updates retain points instead of changing back to a rupee label.
- The previous FYERS chart and all earlier repairs are included. No real-order feature was enabled.

## Evidence

51 automated runner tests across 48 files passed. A new assembled Indian-market journey test exercises: disconnected status; save -200 app; sign-in link; callback completion; broker-fed chart load; account view; expired verification; reconnect with saved App ID; index shortcut; source-age label update. Secrets and callback fields clear after submission. Responses are controlled fixtures; no real FYERS credentials or orders were used.

Actual customer account permissions/IP and browser pixel rendering remain unverified. The full Advanced Charts/FYERS-terminal feature limits in FYERS-CHART-CAPABILITIES.md still apply. This update improves navigation/recovery and does not certify complete broker-platform parity.

## Install once

Close the OLD Market Radar terminal (not just the browser). Extract this complete ZIP and run Start Market Radar.cmd. Open Indian markets and check the local build reads 2026.10.19.india.15. Existing saved account data remains in AppData MarketRadar, outside this folder.
