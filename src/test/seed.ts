import type { TestD1 } from "@/test/d1";
import { insertUser } from "@/test/d1";

/** A preacher with a profile, for module tests. */
export function seedPreacher(db: TestD1, id: string, { slug = `pastor-${id}`, name = `Pastor ${id}`, isVerified = false, status = "active" } = {}) {
  insertUser(db, { id, role: "preacher", name, status });
  db.sqlite
    .prepare("INSERT INTO preacher_profiles (user_id, slug, display_name, ministry, state, city, is_verified) VALUES (?, ?, ?, 'Grace Chapel', 'Lagos', 'Ikeja', ?)")
    .run(id, slug, name, isVerified ? 1 : 0);
}

/** An ended broadcast with a recording. */
export function seedRecording(
  db: TestD1,
  id: string,
  preacherId: string,
  { status = "ready", visibility = "public", createdAt = "2026-11-01T10:00:00.000Z", title = `Sermon ${id}` } = {},
) {
  db.sqlite
    .prepare(
      "INSERT INTO broadcasts (id, preacher_id, title, status, ended_reason, started_at, ended_at) VALUES (?, ?, ?, 'ended', 'preacher', ?, ?)",
    )
    .run(`b-${id}`, preacherId, title, createdAt, createdAt);
  db.sqlite
    .prepare(
      "INSERT INTO recordings (id, broadcast_id, preacher_id, title, status, visibility, r2_key, duration_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1800, ?)",
    )
    .run(id, `b-${id}`, preacherId, title, status, visibility, `recordings/${preacherId}/b-${id}.ogg`, createdAt);
}
