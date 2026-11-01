import "server-only";

import { getLimits } from "@/lib/cloudflare";
import { nowIso } from "@/lib/ids";
import { TrackType } from "livekit-server-sdk";

import { liveKitConfig, roomService } from "@/lib/livekit";
import { hoursAction, type EndedReason } from "@/modules/broadcasting/server/policy";
import { getBroadcast, type BroadcastRow } from "@/modules/broadcasting/server/repo";
import { getHoursSummary } from "@/modules/broadcasting/server/service";

/**
 * Broadcast lifecycle (broadcasting-rules): ready → live → ended, forward only.
 * Every move is a compare-and-set so the preacher's client, LiveKit webhooks
 * and admins can act at the same time; every step is safe to repeat.
 */

type Listener = (env: CloudflareEnv, broadcast: BroadcastRow) => Promise<void>;
const onLiveListeners: Listener[] = [];
const onEndedListeners: Listener[] = [];
const onSyncedListeners: Listener[] = [];

/** Other modules react to lifecycle moves (recording, notifications) without a dependency cycle. */
export function onBroadcastLive(listener: Listener) {
  onLiveListeners.push(listener);
}
export function onBroadcastEnded(listener: Listener) {
  onEndedListeners.push(listener);
}
/** After each sync of a live broadcast where the preacher is publishing (e.g. to retry a recording start). */
export function onBroadcastPublishing(listener: Listener) {
  onSyncedListeners.push(listener);
}

async function emit(listeners: Listener[], env: CloudflareEnv, broadcastId: string) {
  const broadcast = await getBroadcast(env.DB, broadcastId);
  if (!broadcast) return;
  for (const listener of listeners) {
    try {
      await listener(env, broadcast);
    } catch (error) {
      console.error("Broadcast lifecycle listener failed", error);
    }
  }
}

/** Live once the preacher's microphone track is published. Returns true only on the first move. */
export async function markLive(env: CloudflareEnv, broadcastId: string, now: Date = new Date()): Promise<boolean> {
  const result = await env.DB.prepare(
    "UPDATE broadcasts SET status = 'live', started_at = ?, publisher_left_at = NULL WHERE id = ? AND status = 'ready'",
  )
    .bind(nowIso(now), broadcastId)
    .run();
  if (!result.meta.changes) return false;
  await emit(onLiveListeners, env, broadcastId);
  return true;
}

export async function markPublisherLeft(db: D1Database, broadcastId: string, now: Date = new Date()) {
  await db
    .prepare("UPDATE broadcasts SET publisher_left_at = COALESCE(publisher_left_at, ?) WHERE id = ? AND status = 'live'")
    .bind(nowIso(now), broadcastId)
    .run();
}

export async function markPublisherBack(db: D1Database, broadcastId: string) {
  await db.prepare("UPDATE broadcasts SET publisher_left_at = NULL WHERE id = ? AND status = 'live'").bind(broadcastId).run();
}

export async function setListenerCount(db: D1Database, broadcastId: string, count: number) {
  await db
    .prepare(
      "UPDATE broadcasts SET current_listeners = ?, peak_listeners = MAX(peak_listeners, ?) WHERE id = ? AND status = 'live'",
    )
    .bind(count, count, broadcastId)
    .run();
}

/** Ends a broadcast once, whoever asks first. Deleting the room drops everyone at once. */
export async function endBroadcast(
  env: CloudflareEnv,
  broadcastId: string,
  reason: EndedReason,
  { deleteRoom = true, now = new Date() }: { deleteRoom?: boolean; now?: Date } = {},
): Promise<boolean> {
  const at = nowIso(now);
  const result = await env.DB.prepare(
    `UPDATE broadcasts SET status = 'ended', ended_reason = ?, ended_at = ?, current_listeners = 0,
            started_at = COALESCE(started_at, ?)
      WHERE id = ? AND status IN ('ready', 'live')`,
  )
    .bind(reason, at, at, broadcastId)
    .run();
  if (!result.meta.changes) return false;
  if (deleteRoom) {
    await roomService(liveKitConfig(env))
      .deleteRoom(broadcastId)
      .catch(() => undefined); // already gone
  }
  await emit(onEndedListeners, env, broadcastId);
  return true;
}

export interface SyncResult {
  broadcast: BroadcastRow;
  remainingSeconds: number;
  /** True when the preacher should see the "10 minutes left" warning. */
  isHoursWarning: boolean;
}

/**
 * Brings a broadcast in line with its LiveKit room: live once the preacher
 * publishes, listener counts, and the monthly hours cap (warn, then end).
 * Called by the preacher's client every minute and by webhooks.
 */
export async function syncBroadcast(env: CloudflareEnv, broadcastId: string, now: Date = new Date()): Promise<SyncResult | null> {
  let broadcast = await getBroadcast(env.DB, broadcastId);
  if (!broadcast || broadcast.status === "ended") return broadcast ? { broadcast, remainingSeconds: 0, isHoursWarning: false } : null;
  const participants = await roomService(liveKitConfig(env))
    .listParticipants(broadcastId)
    .catch(() => []);
  const publisher = participants.find((participant) => participant.identity === broadcast!.preacher_id);
  const isPublishing = Boolean(publisher?.tracks.some((track) => track.type === TrackType.AUDIO && !track.muted));
  if (isPublishing && broadcast.status === "ready") await markLive(env, broadcastId, now);
  if (isPublishing && broadcast.publisher_left_at) await markPublisherBack(env.DB, broadcastId);
  await setListenerCount(env.DB, broadcastId, participants.filter((p) => p.identity !== broadcast!.preacher_id).length);

  broadcast = (await getBroadcast(env.DB, broadcastId))!;
  if (broadcast.status !== "live") return { broadcast, remainingSeconds: 0, isHoursWarning: false };
  if (isPublishing) await emit(onSyncedListeners, env, broadcastId);
  const hours = await getHoursSummary(env.DB, broadcast.preacher_id, getLimits(env).freeMonthlyBroadcastMinutes, now);
  const action = hoursAction(hours.remainingSeconds, Boolean(broadcast.hours_warning_at));
  if (action === "end") {
    await endBroadcast(env, broadcastId, "hours_cap", { now });
    broadcast = (await getBroadcast(env.DB, broadcastId))!;
  } else if (action === "warn") {
    await env.DB.prepare("UPDATE broadcasts SET hours_warning_at = ? WHERE id = ? AND hours_warning_at IS NULL")
      .bind(nowIso(now), broadcastId)
      .run();
  }
  return {
    broadcast,
    remainingSeconds: hours.remainingSeconds,
    isHoursWarning: broadcast.status === "live" && hours.remainingSeconds <= 10 * 60,
  };
}
