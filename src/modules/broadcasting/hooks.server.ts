import "server-only";

import { waitUntil } from "@/lib/cloudflare";
import { onBroadcastLive } from "@/modules/broadcasting/server/lifecycle";
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
