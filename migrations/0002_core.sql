-- OpenPulpit's own tables. Each table names the module that owns it; only that
-- module's server/repo.ts reads or writes it (see the d1-schema skill).
-- Timestamps are ISO-8601 UTC text. Durations are whole seconds, sizes whole bytes.

-- module: accounts -------------------------------------------------------------

CREATE TABLE preacher_profiles (
  user_id TEXT NOT NULL PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE CHECK (slug = lower(slug) AND length(slug) BETWEEN 3 AND 40),
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  ministry TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  denomination TEXT NOT NULL DEFAULT '',
  photo_key TEXT NOT NULL DEFAULT '',
  is_verified INTEGER NOT NULL DEFAULT 0 CHECK (is_verified IN (0, 1)),
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- A listener asking to become a preacher (requirement 2); an admin decides.
CREATE TABLE preacher_applications (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ministry TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  decided_at TEXT,
  decided_by TEXT
);
CREATE UNIQUE INDEX preacher_applications_one_pending ON preacher_applications (user_id) WHERE status = 'pending';
CREATE INDEX preacher_applications_queue ON preacher_applications (status, created_at);

-- A preacher asking for the verified badge (requirement 4); an admin decides.
CREATE TABLE verification_requests (
  id TEXT NOT NULL PRIMARY KEY,
  preacher_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT NOT NULL DEFAULT '',
  decision_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  decided_at TEXT,
  decided_by TEXT
);
CREATE UNIQUE INDEX verification_requests_one_pending ON verification_requests (preacher_id) WHERE status = 'pending';
CREATE INDEX verification_requests_queue ON verification_requests (status, created_at);

-- Preacher search (requirement 15): name, ministry, location, denomination.
CREATE VIRTUAL TABLE preacher_search USING fts5 (
  user_id UNINDEXED,
  display_name,
  ministry,
  location,
  denomination,
  tokenize = 'unicode61 remove_diacritics 2'
);
CREATE TRIGGER preacher_profiles_search_insert AFTER INSERT ON preacher_profiles BEGIN
  INSERT INTO preacher_search (user_id, display_name, ministry, location, denomination)
  VALUES (new.user_id, new.display_name, new.ministry, trim(new.city || ' ' || new.state), new.denomination);
END;
CREATE TRIGGER preacher_profiles_search_update AFTER UPDATE ON preacher_profiles BEGIN
  DELETE FROM preacher_search WHERE user_id = old.user_id;
  INSERT INTO preacher_search (user_id, display_name, ministry, location, denomination)
  VALUES (new.user_id, new.display_name, new.ministry, trim(new.city || ' ' || new.state), new.denomination);
END;
CREATE TRIGGER preacher_profiles_search_delete AFTER DELETE ON preacher_profiles BEGIN
  DELETE FROM preacher_search WHERE user_id = old.user_id;
END;

-- module: broadcasting --------------------------------------------------------

CREATE TABLE broadcasts (
  id TEXT NOT NULL PRIMARY KEY,
  preacher_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 120),
  description TEXT NOT NULL DEFAULT '',
  bible_passage TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'live', 'ended')),
  ended_reason TEXT NOT NULL DEFAULT '' CHECK (ended_reason IN ('', 'preacher', 'disconnected', 'hours_cap', 'admin', 'error')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  started_at TEXT,
  ended_at TEXT,
  -- Set when the preacher's track drops; cleared when it comes back (reconnect grace).
  publisher_left_at TEXT,
  -- Set once the 10-minutes-left warning has been sent for this broadcast.
  hours_warning_at TEXT,
  peak_listeners INTEGER NOT NULL DEFAULT 0 CHECK (peak_listeners >= 0),
  current_listeners INTEGER NOT NULL DEFAULT 0 CHECK (current_listeners >= 0),
  CHECK ((status = 'ended') = (ended_at IS NOT NULL)),
  CHECK (status = 'ready' OR started_at IS NOT NULL OR ended_reason <> '')
);
-- One live broadcast per preacher at a time.
CREATE UNIQUE INDEX broadcasts_one_live_per_preacher ON broadcasts (preacher_id) WHERE status = 'live';
CREATE INDEX broadcasts_live_now ON broadcasts (status, started_at);
CREATE INDEX broadcasts_preacher_month ON broadcasts (preacher_id, started_at);

