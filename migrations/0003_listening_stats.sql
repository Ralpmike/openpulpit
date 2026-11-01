-- module: broadcasting
-- Listener-seconds per broadcast, accumulated by the heartbeat (requirement 28
-- bandwidth totals); last_synced_at bounds each increment.
ALTER TABLE broadcasts ADD COLUMN listener_seconds INTEGER NOT NULL DEFAULT 0 CHECK (listener_seconds >= 0);
ALTER TABLE broadcasts ADD COLUMN last_synced_at TEXT;
