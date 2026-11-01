import "server-only";

import type { AuditRow, ReportGroup } from "@/modules/admin/models";

/** Open reports grouped by what they're about, most reported first (requirement 26). */
export async function listOpenReportGroups(db: D1Database, limit = 50): Promise<ReportGroup[]> {
  const { results } = await db
    .prepare(
      `SELECT r.target_type, r.target_id, count(*) AS report_count, group_concat(DISTINCT r.reason) AS reasons,
              max(r.created_at) AS latest_at,
              (SELECT details FROM reports x WHERE x.target_type = r.target_type AND x.target_id = r.target_id AND x.status = 'open' AND x.details <> '' ORDER BY created_at DESC LIMIT 1) AS latest_details
         FROM reports r WHERE r.status = 'open'
        GROUP BY r.target_type, r.target_id
        ORDER BY report_count DESC, latest_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all<{ target_type: ReportGroup["targetType"]; target_id: string; report_count: number; reasons: string; latest_at: string; latest_details: string | null }>();

  const groups: ReportGroup[] = [];
  for (const row of results) {
    let details: Pick<ReportGroup, "title" | "preacherId" | "preacherName" | "preacherStatus" | "state" | "link">;
    if (row.target_type === "profile") {
      const profile = await db
        .prepare(`SELECT p.display_name, p.slug, u.status FROM "user" u LEFT JOIN preacher_profiles p ON p.user_id = u.id WHERE u.id = ?`)
        .bind(row.target_id)
        .first<{ display_name: string | null; slug: string | null; status: string }>();
      details = {
        title: profile?.display_name ?? "Account",
        preacherId: row.target_id,
        preacherName: profile?.display_name ?? "",
        preacherStatus: profile?.status ?? "",
        state: profile?.status ?? "gone",
        link: profile?.slug ? `/p/${profile.slug}` : null,
      };
    } else {
      const table = row.target_type === "broadcast" ? "broadcasts" : "recordings";
      const stateColumn = row.target_type === "broadcast" ? "t.status" : "t.status || ':' || t.visibility";
      const item = await db
        .prepare(
          `SELECT t.title, t.preacher_id, ${stateColumn} AS state, p.display_name, u.status AS preacher_status
             FROM ${table} t JOIN "user" u ON u.id = t.preacher_id LEFT JOIN preacher_profiles p ON p.user_id = t.preacher_id WHERE t.id = ?`,
        )
        .bind(row.target_id)
        .first<{ title: string; preacher_id: string; state: string; display_name: string | null; preacher_status: string }>();
      details = {
        title: item?.title ?? "(removed)",
        preacherId: item?.preacher_id ?? null,
        preacherName: item?.display_name ?? "",
        preacherStatus: item?.preacher_status ?? "",
        state: item?.state ?? "gone",
        link: item ? (row.target_type === "broadcast" ? `/live/${row.target_id}` : `/r/${row.target_id}`) : null,
      };
    }
    groups.push({
      targetType: row.target_type,
      targetId: row.target_id,
      reportCount: row.report_count,
      reasons: row.reasons.split(","),
      latestDetails: row.latest_details ?? "",
      latestAt: row.latest_at,
      ...details,
    });
  }
  return groups;
}

export async function listAuditLog(db: D1Database, { before, limit = 50 }: { before?: string; limit?: number } = {}): Promise<AuditRow[]> {
  const { results } = await db
    .prepare(
      `SELECT a.id, coalesce(u.name, a.actor_id) AS actor_name, a.action, a.target_type, a.target_id, a.reason, a.created_at
         FROM audit_log a LEFT JOIN "user" u ON u.id = a.actor_id
        WHERE (?1 IS NULL OR a.created_at < ?1) ORDER BY a.created_at DESC LIMIT ?2`,
    )
    .bind(before ?? null, limit)
    .all<{ id: string; actor_name: string; action: string; target_type: string; target_id: string; reason: string; created_at: string }>();
  return results.map((row) => ({
    id: row.id,
    actorName: row.actor_name,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}
