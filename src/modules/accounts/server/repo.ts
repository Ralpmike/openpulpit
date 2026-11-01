import "server-only";

import type { UserRole } from "@/modules/accounts/server/authSchema";

export interface AccountRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  createdAt: string;
  hasPreacherProfile: number;
}

export interface PreacherApplicationRow {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  ministry: string;
  note: string;
  created_at: string;
  decided_at: string | null;
}

export async function getAccount(db: D1Database, userId: string): Promise<AccountRow | null> {
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.createdAt,
              EXISTS (SELECT 1 FROM preacher_profiles p WHERE p.user_id = u.id) AS hasPreacherProfile
         FROM "user" u WHERE u.id = ?`,
    )
    .bind(userId)
    .first<AccountRow>();
}

/** Listener → preacher, only if still a listener (compare-and-set). */
export function setRoleStatement(db: D1Database, userId: string, from: UserRole, to: UserRole) {
  return db
    .prepare(`UPDATE "user" SET role = ?, updatedAt = ? WHERE id = ? AND role = ?`)
    .bind(to, new Date().toISOString(), userId, from);
}

export async function latestApplication(db: D1Database, userId: string): Promise<PreacherApplicationRow | null> {
  return db
    .prepare(
      `SELECT id, user_id, status, ministry, note, created_at, decided_at
         FROM preacher_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(userId)
    .first<PreacherApplicationRow>();
}

export async function insertApplication(
  db: D1Database,
  application: { id: string; userId: string; ministry: string; note: string },
): Promise<void> {
  await db
    .prepare("INSERT INTO preacher_applications (id, user_id, ministry, note) VALUES (?, ?, ?, ?)")
    .bind(application.id, application.userId, application.ministry, application.note)
    .run();
}

export async function getApplication(db: D1Database, id: string): Promise<PreacherApplicationRow | null> {
  return db
    .prepare("SELECT id, user_id, status, ministry, note, created_at, decided_at FROM preacher_applications WHERE id = ?")
    .bind(id)
    .first<PreacherApplicationRow>();
}

export async function listPendingApplications(db: D1Database, limit = 50) {
  const { results } = await db
    .prepare(
      `SELECT a.id, a.user_id, a.ministry, a.note, a.created_at, u.name, u.email
         FROM preacher_applications a JOIN "user" u ON u.id = a.user_id
        WHERE a.status = 'pending' ORDER BY a.created_at ASC LIMIT ?`,
    )
    .bind(limit)
    .all<{ id: string; user_id: string; ministry: string; note: string; created_at: string; name: string; email: string }>();
  return results;
}

export function decideApplicationStatement(
  db: D1Database,
  decision: { id: string; status: "approved" | "rejected"; adminId: string },
) {
  return db
    .prepare(
      `UPDATE preacher_applications SET status = ?, decided_at = ?, decided_by = ?
        WHERE id = ? AND status = 'pending'`,
    )
    .bind(decision.status, new Date().toISOString(), decision.adminId, decision.id);
}

export interface PreacherProfileRow {
  user_id: string;
  slug: string;
  display_name: string;
  bio: string;
  ministry: string;
  state: string;
  city: string;
  denomination: string;
  photo_key: string;
  is_verified: number;
}

const PROFILE_COLUMNS =
  "p.user_id, p.slug, p.display_name, p.bio, p.ministry, p.state, p.city, p.denomination, p.photo_key, p.is_verified";

export async function getProfileByUserId(db: D1Database, userId: string): Promise<PreacherProfileRow | null> {
  return db.prepare(`SELECT ${PROFILE_COLUMNS} FROM preacher_profiles p WHERE p.user_id = ?`).bind(userId).first();
}

/** Public lookup: only preachers in good standing are shown. */
export async function getPublicProfileBySlug(db: D1Database, slug: string): Promise<PreacherProfileRow | null> {
  return db
    .prepare(
      `SELECT ${PROFILE_COLUMNS} FROM preacher_profiles p JOIN "user" u ON u.id = p.user_id
        WHERE p.slug = ? AND u.role IN ('preacher', 'admin') AND u.status IN ('active', 'warned')`,
    )
    .bind(slug)
    .first();
}

export async function isSlugTaken(db: D1Database, slug: string, exceptUserId: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS taken FROM preacher_profiles WHERE slug = ? AND user_id <> ?")
    .bind(slug, exceptUserId)
    .first();
  return Boolean(row);
}

export async function upsertProfile(
  db: D1Database,
  userId: string,
  profile: { displayName: string; slug: string; ministry: string; state: string; city: string; denomination: string; bio: string },
): Promise<void> {
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO preacher_profiles (user_id, slug, display_name, bio, ministry, state, city, denomination, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET slug = excluded.slug, display_name = excluded.display_name,
           bio = excluded.bio, ministry = excluded.ministry, state = excluded.state, city = excluded.city,
           denomination = excluded.denomination, updated_at = excluded.updated_at`,
      )
      .bind(userId, profile.slug, profile.displayName, profile.bio, profile.ministry, profile.state, profile.city, profile.denomination, now),
    db.prepare(`UPDATE "user" SET name = ?, updatedAt = ? WHERE id = ?`).bind(profile.displayName, now, userId),
  ]);
}

export function setPhotoKeyStatement(db: D1Database, userId: string, photoKey: string) {
  return db
    .prepare("UPDATE preacher_profiles SET photo_key = ?, updated_at = ? WHERE user_id = ?")
    .bind(photoKey, new Date().toISOString(), userId);
}
