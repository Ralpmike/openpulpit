-- module: admin
-- One alert per metric per Lagos day (cost monitoring, OP-41).
CREATE TABLE cost_alerts (
  day TEXT NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('bandwidth', 'livekit_minutes', 'failed_recordings')),
  value REAL NOT NULL,
  threshold REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (day, metric)
);
