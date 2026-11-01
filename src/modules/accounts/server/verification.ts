import "server-only";

import { conflict, forbidden, notFound } from "@/lib/api";
import { newId, nowIso } from "@/lib/ids";
import { auditStatement } from "@/modules/admin";
import { getProfileByUserId } from "@/modules/accounts/server/repo";
import type { Viewer } from "@/modules/accounts/server/session";

export type VerificationStatus = "none" | "pending" | "verified" | "rejected";

export interface VerificationState {
  status: VerificationStatus;
  decisionNote: string;
}

interface RequestRow {
  id: string;
  preacher_id: string;
  status: "pending" | "approved" | "rejected";
  decision_note: string;
}

async function latestRequest(db: D1Database, preacherId: string) {
  return db
    .prepare(
      "SELECT id, preacher_id, status, decision_note FROM verification_requests WHERE preacher_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .bind(preacherId)
    .first<RequestRow>();
}

export async function getVerificationState(db: D1Database, viewer: Viewer): Promise<VerificationState> {
  const [profile, request] = await Promise.all([getProfileByUserId(db, viewer.id), latestRequest(db, viewer.id)]);
  if (profile?.is_verified) return { status: "verified", decisionNote: "" };
  if (!request) return { status: "none", decisionNote: "" };
  if (request.status === "pending") return { status: "pending", decisionNote: "" };
  return { status: request.status === "rejected" ? "rejected" : "none", decisionNote: request.decision_note };
}

/** A preacher asks for the verified badge (requirement 4). */
export async function requestVerification(db: D1Database, viewer: Viewer, message: string): Promise<{ id: string }> {
  if (viewer.role !== "preacher") throw forbidden("Only preachers can ask to be verified.");
  const profile = await getProfileByUserId(db, viewer.id);
  if (!profile) throw conflict("Set up your profile first.");
  if (profile.is_verified) throw conflict("You're already verified.");
  const id = newId();
  try {
    await db
      .prepare("INSERT INTO verification_requests (id, preacher_id, message) VALUES (?, ?, ?)")
      .bind(id, viewer.id, message)
      .run();
  } catch (error) {
    if (String(error).includes("UNIQUE")) throw conflict("Your request is already waiting for review.");
    throw error;
  }
  return { id };
}

export async function listPendingVerifications(db: D1Database, limit = 50) {
  const { results } = await db
    .prepare(
      `SELECT r.id, r.preacher_id, r.message, r.created_at, p.display_name, p.slug, p.ministry, p.city, p.state
         FROM verification_requests r JOIN preacher_profiles p ON p.user_id = r.preacher_id
        WHERE r.status = 'pending' ORDER BY r.created_at ASC LIMIT ?`,
    )
    .bind(limit)
    .all();
  return results;
}

/** An admin approves or rejects; the badge, the request and the audit row change together. */
export async function decideVerification(
  db: D1Database,
  admin: Viewer,
  input: { id: string; decision: "approve" | "reject"; reason: string },
): Promise<void> {
  const request = await db
    .prepare("SELECT id, preacher_id, status, decision_note FROM verification_requests WHERE id = ?")
    .bind(input.id)
    .first<RequestRow>();
  if (!request) throw notFound();
  if (request.status !== "pending") throw conflict("This request has already been decided.");
  const status = input.decision === "approve" ? "approved" : "rejected";
  const now = nowIso();
  const statements = [
    db
      .prepare(
        "UPDATE verification_requests SET status = ?, decision_note = ?, decided_at = ?, decided_by = ? WHERE id = ? AND status = 'pending'",
      )
      .bind(status, input.reason, now, admin.id, input.id),
    auditStatement(db, {
      actorId: admin.id,
      action: `verification.${status}`,
      targetType: "user",
      targetId: request.preacher_id,
      reason: input.reason,
      metadata: { requestId: input.id },
    }),
  ];
  if (status === "approved") {
    statements.push(
      db
        .prepare("UPDATE preacher_profiles SET is_verified = 1, verified_at = ?, updated_at = ? WHERE user_id = ?")
        .bind(now, now, request.preacher_id),
    );
  }
  await db.batch(statements);
}
