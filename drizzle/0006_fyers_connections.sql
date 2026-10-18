CREATE TABLE IF NOT EXISTS market_connections (owner TEXT NOT NULL, broker TEXT NOT NULL, cipher TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(owner,broker));
