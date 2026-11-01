import { notFound, ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { getBroadcastWithPreacher } from "@/modules/broadcasting/server/queries";

export const dynamic = "force-dynamic";

/** Public: a broadcast and its preacher, for the listener's player. */
export const GET = route(async (_request: Request, { params }: RouteContext<"/api/broadcasts/[id]">) => {
  const { id } = await params;
  const broadcast = await getBroadcastWithPreacher(getDb(), id);
  if (!broadcast) throw notFound("We couldn't find that broadcast.");
  return ok(broadcast);
});
