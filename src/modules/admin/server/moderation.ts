import "server-only";

import { badRequest, conflict, notFound } from "@/lib/api";
import { nowIso } from "@/lib/ids";
import type { Viewer } from "@/modules/accounts";
import type { AdminActionInput } from "@/modules/admin/schemas/actions";
import { auditStatement } from "@/modules/admin/server/audit";
import { afterBroadcastEnded, endBroadcastStatement } from "@/modules/broadcasting/server/lifecycle";

/** Open reports about a target become "actioned" (or "dismissed") with the admin action, in the same batch. */
function resolveReportsStatement(db: D1Database, admin: Viewer, targetType: string, targetId: string, status: "actioned" | "dismissed") {
  return db
    .prepare(
      "UPDATE reports SET status = ?, resolved_at = ?, resolved_by = ? WHERE target_type = ? AND target_id = ? AND status = 'open'",
    )
    .bind(status, nowIso(), admin.id, targetType, targetId);
}

/**
 * Every admin action (requirement 26): role re-checked by the route, the
 * change and its audit_log row in ONE batch, related open reports resolved.
 */
export async function runAdminAction(env: CloudflareEnv, admin: Viewer, input: AdminActionInput): Promise<{ changed: boolean }> {
  const db = env.DB;
  const audit = (targetType: string, targetId: string, metadata: Record<string, unknown> = {}) =>
    auditStatement(db, { actorId: admin.id, action: input.action, targetType, targetId, reason: input.reason, metadata });

  switch (input.action) {
    case "end_broadcast": {
      const broadcast = await db.prepare("SELECT id, status FROM broadcasts WHERE id = ?").bind(input.targetId).first<{ id: string; status: string }>();
      if (!broadcast) throw notFound("Broadcast not found.");
      if (broadcast.status === "ended") throw conflict("This broadcast has already ended.");
      const [ended] = await db.batch([
        endBroadcastStatement(db, broadcast.id, "admin"),
        // Its recording is hidden by an admin, whatever state it's in.
        db.prepare("UPDATE recordings SET visibility = 'hidden_by_admin' WHERE broadcast_id = ?").bind(broadcast.id),
        resolveReportsStatement(db, admin, "broadcast", broadcast.id, "actioned"),
        audit("broadcast", broadcast.id),
      ]);
      // Drops the preacher and listeners at once, stops the recording.
      if (ended?.meta.changes) await afterBroadcastEnded(env, broadcast.id);
      return { changed: Boolean(ended?.meta.changes) };
    }
    case "hide_recording":
    case "unhide_recording": {
      const recording = await db.prepare("SELECT id, broadcast_id FROM recordings WHERE id = ? AND status <> 'deleted'").bind(input.targetId).first<{ id: string; broadcast_id: string }>();
      if (!recording) throw notFound("Recording not found.");
      const visibility = input.action === "hide_recording" ? "hidden_by_admin" : "public";
      const [updated] = await db.batch([
        db.prepare("UPDATE recordings SET visibility = ? WHERE id = ?").bind(visibility, recording.id),
        resolveReportsStatement(db, admin, "recording", recording.id, "actioned"),
        audit("recording", recording.id, { visibility }),
      ]);
      return { changed: Boolean(updated?.meta.changes) };
    }
    case "warn_user":
    case "suspend_user":
    case "ban_user":
    case "restore_user": {
      const user = await db.prepare(`SELECT id, role FROM "user" WHERE id = ?`).bind(input.targetId).first<{ id: string; role: string }>();
      if (!user) throw notFound("Account not found.");
      if (user.role === "admin") throw badRequest("Admins can't be moderated here.");
      const status = { warn_user: "warned", suspend_user: "suspended", ban_user: "banned", restore_user: "active" }[input.action];
      const isRemoving = status === "suspended" || status === "banned";
      const live = isRemoving
        ? await db.prepare("SELECT id FROM broadcasts WHERE preacher_id = ? AND status = 'live'").bind(user.id).first<{ id: string }>()
        : null;
      const statements = [
        db.prepare(`UPDATE "user" SET status = ?, updatedAt = ? WHERE id = ?`).bind(status, nowIso(), user.id),
        resolveReportsStatement(db, admin, "profile", user.id, "actioned"),
        audit("user", user.id, { status, endedBroadcast: live?.id ?? null }),
      ];
      // Suspended and banned: signed out everywhere, and a live broadcast ends at once.
      if (isRemoving) statements.push(db.prepare("DELETE FROM session WHERE userId = ?").bind(user.id));
      if (live) statements.push(endBroadcastStatement(db, live.id, "admin"));
      await db.batch(statements);
      if (live) await afterBroadcastEnded(env, live.id);
      return { changed: true };
    }
    case "dismiss_reports": {
      const [targetType, targetId] = input.targetId.split(":");
      if (!targetType || !targetId || !["broadcast", "recording", "profile"].includes(targetType)) throw badRequest("Unknown report target.");
      const [updated] = await db.batch([
        resolveReportsStatement(db, admin, targetType, targetId, "dismissed"),
        audit(targetType === "profile" ? "user" : targetType, targetId, { dismissed: true }),
      ]);
      return { changed: Boolean(updated?.meta.changes) };
    }
  }
}
