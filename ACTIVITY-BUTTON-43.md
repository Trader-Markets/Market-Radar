# Activity start-button fix — build 43

Start is disabled during the start request and while server-saved scanner plus early-warning settings are enabled. It displays Starting… then Continuous scan enabled, with an explicit grey disabled style. Completing one bounded batch no longer re-enables it. Pause restores Start. Failed saved jobs expose Retry continuous scan. A rejected start restores an actionable button and preserves the error message. No exchange authentication, scanner thresholds, subscriptions or order behaviour changed.

Three targeted suites passed: customer DOM journey (enabled across rerender, pause, rejected start, failed-job retry), Worker asset/routes checks and local startup/version checks. Browser preview verified the rejected-start error and settled available button; preview cannot verify real exchange connections. Prior live feed/hosted collector limits remain unchanged. Public Binance/Bybit liquidation feeds do not require account login or API keys.
