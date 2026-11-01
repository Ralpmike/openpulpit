import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { getViewer, requireSession } from "@/modules/accounts";
import { follow, getFollowState, unfollow } from "@/modules/social/server/follows";

export const dynamic = "force-dynamic";

type Context = RouteContext<"/api/preachers/[slug]/follow">;

/** Follower count and whether the viewer follows (visitors get isFollowing: false). */
export const GET = route(async (_request: Request, { params }: Context) => {
  const viewer = await getViewer();
  return ok(await getFollowState(getDb(), viewer, (await params).slug));
});

export const PUT = route(async (_request: Request, { params }: Context) => {
  const viewer = await requireSession();
  return ok(await follow(getDb(), viewer, (await params).slug));
});

export const DELETE = route(async (_request: Request, { params }: Context) => {
  const viewer = await requireSession();
  return ok(await unfollow(getDb(), viewer, (await params).slug));
});
