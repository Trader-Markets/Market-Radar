> Historical release notes. Superseded for Indian Markets by DHAN-MIGRATION.md.

# Indian chart drawing tools

Build `2026.10.20.draw.22`

Open **Indian markets → Chart & stock search**, select a stock and use the **FYERS data** view. A **Draw** selector appears above the broker chart once candles load. These tools are also available after loading the chart in **Strategy plans**.

## Tools

- Horizontal price level: choose the tool and click a price.
- Trend line / trend ray: click the first candle and price, then a second candle and price. Rays extend toward the second anchor's direction.
- Consolidation zone: click two opposite corners.
- Fibonacci retracement: two anchors produce 0, .236, .382, .5, .618, .786 and 1 levels. Levels follow the direction of the anchors.
- Measure price move: two anchors show price difference, percentage change and elapsed calendar hours.
- Select / adjust: click a drawing, drag an endpoint, or choose Delete selected. Horizontal levels can be dragged from the line itself. Whole-object dragging, text notes and alerts attached to drawings are not included.
- Undo, redo and Clear this chart. Clear can be undone. Colour and line width are in Drawing options.
- Pan / zoom returns normal chart gestures. Completing a new drawing returns to pan mode. Escape cancels a drawing/drag; Delete removes the selected drawing while the drawing surface or toolbar has keyboard focus.

Anchors use the actual loaded candle timestamps and prices, with x positions snapped to candles. The second anchor of a line/ray/Fibonacci/measurement must use a different candle. Drawing outside the loaded candle area is rejected; use the ray tool to extend from loaded anchors. Drawings outside available history may be hidden until their anchor candles are loaded again. Up to 100 drawings per instrument/timeframe are saved in this browser. They remain separate across stock symbols and timeframes; styles and candle refreshes retain them. Recent edit history survives chart rebuilds within the page; a browser reload restores drawings but resets undo history. Storage failures are shown, with drawings then retained only for the page session. Hosted and localhost browser storage is separate.

## Additional chart controls

The main broker chart now has full-screen/exit controls (Escape exits), candle OHLC/volume readouts as you move the crosshair, regular/logarithmic price scale, and a combined EMA 20/50/200 option. EMA values use loaded candles; a period without sufficient candles is omitted. Existing candles/line, volume, timeframe, fit and zoom controls remain available.

These are Market Radar drawing tools over FYERS candles using TradingView Lightweight Charts. The full TradingView platform remains available through the external chart link. This release does not add TradingView's complete indicator library, Pine Script, its proprietary drawing set or broker-order execution. Drawings are visual annotations and do not place orders or protective stops.

## Verification

Tests cover all six drawing types, timestamp/price anchoring across a session gap, pan and price-scale reprojection, endpoint adjustment, undo/redo/delete/clear, chart rebuilds and browser-storage restore, stock/timeframe isolation, cancellation and invalid second anchors, storage failure and cleanup. Boundary tests verify that both the main chart and Strategy Plans attach/detach tools correctly. Fullscreen exit, OHLC readouts, asset packaging and existing chart flows are checked. No live orders were used. Actual visual browser verification remains unavailable in this environment.
