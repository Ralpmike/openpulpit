import "server-only";

import { conflict, notFound } from "@/lib/api";
import { newId } from "@/lib/ids";
import { requireAcceptedTerms, type Viewer } from "@/modules/accounts";
import type { ReportInput } from "@/modules/moderation/schemas/report";

/** The owner of what is being reported: for a profile the target id is its slug. */
async function resolveTarget(db: D1Database, input: Pick<ReportInput, "targetType" | "targetId">) {
  if (input.targetType === "profile") {
    const row = await db.prepare("SELECT user_id FROM preacher_profiles WHERE slug = ?").bind(input.targetId.toLowerCase()).first<{ user_id: string }>();
    return row ? { targetId: row.user_id, ownerId: row.user_id } : null;
  }
  const table = input.targetType === "broadcast" ? "broadcasts" : "recordings";
  const row = await db.prepare(`SELECT id, preacher_id FROM ${table} WHERE id = ?`).bind(input.targetId).first<{ id: string; preacher_id: string }>();
  return row ? { targetId: row.id, ownerId: row.preacher_id } : null;
}

/**
 * Any signed-in person can report a live broadcast, a recording or a profile,
 * with a reason (requirement 25). One open report per reporter and target.
 */
export async function createReport(db: D1Database, viewer: Viewer, input: ReportInput): Promise<{ id: string }> {
  requireAcceptedTerms(viewer);
  const target = await resolveTarget(db, input);
  if (!target) throw notFound("We couldn't find what you're reporting.");
  if (target.ownerId === viewer.id) throw conflict("You can't report your own content.");
  const id = newId();
  try {
    await db
      .prepare("INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, viewer.id, input.targetType, target.targetId, input.reason, input.details)
      .run();
  } catch (error) {
    if (String(error).includes("UNIQUE")) throw conflict("You've already reported this. Our team will review it.");
    throw error;
  }
  return { id };
}
