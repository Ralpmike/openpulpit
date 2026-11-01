import "server-only";

import { newId } from "@/lib/ids";

export interface AuditEntry {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * The audit_log INSERT for an admin action. Always run it in the same
 * db.batch() as the action itself, so no action lands without its record.
 */
export function auditStatement(db: D1Database, entry: AuditEntry): D1PreparedStatement {
  return db
    .prepare(
      "INSERT INTO audit_log (id, actor_id, action, target_type, target_id, reason, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      newId(),
      entry.actorId,
      entry.action,
      entry.targetType,
      entry.targetId,
      entry.reason ?? "",
      JSON.stringify(entry.metadata ?? {}),
    );
}
