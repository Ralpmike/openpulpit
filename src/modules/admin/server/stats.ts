import "server-only";

import { lagosDay } from "@/helpers/time/lagos";
import type { PlatformStats } from "@/modules/admin/models";

/** Adds to today's (Lagos) platform totals. One UPSERT; safe from many places at once. */
export function addDailyStatsStatement(
  db: D1Database,
  add: { broadcastSeconds?: number; listenSeconds?: number; bandwidthBytes?: number },
  now: Date = new Date(),
) {
  return db
    .prepare(
      `INSERT INTO daily_stats (day, broadcast_seconds, listen_seconds, bandwidth_bytes, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT (day) DO UPDATE SET broadcast_seconds = broadcast_seconds + ?2, listen_seconds = listen_seconds + ?3,
         bandwidth_bytes = bandwidth_bytes + ?4, updated_at = ?5`,
    )
    .bind(
      lagosDay(now),
      Math.round(add.broadcastSeconds ?? 0),
      Math.round(add.listenSeconds ?? 0),
      Math.round(add.bandwidthBytes ?? 0),
      now.toISOString(),
    );
}

const GB = 1_000_000_000;

/** Requirement 28, from stored totals (never recomputed from LiveKit on page load). */
export async function getPlatformStats(db: D1Database, { days = 14 }: { days?: number } = {}): Promise<PlatformStats> {
  const [totals, daily] = await db.batch([
    db.prepare(
      `SELECT
         (SELECT count(*) FROM "user" WHERE role = 'preacher') AS preachers,
         (SELECT count(*) FROM "user" WHERE role = 'listener') AS listeners,
         (SELECT count(*) FROM broadcasts WHERE started_at IS NOT NULL) AS broadcasts,
         (SELECT count(*) FROM broadcasts WHERE status = 'live') AS live_now,
         (SELECT coalesce(sum(CAST((julianday(coalesce(ended_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))) - julianday(started_at)) * 86400 AS INTEGER)), 0)
            FROM broadcasts WHERE started_at IS NOT NULL) AS broadcast_seconds,
         (SELECT coalesce(sum(listen_seconds), 0) FROM daily_stats) AS listen_seconds,
         (SELECT coalesce(sum(bandwidth_bytes), 0) FROM daily_stats) AS bandwidth_bytes`,
    ),
    db.prepare("SELECT day, broadcast_seconds, listen_seconds, bandwidth_bytes FROM daily_stats ORDER BY day DESC LIMIT ?").bind(days),
  ]);
  const t = (totals!.results as Record<string, number>[])[0]!;
  const round = (value: number, places = 1) => Math.round(value * 10 ** places) / 10 ** places;
  return {
    preachers: t.preachers!,
    listeners: t.listeners!,
    broadcasts: t.broadcasts!,
    liveNow: t.live_now!,
    hoursStreamed: round(t.broadcast_seconds! / 3600),
    listenHours: round(t.listen_seconds! / 3600),
    bandwidthGb: round(t.bandwidth_bytes! / GB, 2),
    days: (daily!.results as { day: string; broadcast_seconds: number; listen_seconds: number; bandwidth_bytes: number }[]).map((row) => ({
      day: row.day,
      broadcastHours: round(row.broadcast_seconds / 3600),
      listenHours: round(row.listen_seconds / 3600),
      bandwidthGb: round(row.bandwidth_bytes / GB, 2),
    })),
  };
}
