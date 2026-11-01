import { ok, route } from "@/lib/api";
import { getDb, getLimits } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { getRecordingLimitStatus } from "@/modules/library/server/retention";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const viewer = await requireRole("preacher");
  return ok(await getRecordingLimitStatus(getDb(), viewer.id, getLimits().freeRecordingLimit));
});
