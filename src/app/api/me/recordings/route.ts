import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { listMyRecordings } from "@/modules/library/server/manage";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const viewer = await requireRole("preacher");
  return ok(await listMyRecordings(getDb(), viewer));
});