-- module: library -------------------------------------------------------------

CREATE TABLE recordings (
  id TEXT NOT NULL PRIMARY KEY,
  broadcast_id TEXT NOT NULL UNIQUE REFERENCES broadcasts (id) ON DELETE CASCADE,
  preacher_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 120),
  description TEXT NOT NULL DEFAULT '',
  bible_passage TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed', 'deleted')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'hidden_by_preacher', 'hidden_by_admin')),
  r2_key TEXT NOT NULL,
  egress_id TEXT UNIQUE,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  bitrate_kbps INTEGER NOT NULL DEFAULT 32 CHECK (bitrate_kbps > 0),
  replay_count INTEGER NOT NULL DEFAULT 0 CHECK (replay_count >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ready_at TEXT,
  deleted_at TEXT
);
CREATE INDEX recordings_preacher_recent ON recordings (preacher_id, status, created_at);
CREATE INDEX recordings_public_recent ON recordings (status, visibility, created_at);

-- One replay counted per listener per recording per day (requirement 29).
CREATE TABLE replays (
  recording_id TEXT NOT NULL REFERENCES recordings (id) ON DELETE CASCADE,
  listener_key TEXT NOT NULL,
  day TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (recording_id, listener_key, day)
);

-- Resume where a signed-in listener stopped (requirement 21).
CREATE TABLE playback_positions (
  user_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  recording_id TEXT NOT NULL REFERENCES recordings (id) ON DELETE CASCADE,
  position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, recording_id)
);
CREATE INDEX playback_positions_recording ON playback_positions (recording_id);

-- module: social --------------------------------------------------------------

CREATE TABLE follows (
  listener_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  preacher_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  notifications_enabled INTEGER NOT NULL DEFAULT 1 CHECK (notifications_enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (listener_id, preacher_id),
  CHECK (listener_id <> preacher_id)
);
CREATE INDEX follows_preacher ON follows (preacher_id, notifications_enabled);

-- A preacher blocking a listener (requirement 27).
CREATE TABLE blocks (
  preacher_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  listener_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (preacher_id, listener_id)
);
CREATE INDEX blocks_listener ON blocks (listener_id);

CREATE TABLE push_subscriptions (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_used_at TEXT
);
CREATE INDEX push_subscriptions_user ON push_subscriptions (user_id);

-- One go-live notification per broadcast, whatever retries or reconnects happen.
CREATE TABLE notifications_sent (
  broadcast_id TEXT NOT NULL PRIMARY KEY REFERENCES broadcasts (id) ON DELETE CASCADE,
  claimed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  recipient_count INTEGER NOT NULL DEFAULT 0
);

-- module: moderation ----------------------------------------------------------

CREATE TABLE reports (
  id TEXT NOT NULL PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('broadcast', 'recording', 'profile')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('hate_speech', 'violence', 'harassment', 'fraud_or_scam', 'illegal', 'other')),
  details TEXT NOT NULL DEFAULT '' CHECK (length(details) <= 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'actioned', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resolved_at TEXT,
  resolved_by TEXT
);
CREATE UNIQUE INDEX reports_one_open_per_reporter ON reports (reporter_id, target_type, target_id) WHERE status = 'open';
CREATE INDEX reports_queue ON reports (status, created_at);
CREATE INDEX reports_target ON reports (target_type, target_id);

-- module: admin ---------------------------------------------------------------

-- Every admin action (requirement 26). Append-only: no updates or deletes, ever.
-- actor_id and target_id are plain ids (no foreign keys) so history survives account deletion.
CREATE TABLE audit_log (
  id TEXT NOT NULL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  metadata TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX audit_log_recent ON audit_log (created_at);
CREATE INDEX audit_log_target ON audit_log (target_type, target_id);
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only');
END;
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only');
END;

-- Platform totals for the admin stats page (requirement 28), one row per Lagos day.
CREATE TABLE daily_stats (
  day TEXT NOT NULL PRIMARY KEY,
  broadcast_seconds INTEGER NOT NULL DEFAULT 0,
  listen_seconds INTEGER NOT NULL DEFAULT 0,
  bandwidth_bytes INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- platform: rate limits for public routes (listen tokens, sign-up codes).
-- Keys are salted hashes; rows expire with their window.
CREATE TABLE rate_limits (
  key TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
