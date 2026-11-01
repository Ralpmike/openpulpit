import "server-only";

import { ApiError, conflict, notFound, tooManyRequests } from "@/lib/api";
import { getLimits } from "@/lib/cloudflare";
import { newId } from "@/lib/ids";
import { createListenToken, createPublishToken, liveKitConfig } from "@/lib/livekit";
import { consumeRateLimit } from "@/lib/rateLimit";
import { lagosMonthStart, nextLagosMonthStart } from "@/helpers/time/lagos";
import { getProfileByUserId, type Viewer } from "@/modules/accounts";
import type { Broadcast, HoursSummary, ListenGrant, PublishGrant } from "@/modules/broadcasting/models";
import { PUBLISH_REFUSAL_MESSAGES, publishRefusal, remainingSeconds, usedSeconds } from "@/modules/broadcasting/server/policy";
import {
  broadcastSpansSince,
  getBroadcast,
  getOwnedBroadcast,
  hasOtherLiveBroadcast,
  insertBroadcast,
  toBroadcast,
} from "@/modules/broadcasting/server/repo";
import type { BroadcastDetailsInput } from "@/modules/broadcasting/schemas/broadcast";

export async function getHoursSummary(
  db: D1Database,
  preacherId: string,
  capMinutes: number,
  now: Date = new Date(),
): Promise<HoursSummary> {
  const since = lagosMonthStart(now);
  const used = usedSeconds(await broadcastSpansSince(db, preacherId, since), since, now);
  return {
    capSeconds: capMinutes * 60,
    usedSeconds: used,
    remainingSeconds: remainingSeconds(capMinutes, used),
    renewsAt: nextLagosMonthStart(now).toISOString(),
  };
}

export async function createBroadcast(db: D1Database, viewer: Viewer, input: BroadcastDetailsInput): Promise<Broadcast> {
  if (!(await getProfileByUserId(db, viewer.id))) throw conflict("Set up your preacher profile before going live.");
  const id = newId();
  await insertBroadcast(db, { id, preacherId: viewer.id, ...input });
  return toBroadcast((await getBroadcast(db, id))!);
}

/** A publish token for the preacher's own broadcast, after every check in broadcasting-rules. */
export async function issuePublishToken(
  env: CloudflareEnv,
  viewer: Viewer,
  broadcastId: string,
  now: Date = new Date(),
): Promise<PublishGrant> {
  const db = env.DB;
  const limits = getLimits(env);
  const broadcast = await getOwnedBroadcast(db, broadcastId, viewer.id);
  const [hours, isOtherLive, profile] = await Promise.all([
    getHoursSummary(db, viewer.id, limits.freeMonthlyBroadcastMinutes, now),
    hasOtherLiveBroadcast(db, viewer.id, broadcastId),
    getProfileByUserId(db, viewer.id),
  ]);
  const refusal = publishRefusal({
    role: viewer.role,
    status: viewer.status,
    isOwner: Boolean(broadcast),
    broadcastStatus: broadcast?.status ?? "ready",
    remainingSeconds: hours.remainingSeconds,
    hasOtherLiveBroadcast: isOtherLive,
  });
  if (refusal) {
    const { status, message } = PUBLISH_REFUSAL_MESSAGES[refusal];
    throw new ApiError(status, message);
  }
  const config = liveKitConfig(env);
  const token = await createPublishToken(config, {
    broadcastId,
    preacherId: viewer.id,
    name: profile?.display_name ?? viewer.name,
    reconnectGraceSeconds: limits.reconnectGraceSeconds,
  });
  return { token, url: config.url, broadcastId };
}

/** A subscribe-only token for a live broadcast. Public, so rate-limited per network. */
export async function issueListenToken(
  env: CloudflareEnv,
  input: { broadcastId: string; viewer: Viewer | null; networkKey: string },
): Promise<ListenGrant> {
  const salt = env.RATE_LIMIT_SALT || env.BETTER_AUTH_SECRET;
  const limit = await consumeRateLimit(env.DB, `listen:${input.networkKey}`, { window: 60, max: 30 }, { salt });
  if (!limit.allowed) throw tooManyRequests();
  const broadcast = await getBroadcast(env.DB, input.broadcastId);
  if (!broadcast) throw notFound("We couldn't find that broadcast.");
  if (broadcast.status !== "live") {
    throw new ApiError(409, broadcast.status === "ended" ? "This broadcast has ended." : "This broadcast hasn't started yet.");
  }
  const identity = input.viewer ? `listener-${input.viewer.id}-${newId().slice(0, 8)}` : `anon-${newId()}`;
  const config = liveKitConfig(env);
  return { token: await createListenToken(config, { broadcastId: broadcast.id, identity }), url: config.url, broadcastId: broadcast.id };
}
