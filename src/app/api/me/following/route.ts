import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireSession } from "@/modules/accounts";
import { listFollowing } from "@/modules/social";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const viewer = await requireSession();
  return ok(await listFollowing(getDb(), viewer));
});
