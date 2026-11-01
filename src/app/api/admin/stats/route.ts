import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { getPlatformStats } from "@/modules/admin/server/stats";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireRole("admin", { fresh: true });
  return ok(await getPlatformStats(getDb()));
});
