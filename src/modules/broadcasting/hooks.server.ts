import "server-only";

import { waitUntil } from "@/lib/cloudflare";
import { onBroadcastEnded, onBroadcastLive, onBroadcastPublishing } from "@/modules/broadcasting/server/lifecycle";
import { onEgressEvent } from "@/modules/broadcasting/server/webhooks";
import { ensureRecording, handleEgressEnded, stopRecording } from "@/modules/library/server/recording";
import { notifyFollowersOfLive } from "@/modules/social/server/notifications";

/**
 * Wires other modules into broadcast lifecycle events (recording in library,
 * notifications in social). Each module adds its registration here; calling
 * this more than once is harmless.
 */
let isRegistered = false;

export function registerBroadcastingHooks() {
  if (isRegistered) return;
  isRegistered = true;
  // Every broadcast is recorded (library): start on go-live, retry while publishing, stop on end.
  onBroadcastLive(async (env, broadcast) => void (await ensureRecording(env, broadcast)));
  onBroadcastPublishing(async (env, broadcast) => void (await ensureRecording(env, broadcast)));
  onBroadcastEnded(async (env, broadcast) => stopRecording(env, broadcast.id));
  onEgressEvent(async (env, event) => {
    if (event.event === "egress_ended" && event.egressInfo) await handleEgressEnded(env, event.egressInfo);
  });

  // Followers hear about it once, without making going live wait on push delivery.
  onBroadcastLive(async (env, broadcast) => {
    const work = notifyFollowersOfLive(env, broadcast).catch((error) => console.error("Go-live push failed", error));
    try {
      waitUntil(work);
    } catch {
      await work; // outside a request (tests, scripts)
    }
  });
}
