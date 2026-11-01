import "server-only";

import { getLimits } from "@/lib/cloudflare";
import { endBroadcast, syncBroadcast } from "@/modules/broadcasting/server/lifecycle";

/** A live broadcast with no heartbeat for this long gets checked by the cron. */
const STALE_AFTER_SECONDS = 3 * 60;

/**
 * Safety net (cron, every 15 minutes): broadcasts whose preacher app stopped
 * sending heartbeats are re-synced, so the hours cap still applies, and ended
 * with "disconnected" once the preacher has been gone longer than the grace.
 */
export async function sweepLiveBroadcasts(env: CloudflareEnv, now: Date = new Date()): Promise<{ checked: number; ended: number }> {
  const graceSeconds = getLimits(env).reconnectGraceSeconds;
  const staleBefore = new Date(now.getTime() - STALE_AFTER_SECONDS * 1000).toISOString();
  const { results } = await env.DB.prepare(
    "SELECT id FROM broadcasts WHERE status = 'live' AND coalesce(last_synced_at, started_at) < ? LIMIT 50",
  )
    .bind(staleBefore)
    .all<{ id: string }>();
  let ended = 0;
  for (const { id } of results) {
    const result = await syncBroadcast(env, id, now);
    const broadcast = result?.broadcast;
    if (!broadcast || broadcast.status !== "live") {
      if (broadcast?.status === "ended") ended++;
      continue;
    }
    const goneSince = broadcast.publisher_left_at ? new Date(broadcast.publisher_left_at).getTime() : null;
    if (goneSince !== null && now.getTime() - goneSince > graceSeconds * 1000) {
      if (await endBroadcast(env, id, "disconnected", { now })) ended++;
    }
  }
  return { checked: results.length, ended };
}
