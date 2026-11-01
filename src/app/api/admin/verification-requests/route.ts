import { ok, route } from "@/lib/api";
import { getDb } from "@/lib/cloudflare";
import { requireRole } from "@/modules/accounts";
import { listPendingVerifications } from "@/modules/accounts/server/verification";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireRole("admin", { fresh: true });
  return ok(await listPendingVerifications(getDb()));
});
