import "server-only";

import type { WebhookEvent } from "livekit-server-sdk";

import { getBroadcast } from "@/modules/broadcasting/server/repo";
import { endBroadcast, markPublisherLeft, syncBroadcast } from "@/modules/broadcasting/server/lifecycle";

type EgressHandler = (env: CloudflareEnv, event: WebhookEvent) => Promise<void>;
const egressHandlers: EgressHandler[] = [];

/** The library module handles egress (recording) events. */
export function onEgressEvent(handler: EgressHandler) {
  egressHandlers.push(handler);
}

/**
 * LiveKit webhook events, already signature-checked. The broadcast is found
 * from the room name (its id) only. Every branch is safe to run twice.
 */
export async function handleLiveKitEvent(env: CloudflareEnv, event: WebhookEvent): Promise<void> {
  if (event.event.startsWith("egress_")) {
    for (const handler of egressHandlers) await handler(env, event);
    return;
  }
  const roomName = event.room?.name;
  if (!roomName) return;
  const broadcast = await getBroadcast(env.DB, roomName);
  if (!broadcast || broadcast.status === "ended") return;
  const isPreacher = event.participant?.identity === broadcast.preacher_id;

  switch (event.event) {
    case "track_published":
    case "participant_joined":
    case "participant_left":
      if (event.event === "participant_left" && isPreacher) {
        await markPublisherLeft(env.DB, broadcast.id);
      }
      await syncBroadcast(env, broadcast.id);
      return;
    case "room_finished":
      // The room closes after the reconnect grace with nobody back: the broadcast is over.
      await endBroadcast(env, broadcast.id, broadcast.status === "live" ? "disconnected" : "error", { deleteRoom: false });
      return;
    default:
      return;
  }
}
