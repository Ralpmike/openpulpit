import "server-only";

import { getLimits } from "@/lib/cloudflare";
import { deleteRecordingFile } from "@/modules/library/server/manage";

/** Recordings that count towards the free-tier limit: ready ones, hidden included (broadcasting-rules). */
const COUNTED = "status = 'ready'";

/** Pure: which recordings to delete to keep the newest `limit`. Input is newest first. */
export function recordingsOverLimit<T>(newestFirst: T[], limit: number): T[] {
  return newestFirst.slice(Math.max(0, limit));
}

/**
 * Free tier keeps the newest FREE_RECORDING_LIMIT (20) recordings per preacher
 * (requirement 22). Runs after a new recording becomes ready.
 */
export async function enforceRecordingLimit(env: CloudflareEnv, preacherId: string, limit = getLimits(env).freeRecordingLimit) {
  const { results } = await env.DB.prepare(
    `SELECT id, r2_key FROM recordings WHERE preacher_id = ? AND ${COUNTED} ORDER BY created_at DESC, id DESC`,
  )
    .bind(preacherId)
    .all<{ id: string; r2_key: string }>();
  const toDelete = recordingsOverLimit(results, limit);
  for (const recording of toDelete) {
    await deleteRecordingFile(env.DB, env.RECORDINGS, recording);
  }
  return toDelete.map((recording) => recording.id);
}

export interface RecordingLimitStatus {
  limit: number;
  count: number;
  /** The recording the next broadcast will push out, if the preacher is at the limit. */
  nextToGo: { id: string; title: string } | null;
}

export async function getRecordingLimitStatus(db: D1Database, preacherId: string, limit: number): Promise<RecordingLimitStatus> {
  const { results } = await db
    .prepare(`SELECT id, title FROM recordings WHERE preacher_id = ? AND ${COUNTED} ORDER BY created_at DESC, id DESC`)
    .bind(preacherId)
    .all<{ id: string; title: string }>();
  const nextToGo = results.length >= limit && limit > 0 ? results[limit - 1]! : null;
  return { limit, count: results.length, nextToGo };
}
