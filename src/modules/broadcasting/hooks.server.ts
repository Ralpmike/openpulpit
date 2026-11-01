import "server-only";

/**
 * Wires other modules into broadcast lifecycle events (recording in library,
 * notifications in social). Each module adds its registration here; calling
 * this more than once is harmless.
 */
let isRegistered = false;

export function registerBroadcastingHooks() {
  if (isRegistered) return;
  isRegistered = true;
}
