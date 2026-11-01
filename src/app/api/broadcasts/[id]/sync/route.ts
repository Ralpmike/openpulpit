import { notFound, ok, route } from "@/lib/api";
import { getEnv } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { registerBroadcastingHooks } from "@/modules/broadcasting/hooks.server";
import { syncBroadcast } from "@/modules/broadcasting/server/lifecycle";
import { getOwnedBroadcast, toBroadcast } from "@/modules/broadcasting/server/repo";

export const dynamic = "force-dynamic";

/** The preacher's heartbeat while live: status, listeners, and the hours cap enforced on the server. */
export const POST = route(async (_request: Request, { params }: RouteContext<"/api/broadcasts/[id]/sync">) => {
  const viewer = await requireRole("preacher");
  const { id } = await params;
  const env = getEnv();
  if (!(await getOwnedBroadcast(env.DB, id, viewer.id))) throw notFound("We couldn't find that broadcast.");
  registerBroadcastingHooks();
  const result = (await syncBroadcast(env, id))!;
  return ok({
    broadcast: toBroadcast(result.broadcast),
    remainingSeconds: result.remainingSeconds,
    isHoursWarning: result.isHoursWarning,
  });
});
