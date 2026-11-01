import { ok, route } from "@/lib/api";
import { getEnv } from "@/lib/cloudflare";
import { requireAcceptedTerms, requireRole } from "@/modules/accounts";
import { issuePublishToken } from "@/modules/broadcasting/server/service";

export const dynamic = "force-dynamic";

/** The only place a publish token is minted. The session is re-read from D1 (no cache). */
export const POST = route(async (_request: Request, { params }: RouteContext<"/api/broadcasts/[id]/token">) => {
  const viewer = await requireRole("preacher", { fresh: true });
  requireAcceptedTerms(viewer);
  const { id } = await params;
  return ok(await issuePublishToken(getEnv(), viewer, id));
});
