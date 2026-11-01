import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { listPendingApplications } from "@/modules/accounts/server/repo";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireRole("admin", { fresh: true });
  return ok(await listPendingApplications(getDb()));
});
