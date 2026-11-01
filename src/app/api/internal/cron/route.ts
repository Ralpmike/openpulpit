import { getEnv } from "@/lib/cloudflare";
import { checkCosts, costThresholds, sendCostAlerts } from "@/modules/admin/server/costs";
import { registerBroadcastingHooks } from "@/modules/broadcasting/hooks.server";
import { sweepLiveBroadcasts } from "@/modules/broadcasting/server/sweep";

export const dynamic = "force-dynamic";

function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

/** Called by the 15-minute cron in worker.ts. Not public: the cron secret is required. */
export async function POST(request: Request) {
  const env = getEnv();
  if (!isAuthorized(request.headers.get("authorization"), env.CRON_SECRET)) {
    return new Response("Not found", { status: 404 });
  }
  registerBroadcastingHooks();
  const sweep = await sweepLiveBroadcasts(env);
  const checks = await checkCosts(env.DB, costThresholds(env));
  const alerts = await sendCostAlerts(env, checks);
  return Response.json({ sweep, alerts });
}
