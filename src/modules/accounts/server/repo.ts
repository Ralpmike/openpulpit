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
