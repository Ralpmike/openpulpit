import { ok, route } from "@/lib/api";
import { getDb, getLimits } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { getHoursSummary } from "@/modules/broadcasting/server/service";

export const dynamic = "force-dynamic";

/** This month's broadcast hours for the signed-in preacher (requirement 10). */
export const GET = route(async () => {
  const viewer = await requireRole("preacher");
  return ok(await getHoursSummary(getDb(), viewer.id, getLimits().freeMonthlyBroadcastMinutes));
});
