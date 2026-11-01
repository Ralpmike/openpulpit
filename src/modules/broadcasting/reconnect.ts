/**
 * Rejoin rules after LiveKit's own reconnect gives up (broadcasting-rules:
 * reconnects). Pure, shared by the preacher's broadcast and the listener's player.
 */
export const REJOIN_DELAYS_MS = [1000, 2000, 4000, 8000, 15000] as const;

/** Delay before rejoin attempt `attempt` (0-based); the last delay repeats. */
export function rejoinDelay(attempt: number): number {
  return REJOIN_DELAYS_MS[Math.min(attempt, REJOIN_DELAYS_MS.length - 1)]!;
}

/**
 * Keep trying while within the grace window. The server keeps the broadcast
 * live for `graceSeconds` after the preacher drops; listeners keep trying for
 * as long as the broadcast may still be live.
 */
export function shouldKeepRejoining(input: {
  droppedAt: number;
  now: number;
  graceSeconds: number;
  wasIntentional: boolean;
}): boolean {
  if (input.wasIntentional) return false;
  return input.now - input.droppedAt < input.graceSeconds * 1000;
}

/** LiveKit DisconnectReason values that mean "don't come back". */
export const FINAL_DISCONNECT_REASONS = new Set([
  1, // CLIENT_INITIATED
  2, // DUPLICATE_IDENTITY
  4, // PARTICIPANT_REMOVED (an admin removed them)
  5, // ROOM_DELETED (the broadcast ended)
]);
