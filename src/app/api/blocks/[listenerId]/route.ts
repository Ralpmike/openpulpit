import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { blockListener, unblockListener } from "@/modules/social/server/blocks";

export const dynamic = "force-dynamic";

type Context = RouteContext<"/api/blocks/[listenerId]">;

/** The signed-in preacher blocks (PUT) or unblocks (DELETE) a listener. */
export const PUT = route(async (_request: Request, { params }: Context) => {
  const viewer = await requireRole("preacher");
  await blockListener(getDb(), viewer, (await params).listenerId);
  return ok({ isBlocked: true });
});

export const DELETE = route(async (_request: Request, { params }: Context) => {
  const viewer = await requireRole("preacher");
  await unblockListener(getDb(), viewer, (await params).listenerId);
  return ok({ isBlocked: false });
});
