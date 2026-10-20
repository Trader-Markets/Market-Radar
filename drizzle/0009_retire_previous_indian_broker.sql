-- Retire the removed broker connection only. Crypto accounts and trade history are unaffected.
DELETE FROM market_connections WHERE broker='fyers';
