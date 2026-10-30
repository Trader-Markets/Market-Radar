# Direction label correction — build53, 30 October 2026

Customer screenshot: JCTUSD had a downside volume warning, price0.005585 below original level0.005659, but header said HOLDING BREAKOUT NOW. The directional price check was bearish already; the shared presentation label was wrong.

Holding downside warnings now display HOLDING BREAKDOWN NOW; holding upside warnings display HOLDING BREAKOUT NOW. Backend explanations explicitly say below the original breakdown level or above the original breakout level. Invalidation explanations use neutral original-range wording. Generic explanatory copy refers to the detected direction. No strategy thresholds, direction tests, risk/positions, timing, credentials, recipient settings or layout changes.

Verification:163automated full-suite checks passed,0failed,0skipped. New pure checks verify above/breakout vs below/breakdown explanations. Customer DOM tests reproduce the screenshot's JCTUSD values and require the breakdown header, then verify the upward header remains breakout. Existing scanner, freshness, retirement, owner and isolated localhostHTTP checks pass. No real broker trade or customer-machine acceptance test was performed.
