import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * The Cloudflare bindings (D1, R2, vars, secrets) for the current request.
 * Always call this inside a request; never keep `env` or a D1 handle at module scope.
 */
export function getEnv(): CloudflareEnv {
  return getCloudflareContext().env;
}

/** Like getEnv(), but usable from code that may run during static generation. */
export async function getEnvAsync(): Promise<CloudflareEnv> {
  return (await getCloudflareContext({ async: true })).env;
}

/** Run work after the response is sent (e.g. notification fan-out). */
export function waitUntil(promise: Promise<unknown>): void {
  getCloudflareContext().ctx.waitUntil(promise);
}

export function getDb(): D1Database {
  return getEnv().DB;
}

export function getRecordingsBucket(): R2Bucket {
  return getEnv().RECORDINGS;
}

/** Numeric settings from wrangler vars, with safe fallbacks. */
export function getLimits(env: CloudflareEnv = getEnv()) {
  return {
    freeMonthlyBroadcastMinutes: toInt(env.FREE_MONTHLY_BROADCAST_MINUTES, 600),
    freeRecordingLimit: toInt(env.FREE_RECORDING_LIMIT, 20),
    reconnectGraceSeconds: toInt(env.RECONNECT_GRACE_SECONDS, 60),
  };
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
