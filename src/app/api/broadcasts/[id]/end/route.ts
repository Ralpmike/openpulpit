import { notFound, ok, route } from "@/lib/api";
import { getEnv } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { registerBroadcastingHooks } from "@/modules/broadcasting/hooks.server";
import { endBroadcast } from "@/modules/broadcasting/server/lifecycle";
import { getOwnedBroadcast, toBroadcast } from "@/modules/broadcasting/server/repo";

export const dynamic = "force-dynamic";

/** The preacher ends their own broadcast. Safe to repeat. */
export const POST = route(async (_request: Request, { params }: RouteContext<"/api/broadcasts/[id]/end">) => {
  const viewer = await requireRole("preacher");
  const { id } = await params;
  const env = getEnv();
  if (!(await getOwnedBroadcast(env.DB, id, viewer.id))) throw notFound("We couldn't find that broadcast.");
  registerBroadcastingHooks();
  await endBroadcast(env, id, "preacher");
  return ok(toBroadcast((await getOwnedBroadcast(env.DB, id, viewer.id))!));
});
