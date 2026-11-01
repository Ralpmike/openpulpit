-- Local seed: run with `npm run db:seed:local` after `npm run db:migrate:local`.
-- Fixed ids so it can be re-run (INSERT OR REPLACE). Sign in with the email
-- one-time code; in local development the code is printed in the server log.
PRAGMA foreign_keys = ON;

INSERT OR REPLACE INTO "user" (id, name, email, emailVerified, image, createdAt, updatedAt, role, status, termsVersion) VALUES
  ('00000000-0000-4000-8000-000000000001', 'FutureLabs Admin', 'admin@openpulpit.test', 1, NULL, '2026-10-01T08:00:00.000Z', '2026-10-01T08:00:00.000Z', 'admin', 'active', '2026-11-01'),
  ('00000000-0000-4000-8000-000000000101', 'Pastor Adebayo Ogunleye', 'adebayo@openpulpit.test', 1, NULL, '2026-10-02T08:00:00.000Z', '2026-10-02T08:00:00.000Z', 'preacher', 'active', '2026-11-01'),
  ('00000000-0000-4000-8000-000000000102', 'Rev. Chiamaka Eze', 'chiamaka@openpulpit.test', 1, NULL, '2026-10-03T08:00:00.000Z', '2026-10-03T08:00:00.000Z', 'preacher', 'active', '2026-11-01'),
  ('00000000-0000-4000-8000-000000000103', 'Evangelist Musa Danjuma', 'musa@openpulpit.test', 1, NULL, '2026-10-04T08:00:00.000Z', '2026-10-04T08:00:00.000Z', 'preacher', 'active', '2026-11-01'),
  ('00000000-0000-4000-8000-000000000201', 'Ngozi Okafor', 'ngozi@openpulpit.test', 1, NULL, '2026-10-05T08:00:00.000Z', '2026-10-05T08:00:00.000Z', 'listener', 'active', '2026-11-01'),
  ('00000000-0000-4000-8000-000000000202', 'Tunde Bakare', 'tunde@openpulpit.test', 1, NULL, '2026-10-06T08:00:00.000Z', '2026-10-06T08:00:00.000Z', 'listener', 'active', '2026-11-01');

INSERT OR REPLACE INTO preacher_profiles (user_id, slug, display_name, bio, ministry, state, city, denomination, is_verified, verified_at) VALUES
  ('00000000-0000-4000-8000-000000000101', 'adebayo-ogunleye', 'Pastor Adebayo Ogunleye', 'Teaching the Word with simplicity and power for over 20 years.', 'Living Word Chapel', 'Oyo', 'Ibadan', 'Pentecostal', 1, '2026-10-10T10:00:00.000Z'),
  ('00000000-0000-4000-8000-000000000102', 'chiamaka-eze', 'Rev. Chiamaka Eze', 'Prayer, worship and practical faith for families.', 'Grace Assembly International', 'Enugu', 'Enugu', 'Anglican', 0, NULL),
  ('00000000-0000-4000-8000-000000000103', 'musa-danjuma', 'Evangelist Musa Danjuma', 'Bringing the gospel to the North, one village at a time.', 'Light of the North Outreach', 'Kaduna', 'Zaria', '', 0, NULL);

INSERT OR REPLACE INTO broadcasts (id, preacher_id, title, description, bible_passage, status, ended_reason, created_at, started_at, ended_at, peak_listeners) VALUES
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000101', 'Walking in Faith', 'Sunday morning teaching.', 'Hebrews 11:1-6', 'ended', 'preacher', '2026-10-25T08:55:00.000Z', '2026-10-25T09:00:00.000Z', '2026-10-25T10:05:00.000Z', 214),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000101', 'The Prodigal Son', '', 'Luke 15:11-32', 'ended', 'preacher', '2026-10-28T17:55:00.000Z', '2026-10-28T18:00:00.000Z', '2026-10-28T18:45:00.000Z', 96),
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000102', 'Prayer for Families', 'Midweek prayer meeting.', 'Joshua 24:15', 'ended', 'preacher', '2026-10-29T19:55:00.000Z', '2026-10-29T20:00:00.000Z', '2026-10-29T20:50:00.000Z', 58);

INSERT OR REPLACE INTO recordings (id, broadcast_id, preacher_id, title, description, bible_passage, status, visibility, r2_key, duration_seconds, size_bytes, bitrate_kbps, replay_count, created_at, ready_at) VALUES
  ('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000101', 'Walking in Faith', 'Sunday morning teaching.', 'Hebrews 11:1-6', 'ready', 'public', 'recordings/00000000-0000-4000-8000-000000000101/00000000-0000-4000-8000-000000001001.ogg', 3900, 15600000, 32, 412, '2026-10-25T10:05:00.000Z', '2026-10-25T10:06:00.000Z'),
  ('00000000-0000-4000-8000-000000002002', '00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000101', 'The Prodigal Son', '', 'Luke 15:11-32', 'ready', 'public', 'recordings/00000000-0000-4000-8000-000000000101/00000000-0000-4000-8000-000000001002.ogg', 2700, 10800000, 32, 133, '2026-10-28T18:45:00.000Z', '2026-10-28T18:46:00.000Z'),
  ('00000000-0000-4000-8000-000000002003', '00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000102', 'Prayer for Families', 'Midweek prayer meeting.', 'Joshua 24:15', 'ready', 'public', 'recordings/00000000-0000-4000-8000-000000000102/00000000-0000-4000-8000-000000001003.ogg', 3000, 12000000, 32, 77, '2026-10-29T20:50:00.000Z', '2026-10-29T20:51:00.000Z');

INSERT OR REPLACE INTO follows (listener_id, preacher_id, notifications_enabled) VALUES
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', 1),
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000102', 0),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000101', 1);
