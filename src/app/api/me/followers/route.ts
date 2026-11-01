import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { listMyBlocks, listMyFollowers } from "@/modules/social/server/blocks";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const viewer = await requireRole("preacher");
  const [followers, blocked] = await Promise.all([listMyFollowers(getDb(), viewer), listMyBlocks(getDb(), viewer)]);
  return ok({ followers, blocked });
});
