import { ok, route } from "@/lib/api";
import { getEnv } from "@/lib/cloudflare";
import { getViewer } from "@/modules/accounts";
import { issueListenToken } from "@/modules/broadcasting/server/service";

export const dynamic = "force-dynamic";

/** Public: listening needs no account. Subscribe-only, rate-limited per network. */
export const POST = route(async (request: Request, { params }: RouteContext<"/api/broadcasts/[id]/listen-token">) => {
  const { id } = await params;
  const viewer = await getViewer();
  const networkKey = request.headers.get("cf-connecting-ip") ?? "unknown";
  return ok(await issueListenToken(getEnv(), { broadcastId: id, viewer, networkKey }));
});
