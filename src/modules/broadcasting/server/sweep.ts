import "server-only";

import { syncBroadcast } from "@/modules/broadcasting/server/lifecycle";

/** A live broadcast with no heartbeat for this long gets checked by the cron. */
const STALE_AFTER_SECONDS = 3 * 60;

/**
 * Safety net (cron, every 15 minutes): broadcasts whose preacher app stopped
 * sending heartbeats are re-synced, so the hours cap still applies, and ended
 * with "disconnected" once the preacher has been gone longer than the grace.
 */
export async function sweepLiveBroadcasts(env: CloudflareEnv, now: Date = new Date()): Promise<{ checked: number; ended: number }> {
  const staleBefore = new Date(now.getTime() - STALE_AFTER_SECONDS * 1000).toISOString();
  const { results } = await env.DB.prepare(
    "SELECT id FROM broadcasts WHERE status = 'live' AND coalesce(last_synced_at, started_at) < ? LIMIT 50",
  )
    .bind(staleBefore)
    .all<{ id: string }>();
  let ended = 0;
  for (const { id } of results) {
    // syncBroadcast ends it ("disconnected", at the time the preacher left) once past the grace.
    const result = await syncBroadcast(env, id, now);
    if (result?.broadcast.status === "ended") ended++;
  }
  return { checked: results.length, ended };
}
