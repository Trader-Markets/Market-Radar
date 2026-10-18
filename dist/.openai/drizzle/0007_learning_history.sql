CREATE TABLE learning_jobs (id TEXT PRIMARY KEY NOT NULL, owner TEXT NOT NULL, account TEXT NOT NULL, payload TEXT NOT NULL, updated INTEGER NOT NULL, busy_until INTEGER NOT NULL DEFAULT 0);
CREATE INDEX learning_jobs_owner ON learning_jobs(owner,account,updated);
CREATE TABLE learning_records (owner TEXT NOT NULL, account TEXT NOT NULL, kind TEXT NOT NULL, record_id TEXT NOT NULL, at INTEGER NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(owner,account,kind,record_id));
CREATE INDEX learning_records_range ON learning_records(owner,account,at);
CREATE TABLE learning_notes (owner TEXT NOT NULL, account TEXT NOT NULL, order_id TEXT NOT NULL, label TEXT NOT NULL, note TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(owner,account,order_id));
