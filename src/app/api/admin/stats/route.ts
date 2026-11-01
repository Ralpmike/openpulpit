import { ok, route } from "@/lib/api";
import { getEnv } from "@/lib/cloudflare";
import { checkCosts, costThresholds } from "@/modules/admin/server/costs";
import { requireRole } from "@/modules/accounts";
import { getPlatformStats } from "@/modules/admin/server/stats";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireRole("admin", { fresh: true });
  const env = getEnv();
  const [stats, costs] = await Promise.all([getPlatformStats(env.DB), checkCosts(env.DB, costThresholds(env))]);
  return ok({ ...stats, costs });
});
