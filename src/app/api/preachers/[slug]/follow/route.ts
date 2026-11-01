import { ok, parseJson, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { getViewer, requireAcceptedTerms, requireSession } from "@/modules/accounts";
import { followNotificationsSchema } from "@/modules/social/schemas/push";
import { follow, getFollowState, setNotifications, unfollow } from "@/modules/social/server/follows";

export const dynamic = "force-dynamic";

type Context = RouteContext<"/api/preachers/[slug]/follow">;

/** Follower count and whether the viewer follows (visitors get isFollowing: false). */
export const GET = route(async (_request: Request, { params }: Context) => {
  const viewer = await getViewer();
  return ok(await getFollowState(getDb(), viewer, (await params).slug));
});

export const PUT = route(async (_request: Request, { params }: Context) => {
  const viewer = await requireSession({ fresh: true });
  requireAcceptedTerms(viewer);
  return ok(await follow(getDb(), viewer, (await params).slug));
});

export const DELETE = route(async (_request: Request, { params }: Context) => {
  const viewer = await requireSession();
  return ok(await unfollow(getDb(), viewer, (await params).slug));
});

/** Notifications on or off for this one preacher. */
export const PATCH = route(async (request: Request, { params }: Context) => {
  const viewer = await requireSession();
  const { notificationsEnabled } = await parseJson(request, followNotificationsSchema);
  return ok(await setNotifications(getDb(), viewer, (await params).slug, notificationsEnabled));
});
